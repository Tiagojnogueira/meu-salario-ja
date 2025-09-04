import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import WorkingHoursConfig from '@/components/overtime/WorkingHoursConfig';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseCalculations } from '@/hooks/useSupabaseCalculations';
import { supabase } from '@/integrations/supabase/client';
import { WorkingHours, OvertimePercentages } from '@/types/overtime';
import { toast } from 'sonner';
import { CalendarIcon, ArrowLeft, Calculator, Moon, Info } from 'lucide-react';
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
  const [autoFillEnabled, setAutoFillEnabled] = useState(false);
  const [showWorkingHoursConfig, setShowWorkingHoursConfig] = useState(false);
  
  // Campos de horário noturno
  const [nightShiftStart, setNightShiftStart] = useState('22:00');
  const [nightShiftEnd, setNightShiftEnd] = useState('05:00');
  const [extendNightHours, setExtendNightHours] = useState(true);
  const [applyNightReduction, setApplyNightReduction] = useState(true);

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
          
          // Carregando campos de horário noturno
          setNightShiftStart((data as any).night_shift_start || '22:00');
          setNightShiftEnd((data as any).night_shift_end || '05:00');
          setExtendNightHours((data as any).extend_night_hours ?? true);
          setApplyNightReduction((data as any).apply_night_reduction ?? true);
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

  const handleAutoFill = (enabled: boolean) => {
    if (enabled) {
      setShowWorkingHoursConfig(true);
    } else {
      setAutoFillEnabled(false);
    }
  };

  const handleWorkingHoursConfigSave = (configuredHours: any) => {
    // A configuração detalhada de horários será usada na próxima tela
    setAutoFillEnabled(true);
    setShowWorkingHoursConfig(false);
    toast.success('Configuração de horários salva!');
  };

  const handleWorkingHoursConfigClose = () => {
    setShowWorkingHoursConfig(false);
    // Se o modal for fechado sem salvar, desmarca o checkbox
    if (!autoFillEnabled) {
      setAutoFillEnabled(false);
    }
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

    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');
    
    console.log('EditCalculation - Saving dates:', {
      originalStartDate: startDate,
      originalEndDate: endDate,
      formattedStartDate,
      formattedEndDate
    });

    const calculationData = {
      description: description.trim(),
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      working_hours: workingHours,
      overtime_percentages: overtimePercentages,
      day_entries: dayEntries,
      night_shift_start: nightShiftStart,
      night_shift_end: nightShiftEnd,
      extend_night_hours: extendNightHours,
      apply_night_reduction: applyNightReduction,
      auto_fill_enabled: autoFillEnabled
    };

    console.log('EditCalculation - Calculation data being sent:', calculationData);

    try {
      const success = await updateCalculation(id, calculationData);
      if (success) {
        // Navegar para a tela de edição de horários com estado de preenchimento automático
        navigate(`/horas-extras/editar-horarios/${id}`, { 
          state: { autoFillEnabled } 
        });
      }
    } catch (error) {
      console.error('EditCalculation - Update error:', error);
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
                         onSelect={(date) => {
                           console.log('EditCalculation - Start date changed:', date);
                           setStartDate(date);
                         }}
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
                         onSelect={(date) => {
                           console.log('EditCalculation - End date changed:', date);
                           setEndDate(date);
                         }}
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
              
              {/* Auto Fill Option */}
              <div className="mt-6 pt-4 border-t">
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
              </div>
            </CardContent>
          </Card>

          {/* Night Shift Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Moon className="h-5 w-5 mr-2" />
                Configuração de Horário Noturno
              </CardTitle>
              <CardDescription>
                Configure os parâmetros para cálculo de horas noturnas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">
                  Entre quais horários você deseja considerar horário noturno para este cálculo?
                </Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label htmlFor="nightStart">Hora inicial</Label>
                    <Input
                      id="nightStart"
                      type="time"
                      value={nightShiftStart}
                      onChange={(e) => setNightShiftStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nightEnd">Hora final</Label>
                    <Input
                      id="nightEnd"
                      type="time"
                      value={nightShiftEnd}
                      onChange={(e) => setNightShiftEnd(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="extendNight"
                    checked={extendNightHours}
                    onCheckedChange={(checked) => setExtendNightHours(checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="extendNight" className="text-sm font-normal cursor-pointer">
                      Desejo que as horas noturnas sejam prorrogadas em conformidade com a{' '}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button 
                            type="button"
                            className="text-blue-600 underline hover:text-blue-800 inline-flex items-center gap-1"
                          >
                            Súmula 60 do TST
                            <Info className="h-3 w-3" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Súmula 60 do TST</DialogTitle>
                          </DialogHeader>
                          <div className="pt-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              "Cumprida integralmente a jornada no período noturno e prorrogada esta, 
                              devido é também o adicional quanto às horas prorrogadas."
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      (Caso esta opção não seja marcada serão consideradas horas noturnas apenas o intervalo entre as horas acima informadas.)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="applyReduction"
                    checked={!applyNightReduction}
                    onCheckedChange={(checked) => setApplyNightReduction(!(checked as boolean))}
                  />
                  <Label htmlFor="applyReduction" className="text-sm font-normal cursor-pointer">
                    Não desejo aplicar o fator de redução da hora noturna.
                  </Label>
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
              <Calculator className="h-4 w-4 mr-2" />
              Continuar para Horários
            </Button>
          </div>
        </form>
        
        {/* Working Hours Configuration Modal */}
        <WorkingHoursConfig
          open={showWorkingHoursConfig}
          onClose={handleWorkingHoursConfigClose}
          onSave={handleWorkingHoursConfigSave}
        />
      </main>
    </div>
  );
};