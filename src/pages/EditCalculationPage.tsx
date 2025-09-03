import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseCalculations } from '@/hooks/useSupabaseCalculations';
import { supabase } from '@/integrations/supabase/client';
import { WorkingHours, OvertimePercentages } from '@/types/overtime';
import { toast } from 'sonner';
import { CalendarIcon, ArrowLeft, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const EditCalculationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  console.log('EditCalculationPage - Received ID from URL:', id);
  const { profile } = useSupabaseAuth();
  const { updateCalculation } = useSupabaseCalculations(profile?.user_id);

  // Initialize states with defaults
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: '08:00',
    tuesday: '08:00',
    wednesday: '08:00',
    thursday: '08:00',
    friday: '08:00',
    saturday: '04:00',
    sunday: '00:00',
    rest: '00:00'
  });
  const [overtimePercentages, setOvertimePercentages] = useState<OvertimePercentages>({
    upTo2Hours: 50,
    from2To3Hours: 70,
    from3To4Hours: 70,
    from4To5Hours: 70,
    over5Hours: 70,
    restDay: 100
  });
  const [dayEntries, setDayEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing data when component mounts
  useEffect(() => {
    const loadCalculation = async () => {
      if (!id || !profile?.user_id) return;

      console.log('EditCalculation - Loading calculation with ID:', id);
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
          console.log('EditCalculation - Loaded calculation:', data);
          setDescription(data.description);
          setStartDate(new Date(data.start_date + 'T00:00:00'));
          setEndDate(new Date(data.end_date + 'T00:00:00'));
          setWorkingHours(data.working_hours as unknown as WorkingHours);
          setOvertimePercentages(data.overtime_percentages as unknown as OvertimePercentages);
          setDayEntries((data.day_entries as any[]) || []);
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

  const handleWorkingHourChange = (day: keyof WorkingHours, value: string) => {
    console.log('EditCalculation - Working hour change:', day, value);
    setWorkingHours(prev => ({
      ...prev,
      [day]: value
    }));
  };

  const handlePercentageChange = (type: keyof OvertimePercentages, value: string) => {
    console.log('EditCalculation - Percentage change:', type, value);
    const numValue = parseFloat(value) || 0;
    setOvertimePercentages(prev => ({
      ...prev,
      [type]: numValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      toast.error('ID do cálculo não encontrado');
      return;
    }

    if (!description.trim()) {
      toast.error('Informe a descrição do cálculo');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Selecione as datas inicial e final');
      return;
    }

    if (endDate < startDate) {
      toast.error('A data final deve ser igual ou posterior à data inicial');
      return;
    }

    const calculationData = {
      description: description.trim(),
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      working_hours: workingHours,
      overtime_percentages: overtimePercentages,
      day_entries: dayEntries
    };

    try {
      const success = await updateCalculation(id, calculationData);
      if (success) {
        toast.success('Cálculo atualizado com sucesso!');
        // Não navegar para dashboard, apenas mostrar mensagem de sucesso
        // para permitir continuar editando
      }
    } catch (error) {
      toast.error('Erro ao atualizar cálculo');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/horas-extras')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Editar Cálculo
              </h1>
              <p className="text-sm text-muted-foreground">
                Modifique os parâmetros do cálculo de horas extras
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Edite a descrição e período do cálculo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">
                  Descrição e datas para este cálculo (máx. 100 caracteres)
                </Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Ex: João Silva - Janeiro 2025"
                  value={description}
                  onChange={(e) => {
                    console.log('EditCalculation - Description change:', e.target.value);
                    setDescription(e.target.value.slice(0, 100));
                  }}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/100 caracteres
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => startDate ? date < startDate : false}
                        defaultMonth={startDate || new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overtime Percentages */}
          <Card>
            <CardHeader>
              <CardTitle>Percentuais de Horas Extras</CardTitle>
              <CardDescription>
                Configure os percentuais aplicados para cada faixa de horas extras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="upTo2Hours">Até 2 H.E. (%)</Label>
                  <Input
                    id="upTo2Hours"
                    type="number"
                    min="0"
                    max="999"
                    step="1"
                    maxLength={3}
                    value={overtimePercentages.upTo2Hours}
                    onChange={(e) => handlePercentageChange('upTo2Hours', e.target.value.slice(0, 3))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from2To3Hours">De 2 à 3 H.E. (%)</Label>
                  <Input
                    id="from2To3Hours"
                    type="number"
                    min="0"
                    max="999"
                    step="1"
                    maxLength={3}
                    value={overtimePercentages.from2To3Hours}
                    onChange={(e) => handlePercentageChange('from2To3Hours', e.target.value.slice(0, 3))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from3To4Hours">De 3 à 4 H.E. (%)</Label>
                  <Input
                    id="from3To4Hours"
                    type="number"
                    min="0"
                    max="999"
                    step="1"
                    maxLength={3}
                    value={overtimePercentages.from3To4Hours}
                    onChange={(e) => handlePercentageChange('from3To4Hours', e.target.value.slice(0, 3))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from4To5Hours">De 4 à 5 H.E. (%)</Label>
                  <Input
                    id="from4To5Hours"
                    type="number"
                    min="0"
                    max="999"
                    step="1"
                    maxLength={3}
                    value={overtimePercentages.from4To5Hours}
                    onChange={(e) => handlePercentageChange('from4To5Hours', e.target.value.slice(0, 3))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="over5Hours">+ de 5 H.E. (%)</Label>
                  <Input
                    id="over5Hours"
                    type="number"
                    min="0"
                    max="999"
                    step="1"
                    maxLength={3}
                    value={overtimePercentages.over5Hours}
                    onChange={(e) => handlePercentageChange('over5Hours', e.target.value.slice(0, 3))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restDay">Na folga (%)</Label>
                  <Input
                    id="restDay"
                    type="number"
                    min="0"
                    max="999"
                    step="1"
                    maxLength={3}
                    value={overtimePercentages.restDay}
                    onChange={(e) => handlePercentageChange('restDay', e.target.value.slice(0, 3))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Jornada Contratual de Trabalho</CardTitle>
              <CardDescription>
                Informe a jornada de trabalho para cada dia da semana (formato HH:MM)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monday">Seg</Label>
                  <Input
                    id="monday"
                    type="time"
                    value={workingHours.monday}
                    onChange={(e) => handleWorkingHourChange('monday', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tuesday">Ter</Label>
                  <Input
                    id="tuesday"
                    type="time"
                    value={workingHours.tuesday}
                    onChange={(e) => handleWorkingHourChange('tuesday', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wednesday">Qua</Label>
                  <Input
                    id="wednesday"
                    type="time"
                    value={workingHours.wednesday}
                    onChange={(e) => handleWorkingHourChange('wednesday', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thursday">Qui</Label>
                  <Input
                    id="thursday"
                    type="time"
                    value={workingHours.thursday}
                    onChange={(e) => handleWorkingHourChange('thursday', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="friday">Sex</Label>
                  <Input
                    id="friday"
                    type="time"
                    value={workingHours.friday}
                    onChange={(e) => handleWorkingHourChange('friday', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saturday">Sab</Label>
                  <Input
                    id="saturday"
                    type="time"
                    value={workingHours.saturday}
                    onChange={(e) => handleWorkingHourChange('saturday', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sunday">Dom</Label>
                  <Input
                    id="sunday"
                    type="time"
                    value={workingHours.sunday}
                    onChange={(e) => handleWorkingHourChange('sunday', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rest">Descanso</Label>
                  <Input
                    id="rest"
                    type="time"
                    value={workingHours.rest}
                    onChange={(e) => handleWorkingHourChange('rest', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/horas-extras')}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" className="px-8">
              <Save className="h-4 w-4 mr-2" />
              Salvar e Continuar Editando
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};