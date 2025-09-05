import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { ArrowLeft, Eye, AlertTriangle } from 'lucide-react';

export const ImpersonationBanner = () => {
  const { impersonatedUser, originalUser, isImpersonating, stopImpersonation } = useImpersonation();

  if (!isImpersonating || !impersonatedUser || !originalUser) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 mb-4">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Eye className="h-4 w-4 text-orange-600" />
          <span className="font-medium text-orange-800 dark:text-orange-200">
            Visualizando como: <strong>{impersonatedUser.name}</strong> ({impersonatedUser.email})
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={stopImpersonation}
          className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para {originalUser.name}
        </Button>
      </AlertDescription>
    </Alert>
  );
};