import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { LoginForm } from '@/components/overtime/LoginForm';
import { Dashboard } from '@/components/overtime/Dashboard';
import { CreateCalculation } from '@/components/overtime/CreateCalculation';
import { TimeEntryForm } from '@/components/overtime/TimeEntryForm';
import { ResultsPage } from '@/components/overtime/ResultsPage';
import { CalculationStep } from '@/types/overtime';

const OvertimeCalculatorPage = () => {
  const { user, loading } = useSupabaseAuth();
  const [currentStep, setCurrentStep] = useState<CalculationStep>('dashboard');
  const [currentCalculationId, setCurrentCalculationId] = useState<string>('');
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
    setCurrentStep('dashboard');
    setCurrentCalculationId('');
  };

  const handleCalculateResults = () => {
    setCurrentStep('results');
  };

  switch (currentStep) {
    case 'dashboard':
      return (
        <Dashboard 
          onCreateNew={handleCreateNew}
          onViewCalculation={handleViewCalculation}
          onEditCalculation={handleEditCalculation}
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
        />
      );
    
    default:
      return (
        <Dashboard 
          onCreateNew={handleCreateNew}
          onViewCalculation={handleViewCalculation}
          onEditCalculation={handleEditCalculation}
        />
      );
  }
};

export default OvertimeCalculatorPage;