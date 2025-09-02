import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, ChevronRight, Code, Zap } from "lucide-react";
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
              Ferramentas Profissionais
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Aplicações desenvolvidas para facilitar cálculos e processos do dia a dia. 
              Ferramentas precisas, modernas e fáceis de usar.
            </p>
          </div>

          {/* Applications Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Salary Calculator App */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                    <Calculator className="h-6 w-6 text-primary" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="text-xl">Calculadora de Salário</CardTitle>
                <CardDescription>
                  Calcule seu salário líquido com precisão usando as tabelas oficiais do INSS e IRRF 2025.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                    Interface responsiva
                  </div>
                </div>
                <Link to="/calculadora-salario">
                  <Button className="w-full mt-6 group-hover:bg-primary/90 transition-colors">
                    Acessar Calculadora
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Placeholder for future apps */}
            <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/5">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-lg">
                  <Code className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl text-muted-foreground">Próximo Aplicativo</CardTitle>
                <CardDescription>
                  Em breve, uma nova ferramenta será disponibilizada aqui.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  Em Desenvolvimento
                </Button>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/5">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-lg">
                  <Code className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl text-muted-foreground">Futuro Projeto</CardTitle>
                <CardDescription>
                  Mais aplicações serão adicionadas conforme a demanda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  Em Desenvolvimento
                </Button>
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
              Desenvolvido com React + TypeScript
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;