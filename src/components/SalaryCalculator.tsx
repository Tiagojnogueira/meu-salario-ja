import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Users, DollarSign } from "lucide-react";
import { SalaryChart } from "./SalaryChart";

// Tabela INSS 2024
const INSS_TABLE = [
  { min: 0, max: 1412.00, rate: 0.075, deduction: 0 },
  { min: 1412.01, max: 2666.68, rate: 0.09, deduction: 21.18 },
  { min: 2666.69, max: 4000.03, rate: 0.12, deduction: 101.18 },
  { min: 4000.04, max: 7786.02, rate: 0.14, deduction: 181.18 }
];

// Tabela IRRF 2024
const IRRF_TABLE = [
  { min: 0, max: 2259.20, rate: 0, deduction: 0 },
  { min: 2259.21, max: 2826.65, rate: 0.075, deduction: 169.44 },
  { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 381.44 },
  { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 662.77 },
  { min: 4664.69, max: Infinity, rate: 0.275, deduction: 896.00 }
];

const DEPENDENT_DEDUCTION = 189.59;

interface SalaryCalculatorProps {}

export const SalaryCalculator: React.FC<SalaryCalculatorProps> = () => {
  const [grossSalary, setGrossSalary] = useState<string>("");
  const [dependents, setDependents] = useState<string>("0");

  const calculations = useMemo(() => {
    const salary = parseFloat(grossSalary.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const dependentCount = parseInt(dependents) || 0;

    // Calcular INSS
    let inssDiscount = 0;
    const inssRange = INSS_TABLE.find(range => salary >= range.min && salary <= range.max);
    if (inssRange) {
      inssDiscount = salary * inssRange.rate - inssRange.deduction;
      inssDiscount = Math.max(0, inssDiscount);
      if (salary > 7786.02) inssDiscount = 908.85; // Teto do INSS
    }

    // Calcular base para IRRF (salário - INSS - dependentes)
    const irrfBase = salary - inssDiscount - (dependentCount * DEPENDENT_DEDUCTION);
    
    // Calcular IRRF
    let irrfDiscount = 0;
    const irrfRange = IRRF_TABLE.find(range => irrfBase >= range.min && irrfBase <= range.max);
    if (irrfRange && irrfBase > 0) {
      irrfDiscount = irrfBase * irrfRange.rate - irrfRange.deduction;
      irrfDiscount = Math.max(0, irrfDiscount);
    }

    const totalDiscounts = inssDiscount + irrfDiscount;
    const netSalary = salary - totalDiscounts;

    return {
      grossSalary: salary,
      inssDiscount,
      irrfDiscount,
      totalDiscounts,
      netSalary,
      dependentDeduction: dependentCount * DEPENDENT_DEDUCTION
    };
  }, [grossSalary, dependents]);

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
          <Calculator className="w-10 h-10 text-primary" />
          Calculadora de Salário Líquido
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Calcule seu salário líquido com precisão usando as tabelas oficiais do INSS e IRRF
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
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
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-success-light to-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TrendingUp className="w-6 h-6 text-success" />
              Resultado do Cálculo
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
                {calculations.dependentDeduction > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Dedução Dependentes:</span>
                    <span className="text-success font-medium">-{formatCurrency(calculations.dependentDeduction)}</span>
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

        {/* Chart Section */}
        {calculations.grossSalary > 0 && (
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl text-center">Distribuição do Salário</CardTitle>
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
          </div>
        )}
      </div>
    </div>
  );
};