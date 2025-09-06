import { useState } from "react";
import { ArrowLeft, Users, FileText, BarChart3, Mail, Phone, Building, User, LogOut, Shield, Settings, TrendingUp, ChevronLeft, Eye, EyeOff, Edit, UserCog, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { useUsers, useUserStats, UserProfile } from "@/hooks/useUsers";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useUserManagement } from "@/hooks/useUserManagement";
import { toast } from "sonner";

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    username: '',
    office_name: '',
    phone: '',
    role: 'user'
  });
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useUsers();
  const { data: stats } = useUserStats();
  const { user, isAdmin, loading: adminLoading, isAuthenticated } = useAdminAuth();
  const { logout, login } = useSupabaseAuth();
  const { updateUserProfile, updateUserRole, deleteUser } = useUserManagement();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleEditUser = (userToEdit: UserProfile) => {
    setEditingUser(userToEdit);
    setEditForm({
      name: userToEdit.name || '',
      email: userToEdit.email || '',
      username: userToEdit.username || '',
      office_name: userToEdit.office_name || '',
      phone: userToEdit.phone || '',
      role: userToEdit.role || 'user'
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      // Atualizar perfil do usuário
      const profileResult = await updateUserProfile(editingUser.user_id, {
        name: editForm.name,
        email: editForm.email,
        username: editForm.username,
        office_name: editForm.office_name,
        phone: editForm.phone,
      });

      if (!profileResult.success) {
        throw profileResult.error;
      }

      // Atualizar role se mudou
      if (editForm.role !== editingUser.role) {
        const roleResult = await updateUserRole(editingUser.user_id, editForm.role as 'user' | 'admin');
        
        if (!roleResult.success) {
          throw roleResult.error;
        }
      }

      toast.success('Usuário atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setEditingUser(null);
      refetchUsers(); // Recarregar a lista
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      
      // Tratar erros específicos
      if (error?.code === '23505') {
        if (error.details?.includes('username')) {
          toast.error('Nome de usuário já está em uso');
        } else if (error.details?.includes('email')) {
          toast.error('Email já está em uso');
        } else {
          toast.error('Dados duplicados encontrados');
        }
      } else if (error?.code === 'PGRST116') {
        toast.error('Usuário não encontrado');
      } else {
        toast.error('Erro ao atualizar usuário: ' + (error?.message || 'Erro desconhecido'));
      }
    }
  };

  const handleDeleteUser = async (userToDelete: UserProfile) => {
    if (userToDelete.user_id === user?.id) {
      toast.error('Você não pode deletar sua própria conta');
      return;
    }

    if (confirm(`Tem certeza que deseja deletar o usuário ${userToDelete.name}?\n\nEsta ação irá:\n- Remover o perfil do usuário\n- Remover todas as permissões\n- Deletar todos os cálculos do usuário\n\nEsta ação não pode ser desfeita.`)) {
      try {
        const result = await deleteUser(userToDelete.user_id);
        
        if (!result.success) {
          throw result.error;
        }
        
        toast.success(`Usuário ${userToDelete.name} deletado com sucesso!`);
        refetchUsers();
      } catch (error: any) {
        console.error('Erro ao deletar usuário:', error);
        
        if (error?.code === 'PGRST116') {
          toast.error('Usuário não encontrado');
        } else {
          toast.error('Erro ao deletar usuário: ' + (error?.message || 'Erro desconhecido'));
        }
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsLoggingIn(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Login realizado com sucesso!');
        // A página será automaticamente atualizada pelo hook de autenticação
      } else {
        toast.error('Email ou senha incorretos');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-2xl">Acesso Administrativo</CardTitle>
            <CardDescription>
              Faça login para acessar o painel administrativo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoggingIn}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoggingIn}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoggingIn}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Shield className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Fazer Login'
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/'}
                disabled={isLoggingIn}
              >
                Voltar ao Sistema
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Alert>
              <AlertDescription>
                Você não tem permissão para acessar o painel administrativo.
                Apenas administradores podem acessar esta área.
              </AlertDescription>
            </Alert>
            <Button onClick={() => window.location.href = '/'} className="w-full mt-4">
              Voltar ao Sistema
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
                <p className="text-sm text-muted-foreground">Gerenciamento do Sistema</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{user?.email}</span>
                <Badge variant="outline" className="ml-2">Admin</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
              <Settings className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Painel de Administração
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Gerencie usuários, visualize relatórios e configure o sistema de forma centralizada.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center justify-center rounded-lg bg-muted p-1">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('overview')}
                className="rounded-md px-4"
              >
                Visão Geral
              </Button>
              <Button
                variant={activeTab === 'users' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('users')}
                className="rounded-md px-4"
              >
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </Button>
            </div>
          </div>

          {activeTab === 'overview' && (
            <>
              {/* Admin Tools Grid */}
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
                {/* User Management */}
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 flex flex-col">
                  <CardHeader className="flex-grow">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Gerenciamento de Usuários</CardTitle>
                    <CardDescription>
                      Visualize e gerencie todos os usuários registrados no sistema. Controle permissões e acesso.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Lista completa de usuários
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Controle de permissões
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Histórico de atividades
                      </div>
                    </div>
                    <Button 
                      className="w-full group-hover:bg-primary/90 transition-colors"
                      onClick={() => setActiveTab('users')}
                    >
                      Gerenciar Usuários
                    </Button>
                  </CardContent>
                </Card>

                {/* Reports */}
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 flex flex-col">
                  <CardHeader className="flex-grow">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Relatórios</CardTitle>
                    <CardDescription>
                      Acesse relatórios detalhados sobre uso do sistema, cálculos realizados e estatísticas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Relatórios de uso
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Estatísticas detalhadas
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Exportação de dados
                      </div>
                    </div>
                    <Button className="w-full group-hover:bg-primary/90 transition-colors">
                      Ver Relatórios
                    </Button>
                  </CardContent>
                </Card>

                {/* Analytics */}
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 flex flex-col">
                  <CardHeader className="flex-grow">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Análises</CardTitle>
                    <CardDescription>
                      Visualize métricas de desempenho, tendências de uso e insights sobre o sistema.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Métricas em tempo real
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Tendências de uso
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Dashboard interativo
                      </div>
                    </div>
                    <Button className="w-full group-hover:bg-primary/90 transition-colors">
                      Ver Análises
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid gap-6 md:grid-cols-4">
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-foreground mb-2">
                      {stats?.totalUsers || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total de Usuários</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-foreground mb-2">
                      {stats?.newUsersToday || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Novos Hoje</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-foreground mb-2">0</div>
                    <div className="text-sm text-muted-foreground">Cálculos Hoje</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-foreground mb-2">100%</div>
                    <div className="text-sm text-muted-foreground">Sistema Online</div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Users Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Gerenciamento de Usuários</h3>
                  <p className="text-muted-foreground">
                    {users?.length || 0} usuários cadastrados no sistema
                  </p>
                </div>
              </div>

              {/* Users Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Lista de Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Carregando usuários...</div>
                    </div>
                  ) : users && users.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Função</TableHead>
                          <TableHead>Cadastro</TableHead>
                          <TableHead className="text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((userData) => (
                          <TableRow key={userData.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="inline-flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">
                                    {userData.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    @{userData.username}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3 mr-2" />
                                  {userData.email}
                                </div>
                                {userData.phone && (
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3 mr-2" />
                                    {userData.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {userData.office_name ? (
                                <div className="flex items-center text-sm">
                                  <Building className="h-3 w-3 mr-2 text-muted-foreground" />
                                  {userData.office_name}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(userData.role || 'user')}>
                                {userData.role === 'admin' ? 'Administrador' : 'Usuário'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(userData.created_at)}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => handleEditUser(userData)}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar Perfil
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditUser(userData)}
                                    className="cursor-pointer"
                                  >
                                    <UserCog className="mr-2 h-4 w-4" />
                                    Alterar Função
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteUser(userData)}
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                    disabled={userData.user_id === user?.id}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Deletar Usuário
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <div className="text-muted-foreground">Nenhum usuário cadastrado</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </main>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Faça alterações nos dados do usuário aqui. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="office" className="text-right">
                Empresa
              </Label>
              <Input
                id="office"
                value={editForm.office_name}
                onChange={(e) => setEditForm({ ...editForm, office_name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Telefone
              </Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Função
              </Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveUser}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t bg-background/50 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Tiago Nogueira - Painel Administrativo
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboardPage;