import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useOvertimeCalculations } from '@/hooks/useOvertimeCalculations';
import { DayEntry } from '@/types/overtime';
import { toast } from 'sonner';
import { ArrowLeft, Calculator, Clock } from 'lucide-react';
import { format, eachDayOfInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimeEntryFormProps {
  calculationId: string;
  onBack: () => void;
  onCalculate: () => void;
}

export const TimeEntryForm = ({ calculationId, onBack, onCalculate }: TimeEntryFormProps) => {
  const { getCalculation, updateCalculation } = useOvertimeCalculations();
  const calculation = getCalculation(calculationId);
  
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  
  useEffect(() => {
    if (!calculation) return;

    // Generate all days in the range
    const startDate = new Date(calculation.startDate);
    const endDate = new Date(calculation.endDate);
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Create or load existing entries
    const existingEntries = calculation.dayEntries || [];
    const entries: DayEntry[] = allDays.map(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      const existing = existingEntries.find(entry => entry.date === dateString);
      
      if (existing) {
        return existing;
      }

      // Default type based on day of week (Sunday = 0)
      const dayOfWeek = getDay(date);
      const defaultType = dayOfWeek === 0 ? 'rest' : 'workday';

      return {
        date: dateString,
        entry: '',
        intervalStart: '',
        intervalEnd: '',
        exit: '',
        type: defaultType
      };
    });

    setDayEntries(entries);
  }, [calculation]);

  if (!calculation) {
    return <div>Cálculo não encontrado</div>;
  }

  const handleEntryChange = (index: number, field: keyof DayEntry, value: string) => {
    setDayEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const handleCalculate = () => {
    // Validate required fields for workdays
    const workdayEntries = dayEntries.filter(entry => entry.type === 'workday');
    const invalidEntries = workdayEntries.filter(entry => 
      !entry.entry || !entry.exit
    );

    if (invalidEntries.length > 0) {
      toast.error('Preencha pelo menos os horários de entrada e saída para os dias de trabalho');
      return;
    }

    // Save entries to calculation
    if (updateCalculation(calculationId, { dayEntries })) {
      toast.success('Horários salvos com sucesso!');
      onCalculate();
    } else {
      toast.error('Erro ao salvar horários');
    }
  };

  const getWeekdayName = (dateString: string) => {
    return format(new Date(dateString), 'EEEE', { locale: ptBR });
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

  const getTypeBadgeVariant = (type: DayEntry['type']) => {
    switch (type) {
      case 'workday': return 'default';
      case 'rest': return 'secondary';
      case 'absence': return 'destructive';
      case 'justified-absence': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Registrar Horários
              </h1>
              <p className="text-sm text-muted-foreground">
                {calculation.description} • {format(new Date(calculation.startDate), "dd/MM/yyyy")} - {format(new Date(calculation.endDate), "dd/MM/yyyy")}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Instruções
              </CardTitle>
              <CardDescription>
                Preencha os horários para cada dia do período selecionado. 
                Os domingos são marcados como "Dia de Descanso" por padrão.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Time Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Horários do Período</CardTitle>
              <CardDescription>
                Configure os horários e tipo de cada dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dayEntries.map((entry, index) => (
                  <div key={entry.date} className="grid grid-cols-1 lg:grid-cols-8 gap-4 p-4 border rounded-lg">
                    {/* Date and Weekday */}
                    <div className="lg:col-span-2 space-y-1">
                      <div className="font-medium">
                        {format(new Date(entry.date), "dd/MM/yyyy")}
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {getWeekdayName(entry.date)}
                      </div>
                      <Badge variant={getTypeBadgeVariant(entry.type)} className="text-xs">
                        {getTypeLabel(entry.type)}
                      </Badge>
                    </div>

                    {/* Time Inputs */}
                    <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`entry-${index}`} className="text-xs">
                          Entrada
                        </Label>
                        <Input
                          id={`entry-${index}`}
                          type="time"
                          value={entry.entry}
                          onChange={(e) => handleEntryChange(index, 'entry', e.target.value)}
                          disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`intervalStart-${index}`} className="text-xs">
                          Início Intervalo
                        </Label>
                        <Input
                          id={`intervalStart-${index}`}
                          type="time"
                          value={entry.intervalStart}
                          onChange={(e) => handleEntryChange(index, 'intervalStart', e.target.value)}
                          disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`intervalEnd-${index}`} className="text-xs">
                          Fim Intervalo
                        </Label>
                        <Input
                          id={`intervalEnd-${index}`}
                          type="time"
                          value={entry.intervalEnd}
                          onChange={(e) => handleEntryChange(index, 'intervalEnd', e.target.value)}
                          disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`exit-${index}`} className="text-xs">
                          Saída
                        </Label>
                        <Input
                          id={`exit-${index}`}
                          type="time"
                          value={entry.exit}
                          onChange={(e) => handleEntryChange(index, 'exit', e.target.value)}
                          disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                        />
                      </div>
                    </div>

                    {/* Type Selection */}
                    <div className="space-y-2">
                      <Label className="text-xs">Marca como</Label>
                      <Select
                        value={entry.type}
                        onValueChange={(value) => handleEntryChange(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="workday">Dia de Trabalho</SelectItem>
                          <SelectItem value="rest">Dia de Descanso</SelectItem>
                          <SelectItem value="absence">Falta</SelectItem>
                          <SelectItem value="justified-absence">Falta Justificada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Calculate Button */}
          <div className="flex justify-end">
            <Button onClick={handleCalculate} size="lg" className="px-8">
              <Calculator className="h-4 w-4 mr-2" />
              Calcular Horas Extras
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};