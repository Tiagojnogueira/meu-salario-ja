import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  username: string;
  office_name?: string;
  phone?: string;
  created_at: string;
  role?: string;
}

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Buscar todos os profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) {
        throw profilesError;
      }

      // Por enquanto, assumir role 'user' para todos os usuários
      // TODO: Implementar busca de roles quando os tipos estiverem corretos
      const usersWithRoles = profiles.map((profile) => ({
        ...profile,
        role: 'user' // Valor padrão por enquanto
      }));

      return usersWithRoles as UserProfile[];
    },
  });
};

export const useUserStats = () => {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, created_at');
      
      if (error) {
        throw error;
      }

      const totalUsers = profiles.length;
      const today = new Date().toISOString().split('T')[0];
      const newUsersToday = profiles.filter(p => 
        p.created_at.startsWith(today)
      ).length;

      return {
        totalUsers,
        newUsersToday
      };
    },
  });
};