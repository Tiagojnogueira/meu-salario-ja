import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useUsers } from '@/hooks/useUsers';
import { Calculator, Users, LogOut, User, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserSelectionProps {
  onBack: () => void;
  onUserSelected: (userId: string, userName: string) => void;
}

export const UserSelection = ({ onBack, onUserSelected }: UserSelectionProps) => {
  const navigate = useNavigate();
  const { profile, logout } = useSupabaseAuth();
  const { data: users, isLoading } = useUsers();
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Ordenar usuários: primeiro o próprio admin, depois usuários ativos, depois inativos
  const sortedUsers = users ? users
    .sort((a, b) => {
      // Colocar o próprio usuário logado primeiro
      if (a.user_id === profile?.user_id) return -1;
      if (b.user_id === profile?.user_id) return 1;
      // Usuários ativos vêm antes dos inativos
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      // Depois ordenar por nome
      return a.name.localeCompare(b.name);
    }) : [];

  // Definir o usuário padrão como o próprio admin ao carregar a lista
  useEffect(() => {
    if (sortedUsers.length > 0 && !selectedUserId && profile?.user_id) {
      setSelectedUserId(profile.user_id);
    }
  }, [sortedUsers, selectedUserId, profile?.user_id]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const handleConfirm = () => {
    if (!selectedUserId) {
      toast.error('Por favor, selecione um usuário');
      return;
    }

    const selectedUser = sortedUsers.find(u => u.user_id === selectedUserId);
    if (!selectedUser) {
      toast.error('Usuário não encontrado');
      return;
    }

    onUserSelected(selectedUserId, selectedUser.name);
  };

  // Todos os usuários (ativos e inativos)
  const allUsers = sortedUsers;

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
                onClick={onBack}
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
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Selecionar Usuário</h2>
            <p className="text-muted-foreground">Escolha o usuário cujos cálculos deseja visualizar</p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-full mb-4 mx-auto">
                <Users className="h-8 w-8 text-secondary-foreground" />
              </div>
              <CardTitle className="text-xl">Seleção de Usuário</CardTitle>
              <CardDescription>
                Selecione um usuário para gerenciar seus cálculos de horas extras
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando usuários...</p>
                </div>
              ) : allUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    Nenhum usuário encontrado
                  </h3>
                  <p className="text-muted-foreground">
                    Não há usuários no sistema no momento
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Usuário
                    </label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {allUsers.map((user) => (
                          <SelectItem key={user.user_id} value={user.user_id}>
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                {user.active ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                                <span className={`font-medium ${!user.active ? 'text-muted-foreground' : ''}`}>
                                  {user.name}
                                  {user.user_id === profile?.user_id && (
                                    <span className="text-xs text-primary ml-1">(Você)</span>
                                  )}
                                  {!user.active && (
                                    <span className="text-xs text-red-500 ml-1">(Inativo)</span>
                                  )}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                ({user.email})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={onBack} className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={handleConfirm} className="flex-1">
                      Confirmar
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};