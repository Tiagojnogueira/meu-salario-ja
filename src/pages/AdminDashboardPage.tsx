import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Settings, TrendingUp, ChevronLeft, Mail, Phone, Building, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useUsers, useUserStats } from "@/hooks/useUsers";
import { useState } from "react";

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: stats } = useUserStats();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

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
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Settings className="h-4 w-4" />
              <span>Admin</span>
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="inline-flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">
                                    {user.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    @{user.username}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3 mr-2" />
                                  {user.email}
                                </div>
                                {user.phone && (
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3 mr-2" />
                                    {user.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.office_name ? (
                                <div className="flex items-center text-sm">
                                  <Building className="h-3 w-3 mr-2 text-muted-foreground" />
                                  {user.office_name}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(user.role || 'user')}>
                                {user.role === 'admin' ? 'Administrador' : 
                                 user.role === 'moderator' ? 'Moderador' : 'Usuário'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(user.created_at)}
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