import { useParams, useNavigate } from 'react-router-dom';
import { ResultsPage } from '@/components/overtime/ResultsPage';

export const EditResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Pegar userId da query string se disponível (quando admin visualiza outro usuário)
  const urlParams = new URLSearchParams(window.location.search);
  const selectedUserId = urlParams.get('userId');

  if (!id) {
    return <div>ID do cálculo não encontrado</div>;
  }

  return (
    <ResultsPage 
      calculationId={id}
      onBack={() => {
        const url = selectedUserId 
          ? `/horas-extras/editar-horarios/${id}?userId=${selectedUserId}`
          : `/horas-extras/editar-horarios/${id}`;
        navigate(url);
      }}
      onBackToDashboard={() => navigate('/horas-extras')}
      onEdit={() => {
        const url = selectedUserId 
          ? `/horas-extras/editar/${id}?userId=${selectedUserId}`
          : `/horas-extras/editar/${id}`;
        navigate(url);
      }}
      selectedUserId={selectedUserId || undefined}
    />
  );
};