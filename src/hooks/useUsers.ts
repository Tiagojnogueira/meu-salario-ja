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
      // Buscar profiles com roles através de JOIN
      const { data: users, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }

      // Transformar os dados para o formato esperado
      const usersWithRoles = users.map((user: any) => ({
        ...user,
        role: user.user_roles?.[0]?.role || 'user'
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