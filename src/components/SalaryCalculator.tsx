import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Users, DollarSign, RotateCcw } from "lucide-react";
import { SalaryChart } from "./SalaryChart";

// Tabela INSS 2025
const INSS_TABLE = [
  { min: 0.01, max: 1518.00, rate: 0.075, deduction: 0 },
  { min: 1518.01, max: 2793.88, rate: 0.09, deduction: 22.77 },
  { min: 2793.89, max: 4190.83, rate: 0.12, deduction: 106.60 },
  { min: 4190.84, max: 8157.42, rate: 0.14, deduction: 190.42 }
];

const INSS_CEILING = 951.62; // Teto INSS para empregados

// Tabela IRRF 2025
const IRRF_TABLE = [
  { min: 0, max: 2428.80, rate: 0, deduction: 0 },
  { min: 2428.81, max: 2826.65, rate: 0.075, deduction: 182.16 },
  { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 394.16 },
  { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 675.49 },
  { min: 4664.69, max: Infinity, rate: 0.275, deduction: 908.73 }
];

const DEPENDENT_DEDUCTION = 189.59;

interface SalaryCalculatorProps {}

export const SalaryCalculator: React.FC<SalaryCalculatorProps> = () => {
  const [grossSalary, setGrossSalary] = useState<string>("");
  const [dependents, setDependents] = useState<string>("0");
  const [otherDiscounts, setOtherDiscounts] = useState<string>("");

  const calculations = useMemo(() => {
    const salary = parseFloat(grossSalary.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const dependentCount = parseInt(dependents) || 0;
    const otherDiscountsValue = parseFloat(otherDiscounts.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

    // Calcular INSS (mesmo para ambos os métodos)
    let inssDiscount = 0;
    if (salary > 8157.42) {
      // Aplicar teto do INSS para salários acima do limite
      inssDiscount = INSS_CEILING;
    } else {
      // Aplicar tabela progressiva para salários dentro do limite
      const inssRange = INSS_TABLE.find(range => salary >= range.min && salary <= range.max);
      if (inssRange) {
        inssDiscount = salary * inssRange.rate - inssRange.deduction;
        inssDiscount = Math.max(0, inssDiscount);
      }
    }

    // CÁLCULO TRADICIONAL
    // Calcular base para IRRF (salário - INSS - dependentes)
    const irrfBase = salary - inssDiscount - (dependentCount * DEPENDENT_DEDUCTION);
    
    // Calcular IRRF tradicional
    let irrfDiscount = 0;
    let irrfOptional = false;
    const irrfRange = IRRF_TABLE.find(range => irrfBase >= range.min && irrfBase <= range.max);
    if (irrfRange && irrfBase > 0) {
      irrfDiscount = irrfBase * irrfRange.rate - irrfRange.deduction;
      irrfDiscount = Math.max(0, irrfDiscount);
      
      // Verificar se IRRF é menor que R$ 10,00 (opcional)
      if (irrfDiscount > 0 && irrfDiscount < 10) {
        irrfOptional = true;
      }
    }

    const totalDiscounts = inssDiscount + irrfDiscount;
    const netSalary = salary - totalDiscounts - otherDiscountsValue;

    // CÁLCULO DEDUÇÃO SIMPLIFICADA
    // Base para IRRF simplificado: salário - R$ 607,20
    const simplifiedIrrfBase = salary - 607.20;
    
    // Calcular IRRF simplificado
    let simplifiedIrrfDiscount = 0;
    let simplifiedIrrfOptional = false;
    const simplifiedIrrfRange = IRRF_TABLE.find(range => simplifiedIrrfBase >= range.min && simplifiedIrrfBase <= range.max);
    if (simplifiedIrrfRange && simplifiedIrrfBase > 0) {
      simplifiedIrrfDiscount = simplifiedIrrfBase * simplifiedIrrfRange.rate - simplifiedIrrfRange.deduction;
      simplifiedIrrfDiscount = Math.max(0, simplifiedIrrfDiscount);
      
      // Verificar se IRRF é menor que R$ 10,00 (opcional)
      if (simplifiedIrrfDiscount > 0 && simplifiedIrrfDiscount < 10) {
        simplifiedIrrfOptional = true;
      }
    }

    const simplifiedTotalDiscounts = inssDiscount + simplifiedIrrfDiscount;
    const simplifiedNetSalary = salary - simplifiedTotalDiscounts - otherDiscountsValue;

    return {
      grossSalary: salary,
      inssDiscount,
      irrfDiscount,
      irrfOptional,
      totalDiscounts,
      netSalary,
      dependentDeduction: dependentCount * DEPENDENT_DEDUCTION,
      otherDiscounts: otherDiscountsValue,
      // Dedução Simplificada
      simplifiedIrrfDiscount,
      simplifiedIrrfOptional,
      simplifiedTotalDiscounts,
      simplifiedNetSalary
    };
  }, [grossSalary, dependents, otherDiscounts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseInt(value) / 100 || 0);
    setGrossSalary(formattedValue);
  };

  const handleOtherDiscountsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseInt(value) / 100 || 0);
    setOtherDiscounts(formattedValue);
  };

  const handleNewCalculation = () => {
    setGrossSalary("");
    setDependents("0");
    setOtherDiscounts("");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
          <Calculator className="w-10 h-10 text-primary" />
          Calculadora de Salário Líquido
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Calcule seu salário líquido - tiagonogueira.com.br
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-accent/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <DollarSign className="w-6 h-6 text-primary" />
              Dados do Salário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="gross-salary" className="text-base font-medium">
                Salário Bruto
              </Label>
              <Input
                id="gross-salary"
                type="text"
                value={grossSalary}
                onChange={handleSalaryChange}
                placeholder="R$ 0,00"
                className="text-lg h-14 text-center font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependents" className="text-base font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Número de Dependentes
              </Label>
              <Select value={dependents} onValueChange={setDependents}>
                <SelectTrigger className="h-12 text-lg">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i} {i === 1 ? 'dependente' : 'dependentes'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {parseInt(dependents) > 0 && (
                <p className="text-sm text-muted-foreground">
                  Dedução por dependente: {formatCurrency(DEPENDENT_DEDUCTION)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="other-discounts" className="text-base font-medium">
                Outros Descontos (R$)
              </Label>
              <Input
                id="other-discounts"
                type="text"
                value={otherDiscounts}
                onChange={handleOtherDiscountsChange}
                placeholder="R$ 0,00"
                className="text-lg h-14 text-center font-semibold"
              />
            </div>

            <Button
              onClick={handleNewCalculation}
              variant="outline"
              className="w-full h-12 text-lg gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Novo Cálculo
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-success-light to-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TrendingUp className="w-6 h-6 text-success" />
              Resultado do Cálculo - Deduções Legais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-card/80 backdrop-blur p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Salário Bruto:</span>
                  <span className="font-semibold text-lg">{formatCurrency(calculations.grossSalary)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">INSS:</span>
                  <span className="text-destructive font-medium">-{formatCurrency(calculations.inssDiscount)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">IRRF:</span>
                  <span className="text-destructive font-medium">-{formatCurrency(calculations.irrfDiscount)}</span>
                </div>
                {calculations.irrfOptional && (
                  <p className="text-xs text-amber-600 mb-2 italic">
                    * IRRF menor que R$ 10,00 - recolhimento opcional
                  </p>
                )}
                {calculations.dependentDeduction > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Dedução Dependentes:</span>
                    <span className="text-success font-medium">-{formatCurrency(calculations.dependentDeduction)}</span>
                  </div>
                )}
                {calculations.otherDiscounts > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Outros Descontos:</span>
                    <span className="text-destructive font-medium">-{formatCurrency(calculations.otherDiscounts)}</span>
                  </div>
                )}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Salário Líquido:</span>
                    <span className="text-2xl font-bold text-success">
                      {formatCurrency(calculations.netSalary)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simplified Deduction Results Section */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-primary-light to-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Calculator className="w-6 h-6 text-primary" />
              Resultado - Dedução Simplificada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-card/80 backdrop-blur p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Salário Bruto:</span>
                  <span className="font-semibold text-lg">{formatCurrency(calculations.grossSalary)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">INSS:</span>
                  <span className="text-destructive font-medium">-{formatCurrency(calculations.inssDiscount)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">IRRF (Base: Bruto - R$ 607,20):</span>
                  <span className="text-destructive font-medium">-{formatCurrency(calculations.simplifiedIrrfDiscount)}</span>
                </div>
                {calculations.simplifiedIrrfOptional && (
                  <p className="text-xs text-amber-600 mb-2 italic">
                    * IRRF menor que R$ 10,00 - recolhimento opcional
                  </p>
                )}
                {calculations.otherDiscounts > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Outros Descontos:</span>
                    <span className="text-destructive font-medium">-{formatCurrency(calculations.otherDiscounts)}</span>
                  </div>
                )}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Salário Líquido:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(calculations.simplifiedNetSalary)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        {calculations.grossSalary > 0 && (
          <div className="lg:col-span-3 grid md:grid-cols-2 gap-6">
            {/* Legal Deductions Chart */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl text-center">Distribuição do Salário - Deduções Legais</CardTitle>
              </CardHeader>
              <CardContent>
                <SalaryChart 
                  grossSalary={calculations.grossSalary}
                  inssDiscount={calculations.inssDiscount}
                  irrfDiscount={calculations.irrfDiscount}
                  netSalary={calculations.netSalary}
                />
              </CardContent>
            </Card>

            {/* Simplified Deduction Chart */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl text-center">Distribuição do Salário - Dedução Simplificada</CardTitle>
              </CardHeader>
              <CardContent>
                <SalaryChart 
                  grossSalary={calculations.grossSalary}
                  inssDiscount={calculations.inssDiscount}
                  irrfDiscount={calculations.simplifiedIrrfDiscount}
                  netSalary={calculations.simplifiedNetSalary}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};