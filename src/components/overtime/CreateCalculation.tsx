import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useOvertimeCalculations } from '@/hooks/useOvertimeCalculations';
import { WorkingHours, OvertimePercentages } from '@/types/overtime';
import { toast } from 'sonner';
import { CalendarIcon, ArrowLeft, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CreateCalculationProps {
  onBack: () => void;
  onContinue: (calculationId: string) => void;
  editingId?: string;
}

export const CreateCalculation = ({ onBack, onContinue, editingId }: CreateCalculationProps) => {
  const { 
    createCalculation, 
    updateCalculation, 
    getCalculation,
    getDefaultWorkingHours, 
    getDefaultOvertimePercentages 
  } = useOvertimeCalculations();

  // Load existing data if editing
  const existingCalculation = editingId ? getCalculation(editingId) : null;

  const [description, setDescription] = useState(existingCalculation?.description || '');
  const [startDate, setStartDate] = useState<Date | undefined>(
    existingCalculation ? new Date(existingCalculation.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    existingCalculation ? new Date(existingCalculation.endDate) : undefined
  );
  
  const [workingHours, setWorkingHours] = useState<WorkingHours>(
    existingCalculation?.workingHours || getDefaultWorkingHours()
  );
  
  const [overtimePercentages, setOvertimePercentages] = useState<OvertimePercentages>(
    existingCalculation?.overtimePercentages || getDefaultOvertimePercentages()
  );

  const handleWorkingHourChange = (day: keyof WorkingHours, value: string) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: value
    }));
  };

  const handlePercentageChange = (type: keyof OvertimePercentages, value: string) => {
    const numValue = parseFloat(value) || 0;
    setOvertimePercentages(prev => ({
      ...prev,
      [type]: numValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      workingHours,
      overtimePercentages,
      dayEntries: existingCalculation?.dayEntries || []
    };

    try {
      if (editingId) {
        if (updateCalculation(editingId, calculationData)) {
          toast.success('Cálculo atualizado com sucesso!');
          onContinue(editingId);
        } else {
          toast.error('Erro ao atualizar cálculo');
        }
      } else {
        const newId = createCalculation(calculationData);
        toast.success('Cálculo criado com sucesso!');
        onContinue(newId);
      }
    } catch (error) {
      toast.error('Erro ao salvar cálculo');
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
                {editingId ? 'Editar Cálculo' : 'Calcular Horas Extras'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Configure os parâmetros para o cálculo de horas extras
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
                Defina a descrição e período do cálculo
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
                  onChange={(e) => setDescription(e.target.value.slice(0, 100))}
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
                    step="1"
                    value={overtimePercentages.upTo2Hours}
                    onChange={(e) => handlePercentageChange('upTo2Hours', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from2To3Hours">De 2 à 3 H.E. (%)</Label>
                  <Input
                    id="from2To3Hours"
                    type="number"
                    min="0"
                    step="1"
                    value={overtimePercentages.from2To3Hours}
                    onChange={(e) => handlePercentageChange('from2To3Hours', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from3To4Hours">De 3 à 4 H.E. (%)</Label>
                  <Input
                    id="from3To4Hours"
                    type="number"
                    min="0"
                    step="1"
                    value={overtimePercentages.from3To4Hours}
                    onChange={(e) => handlePercentageChange('from3To4Hours', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from4To5Hours">De 4 à 5 H.E. (%)</Label>
                  <Input
                    id="from4To5Hours"
                    type="number"
                    min="0"
                    step="1"
                    value={overtimePercentages.from4To5Hours}
                    onChange={(e) => handlePercentageChange('from4To5Hours', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="over5Hours">+ de 5 H.E. (%)</Label>
                  <Input
                    id="over5Hours"
                    type="number"
                    min="0"
                    step="1"
                    value={overtimePercentages.over5Hours}
                    onChange={(e) => handlePercentageChange('over5Hours', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restDay">Na folga (%)</Label>
                  <Input
                    id="restDay"
                    type="number"
                    min="0"
                    step="1"
                    value={overtimePercentages.restDay}
                    onChange={(e) => handlePercentageChange('restDay', e.target.value)}
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
          <div className="flex justify-end">
            <Button type="submit" size="lg" className="px-8">
              <Save className="h-4 w-4 mr-2" />
              {editingId ? 'Salvar Alterações' : 'Gravar / Continuar'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};