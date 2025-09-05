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
  const { users, loading } = useAdminData();
  const { startImpersonation } = useImpersonation();

  // Redirect if not admin
  if (!adminLoading && !isAdmin) {
    navigate('/horas-extras');
    return null;
  }

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  const handleImpersonateUser = (user: any) => {
    if (!currentProfile) {
      toast.error('Erro: perfil administrativo não encontrado');
      return;
    }
    
    startImpersonation(user, currentProfile);
    toast.success(`Agora visualizando como ${user.name}`);
    navigate('/horas-extras');
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
        <div className="max-w-6xl mx-auto">
          
          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Users className="h-6 w-6 mr-3" />
                Usuários Cadastrados ({users.length})
              </CardTitle>
              <CardDescription>
                Lista completa de todos os usuários do sistema
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
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const isUserAdmin = user.user_roles?.some(r => r.role === 'admin') || false;
                      return (
                        <TableRow key={user.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">@{user.username}</Badge>
                          </TableCell>
                          <TableCell>{user.office_name || '-'}</TableCell>
                          <TableCell>{user.phone || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.calculation_count || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isUserAdmin ? "default" : "secondary"}>
                              {isUserAdmin ? "Admin" : "Usuário"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleImpersonateUser(user)}
                              title="Visualizar como este usuário"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Visualizar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {users.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum usuário encontrado no sistema</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};