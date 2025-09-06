import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseCalculations } from '@/hooks/useSupabaseCalculations';
import { DayEntry } from '@/types/overtime';
import { toast } from 'sonner';
import { ArrowLeft, Calculator, Clock } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimeEntryFormProps {
  calculationId: string;
  onBack: () => void;
  onCalculate: () => void;
  selectedUserId?: string;
}

export const TimeEntryForm = ({ calculationId, onBack, onCalculate, selectedUserId }: TimeEntryFormProps) => {
  const { profile } = useSupabaseAuth();
  // Se há selectedUserId (admin visualizando outro usuário), usar ele, senão usar o próprio user_id
  const targetUserId = selectedUserId || profile?.user_id;
  const { getCalculation, updateCalculation } = useSupabaseCalculations(targetUserId);
  const calculation = getCalculation(calculationId);
  
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  
  useEffect(() => {
    if (!calculation) return;

    // Fix timezone issues by using date-only strings directly
    const startDate = parseISO(calculation.start_date);
    const endDate = parseISO(calculation.end_date);
    
    // Generate all days in the range without timezone conversion
    const allDays: Date[] = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
      allDays.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }

    // Create or load existing entries
    const existingEntries = calculation.day_entries || [];
    const entries: DayEntry[] = allDays.map(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      const existing = existingEntries.find(entry => entry.date === dateString);
      
      if (existing) {
        return existing;
      }

      // Default type based on day of week (Sunday = 0)
      const dayOfWeek = date.getDay();
      const defaultType: DayEntry['type'] = dayOfWeek === 0 ? 'rest' : 'workday';

      // Função para mapear dia da semana para chave
      const getDayOfWeekKey = (date: Date) => {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[date.getDay()];
      };

      let entry = {
        date: dateString,
        entry: '',
        intervalStart: '',
        intervalEnd: '',
        exit: '',
        type: defaultType
      };

      // Aplicar horários detalhados se auto_fill estiver habilitado
      if (calculation.auto_fill_enabled && calculation.detailed_working_hours) {
        const dayKey = getDayOfWeekKey(date);
        const detailedHours = calculation.detailed_working_hours;
        
        if (defaultType === 'workday' && detailedHours[dayKey]) {
          const dayHours = detailedHours[dayKey];
          entry = {
            ...entry,
            entry: dayHours.entry || '',
            intervalStart: dayHours.intervalStart || '',
            intervalEnd: dayHours.intervalEnd || '',
            exit: dayHours.exit || ''
          };
        } else if (defaultType === 'rest' && detailedHours.restDays) {
          const restHours = detailedHours.restDays;
          entry = {
            ...entry,
            entry: restHours.entry || '',
            intervalStart: restHours.intervalStart || '',
            intervalEnd: restHours.intervalEnd || '',
            exit: restHours.exit || ''
          };
        }
      }

      return entry;
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

  const handleCalculate = async () => {
    console.log('TimeEntryForm - handleCalculate called with:', {
      calculationId,
      selectedUserId,
      targetUserId,
      dayEntriesCount: dayEntries.length
    });
    
    // Update calculation with day entries (no validation required)
    const success = await updateCalculation(calculationId, {
      day_entries: dayEntries
    });

    if (success) {
      toast.success('Cálculo criado com sucesso!');
      console.log('TimeEntryForm - Calling onCalculate, should navigate to results with calculationId:', calculationId);
      onCalculate();
    }
  };

  const getWeekdayName = (dateString: string) => {
    return format(parseISO(dateString), 'EEEE', { locale: ptBR });
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

  const getRowBackgroundColor = (type: DayEntry['type']) => {
    switch (type) {
      case 'workday': return 'bg-green-50 border-green-200';
      case 'rest': return 'bg-yellow-50 border-yellow-200';
      case 'justified-absence': return 'bg-yellow-50 border-yellow-200';
      case 'absence': return 'bg-red-50 border-red-200';
      default: return 'bg-background border-border';
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
                {calculation.description} • {format(parseISO(calculation.start_date), "dd/MM/yyyy")} - {format(parseISO(calculation.end_date), "dd/MM/yyyy")}
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
                Digite os horários e marque cada dia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 p-3 font-medium text-sm border-b">
                  <div className="col-span-2">Data</div>
                  <div className="col-span-2">Entrada</div>
                  <div className="col-span-2">Início Intervalo</div>
                  <div className="col-span-2">Fim Intervalo</div>
                  <div className="col-span-2">Saída</div>
                  <div className="col-span-2">Marcar como</div>
                </div>
                
                {dayEntries.map((entry, index) => (
                  <div 
                    key={entry.date} 
                    className={`grid grid-cols-12 gap-2 p-3 border rounded-lg items-center ${getRowBackgroundColor(entry.type)}`}
                  >
                    {/* Date and Weekday */}
                    <div className="col-span-2">
                      <div className="font-medium text-sm">
                        {format(parseISO(entry.date), "dd/MM")}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {getWeekdayName(entry.date)}
                      </div>
                    </div>

                    {/* Time Inputs */}
                    <div className="col-span-2">
                      <Input
                        type="time"
                        value={entry.entry}
                        onChange={(e) => handleEntryChange(index, 'entry', e.target.value)}
                        disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="time"
                        value={entry.intervalStart}
                        onChange={(e) => handleEntryChange(index, 'intervalStart', e.target.value)}
                        disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="time"
                        value={entry.intervalEnd}
                        onChange={(e) => handleEntryChange(index, 'intervalEnd', e.target.value)}
                        disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="time"
                        value={entry.exit}
                        onChange={(e) => handleEntryChange(index, 'exit', e.target.value)}
                        disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Type Selection - Moved to the end */}
                    <div className="col-span-2">
                      <Select
                        value={entry.type}
                        onValueChange={(value) => handleEntryChange(index, 'type', value)}
                      >
                        <SelectTrigger className="h-8 text-sm">
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