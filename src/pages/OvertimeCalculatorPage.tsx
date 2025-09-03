import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Clock, Calculator, FileText, Home, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface TimeEntry {
  id: string;
  date: string;
  entry: string;
  lunchStart: string;
  lunchEnd: string;
  exit: string;
}

interface CalculationResult {
  regularHours: number;
  overtime50: number;
  overtime100: number;
  nightShift: number;
  totalHours: number;
  totalValue: number;
}

const OvertimeCalculatorPage = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [currentEntry, setCurrentEntry] = useState<TimeEntry>({
    id: "",
    date: "",
    entry: "",
    lunchStart: "",
    lunchEnd: "",
    exit: ""
  });

  const addTimeEntry = () => {
    if (!currentEntry.date || !currentEntry.entry || !currentEntry.exit) {
      toast.error("Preencha pelo menos a data, entrada e saída");
      return;
    }

    const newEntry: TimeEntry = {
      ...currentEntry,
      id: Date.now().toString()
    };

    setTimeEntries([...timeEntries, newEntry]);
    setCurrentEntry({
      id: "",
      date: "",
      entry: "",
      lunchStart: "",
      lunchEnd: "",
      exit: ""
    });
    toast.success("Ponto registrado com sucesso!");
  };

  const removeTimeEntry = (id: string) => {
    setTimeEntries(timeEntries.filter(entry => entry.id !== id));
    toast.success("Ponto removido");
  };

  const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const isNightShift = (startMinutes: number, endMinutes: number): number => {
    // Adicional noturno: 22h às 5h (22:00 = 1320 min, 05:00 = 300 min)
    const nightStart = 22 * 60; // 22:00
    const nightEnd = 5 * 60;    // 05:00
    
    let nightMinutes = 0;
    
    // Se o horário cruza a meia-noite
    if (endMinutes < startMinutes) {
      // Calcula da entrada até meia-noite
      if (startMinutes >= nightStart) {
        nightMinutes += (24 * 60) - startMinutes;
      }
      // Calcula da meia-noite até a saída
      if (endMinutes <= nightEnd) {
        nightMinutes += endMinutes;
      }
    } else {
      // Horário no mesmo dia
      if (startMinutes >= nightStart && endMinutes >= nightStart) {
        nightMinutes = endMinutes - startMinutes;
      } else if (startMinutes <= nightEnd && endMinutes <= nightEnd) {
        nightMinutes = endMinutes - startMinutes;
      }
    }
    
    return nightMinutes;
  };

  const calculateHours = (entry: TimeEntry): CalculationResult => {
    const entryMinutes = timeToMinutes(entry.entry);
    const exitMinutes = timeToMinutes(entry.exit);
    const lunchStartMinutes = timeToMinutes(entry.lunchStart);
    const lunchEndMinutes = timeToMinutes(entry.lunchEnd);
    
    let totalWorkedMinutes = 0;
    
    // Calcula total trabalhado
    if (exitMinutes > entryMinutes) {
      totalWorkedMinutes = exitMinutes - entryMinutes;
    } else {
      // Cruza meia-noite
      totalWorkedMinutes = (24 * 60 - entryMinutes) + exitMinutes;
    }
    
    // Desconta almoço se informado
    if (lunchStartMinutes && lunchEndMinutes) {
      const lunchDuration = lunchEndMinutes - lunchStartMinutes;
      totalWorkedMinutes -= lunchDuration;
    }
    
    const totalHours = totalWorkedMinutes / 60;
    const regularWorkDay = 8; // 8 horas normais
    
    let regularHours = Math.min(totalHours, regularWorkDay);
    let overtime50 = 0;
    let overtime100 = 0;
    
    if (totalHours > regularWorkDay) {
      const extraHours = totalHours - regularWorkDay;
      if (extraHours <= 2) {
        overtime50 = extraHours;
      } else {
        overtime50 = 2;
        overtime100 = extraHours - 2;
      }
    }
    
    // Calcula adicional noturno
    const nightShiftMinutes = isNightShift(entryMinutes, exitMinutes);
    const nightShift = nightShiftMinutes / 60;
    
    const hourlyValue = parseFloat(hourlyRate) || 0;
    const totalValue = (regularHours * hourlyValue) + 
                      (overtime50 * hourlyValue * 1.5) + 
                      (overtime100 * hourlyValue * 2) + 
                      (nightShift * hourlyValue * 0.2);
    
    return {
      regularHours,
      overtime50,
      overtime100,
      nightShift,
      totalHours,
      totalValue
    };
  };

  const getTotalCalculation = (): CalculationResult => {
    const totals = timeEntries.reduce((acc, entry) => {
      const calc = calculateHours(entry);
      return {
        regularHours: acc.regularHours + calc.regularHours,
        overtime50: acc.overtime50 + calc.overtime50,
        overtime100: acc.overtime100 + calc.overtime100,
        nightShift: acc.nightShift + calc.nightShift,
        totalHours: acc.totalHours + calc.totalHours,
        totalValue: acc.totalValue + calc.totalValue
      };
    }, {
      regularHours: 0,
      overtime50: 0,
      overtime100: 0,
      nightShift: 0,
      totalHours: 0,
      totalValue: 0
    });
    
    return totals;
  };

  const totalCalc = getTotalCalculation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center">
                  <Clock className="h-6 w-6 mr-2 text-primary" />
                  Sistema de Horas Extras
                </h1>
                <p className="text-sm text-muted-foreground">Controle de pontos, horas extras e adicional noturno</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="register" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Registrar Ponto
              </TabsTrigger>
              <TabsTrigger value="calculate" className="flex items-center">
                <Calculator className="h-4 w-4 mr-2" />
                Cálculos
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Relatório
              </TabsTrigger>
            </TabsList>

            {/* Registro de Ponto */}
            <TabsContent value="register" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Registrar Novo Ponto</CardTitle>
                  <CardDescription>
                    Insira os horários de entrada, almoço e saída para calcular automaticamente as horas trabalhadas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor="date">Data</Label>
                      <Input
                        id="date"
                        type="date"
                        value={currentEntry.date}
                        onChange={(e) => setCurrentEntry({...currentEntry, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="entry">Entrada</Label>
                      <Input
                        id="entry"
                        type="time"
                        value={currentEntry.entry}
                        onChange={(e) => setCurrentEntry({...currentEntry, entry: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lunchStart">Início Almoço</Label>
                      <Input
                        id="lunchStart"
                        type="time"
                        value={currentEntry.lunchStart}
                        onChange={(e) => setCurrentEntry({...currentEntry, lunchStart: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lunchEnd">Fim Almoço</Label>
                      <Input
                        id="lunchEnd"
                        type="time"
                        value={currentEntry.lunchEnd}
                        onChange={(e) => setCurrentEntry({...currentEntry, lunchEnd: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="exit">Saída</Label>
                      <Input
                        id="exit"
                        type="time"
                        value={currentEntry.exit}
                        onChange={(e) => setCurrentEntry({...currentEntry, exit: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button onClick={addTimeEntry} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Ponto
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de Pontos Registrados */}
              {timeEntries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pontos Registrados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {timeEntries.map((entry) => {
                        const calc = calculateHours(entry);
                        return (
                          <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 flex-1">
                              <div>
                                <p className="font-medium">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Entrada: {entry.entry}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Almoço: {entry.lunchStart && entry.lunchEnd ? `${entry.lunchStart}-${entry.lunchEnd}` : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Saída: {entry.exit}</p>
                              </div>
                              <div>
                                <Badge variant="outline">
                                  {calc.totalHours.toFixed(2)}h
                                </Badge>
                              </div>
                              <div>
                                {calc.overtime50 > 0 && <Badge variant="secondary" className="mr-1">50%</Badge>}
                                {calc.overtime100 > 0 && <Badge variant="destructive" className="mr-1">100%</Badge>}
                                {calc.nightShift > 0 && <Badge className="bg-blue-600">Noturno</Badge>}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTimeEntry(entry.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Cálculos */}
            <TabsContent value="calculate" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração de Valores</CardTitle>
                  <CardDescription>
                    Defina o valor da hora para calcular os valores monetários.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-sm">
                    <Label htmlFor="hourlyRate">Valor da Hora (R$)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Horas Normais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {totalCalc.regularHours.toFixed(2)}h
                    </div>
                    <p className="text-sm text-muted-foreground">
                      R$ {(totalCalc.regularHours * (parseFloat(hourlyRate) || 0)).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Horas Extras 50%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {totalCalc.overtime50.toFixed(2)}h
                    </div>
                    <p className="text-sm text-muted-foreground">
                      R$ {(totalCalc.overtime50 * (parseFloat(hourlyRate) || 0) * 1.5).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Horas Extras 100%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {totalCalc.overtime100.toFixed(2)}h
                    </div>
                    <p className="text-sm text-muted-foreground">
                      R$ {(totalCalc.overtime100 * (parseFloat(hourlyRate) || 0) * 2).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Adicional Noturno</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {totalCalc.nightShift.toFixed(2)}h
                    </div>
                    <p className="text-sm text-muted-foreground">
                      R$ {(totalCalc.nightShift * (parseFloat(hourlyRate) || 0) * 0.2).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Total de Horas</h3>
                      <p className="text-3xl font-bold text-primary">
                        {totalCalc.totalHours.toFixed(2)}h
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Valor Total</h3>
                      <p className="text-3xl font-bold text-green-600">
                        R$ {totalCalc.totalValue.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Pontos registrados</p>
                      <p className="font-semibold">{timeEntries.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Horas extras total</p>
                      <p className="font-semibold">{(totalCalc.overtime50 + totalCalc.overtime100).toFixed(2)}h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Adicional noturno</p>
                      <p className="font-semibold">{totalCalc.nightShift.toFixed(2)}h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor hora</p>
                      <p className="font-semibold">R$ {parseFloat(hourlyRate) || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Relatório */}
            <TabsContent value="report" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Relatório Detalhado</CardTitle>
                  <CardDescription>
                    Visualização completa de todos os registros e cálculos realizados.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {timeEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum ponto registrado ainda.</p>
                      <p className="text-sm">Registre pontos na aba "Registrar Ponto" para ver o relatório.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {timeEntries.map((entry) => {
                        const calc = calculateHours(entry);
                        return (
                          <Card key={entry.id} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">
                                  {new Date(entry.date).toLocaleDateString('pt-BR')}
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p><span className="text-muted-foreground">Entrada:</span> {entry.entry}</p>
                                  {entry.lunchStart && entry.lunchEnd && (
                                    <p><span className="text-muted-foreground">Almoço:</span> {entry.lunchStart} às {entry.lunchEnd}</p>
                                  )}
                                  <p><span className="text-muted-foreground">Saída:</span> {entry.exit}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Cálculos</h4>
                                <div className="space-y-1 text-sm">
                                  <p><span className="text-muted-foreground">Horas normais:</span> {calc.regularHours.toFixed(2)}h</p>
                                  {calc.overtime50 > 0 && (
                                    <p><span className="text-muted-foreground">Extras 50%:</span> {calc.overtime50.toFixed(2)}h</p>
                                  )}
                                  {calc.overtime100 > 0 && (
                                    <p><span className="text-muted-foreground">Extras 100%:</span> {calc.overtime100.toFixed(2)}h</p>
                                  )}
                                  {calc.nightShift > 0 && (
                                    <p><span className="text-muted-foreground">Adicional noturno:</span> {calc.nightShift.toFixed(2)}h</p>
                                  )}
                                  <p className="font-semibold"><span className="text-muted-foreground">Total:</span> R$ {calc.totalValue.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default OvertimeCalculatorPage;