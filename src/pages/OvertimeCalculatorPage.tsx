import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { LoginForm } from '@/components/overtime/LoginForm';
import { Dashboard } from '@/components/overtime/Dashboard';
import { UserSelection } from '@/components/overtime/UserSelection';
import { CreateCalculation } from '@/components/overtime/CreateCalculation';
import { TimeEntryForm } from '@/components/overtime/TimeEntryForm';
import { ResultsPage } from '@/components/overtime/ResultsPage';
import { CalculationStep } from '@/types/overtime';

const OvertimeCalculatorPage = () => {
  const { user, loading } = useSupabaseAuth();
  const { isAdmin } = useAdminAuth();
  const [currentStep, setCurrentStep] = useState<CalculationStep | 'user-selection'>('dashboard');
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

  // Se o usuário logou e é admin e está no dashboard sem usuário selecionado, redirecionar para seleção
  if (user && isAdmin && currentStep === 'dashboard' && !selectedUserId) {
    setCurrentStep('user-selection');
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
    // Se for admin visualizando outro usuário, incluir o selectedUserId na URL
    const url = selectedUserId 
      ? `/horas-extras/editar/${id}?userId=${selectedUserId}`
      : `/horas-extras/editar/${id}`;
    navigate(url);
  };

  const handleContinueToTimeEntry = (calculationId: string) => {
    setCurrentCalculationId(calculationId);
    setCurrentStep('time-entry');
  };

  const handleBackToDashboard = () => {
    if (isAdmin && selectedUserId) {
      // Se for admin com usuário selecionado, ir para dashboard do usuário selecionado
      setCurrentStep('dashboard');
    } else if (isAdmin) {
      // Se for admin sem usuário selecionado, ir para seleção de usuário
      setCurrentStep('user-selection');
      setSelectedUserId('');
      setSelectedUserName('');
    } else {
      // Usuário normal vai para dashboard
      setCurrentStep('dashboard');
    }
    setCurrentCalculationId('');
  };

  const handleCalculateResults = () => {
    console.log('OvertimeCalculatorPage - handleCalculateResults called with selectedUserId:', selectedUserId);
    setCurrentStep('results');
  };

  switch (currentStep) {
    case 'user-selection':
      return (
        <UserSelection 
          onBack={() => navigate('/')}
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
            setCurrentStep('user-selection');
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
          selectedUserId={selectedUserId}
        />
      );
    
    case 'results':
      return (
        <ResultsPage 
          calculationId={currentCalculationId}
          onBack={() => setCurrentStep('time-entry')}
          onBackToDashboard={handleBackToDashboard}
          onEdit={() => {
            const url = selectedUserId 
              ? `/horas-extras/editar/${currentCalculationId}?userId=${selectedUserId}`
              : `/horas-extras/editar/${currentCalculationId}`;
            navigate(url);
          }}
          selectedUserId={selectedUserId}
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
            setCurrentStep('user-selection');
          }}
        />
      );
  }
};

export default OvertimeCalculatorPage;