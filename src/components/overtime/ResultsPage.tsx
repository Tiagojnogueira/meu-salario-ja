import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseCalculations } from '@/hooks/useSupabaseCalculations';
import { DayEntry, WorkingHours, OvertimePercentages } from '@/types/overtime';
import { ArrowLeft, Printer, Calculator } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ResultsPageProps {
  calculationId: string;
  onBack: () => void;
  onBackToDashboard: () => void;
}

interface DayResult {
  date: string;
  weekday: string;
  type: string;
  entry: string;
  intervalStart: string;
  intervalEnd: string;
  exit: string;
  workedHours: number;
  contractualHours: number;
  regularHours: number;
  overtimeHours: number;
  overtimePercentage: number;
}

export const ResultsPage = ({ calculationId, onBack, onBackToDashboard }: ResultsPageProps) => {
  const { profile } = useSupabaseAuth();
  const { getCalculation } = useSupabaseCalculations(profile?.user_id);
  const calculation = getCalculation(calculationId);

  if (!calculation) {
    return <div>Cálculo não encontrado</div>;
  }

  const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToHours = (minutes: number): number => {
    return minutes / 60;
  };

  const getContractualHours = (date: string, workingHours: WorkingHours): number => {
    const dayOfWeek = parseISO(date).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const dayName = dayNames[dayOfWeek];
    const hoursStr = workingHours[dayName] || '00:00';
    return timeToMinutes(hoursStr) / 60;
  };

  const calculateDayResult = (entry: DayEntry, workingHours: WorkingHours, overtimePercentages: OvertimePercentages): DayResult => {
    const entryMinutes = timeToMinutes(entry.entry);
    const intervalStartMinutes = timeToMinutes(entry.intervalStart);
    const intervalEndMinutes = timeToMinutes(entry.intervalEnd);
    const exitMinutes = timeToMinutes(entry.exit);

    let workedMinutes = 0;
    let overtimeHours = 0;
    let overtimePercentage = 0;

    if (entry.type === 'workday' || entry.type === 'rest') {
      // Calculate worked hours
      if (entryMinutes && exitMinutes) {
        workedMinutes = exitMinutes - entryMinutes;
        if (workedMinutes < 0) {
          // Crosses midnight
          workedMinutes = (24 * 60 - entryMinutes) + exitMinutes;
        }

        // Subtract interval
        if (intervalStartMinutes && intervalEndMinutes) {
          const intervalMinutes = intervalEndMinutes - intervalStartMinutes;
          workedMinutes -= intervalMinutes;
        }
      }
    }

    const workedHours = minutesToHours(workedMinutes);
    const contractualHours = getContractualHours(entry.date, workingHours);
    
    let regularHours = workedHours;
    
    if (entry.type === 'rest') {
      // All hours on rest day are overtime at rest day percentage
      overtimeHours = workedHours;
      regularHours = 0;
      overtimePercentage = overtimePercentages.restDay;
    } else if (entry.type === 'workday' && workedHours > contractualHours) {
      // Calculate overtime based on brackets
      overtimeHours = workedHours - contractualHours;
      regularHours = contractualHours;

      // Determine overtime percentage based on overtime hours
      if (overtimeHours <= 2) {
        overtimePercentage = overtimePercentages.upTo2Hours;
      } else if (overtimeHours <= 3) {
        overtimePercentage = overtimePercentages.from2To3Hours;
      } else if (overtimeHours <= 4) {
        overtimePercentage = overtimePercentages.from3To4Hours;
      } else if (overtimeHours <= 5) {
        overtimePercentage = overtimePercentages.from4To5Hours;
      } else {
        overtimePercentage = overtimePercentages.over5Hours;
      }
    }

    return {
      date: entry.date,
      weekday: format(parseISO(entry.date), 'EEEE', { locale: ptBR }),
      type: getTypeLabel(entry.type),
      entry: entry.entry || '-',
      intervalStart: entry.intervalStart || '-',
      intervalEnd: entry.intervalEnd || '-',
      exit: entry.exit || '-',
      workedHours,
      contractualHours,
      regularHours,
      overtimeHours,
      overtimePercentage
    };
  };

  const getTypeLabel = (type: DayEntry['type']) => {
    switch (type) {
      case 'workday': return 'Dia de Trabalho';
      case 'rest': return 'Dia de Descanso';
      case 'absence': return 'Falta';
      case 'justified-absence': return 'Falta Justificada';
      default: return type;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'Dia de Trabalho': return 'default';
      case 'Dia de Descanso': return 'secondary';
      case 'Falta': return 'destructive';
      case 'Falta Justificada': return 'outline';
      default: return 'default';
    }
  };

  // Process day entries into results
  const dayResults: DayResult[] = (calculation?.day_entries || []).map((entry: DayEntry): DayResult => {
    const result = calculateDayResult(entry, calculation.working_hours, calculation.overtime_percentages);
    return {
      date: entry.date,
      weekday: format(parseISO(entry.date), 'EEEE', { locale: ptBR }),
      type: entry.type,
      entry: entry.entry,
      intervalStart: entry.intervalStart,
      intervalEnd: entry.intervalEnd,
      exit: entry.exit,
      workedHours: result.workedHours,
      contractualHours: result.contractualHours,
      regularHours: result.regularHours,
      overtimeHours: result.overtimeHours,
      overtimePercentage: result.overtimePercentage
    };
  });

  const results = calculation.day_entries.map(entry => calculateDayResult(entry, calculation.working_hours, calculation.overtime_percentages));
  
  const totals = results.reduce((acc, result) => ({
    workedHours: acc.workedHours + result.workedHours,
    regularHours: acc.regularHours + result.regularHours,
    overtimeHours: acc.overtimeHours + result.overtimeHours
  }), { workedHours: 0, regularHours: 0, overtimeHours: 0 });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Resultado do Cálculo
                </h1>
                <p className="text-sm text-muted-foreground">
                  {calculation.description} • {format(parseISO(calculation.start_date), 'dd/MM/yyyy')} - {format(parseISO(calculation.end_date), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button onClick={onBackToDashboard}>
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Print Header */}
          <div className="hidden print:block mb-8">
            <h1 className="text-2xl font-bold text-center mb-2">
              Sistema de Horas Extras - Resultado do Cálculo
            </h1>
            <p className="text-center text-muted-foreground">
              {calculation.description}
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Período: {format(parseISO(calculation.start_date), "dd/MM/yyyy")} - {format(parseISO(calculation.end_date), "dd/MM/yyyy")}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Trabalhado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {totals.workedHours.toFixed(2)}h
                </div>
                <p className="text-sm text-muted-foreground">
                  Horas totais trabalhadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Horas Normais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {totals.regularHours.toFixed(2)}h
                </div>
                <p className="text-sm text-muted-foreground">
                  Dentro da jornada contratual
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Horas Extras</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {totals.overtimeHours.toFixed(2)}h
                </div>
                <p className="text-sm text-muted-foreground">
                  Excedente da jornada
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">H.E. por Percentual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>50%:</span>
                    <span className="font-mono">{(() => {
                      const he50 = results.reduce((acc, result) => {
                        if (result.overtimePercentage === 50) {
                          return acc + result.overtimeHours;
                        }
                        return acc;
                      }, 0);
                      return he50.toFixed(2);
                    })()}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>70%:</span>
                    <span className="font-mono">{(() => {
                      const he70 = results.reduce((acc, result) => {
                        if (result.overtimePercentage === 70) {
                          return acc + result.overtimeHours;
                        }
                        return acc;
                      }, 0);
                      return he70.toFixed(2);
                    })()}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>100%:</span>
                    <span className="font-mono">{(() => {
                      const he100 = results.reduce((acc, result) => {
                        if (result.overtimePercentage === 100) {
                          return acc + result.overtimeHours;
                        }
                        return acc;
                      }, 0);
                      return he100.toFixed(2);
                    })()}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Detalhamento por Dia
              </CardTitle>
              <CardDescription>
                Resultado detalhado do cálculo de horas extras para cada dia do período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Dia</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Início Int.</TableHead>
                      <TableHead>Fim Int.</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead className="text-right">H. Trab.</TableHead>
                      <TableHead className="text-right">H. Contr.</TableHead>
                      <TableHead className="text-right">H. Normais</TableHead>
                      <TableHead className="text-right">H. Extras</TableHead>
                      <TableHead className="text-right">% Extra</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.date}>
                        <TableCell>{format(parseISO(result.date), "dd/MM")}</TableCell>
                        <TableCell className="capitalize">
                          {result.weekday}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTypeBadgeVariant(result.type)}>
                            {result.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{result.entry}</TableCell>
                        <TableCell>{result.intervalStart}</TableCell>
                        <TableCell>{result.intervalEnd}</TableCell>
                        <TableCell>{result.exit}</TableCell>
                        <TableCell className="text-right font-mono">
                          {result.workedHours.toFixed(2)}h
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {result.contractualHours.toFixed(2)}h
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {result.regularHours.toFixed(2)}h
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {result.overtimeHours > 0 ? (
                            <span className="text-orange-600 font-semibold">
                              {result.overtimeHours.toFixed(2)}h
                            </span>
                          ) : (
                            '0.00h'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {result.overtimePercentage > 0 && (
                            <Badge variant="outline">
                              {result.overtimePercentage}%
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-6" />

              {/* Totals Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Trabalhado</p>
                  <p className="text-2xl font-bold text-primary">
                    {totals.workedHours.toFixed(2)}h
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Horas Normais</p>
                  <p className="text-2xl font-bold text-green-600">
                    {totals.regularHours.toFixed(2)}h
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Horas Extras</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {totals.overtimeHours.toFixed(2)}h
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">H.E. por %</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>50%:</span>
                      <span className="font-mono">{(() => {
                        const he50 = results.reduce((acc, result) => {
                          if (result.overtimePercentage === 50) {
                            return acc + result.overtimeHours;
                          }
                          return acc;
                        }, 0);
                        return he50.toFixed(2);
                      })()}h</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>70%:</span>
                      <span className="font-mono">{(() => {
                        const he70 = results.reduce((acc, result) => {
                          if (result.overtimePercentage === 70) {
                            return acc + result.overtimeHours;
                          }
                          return acc;
                        }, 0);
                        return he70.toFixed(2);
                      })()}h</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>100%:</span>
                      <span className="font-mono">{(() => {
                        const he100 = results.reduce((acc, result) => {
                          if (result.overtimePercentage === 100) {
                            return acc + result.overtimeHours;
                          }
                          return acc;
                        }, 0);
                        return he100.toFixed(2);
                      })()}h</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Summary */}
          <Card className="print:break-before-page">
            <CardHeader>
              <CardTitle>Configurações Utilizadas</CardTitle>
              <CardDescription>
                Parâmetros aplicados neste cálculo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <dt className="font-medium">Horas Contratuais</dt>
                  <dd>{calculation.working_hours.monday}h (seg-qua-sex)</dd>
                  <dd>{calculation.working_hours.tuesday}h (ter-qui)</dd>
                  <dd>{calculation.working_hours.saturday}h (sáb)</dd>
                  <dd>{calculation.working_hours.sunday}h (dom)</dd>
                </div>
                
                <div className="space-y-1">
                  <dt className="font-medium">Percentuais de Hora Extra</dt>
                  <dd>Até 2h: {calculation.overtime_percentages.upTo2Hours}%</dd>
                  <dd>2-3h: {calculation.overtime_percentages.from2To3Hours}%</dd>
                  <dd>3-4h: {calculation.overtime_percentages.from3To4Hours}%</dd>
                  <dd>4-5h: {calculation.overtime_percentages.from4To5Hours}%</dd>
                  <dd>+5h: {calculation.overtime_percentages.over5Hours}%</dd>
                  <dd>Folga: {calculation.overtime_percentages.restDay}%</dd>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};