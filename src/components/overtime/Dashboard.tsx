import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseCalculations } from '@/hooks/useSupabaseCalculations';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Plus, Eye, Edit, Trash2, LogOut, Calculator, User, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  onCreateNew: () => void;
  onViewCalculation: (id: string) => void;
  onEditCalculation: (id: string) => void;
  selectedUserId?: string;
  selectedUserName?: string;
  onBackToSelection?: () => void;
}

export const Dashboard = ({ onCreateNew, onViewCalculation, onEditCalculation, selectedUserId, selectedUserName, onBackToSelection }: DashboardProps) => {
  const navigate = useNavigate();
  const { profile, logout } = useSupabaseAuth();
  const { isAdmin } = useAdminAuth();
  
  // Se for admin e estiver visualizando cálculos de outro usuário, usar o selectedUserId
  // Caso contrário, usar o próprio user_id
  const targetUserId = selectedUserId || profile?.user_id;
  const { calculations, deleteCalculation, loading } = useSupabaseCalculations(targetUserId);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const calculationsPerPage = 10;

  const handleLogout = async () => {
    try {
      await logout();
      // Redirecionar para a página inicial após logout
      navigate('/');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(calculations.length / calculationsPerPage);
  const startIndex = (currentPage - 1) * calculationsPerPage;
  const endIndex = startIndex + calculationsPerPage;
  const paginatedCalculations = calculations.slice(startIndex, endIndex);

  const handleDelete = async (id: string, description: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o cálculo "${description}"?`)) {
      await deleteCalculation(id);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Handle both ISO timestamps and date-only strings
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
              <Calculator className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Sistema de Horas Extras
                </h1>
                <p className="text-sm text-muted-foreground">
                  {selectedUserName ? (
                    <>Visualizando cálculos de: <span className="font-medium">{selectedUserName}</span></>
                  ) : (
                    <>Bem-vindo, {profile?.name}</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {selectedUserId && onBackToSelection && (
                <Button 
                  variant="ghost" 
                  onClick={onBackToSelection}
                  title="Voltar à Seleção"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar à Seleção
                </Button>
              )}
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
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Create Button */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                {selectedUserName ? `Cálculos de ${selectedUserName}` : 'Painel de Controle'}
              </h2>
              <p className="text-muted-foreground">
                {selectedUserName ? 
                  `Gerencie os cálculos de horas extras de ${selectedUserName}` : 
                  'Gerencie seus cálculos de horas extras'
                }
              </p>
            </div>
            <Button onClick={onCreateNew} size="lg" className="shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Criar Novo Cálculo
            </Button>
          </div>

          {/* Calculations Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedUserName ? `Cálculos de ${selectedUserName}` : 'Seus Cálculos'}
              </CardTitle>
              <CardDescription>
                {selectedUserName ? 
                  `Lista de todos os cálculos de horas extras de ${selectedUserName}` :
                  'Lista de todos os cálculos de horas extras criados'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {calculations.length === 0 ? (
                <div className="text-center py-12">
                  <Calculator className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    Nenhum cálculo encontrado
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {selectedUserName ? 
                      `${selectedUserName} ainda não possui cálculos de horas extras` :
                      'Comece criando seu primeiro cálculo de horas extras'
                    }
                  </p>
                  <Button onClick={onCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Cálculo
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                    <Table className="[&>tbody>tr:nth-child(odd)]:bg-muted/50">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">ID</TableHead>
                          <TableHead>Identificação (Nome)</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Data de Criação</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Opções</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {paginatedCalculations.map((calculation) => (
                        <TableRow key={calculation.id}>
                          <TableCell className="font-mono text-sm">
                            {calculation.id.substring(0, 8).toUpperCase()}
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
                                  onClick={() => onViewCalculation(calculation.id)}
                                  title="Visualizar"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                 <Button
                                   variant="secondary"
                                   size="sm"
                                   onClick={() => {
                                     console.log('Dashboard - Edit clicked. Real ID from database:', calculation.id);
                                     console.log('Dashboard - Calculation data:', calculation);
                                     onEditCalculation(calculation.id);
                                   }}
                                   title="Editar"
                                 >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(calculation.id, calculation.description)}
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
                  
                  {/* Pagination */}
                  {calculations.length > calculationsPerPage && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) setCurrentPage(currentPage - 1);
                              }}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            >
                              Anterior
                            </PaginationPrevious>
                          </PaginationItem>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            if (totalPages <= 7) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setCurrentPage(page);
                                    }}
                                    isActive={currentPage === page}
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }
                            
                            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setCurrentPage(page);
                                    }}
                                    isActive={currentPage === page}
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }
                            
                            if (page === currentPage - 2 || page === currentPage + 2) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            }
                            
                            return null;
                          })}
                          
                          <PaginationItem>
                            <PaginationNext 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                              }}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                            >
                              Próxima
                            </PaginationNext>
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Cards */}
          {calculations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total de Cálculos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {calculations.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cálculos criados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Concluídos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {calculations.filter(c => c.day_entries.length > 0).length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Com horários registrados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Em Andamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {calculations.filter(c => c.day_entries.length === 0).length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Aguardando registros
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};