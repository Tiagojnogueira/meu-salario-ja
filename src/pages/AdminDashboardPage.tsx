import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminData } from '@/hooks/useAdminData';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { 
  ArrowLeft, 
  Users, 
  Calculator, 
  Eye, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { profile: currentProfile, logout } = useSupabaseAuth();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const { users, allCalculations, loading, deleteUser, updateUserRole } = useAdminData();
  const { startImpersonation } = useImpersonation();
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  // Redirect if not admin
  if (!adminLoading && !isAdmin) {
    navigate('/horas-extras');
    return null;
  }

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      const success = await deleteUser(userId);
      if (success) {
        toast.success('Usuário excluído com sucesso!');
      } else {
        toast.error('Erro ao excluir usuário');
      }
    }
  };

  const handleImpersonateUser = (user: any) => {
    if (!currentProfile) {
      toast.error('Erro: perfil administrativo não encontrado');
      return;
    }
    
    startImpersonation(user, currentProfile);
    toast.success(`Agora visualizando como ${user.name}`);
    navigate('/horas-extras');
  };

  const handleToggleRole = async (userId: string, currentIsAdmin: boolean, userName: string) => {
    const newRole = currentIsAdmin ? 'user' : 'admin';
    const action = currentIsAdmin ? 'remover privilégios de administrador' : 'tornar administrador';
    
    if (window.confirm(`Tem certeza que deseja ${action} para "${userName}"?`)) {
      const success = await updateUserRole(userId, newRole);
      if (success) {
        toast.success(`Permissões de ${userName} atualizadas com sucesso!`);
        // Refresh the page to update the data
        window.location.reload();
      } else {
        toast.error('Erro ao atualizar permissões');
      }
    }
  };

  const filteredCalculations = selectedUserId === 'all' 
    ? allCalculations 
    : allCalculations.filter(calc => calc.user_id === selectedUserId);

  const formatDate = (dateString: string) => {
    try {
      const date = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const getDateRange = (startDate: string, endDate: string) => {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/horas-extras')}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Painel Administrativo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie usuários e cálculos do sistema
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Total de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {users.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Usuários cadastrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Total de Cálculos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {allCalculations.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Cálculos criados
                </p>
              </CardContent>
            </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2" />
                Administradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {users.filter(u => u.user_roles?.some(r => r.role === 'admin')).length}
              </div>
              <p className="text-sm text-muted-foreground">
                Usuários com privilégios
              </p>
            </CardContent>
          </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="calculations">Cálculos</TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Usuários</CardTitle>
                  <CardDescription>
                    Lista de todos os usuários do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Escritório</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Cálculos</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => {
                          const isUserAdmin = user.user_roles?.some(r => r.role === 'admin') || false;
                          return (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.username}</TableCell>
                              <TableCell>{user.office_name || '-'}</TableCell>
                              <TableCell>{user.phone || '-'}</TableCell>
                              <TableCell>{user.calculation_count}</TableCell>
                              <TableCell>
                                <Badge variant={isUserAdmin ? "default" : "secondary"}>
                                  {isUserAdmin ? "Admin" : "Usuário"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleImpersonateUser(user)}
                                    title="Visualizar como cliente"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/admin/user/${user.user_id}`)}
                                    title="Ver detalhes"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant={isUserAdmin ? "secondary" : "default"}
                                    size="sm"
                                    onClick={() => handleToggleRole(user.user_id, isUserAdmin, user.name)}
                                    title={isUserAdmin ? "Remover admin" : "Tornar admin"}
                                  >
                                    {isUserAdmin ? <Shield className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.user_id, user.name)}
                                    className="text-destructive hover:text-destructive"
                                    title="Excluir usuário"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calculations Tab */}
            <TabsContent value="calculations">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Cálculos do Sistema</CardTitle>
                      <CardDescription>
                        Todos os cálculos criados no sistema
                      </CardDescription>
                    </div>
                    <select 
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="all">Todos os usuários</option>
                      {users.map(user => (
                        <option key={user.user_id} value={user.user_id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Criado em</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCalculations.map((calculation) => (
                          <TableRow key={calculation.id}>
                            <TableCell className="font-mono text-sm">
                              {calculation.id.substring(0, 8).toUpperCase()}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{calculation.profiles?.name}</p>
                                <p className="text-sm text-muted-foreground">{calculation.profiles?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{calculation.description}</p>
                                <p className="text-sm text-muted-foreground">
                                  {calculation.day_entries.length} dias registrados
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getDateRange(calculation.start_date, calculation.end_date)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDate(calculation.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={calculation.day_entries.length > 0 ? "default" : "secondary"}
                              >
                                {calculation.day_entries.length > 0 ? "Concluído" : "Em andamento"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/horas-extras/resultados/${calculation.id}`)}
                                  title="Visualizar"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => navigate(`/horas-extras/editar/${calculation.id}`)}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (window.confirm(`Tem certeza que deseja excluir o cálculo "${calculation.description}"?`)) {
                                      // Handle delete calculation
                                      console.log('Delete calculation:', calculation.id);
                                    }
                                  }}
                                  className="text-destructive hover:text-destructive"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};