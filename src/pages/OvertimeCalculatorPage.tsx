import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { LoginForm } from '@/components/overtime/LoginForm';
import { Dashboard } from '@/components/overtime/Dashboard';
import { AdminDashboardSelection } from '@/components/overtime/AdminDashboardSelection';
import { UserSelection } from '@/components/overtime/UserSelection';
import { CreateCalculation } from '@/components/overtime/CreateCalculation';
import { TimeEntryForm } from '@/components/overtime/TimeEntryForm';
import { ResultsPage } from '@/components/overtime/ResultsPage';
import { CalculationStep } from '@/types/overtime';

const OvertimeCalculatorPage = () => {
  const { user, loading } = useSupabaseAuth();
  const { isAdmin } = useAdminAuth();
  const [currentStep, setCurrentStep] = useState<CalculationStep | 'admin-selection' | 'user-selection'>('dashboard');
  const [currentCalculationId, setCurrentCalculationId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLoginSuccess={() => setCurrentStep('dashboard')} />;
  }

  // Se o usuário logou e é admin, mostrar seleção inicial  
  if (user && isAdmin && currentStep === 'dashboard' && !selectedUserId) {
    setCurrentStep('admin-selection');
  }

  const handleCreateNew = () => {
    setCurrentCalculationId('');
    setCurrentStep('create');
  };

  const handleViewCalculation = (id: string) => {
    setCurrentCalculationId(id);
    setCurrentStep('results');
  };

  const handleEditCalculation = (id: string) => {
    console.log('OvertimeCalculatorPage - Navigating to edit with database ID:', id);
    navigate('/horas-extras/editar/' + id);
  };

  const handleContinueToTimeEntry = (calculationId: string) => {
    setCurrentCalculationId(calculationId);
    setCurrentStep('time-entry');
  };

  const handleBackToDashboard = () => {
    if (isAdmin && selectedUserId) {
      // Se for admin visualizando outro usuário, voltar para seleção
      setCurrentStep('admin-selection');
      setSelectedUserId('');
      setSelectedUserName('');
    } else {
      setCurrentStep('dashboard');
    }
    setCurrentCalculationId('');
  };

  const handleCalculateResults = () => {
    setCurrentStep('results');
  };

  switch (currentStep) {
    case 'admin-selection':
      return (
        <AdminDashboardSelection 
          onMyCalculations={() => {
            setSelectedUserId('');
            setSelectedUserName('');
            setCurrentStep('dashboard');
          }}
          onUserCalculations={() => setCurrentStep('user-selection')}
        />
      );

    case 'user-selection':
      return (
        <UserSelection 
          onBack={() => setCurrentStep('admin-selection')}
          onUserSelected={(userId, userName) => {
            setSelectedUserId(userId);
            setSelectedUserName(userName);
            setCurrentStep('dashboard');
          }}
        />
      );
    
    case 'dashboard':
      return (
        <Dashboard 
          onCreateNew={handleCreateNew}
          onViewCalculation={handleViewCalculation}
          onEditCalculation={handleEditCalculation}
          selectedUserId={selectedUserId}
          selectedUserName={selectedUserName}
          onBackToSelection={() => {
            setSelectedUserId('');
            setSelectedUserName('');
            setCurrentStep('admin-selection');
          }}
        />
      );
    
    case 'create':
      return (
        <CreateCalculation 
          onBack={handleBackToDashboard}
          onContinue={handleContinueToTimeEntry}
        />
      );
    
    case 'time-entry':
      return (
        <TimeEntryForm 
          calculationId={currentCalculationId}
          onBack={() => setCurrentStep('create')}
          onCalculate={handleCalculateResults}
        />
      );
    
    case 'results':
      return (
        <ResultsPage 
          calculationId={currentCalculationId}
          onBack={() => setCurrentStep('time-entry')}
          onBackToDashboard={handleBackToDashboard}
          onEdit={() => navigate('/horas-extras/editar/' + currentCalculationId)}
        />
      );
    
    default:
      return (
        <Dashboard 
          onCreateNew={handleCreateNew}
          onViewCalculation={handleViewCalculation}
          onEditCalculation={handleEditCalculation}
          selectedUserId={selectedUserId}
          selectedUserName={selectedUserName}
          onBackToSelection={() => {
            setSelectedUserId('');
            setSelectedUserName('');
            setCurrentStep('admin-selection');
          }}
        />
      );
  }
};

export default OvertimeCalculatorPage;