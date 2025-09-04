import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, MoreVertical } from 'lucide-react';

interface DayHours {
  entry: string;
  intervalStart: string;
  intervalEnd: string;
  exit: string;
}

interface ExtendedWorkingHours {
  sunday: DayHours;
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  rest: DayHours;
}

interface WorkingHoursConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (workingHours: ExtendedWorkingHours) => void;
}

type DayOfWeek = keyof ExtendedWorkingHours;

const WorkingHoursConfig: React.FC<WorkingHoursConfigProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const [localWorkingHours, setLocalWorkingHours] = useState<ExtendedWorkingHours>({
    sunday: { entry: '', intervalStart: '', intervalEnd: '', exit: '' },
    monday: { entry: '', intervalStart: '', intervalEnd: '', exit: '' },
    tuesday: { entry: '', intervalStart: '', intervalEnd: '', exit: '' },
    wednesday: { entry: '', intervalStart: '', intervalEnd: '', exit: '' },
    thursday: { entry: '', intervalStart: '', intervalEnd: '', exit: '' },
    friday: { entry: '', intervalStart: '', intervalEnd: '', exit: '' },
    saturday: { entry: '', intervalStart: '', intervalEnd: '', exit: '' },
    rest: { entry: '00:00', intervalStart: '00:00', intervalEnd: '00:00', exit: '00:00' },
  });

  const dayLabels: Record<DayOfWeek, string> = {
    sunday: 'Domingo',
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    rest: 'Feriados',
  };

  const dayOrder: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'rest'];

  const handleInputChange = (day: DayOfWeek, field: 'entry' | 'intervalStart' | 'intervalEnd' | 'exit', value: string) => {
    setLocalWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleAutoRepeat = () => {
    const mondayHours = localWorkingHours.monday;
    const updatedHours = { ...localWorkingHours };
    
    // Aplica os horários de segunda-feira para os dias que estão em branco
    dayOrder.forEach(day => {
      if (day !== 'monday') {
        const dayHours = updatedHours[day];
        if (!dayHours.entry && !dayHours.intervalStart && !dayHours.intervalEnd && !dayHours.exit) {
          updatedHours[day] = { ...mondayHours };
        }
      }
    });
    
    setLocalWorkingHours(updatedHours);
  };

  const handleClearDay = (dayToClear: DayOfWeek) => {
    setLocalWorkingHours(prev => ({
      ...prev,
      [dayToClear]: {
        entry: '',
        intervalStart: '',
        intervalEnd: '',
        exit: '',
      },
    }));
  };

  const handleSave = () => {
    onSave(localWorkingHours);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Horários por Dia da Semana</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-3 text-left">Dia da semana</th>
                  <th className="border border-border p-3 text-left">Entrada</th>
                  <th className="border border-border p-3 text-left">Início Intervalo</th>
                  <th className="border border-border p-3 text-left">Fim Intervalo</th>
                  <th className="border border-border p-3 text-left">Saída</th>
                  <th className="border border-border p-3 text-left">Opções</th>
                </tr>
              </thead>
              <tbody>
                {dayOrder.map((day, index) => (
                  <tr key={day} className="hover:bg-muted/50">
                    <td className="border border-border p-3 font-medium">
                      {dayLabels[day]}
                    </td>
                    <td className="border border-border p-3">
                      <Input
                        type="time"
                        value={localWorkingHours[day].entry}
                        onChange={(e) => handleInputChange(day, 'entry', e.target.value)}
                        className="w-full"
                      />
                    </td>
                    <td className="border border-border p-3">
                      <Input
                        type="time"
                        value={localWorkingHours[day].intervalStart}
                        onChange={(e) => handleInputChange(day, 'intervalStart', e.target.value)}
                        className="w-full"
                      />
                    </td>
                    <td className="border border-border p-3">
                      <Input
                        type="time"
                        value={localWorkingHours[day].intervalEnd}
                        onChange={(e) => handleInputChange(day, 'intervalEnd', e.target.value)}
                        className="w-full"
                      />
                    </td>
                    <td className="border border-border p-3">
                      <Input
                        type="time"
                        value={localWorkingHours[day].exit}
                        onChange={(e) => handleInputChange(day, 'exit', e.target.value)}
                        className="w-full"
                      />
                    </td>
                    <td className="border border-border p-3">
                      <div className="flex gap-2">
                        {/* Ícone de Auto Repetir */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleAutoRepeat}
                                className="p-2"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Auto repetir</p>
                              <p className="text-sm text-muted-foreground">
                                Repetir os horários de segunda-feira para os demais dias que estão com os campos em branco.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Menu de Opções - Para todos os dias */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-2">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleClearDay(day)}>
                              Apagar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClearDay(day)}>
                              Limpar os horários de {dayLabels[day].toLowerCase()}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkingHoursConfig;