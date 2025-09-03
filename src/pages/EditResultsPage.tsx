import { useParams, useNavigate } from 'react-router-dom';
import { ResultsPage } from '@/components/overtime/ResultsPage';

export const EditResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) {
    return <div>ID do cálculo não encontrado</div>;
  }

  return (
    <ResultsPage 
      calculationId={id}
      onBack={() => navigate(`/horas-extras/editar-horarios/${id}`)}
      onBackToDashboard={() => navigate('/horas-extras')}
      onEdit={() => navigate(`/horas-extras/editar/${id}`)}
    />
  );
};