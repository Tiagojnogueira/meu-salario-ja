import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseCalculations } from '@/hooks/useSupabaseCalculations';
import { DayEntry, WorkingHours, OvertimePercentages } from '@/types/overtime';
import { ArrowLeft, Printer, Calculator, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ResultsPageProps {
  calculationId: string;
  onBack: () => void;
  onBackToDashboard: () => void;
  onEdit?: () => void;
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

export const ResultsPage = ({ calculationId, onBack, onBackToDashboard, onEdit }: ResultsPageProps) => {
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
    const dayOfWeek = parseISO(date + 'T00:00:00').getDay();
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
      // Calculate overtime progressively
      overtimeHours = workedHours - contractualHours;
      regularHours = contractualHours;

      // For display purposes, we'll show the average percentage
      // The actual progressive calculation will be done separately
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
      weekday: format(parseISO(entry.date + 'T00:00:00'), 'EEEE', { locale: ptBR }),
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
      weekday: format(parseISO(entry.date + 'T00:00:00'), 'EEEE', { locale: ptBR }),
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

  // Calculate progressive overtime hours by percentage
  const calculateProgressiveOvertimeHours = (results: DayResult[], overtimePercentages: OvertimePercentages) => {
    let he50 = 0, he70 = 0, he100 = 0;
    
    results.forEach(result => {
      if (result.type === 'Dia de Descanso') {
        // Rest day overtime is always 100%
        he100 += result.overtimeHours;
      } else if (result.overtimeHours > 0) {
        // Progressive calculation for workdays
        let remainingOvertimeHours = result.overtimeHours;
        
        // First 2 hours at upTo2Hours percentage
        if (remainingOvertimeHours > 0) {
          const hoursAt50 = Math.min(remainingOvertimeHours, 2);
          if (overtimePercentages.upTo2Hours === 50) he50 += hoursAt50;
          else if (overtimePercentages.upTo2Hours === 70) he70 += hoursAt50;
          else if (overtimePercentages.upTo2Hours === 100) he100 += hoursAt50;
          remainingOvertimeHours -= hoursAt50;
        }
        
        // Next hour (2-3) at from2To3Hours percentage
        if (remainingOvertimeHours > 0) {
          const hoursAt2To3 = Math.min(remainingOvertimeHours, 1);
          if (overtimePercentages.from2To3Hours === 50) he50 += hoursAt2To3;
          else if (overtimePercentages.from2To3Hours === 70) he70 += hoursAt2To3;
          else if (overtimePercentages.from2To3Hours === 100) he100 += hoursAt2To3;
          remainingOvertimeHours -= hoursAt2To3;
        }
        
        // Next hour (3-4) at from3To4Hours percentage
        if (remainingOvertimeHours > 0) {
          const hoursAt3To4 = Math.min(remainingOvertimeHours, 1);
          if (overtimePercentages.from3To4Hours === 50) he50 += hoursAt3To4;
          else if (overtimePercentages.from3To4Hours === 70) he70 += hoursAt3To4;
          else if (overtimePercentages.from3To4Hours === 100) he100 += hoursAt3To4;
          remainingOvertimeHours -= hoursAt3To4;
        }
        
        // Next hour (4-5) at from4To5Hours percentage
        if (remainingOvertimeHours > 0) {
          const hoursAt4To5 = Math.min(remainingOvertimeHours, 1);
          if (overtimePercentages.from4To5Hours === 50) he50 += hoursAt4To5;
          else if (overtimePercentages.from4To5Hours === 70) he70 += hoursAt4To5;
          else if (overtimePercentages.from4To5Hours === 100) he100 += hoursAt4To5;
          remainingOvertimeHours -= hoursAt4To5;
        }
        
        // Remaining hours (5+) at over5Hours percentage
        if (remainingOvertimeHours > 0) {
          if (overtimePercentages.over5Hours === 50) he50 += remainingOvertimeHours;
          else if (overtimePercentages.over5Hours === 70) he70 += remainingOvertimeHours;
          else if (overtimePercentages.over5Hours === 100) he100 += remainingOvertimeHours;
        }
      }
    });
    
    return { he50, he70, he100 };
  };

  // Calculate progressive overtime breakdown for a single day
  const calculateDayOvertimeBreakdown = (overtimeHours: number, overtimePercentages: OvertimePercentages, isRestDay: boolean = false): string => {
    if (overtimeHours <= 0) return '-';
    
    if (isRestDay) {
      return `${overtimeHours.toFixed(2)}h (100%)`;
    }
    
    const breakdown: string[] = [];
    let remainingHours = overtimeHours;
    
    // First 2 hours at upTo2Hours percentage
    if (remainingHours > 0) {
      const hoursAt50 = Math.min(remainingHours, 2);
      breakdown.push(`${hoursAt50.toFixed(2)}h (${overtimePercentages.upTo2Hours}%)`);
      remainingHours -= hoursAt50;
    }
    
    // Next hour (2-3) at from2To3Hours percentage
    if (remainingHours > 0) {
      const hoursAt2To3 = Math.min(remainingHours, 1);
      breakdown.push(`${hoursAt2To3.toFixed(2)}h (${overtimePercentages.from2To3Hours}%)`);
      remainingHours -= hoursAt2To3;
    }
    
    // Next hour (3-4) at from3To4Hours percentage
    if (remainingHours > 0) {
      const hoursAt3To4 = Math.min(remainingHours, 1);
      breakdown.push(`${hoursAt3To4.toFixed(2)}h (${overtimePercentages.from3To4Hours}%)`);
      remainingHours -= hoursAt3To4;
    }
    
    // Next hour (4-5) at from4To5Hours percentage
    if (remainingHours > 0) {
      const hoursAt4To5 = Math.min(remainingHours, 1);
      breakdown.push(`${hoursAt4To5.toFixed(2)}h (${overtimePercentages.from4To5Hours}%)`);
      remainingHours -= hoursAt4To5;
    }
    
    // Remaining hours (5+) at over5Hours percentage
    if (remainingHours > 0) {
      breakdown.push(`${remainingHours.toFixed(2)}h (${overtimePercentages.over5Hours}%)`);
    }
    
    return breakdown.join(' + ');
  };

  // Extract employee name from description (first part before " - ")
  const getEmployeeName = (description: string): string => {
    const parts = description.split(' - ');
    return parts[0] || 'Funcionário';
  };

  const results = calculation.day_entries.map(entry => calculateDayResult(entry, calculation.working_hours, calculation.overtime_percentages));
  
  // Calculate progressive overtime hours
  const progressiveHours = calculateProgressiveOvertimeHours(results, calculation.overtime_percentages);
  
  const totals = results.reduce((acc, result) => ({
    workedHours: acc.workedHours + result.workedHours,
    regularHours: acc.regularHours + result.regularHours,
    overtimeHours: acc.overtimeHours + result.overtimeHours
  }), { workedHours: 0, regularHours: 0, overtimeHours: 0 });

  // Count absences
  const absenceCounts = calculation.day_entries.reduce((acc, entry) => {
    if (entry.type === 'absence') acc.unjustified++;
    else if (entry.type === 'justified-absence') acc.justified++;
    return acc;
  }, { unjustified: 0, justified: 0 });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Resultado do Cálculo
              </h1>
               <p className="text-sm text-muted-foreground">
                {calculation.description} • {format(parseISO(calculation.start_date + 'T00:00:00'), 'dd/MM/yyyy')} - {format(parseISO(calculation.end_date + 'T00:00:00'), 'dd/MM/yyyy')}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="dashboard" onClick={onBackToDashboard}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              {onEdit && (
                <Button variant="outline" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
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
              Funcionário: {getEmployeeName(calculation.description)}
            </p>
             <p className="text-center text-sm text-muted-foreground">
               Período: {format(parseISO(calculation.start_date + 'T00:00:00'), "dd/MM/yyyy")} - {format(parseISO(calculation.end_date + 'T00:00:00'), "dd/MM/yyyy")}
             </p>
          </div>

          {/* Absence Information */}
          {(absenceCounts.unjustified > 0 || absenceCounts.justified > 0) && (
            <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-yellow-800 dark:text-yellow-200">Informações de Faltas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {absenceCounts.unjustified}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Faltas Injustificadas
                    </p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {absenceCounts.justified}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Faltas Justificadas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                    <span className="font-mono">{progressiveHours.he50.toFixed(2)}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>70%:</span>
                    <span className="font-mono">{progressiveHours.he70.toFixed(2)}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>100%:</span>
                    <span className="font-mono">{progressiveHours.he100.toFixed(2)}h</span>
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
                      <TableHead>Discriminação H.E.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.date}>
                        <TableCell>{format(parseISO(result.date + 'T00:00:00'), "dd/MM")}</TableCell>
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
                        <TableCell>
                          <div className="text-xs font-mono">
                            {calculateDayOvertimeBreakdown(
                              result.overtimeHours, 
                              calculation.overtime_percentages,
                              result.type === 'Dia de Descanso'
                            )}
                          </div>
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
                      <span className="font-mono">{progressiveHours.he50.toFixed(2)}h</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>70%:</span>
                      <span className="font-mono">{progressiveHours.he70.toFixed(2)}h</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>100%:</span>
                      <span className="font-mono">{progressiveHours.he100.toFixed(2)}h</span>
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