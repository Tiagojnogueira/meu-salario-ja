import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseCalculations } from '@/hooks/useSupabaseCalculations';
import { Plus, Eye, Trash2, LogOut, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardProps {
  onCreateNew: () => void;
  onViewCalculation: (id: string) => void;
}

export const Dashboard = ({ onCreateNew, onViewCalculation }: DashboardProps) => {
  const { profile, logout } = useSupabaseAuth();
  const { calculations, deleteCalculation, loading } = useSupabaseCalculations(profile?.user_id);

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
                  Bem-vindo, {profile?.name}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Create Button */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Painel de Controle</h2>
              <p className="text-muted-foreground">Gerencie seus cálculos de horas extras</p>
            </div>
            <Button onClick={onCreateNew} size="lg" className="shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Criar Novo Cálculo
            </Button>
          </div>

          {/* Calculations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Seus Cálculos</CardTitle>
              <CardDescription>
                Lista de todos os cálculos de horas extras criados
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
                    Comece criando seu primeiro cálculo de horas extras
                  </p>
                  <Button onClick={onCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Cálculo
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
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
                      {calculations.map((calculation) => (
                        <TableRow key={calculation.id}>
                          <TableCell className="font-mono text-sm">
                            #{String(calculations.length - calculations.findIndex(c => c.id === calculation.id)).padStart(3, '0')}
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