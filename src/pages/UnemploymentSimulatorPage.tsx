import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Calculator, Home, Shield, DollarSign, Clock, Calendar, TrendingUp, CheckCircle, AlertCircle, Users, FileText, Info } from "lucide-react";
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

  const formatCurrency = (value: string) => {
    // Remove tudo que não é dígito
    const onlyNumbers = value.replace(/\D/g, '');
    
    // Converte para centavos
    const numberValue = parseInt(onlyNumbers) / 100;
    
    // Formata como moeda brasileira
    return numberValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const parseCurrencyToNumber = (value: string) => {
    // Remove símbolos e converte para número
    const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCurrencyChange = (field: string, value: string) => {
    const formatted = formatCurrency(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
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
    const lastSalary = parseCurrencyToNumber(formData.lastSalary) || 0;
    const penultimateSalary = parseCurrencyToNumber(formData.penultimateSalary) || 0;
    const antepenultimateSalary = parseCurrencyToNumber(formData.antepenultimateSalary) || 0;

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

    const lastSalary = parseCurrencyToNumber(formData.lastSalary) || 0;
    const penultimateSalary = parseCurrencyToNumber(formData.penultimateSalary) || 0;
    const antepenultimateSalary = parseCurrencyToNumber(formData.antepenultimateSalary) || 0;
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
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="outline" size="sm" className="hover:bg-primary/10 transition-colors">
                  <Home className="h-4 w-4 mr-2" />
                  Voltar ao Início
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Simulador de Seguro Desemprego - 2025
                </h1>
                <p className="text-sm text-muted-foreground">Simule os valores das parcelas do seguro desemprego</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full shadow-lg">
                  <Shield className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Robô de Cálculo do Seguro Desemprego
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Preencha os dados abaixo para simular seus benefícios
                  </CardDescription>
                </div>
                
                {/* Progress indicator */}
                <div className="flex items-center space-x-2 mt-4">
                  <div className={`w-3 h-3 rounded-full transition-colors ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`w-8 h-0.5 transition-colors ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`w-3 h-3 rounded-full transition-colors ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`w-8 h-0.5 transition-colors ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`w-3 h-3 rounded-full transition-colors ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              {/* Step 1 */}
              {currentStep === 1 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Informações Iniciais</h3>
                    <p className="text-sm text-muted-foreground">Vamos começar com algumas informações básicas</p>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-semibold flex items-center text-foreground">
                      <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                      Você já recebeu seguro desemprego anteriormente?
                    </Label>
                    <Select value={formData.previousReceived} onValueChange={(value) => handleInputChange("previousReceived", value)}>
                      <SelectTrigger className="h-12 text-base bg-background/50 border-2 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="👆 Selecione uma opção aqui" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-2">
                        <SelectItem value="1" className="text-base py-3">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            Não, essa é a primeira vez
                          </div>
                        </SelectItem>
                        <SelectItem value="2" className="text-base py-3">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            Sim, essa é a segunda vez
                          </div>
                        </SelectItem>
                        <SelectItem value="3" className="text-base py-3">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                            Sim, essa é a terceira vez ou mais
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-semibold flex items-center text-foreground">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      Quantidade de meses trabalhados:
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="Digite a quantidade de meses"
                        value={formData.monthsWorked}
                        onChange={(e) => handleInputChange("monthsWorked", e.target.value)}
                        className="h-12 text-base pl-12 bg-background/50 border-2 hover:border-primary/50 focus:border-primary transition-colors"
                      />
                      <Clock className="h-5 w-5 text-muted-foreground absolute left-4 top-1/2 transform -translate-y-1/2" />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Considere apenas os meses com carteira assinada
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={() => nextStep(1)} size="lg" className="px-8 shadow-lg hover:shadow-xl transition-all">
                      Avançar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {currentStep === 2 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Informações Salariais</h3>
                    <p className="text-sm text-muted-foreground">Informe os valores dos seus últimos 3 salários</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-base font-semibold flex items-center text-foreground">
                        <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                        Valor do salário no último mês:
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="R$ 0,00"
                          value={formData.lastSalary}
                          onChange={(e) => handleCurrencyChange("lastSalary", e.target.value)}
                          className="h-12 text-base pl-12 pr-4 bg-background/50 border-2 hover:border-primary/50 focus:border-primary transition-colors text-right font-medium"
                        />
                        <DollarSign className="h-5 w-5 text-green-600 absolute left-4 top-1/2 transform -translate-y-1/2" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold flex items-center text-foreground">
                        <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                        Valor do salário no penúltimo mês:
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="R$ 0,00"
                          value={formData.penultimateSalary}
                          onChange={(e) => handleCurrencyChange("penultimateSalary", e.target.value)}
                          className="h-12 text-base pl-12 pr-4 bg-background/50 border-2 hover:border-primary/50 focus:border-primary transition-colors text-right font-medium"
                        />
                        <DollarSign className="h-5 w-5 text-blue-600 absolute left-4 top-1/2 transform -translate-y-1/2" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold flex items-center text-foreground">
                        <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                        Valor do salário no antepenúltimo mês:
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="R$ 0,00"
                          value={formData.antepenultimateSalary}
                          onChange={(e) => handleCurrencyChange("antepenultimateSalary", e.target.value)}
                          className="h-12 text-base pl-12 pr-4 bg-background/50 border-2 hover:border-primary/50 focus:border-primary transition-colors text-right font-medium"
                        />
                        <DollarSign className="h-5 w-5 text-purple-600 absolute left-4 top-1/2 transform -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg border border-muted">
                    <p className="text-xs text-muted-foreground flex items-start">
                      <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      Informe os valores brutos (antes dos descontos) dos salários recebidos nos últimos 3 meses de trabalho.
                    </p>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="secondary" onClick={prevStep} size="lg" className="px-6">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                    <Button onClick={() => nextStep(2)} size="lg" className="px-8 shadow-lg hover:shadow-xl transition-all">
                      Calcular
                      <Calculator className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3 - Results */}
              {currentStep === 3 && results && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-4">
                      <Calculator className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Resultado da Simulação</h3>
                    <p className="text-muted-foreground">Confira abaixo o resultado do seu cálculo</p>
                  </div>
                  
                  <div className="grid gap-6">
                    {/* Informações básicas */}
                    <div className="bg-gradient-to-r from-muted/30 to-muted/10 p-6 rounded-xl border">
                      <h4 className="font-semibold text-foreground mb-4 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                        Informações do Cálculo
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Tipo de solicitação</p>
                          <p className="font-semibold text-lg">{results.type}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Meses trabalhados</p>
                          <p className="font-semibold text-lg flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-primary" />
                            {results.monthsWorked} meses
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Salário médio</p>
                          <p className="font-semibold text-lg text-green-600 flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            {results.averageSalary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Valor da parcela</p>
                          <p className="font-semibold text-lg text-primary flex items-center">
                            <DollarSign className="h-4 w-4 mr-2" />
                            {results.installmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Resultado final */}
                    <div className={`p-6 rounded-xl border-2 ${results.hasRights ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      {results.hasRights ? (
                        <div className="text-center space-y-4">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-800 mb-2">
                              {results.installmentCount} parcela(s)
                            </p>
                            <p className="text-lg text-green-700 mb-1">
                              Valor mensal: {results.installmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                            <p className="text-xl font-semibold text-green-800">
                              Valor total: {results.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                          </div>
                          <div className="bg-white/70 p-4 rounded-lg">
                            <p className="text-sm text-green-700 flex items-start">
                              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                              Este é um cálculo estimado baseado nas informações fornecidas. Consulte os demais requisitos legais para confirmação do direito.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-red-800 mb-2">
                              Sem direito ao benefício
                            </p>
                            <p className="text-red-700">
                              {results.errorMessage}
                            </p>
                          </div>
                          <div className="bg-white/70 p-4 rounded-lg">
                            <p className="text-sm text-red-700">
                              Para mais informações, consulte a legislação específica ou procure orientação profissional.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={resetSimulator} size="lg" className="px-8">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Nova Simulação
                    </Button>
                  </div>

                  {/* Informações Adicionais */}
                  <div className="mt-12 space-y-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-info/10 rounded-full mb-3">
                        <Info className="h-6 w-6 text-blue-600" />
                      </div>
                      <h4 className="text-xl font-bold text-foreground mb-2">Informações Importantes</h4>
                      <p className="text-muted-foreground">Critérios e regras para o Seguro-Desemprego</p>
                    </div>

                    {/* Quem tem direito */}
                    <Card className="border-blue-200 bg-blue-50/50">
                      <CardHeader>
                        <CardTitle className="flex items-center text-blue-800">
                          <Users className="h-5 w-5 mr-2" />
                          Quem tem direito?
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-blue-700 font-medium mb-3">
                          Tem direito ao Seguro-Desemprego o trabalhador que:
                        </p>
                        <ul className="space-y-2 text-blue-700">
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                            For dispensado sem justa causa;
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                            Estiver desempregado no momento da solicitação do benefício;
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                            Tiver recebido salários de pessoa jurídica ou pessoa física equiparada à jurídica (inscrita no CEI), conforme os critérios abaixo:
                            <ul className="ml-6 mt-2 space-y-1 text-sm">
                              <li>• Pelo menos 12 (doze) meses nos últimos 18 (dezoito) meses imediatamente anteriores à data da dispensa, na primeira solicitação;</li>
                              <li>• Pelo menos 9 (nove) meses nos últimos 12 (doze) meses imediatamente anteriores à data da dispensa, na segunda solicitação;</li>
                              <li>• Cada um dos 6 (seis) meses imediatamente anteriores à data da dispensa, nas demais solicitações;</li>
                            </ul>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                            Não possuir renda própria para o seu sustento e de sua família;
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                            Não estar recebendo benefício de prestação continuada da Previdência Social, exceto pensão por morte ou auxílio-acidente.
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                            Se tiver decorrido um período de 16 meses ou mais entre a data de desligamento da última solicitação do seguro-desemprego e a data de desligamento da nova solicitação.
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Empregado Doméstico */}
                    <Card className="border-purple-200 bg-purple-50/50">
                      <CardHeader>
                        <CardTitle className="flex items-center text-purple-800">
                          <Users className="h-5 w-5 mr-2" />
                          Particularidades do Empregado Doméstico
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-purple-700">
                          <li className="flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2 text-purple-600" />
                            São devidas somente 3 parcelas.
                          </li>
                          <li className="flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2 text-purple-600" />
                            Parcela fixa de um salário-mínimo.
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Como é calculado */}
                    <Card className="border-green-200 bg-green-50/50">
                      <CardHeader>
                        <CardTitle className="flex items-center text-green-800">
                          <Calculator className="h-5 w-5 mr-2" />
                          Como é calculado as parcelas do seguro desemprego em 2025
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-green-700 font-medium">
                          A partir de 11/01/2025 a parcela do seguro desempregado passa a vigorar com os valores atualizados pelo MTE:
                        </p>
                        <div className="space-y-3 text-green-700">
                          <div className="flex items-start p-3 bg-white/70 rounded-lg">
                            <DollarSign className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                            <div>
                              <p className="font-medium">Até R$ 2.138,76</p>
                              <p className="text-sm">Multiplica-se o salário médio por 0,8.</p>
                            </div>
                          </div>
                          <div className="flex items-start p-3 bg-white/70 rounded-lg">
                            <DollarSign className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                            <div>
                              <p className="font-medium">De R$ 2.138,77 até R$ 3.564,96</p>
                              <p className="text-sm">O que exceder a R$ 2.138,76 multiplica-se por 0,5 e soma-se com R$ 1.711,01.</p>
                            </div>
                          </div>
                          <div className="flex items-start p-3 bg-white/70 rounded-lg">
                            <DollarSign className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                            <div>
                              <p className="font-medium">Acima de R$ 3.564,96</p>
                              <p className="text-sm">O valor será invariável de R$ 2.424,11.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
                          <p className="text-yellow-800 font-medium flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Com a atualização, a parcela do seguro-desemprego não pode ser inferior a R$ 1.518,00
                          </p>
                        </div>
                      </CardContent>
                    </Card>
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