import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Calculator, Home, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const UnemploymentSimulatorPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    previousReceived: "",
    monthsWorked: "",
    lastSalary: "",
    penultimateSalary: "",
    antepenultimateSalary: ""
  });
  const [results, setResults] = useState<{
    type: string;
    monthsWorked: number;
    averageSalary: number;
    installmentValue: number;
    installmentCount: number;
    totalValue: number;
    hasRights: boolean;
    errorMessage?: string;
  } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.previousReceived) {
      alert("Por favor, selecione uma opção para o campo 'Você já recebeu seguro desemprego anteriormente?'");
      return false;
    }

    const monthsNum = Number(formData.monthsWorked);
    if (!formData.monthsWorked || isNaN(monthsNum) || monthsNum <= 0 || monthsNum > 960) {
      alert("Quantidade de meses trabalhados deve ser maior que zero e menor ou igual a 960.");
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    const lastSalary = parseFloat(formData.lastSalary) || 0;
    const penultimateSalary = parseFloat(formData.penultimateSalary) || 0;
    const antepenultimateSalary = parseFloat(formData.antepenultimateSalary) || 0;

    const salaryValid = (value: number) => !(isNaN(value) || value < 0 || value > 1000000);

    if (!salaryValid(lastSalary)) {
      alert("Valor do salário no último mês inválido. Deve ser entre 0 e 1.000.000.");
      return false;
    }

    if (!salaryValid(penultimateSalary)) {
      alert("Valor do salário no penúltimo mês inválido. Deve ser entre 0 e 1.000.000.");
      return false;
    }

    if (!salaryValid(antepenultimateSalary)) {
      alert("Valor do salário no antepenúltimo mês inválido. Deve ser entre 0 e 1.000.000.");
      return false;
    }

    return true;
  };

  const calculateUnemploymentBenefits = () => {
    if (!validateStep2()) return;

    const lastSalary = parseFloat(formData.lastSalary) || 0;
    const penultimateSalary = parseFloat(formData.penultimateSalary) || 0;
    const antepenultimateSalary = parseFloat(formData.antepenultimateSalary) || 0;
    const averageSalary = (lastSalary + penultimateSalary + antepenultimateSalary) / 3;

    let installmentValue = 0;
    if (averageSalary <= 1518) installmentValue = 1518;
    else if (averageSalary <= 1897.5) installmentValue = 1518;
    else if (averageSalary <= 2138.76) installmentValue = averageSalary * 0.8;
    else if (averageSalary <= 3564.96) installmentValue = ((averageSalary - 2138.77) * 0.5) + 1711.01;
    else installmentValue = 2424.11;

    const requestType = parseInt(formData.previousReceived);
    const monthsWorked = parseInt(formData.monthsWorked);

    const typeTexts = {
      1: 'Primeira solicitação',
      2: 'Segunda solicitação',
      3: 'Terceira solicitação'
    };

    let installmentCount = 0;
    let hasRights = true;
    let errorMessage = "";

    if (requestType === 1) { // Primeira solicitação
      if (monthsWorked < 12) {
        hasRights = false;
        errorMessage = "Considerando apenas os dados que você informou, você não teria direito ao seguro-desemprego.";
      } else if (monthsWorked >= 12 && monthsWorked <= 23) {
        installmentCount = 4;
      } else if (monthsWorked >= 24) {
        installmentCount = 5;
      }
    } else if (requestType === 2) { // Segunda solicitação
      if (monthsWorked < 8) {
        hasRights = false;
        errorMessage = "Considerando apenas os dados que você informou, você não teria direito ao seguro desemprego.";
      } else if (monthsWorked >= 9 && monthsWorked <= 11) {
        installmentCount = 3;
      } else if (monthsWorked >= 12 && monthsWorked <= 23) {
        installmentCount = 4;
      } else if (monthsWorked >= 24) {
        installmentCount = 5;
      }
    } else if (requestType === 3) { // Terceira solicitação
      if (monthsWorked < 5) {
        hasRights = false;
        errorMessage = "Considerando apenas os dados que você informou, você não teria direito ao seguro-desemprego.";
      } else if (monthsWorked >= 6 && monthsWorked <= 11) {
        installmentCount = 3;
      } else if (monthsWorked >= 12 && monthsWorked <= 23) {
        installmentCount = 4;
      } else if (monthsWorked >= 24) {
        installmentCount = 5;
      }
    }

    const totalValue = installmentCount * installmentValue;

    setResults({
      type: typeTexts[requestType as keyof typeof typeTexts],
      monthsWorked,
      averageSalary,
      installmentValue,
      installmentCount,
      totalValue,
      hasRights,
      errorMessage
    });

    setCurrentStep(3);
  };

  const resetSimulator = () => {
    setFormData({
      previousReceived: "",
      monthsWorked: "",
      lastSalary: "",
      penultimateSalary: "",
      antepenultimateSalary: ""
    });
    setResults(null);
    setCurrentStep(1);
  };

  const nextStep = (step: number) => {
    if (step === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (step === 2) {
      calculateUnemploymentBenefits();
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Voltar ao Início
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Simulador de Seguro Desemprego - 2025</h1>
                <p className="text-sm text-muted-foreground">Simule os valores das parcelas do seguro desemprego</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Robô de Cálculo do Seguro Desemprego</CardTitle>
                  <CardDescription>Preencha os dados para simular seus benefícios</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Step 1 */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Você já recebeu seguro desemprego anteriormente?
                    </Label>
                    <Select value={formData.previousReceived} onValueChange={(value) => handleInputChange("previousReceived", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione Aqui:" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Não, essa é a primeira vez</SelectItem>
                        <SelectItem value="2">Sim, essa é a segunda vez</SelectItem>
                        <SelectItem value="3">Sim, essa é a terceira vez ou mais</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Quantidade de meses trabalhados:</Label>
                    <Input
                      type="number"
                      placeholder="00"
                      value={formData.monthsWorked}
                      onChange={(e) => handleInputChange("monthsWorked", e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => nextStep(1)}>
                      Avançar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Valor do salário no último mês:</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={formData.lastSalary}
                      onChange={(e) => handleInputChange("lastSalary", e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Valor do salário no penúltimo mês:</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={formData.penultimateSalary}
                      onChange={(e) => handleInputChange("penultimateSalary", e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Valor do salário no antepenúltimo mês:</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={formData.antepenultimateSalary}
                      onChange={(e) => handleInputChange("antepenultimateSalary", e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button variant="secondary" onClick={prevStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                    <Button onClick={() => nextStep(2)}>
                      Calcular
                      <Calculator className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3 - Results */}
              {currentStep === 3 && results && (
                <div className="space-y-6">
                  <div className="border-t pt-6">
                    <h3 className="text-xl font-semibold mb-4">Dados do cálculo:</h3>
                    
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Tipo de solicitação</p>
                          <p className="font-semibold">{results.type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Meses trabalhados</p>
                          <p className="font-semibold">{results.monthsWorked}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Salário médio</p>
                          <p className="font-semibold">
                            {results.averageSalary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valor da parcela</p>
                          <p className="font-semibold">
                            {results.installmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                      {results.hasRights ? (
                        <div>
                          <p className="text-lg font-semibold text-foreground mb-2">
                            Você pode ter direito a {results.installmentCount} parcela(s) de{' '}
                            {results.installmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <p className="text-base">
                            Valor total: {results.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            * Consulte os demais requisitos legais para confirmação do direito.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg font-semibold text-destructive">
                            {results.errorMessage}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Para mais informações consulte a legislação específica.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <Button variant="secondary" onClick={resetSimulator}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar ao Início
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UnemploymentSimulatorPage;