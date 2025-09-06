import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, ChevronRight, Code, Zap, Shield, Clock, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Aplicativos</h1>
              <p className="text-sm text-muted-foreground">Tiago Nogueira</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Code className="h-4 w-4" />
              <span>Desenvolvedor</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Ferramentas Profissionais Para o Departamento Pessoal
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Aplicações desenvolvidas para facilitar cálculos e processos do dia a dia. 
              Ferramentas precisas, modernas e fáceis de usar.
            </p>
          </div>

          {/* Applications Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Overtime Calculator App */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 flex flex-col">
              <CardHeader className="flex-grow">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="text-xl">Sistema de Horas Extras</CardTitle>
                <CardDescription>
                  Sistema completo para cálculo de pontos, horas extras e adicional noturno. Controle preciso da jornada de trabalho.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Cálculo de horas extras 50% e 100%
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Adicional noturno automático
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Relatórios detalhados
                  </div>
                </div>
                <Link to="/horas-extras">
                  <Button className="w-full group-hover:bg-primary/90 transition-colors">
                    Acessar Sistema
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Salary Calculator App */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 flex flex-col">
              <CardHeader className="flex-grow">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                    <Calculator className="h-6 w-6 text-primary" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="text-xl">Calculadora de Salário</CardTitle>
                <CardDescription>
                  Calcule seu salário líquido - simule valores de descontos de INSS e IRRF, compare se compensa tributar pelas deduções legais ou pela dedução simplificada.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Tabelas 2025 atualizadas
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Cálculo preciso de descontos
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Gráfico com descontos
                  </div>
                </div>
                <Link to="/calculadora-salario">
                  <Button className="w-full group-hover:bg-primary/90 transition-colors">
                    Acessar Calculadora
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Unemployment Simulator App */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 flex flex-col">
              <CardHeader className="flex-grow">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="text-xl">Simulador de Seguro Desemprego - 2025</CardTitle>
                <CardDescription>
                  Simule Aqui os Valores das Parcelas do Seguro Desemprego em 2025
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Valores atualizados para 2025
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Cálculo automático das parcelas
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Interface intuitiva passo a passo
                  </div>
                </div>
                <Link to="/simulador-seguro-desemprego">
                  <Button className="w-full group-hover:bg-primary/90 transition-colors">
                    Acessar Simulador
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Admin Panel */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 flex flex-col">
              <CardHeader className="flex-grow">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="text-xl">Painel Administrativo</CardTitle>
                <CardDescription>
                  Acesso ao painel de administração do sistema. Gerencie usuários, configurações e relatórios avançados.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Gerenciamento de usuários
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Relatórios avançados
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Configurações do sistema
                  </div>
                </div>
                <Link to="/painel-administrativo">
                  <Button className="w-full group-hover:bg-primary/90 transition-colors">
                    Acessar Painel
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/50 mt-20">
        <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Tiago Nogueira - Consultoria em Dpto. Pessoal
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            <a href="https://tiagonogueira.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              tiagonogueira.com.br
            </a>
          </p>
        </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;