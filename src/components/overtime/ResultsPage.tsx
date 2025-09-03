import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOvertimeCalculations } from '@/hooks/useOvertimeCalculations';
import { DayEntry, WorkingHours, OvertimePercentages } from '@/types/overtime';
import { ArrowLeft, Printer, Calculator } from 'lucide-react';
import { format, getDay } from 'date-fns';
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
  const { getCalculation } = useOvertimeCalculations();
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
    const dayOfWeek = getDay(new Date(date));
    const dayMap = {
      0: workingHours.sunday,    // Sunday
      1: workingHours.monday,    // Monday
      2: workingHours.tuesday,   // Tuesday
      3: workingHours.wednesday, // Wednesday
      4: workingHours.thursday,  // Thursday
      5: workingHours.friday,    // Friday
      6: workingHours.saturday   // Saturday
    };
    
    return timeToMinutes(dayMap[dayOfWeek as keyof typeof dayMap]) / 60;
  };

  const calculateDayResult = (entry: DayEntry): DayResult => {
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
    const contractualHours = getContractualHours(entry.date, calculation.workingHours);
    
    let regularHours = workedHours;
    
    if (entry.type === 'rest') {
      // All hours on rest day are overtime at rest day percentage
      overtimeHours = workedHours;
      regularHours = 0;
      overtimePercentage = calculation.overtimePercentages.restDay;
    } else if (entry.type === 'workday' && workedHours > contractualHours) {
      // Calculate overtime based on brackets
      overtimeHours = workedHours - contractualHours;
      regularHours = contractualHours;

      // Determine overtime percentage based on overtime hours
      if (overtimeHours <= 2) {
        overtimePercentage = calculation.overtimePercentages.upTo2Hours;
      } else if (overtimeHours <= 3) {
        overtimePercentage = calculation.overtimePercentages.from2To3Hours;
      } else if (overtimeHours <= 4) {
        overtimePercentage = calculation.overtimePercentages.from3To4Hours;
      } else if (overtimeHours <= 5) {
        overtimePercentage = calculation.overtimePercentages.from4To5Hours;
      } else {
        overtimePercentage = calculation.overtimePercentages.over5Hours;
      }
    }

    return {
      date: entry.date,
      weekday: format(new Date(entry.date), 'EEEE', { locale: ptBR }),
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

  const results = calculation.dayEntries.map(calculateDayResult);
  
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
                  {calculation.description}
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
              Período: {format(new Date(calculation.startDate), "dd/MM/yyyy")} - {format(new Date(calculation.endDate), "dd/MM/yyyy")}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <TableCell>
                          {format(new Date(result.date), "dd/MM/yyyy")}
                        </TableCell>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
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
                {/* Working Hours */}
                <div>
                  <h4 className="font-semibold mb-3">Jornada Contratual</h4>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>Seg: {calculation.workingHours.monday}</div>
                    <div>Ter: {calculation.workingHours.tuesday}</div>
                    <div>Qua: {calculation.workingHours.wednesday}</div>
                    <div>Qui: {calculation.workingHours.thursday}</div>
                    <div>Sex: {calculation.workingHours.friday}</div>
                    <div>Sab: {calculation.workingHours.saturday}</div>
                    <div>Dom: {calculation.workingHours.sunday}</div>
                    <div>Des: {calculation.workingHours.rest}</div>
                  </div>
                </div>

                {/* Overtime Percentages */}
                <div>
                  <h4 className="font-semibold mb-3">Percentuais de Horas Extras</h4>
                  <div className="space-y-1 text-sm">
                    <div>Até 2 H.E.: {calculation.overtimePercentages.upTo2Hours}%</div>
                    <div>De 2 à 3 H.E.: {calculation.overtimePercentages.from2To3Hours}%</div>
                    <div>De 3 à 4 H.E.: {calculation.overtimePercentages.from3To4Hours}%</div>
                    <div>De 4 à 5 H.E.: {calculation.overtimePercentages.from4To5Hours}%</div>
                    <div>+ de 5 H.E.: {calculation.overtimePercentages.over5Hours}%</div>
                    <div>Na folga: {calculation.overtimePercentages.restDay}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};