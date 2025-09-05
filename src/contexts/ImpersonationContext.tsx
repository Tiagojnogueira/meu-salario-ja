import { createContext, useContext, useState, ReactNode } from 'react';
import { Profile } from '@/hooks/useSupabaseAuth';

interface ImpersonationContextType {
  impersonatedUser: Profile | null;
  originalUser: Profile | null;
  isImpersonating: boolean;
  startImpersonation: (user: Profile, originalUser: Profile) => void;
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export const useImpersonation = () => {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
};

interface ImpersonationProviderProps {
  children: ReactNode;
}

export const ImpersonationProvider = ({ children }: ImpersonationProviderProps) => {
  const [impersonatedUser, setImpersonatedUser] = useState<Profile | null>(null);
  const [originalUser, setOriginalUser] = useState<Profile | null>(null);

  const startImpersonation = (user: Profile, admin: Profile) => {
    setImpersonatedUser(user);
    setOriginalUser(admin);
  };

  const stopImpersonation = () => {
    setImpersonatedUser(null);
    setOriginalUser(null);
  };

  const isImpersonating = impersonatedUser !== null;

  return (
    <ImpersonationContext.Provider
      value={{
        impersonatedUser,
        originalUser,
        isImpersonating,
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
};