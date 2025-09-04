import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseCalculations } from '@/hooks/useSupabaseCalculations';
import { supabase } from '@/integrations/supabase/client';
import { DayEntry } from '@/types/overtime';
import { toast } from 'sonner';
import { ArrowLeft, Calculator, Clock } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const EditTimeEntriesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useSupabaseAuth();
  const { updateCalculation } = useSupabaseCalculations(profile?.user_id);
  
  const [calculation, setCalculation] = useState<any>(null);
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoFillEnabled, setAutoFillEnabled] = useState(location.state?.autoFillEnabled || false);

  // Load calculation data
  useEffect(() => {
    const loadCalculation = async () => {
      if (!id || !profile?.user_id) return;

      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('calculations')
          .select('*')
          .eq('id', id)
          .eq('user_id', profile.user_id)
          .single();

        if (error) {
          console.error('Error loading calculation:', error);
          toast.error('Cálculo não encontrado');
          navigate('/horas-extras');
          return;
        }

        if (data) {
          setCalculation(data);
          
          // Generate day entries
          const startDate = parseISO(data.start_date);
          const endDate = parseISO(data.end_date);
          
          const allDays: Date[] = [];
          let currentDate = startDate;
          while (currentDate <= endDate) {
            allDays.push(new Date(currentDate));
            currentDate = addDays(currentDate, 1);
          }

          const existingEntries = (data.day_entries as unknown as DayEntry[]) || [];
          const entries: DayEntry[] = allDays.map(date => {
            const dateString = format(date, 'yyyy-MM-dd');
            const existing = existingEntries.find(entry => entry.date === dateString);
            
            if (existing) {
              return existing;
            }

            // Default to workday for weekdays, rest for weekends
            const dayOfWeek = date.getDay();
            const defaultType = (dayOfWeek === 0 || dayOfWeek === 6) ? 'rest' : 'workday';
            
            return {
              date: dateString,
              type: defaultType,
              entry: '',
              exit: '',
              intervalStart: '',
              intervalEnd: ''
            };
          });

          setDayEntries(entries);

          // Aplicar preenchimento automático se habilitado
          if (autoFillEnabled || location.state?.autoFillEnabled) {
            applyAutoFill(entries, data.working_hours);
          }
        }
      } catch (error) {
        console.error('Error loading calculation:', error);
        toast.error('Erro ao carregar cálculo');
        navigate('/horas-extras');
      } finally {
        setIsLoading(false);
      }
    };

    loadCalculation();
  }, [id, profile?.user_id, navigate]);

  const applyAutoFill = (entries: DayEntry[], workingHours: any) => {
    const getDayOfWeekKey = (date: Date) => {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      return days[date.getDay()];
    };

    // Calcula os horários baseados nas horas de trabalho
    const calculateTimes = (dayKey: string) => {
      const dailyHours = parseFloat(workingHours[dayKey] || '8');
      
      // Horários padrão: entrada 08:00, intervalo 12:00-13:00
      const entryTime = '08:00';
      const intervalStart = '12:00';
      const intervalEnd = '13:00';
      
      // Calcula a saída baseado nas horas de trabalho + 1 hora de intervalo
      const entryHour = 8;
      const exitHour = entryHour + dailyHours + 1; // +1 para o intervalo
      const exitTime = `${String(Math.floor(exitHour)).padStart(2, '0')}:${String((exitHour % 1) * 60).padStart(2, '0')}`;
      
      return {
        entry: entryTime,
        intervalStart,
        intervalEnd,
        exit: exitTime
      };
    };

    const updatedEntries = entries.map(entry => {
      if (entry.type === 'workday') {
        const date = parseISO(entry.date + 'T00:00:00');
        const dayKey = getDayOfWeekKey(date);
        const times = calculateTimes(dayKey);
        
        return {
          ...entry,
          ...times
        };
      }
      return entry;
    });

    setDayEntries(updatedEntries);
  };

  const handleAutoFill = (enabled: boolean) => {
    setAutoFillEnabled(enabled);
    
    if (enabled && calculation) {
      applyAutoFill(dayEntries, calculation.working_hours);
    }
  };

  const updateDayEntry = (index: number, field: keyof DayEntry, value: string) => {
    setDayEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
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

  const getRowBackgroundColor = (type: DayEntry['type']) => {
    switch (type) {
      case 'workday': return 'bg-green-50 border-green-200';
      case 'rest': return 'bg-yellow-50 border-yellow-200';
      case 'justified-absence': return 'bg-yellow-50 border-yellow-200';
      case 'absence': return 'bg-red-50 border-red-200';
      default: return 'bg-background border-border';
    }
  };

  const getWeekdayName = (dateString: string) => {
    return format(parseISO(dateString + 'T00:00:00'), 'EEEE', { locale: ptBR });
  };

  const handleSave = async () => {
    if (!id || !calculation) return;

    try {
      const success = await updateCalculation(id, {
        ...calculation,
        day_entries: dayEntries
      });
      
      if (success) {
        toast.success('Dados salvos com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao salvar dados');
    }
  };

  const handleCalculateResults = async () => {
    if (!id || !calculation) return;

    try {
      const success = await updateCalculation(id, {
        ...calculation,
        day_entries: dayEntries
      });
      
      if (success) {
        toast.success('Dados salvos com sucesso!');
        navigate(`/horas-extras/resultados/${id}`);
      }
    } catch (error) {
      toast.error('Erro ao salvar dados');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div>Carregando...</div>
      </div>
    );
  }

  if (!calculation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div>Cálculo não encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate(`/horas-extras/editar/${id}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center">
                  <Clock className="h-6 w-6 mr-2" />
                  Editar Horários
                </h1>
                <p className="text-sm text-muted-foreground">
                  {calculation.description} • {format(parseISO(calculation.start_date + 'T00:00:00'), 'dd/MM/yyyy')} - {format(parseISO(calculation.end_date + 'T00:00:00'), 'dd/MM/yyyy')}
                </p>
              </div>
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
                Edite os horários para cada dia do período selecionado. 
                Os domingos são marcados como "Dia de Descanso" por padrão.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Auto Fill Option */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-fill"
                  checked={autoFillEnabled}
                  onCheckedChange={handleAutoFill}
                />
                <Label htmlFor="auto-fill" className="text-sm">
                  Desejo preencher automaticamente os mesmos horários de entrada, intervalo e saída para todo período, de acordo com cada dia da semana.
                </Label>
              </div>
            </CardContent>
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
                        {format(parseISO(entry.date + 'T00:00:00'), "dd/MM")}
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
                        onChange={(e) => updateDayEntry(index, 'entry', e.target.value)}
                        disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="time"
                        value={entry.intervalStart}
                        onChange={(e) => updateDayEntry(index, 'intervalStart', e.target.value)}
                        disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="time"
                        value={entry.intervalEnd}
                        onChange={(e) => updateDayEntry(index, 'intervalEnd', e.target.value)}
                        disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="time"
                        value={entry.exit}
                        onChange={(e) => updateDayEntry(index, 'exit', e.target.value)}
                        disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Type Selection */}
                    <div className="col-span-2">
                      <Select
                        value={entry.type}
                        onValueChange={(value: DayEntry['type']) => updateDayEntry(index, 'type', value)}
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

          {/* Action Buttons */}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={() => navigate(`/horas-extras/editar/${id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Parâmetros
            </Button>
            <Button onClick={handleCalculateResults} size="lg">
              <Calculator className="h-4 w-4 mr-2" />
              Calcular Resultados
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};