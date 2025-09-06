import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Calculator, Users, LogOut, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminDashboardSelectionProps {
  onMyCalculations: () => void;
  onUserCalculations: () => void;
}

export const AdminDashboardSelection = ({ onMyCalculations, onUserCalculations }: AdminDashboardSelectionProps) => {
  const navigate = useNavigate();
  const { profile, logout } = useSupabaseAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Calculator className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Sistema de Horas Extras
                </h1>
                <p className="text-sm text-muted-foreground">
                  Bem-vindo, {profile?.name} (Administrador)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                title="Voltar"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/horas-extras/perfil')}
                title="Minha Conta"
              >
                <User className="h-4 w-4 mr-2" />
                Minha Conta
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Painel Administrativo</h2>
            <p className="text-muted-foreground">Escolha qual área deseja acessar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Meus Cálculos */}
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 group" onClick={onMyCalculations}>
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 mx-auto group-hover:bg-primary/20 transition-colors">
                  <Calculator className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Meus Cálculos</CardTitle>
                <CardDescription>
                  Gerencie seus próprios cálculos de horas extras
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Criar novos cálculos
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Visualizar relatórios
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Editar registros
                  </div>
                </div>
                <Button className="w-full group-hover:bg-primary/90 transition-colors">
                  Acessar Meus Cálculos
                </Button>
              </CardContent>
            </Card>

            {/* Cálculos dos Usuários */}
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 group" onClick={onUserCalculations}>
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-full mb-4 mx-auto group-hover:bg-secondary/20 transition-colors">
                  <Users className="h-8 w-8 text-secondary-foreground" />
                </div>
                <CardTitle className="text-xl">Cálculos dos Usuários</CardTitle>
                <CardDescription>
                  Visualize e gerencie cálculos de outros usuários
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Selecionar usuário
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Visualizar cálculos
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Gerar relatórios
                  </div>
                </div>
                <Button variant="secondary" className="w-full group-hover:bg-secondary/90 transition-colors">
                  Ver Cálculos dos Usuários
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};