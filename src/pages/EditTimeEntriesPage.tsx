import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseCalculations } from '@/hooks/useSupabaseCalculations';
import { supabase } from '@/integrations/supabase/client';
import { DayEntry } from '@/types/overtime';
import { toast } from 'sonner';
import { ArrowLeft, Calculator, Clock, Save } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const EditTimeEntriesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useSupabaseAuth();
  const { updateCalculation } = useSupabaseCalculations(profile?.user_id);
  
  const [calculation, setCalculation] = useState<any>(null);
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'workday': return 'default' as const;
      case 'rest': return 'secondary' as const;
      case 'absence': return 'destructive' as const;
      case 'justified-absence': return 'outline' as const;
      default: return 'default' as const;
    }
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
        <div className="max-w-6xl mx-auto space-y-4">
          {dayEntries.map((entry, index) => (
            <Card key={entry.date}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {format(parseISO(entry.date + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </CardTitle>
                    <CardDescription>
                      {format(parseISO(entry.date + 'T00:00:00'), 'dd/MM/yyyy')}
                    </CardDescription>
                  </div>
                  <Badge variant={getTypeBadgeVariant(entry.type)}>
                    {getTypeLabel(entry.type)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`type-${index}`}>Tipo do Dia</Label>
                    <Select 
                      value={entry.type} 
                      onValueChange={(value: DayEntry['type']) => updateDayEntry(index, 'type', value)}
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

                  <div className="space-y-2">
                    <Label htmlFor={`entry-${index}`}>Entrada</Label>
                    <Input
                      id={`entry-${index}`}
                      type="time"
                      value={entry.entry}
                      onChange={(e) => updateDayEntry(index, 'entry', e.target.value)}
                      disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`intervalStart-${index}`}>Início Intervalo</Label>
                    <Input
                      id={`intervalStart-${index}`}
                      type="time"
                      value={entry.intervalStart}
                      onChange={(e) => updateDayEntry(index, 'intervalStart', e.target.value)}
                      disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`intervalEnd-${index}`}>Fim Intervalo</Label>
                    <Input
                      id={`intervalEnd-${index}`}
                      type="time"
                      value={entry.intervalEnd}
                      onChange={(e) => updateDayEntry(index, 'intervalEnd', e.target.value)}
                      disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`exit-${index}`}>Saída</Label>
                    <Input
                      id={`exit-${index}`}
                      type="time"
                      value={entry.exit}
                      onChange={(e) => updateDayEntry(index, 'exit', e.target.value)}
                      disabled={entry.type === 'absence' || entry.type === 'justified-absence'}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

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