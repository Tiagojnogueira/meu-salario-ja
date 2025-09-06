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
      console.log('Iniciando busca de usuários...');
      
      // Primeiro, buscar todos os profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('Profiles encontrados:', profiles);
      
      if (profilesError) {
        console.error('Erro ao buscar profiles:', profilesError);
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        console.log('Nenhum profile encontrado');
        return [];
      }

      // Buscar roles separadamente
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      console.log('Roles encontradas:', roles);
      
      if (rolesError) {
        console.error('Erro ao buscar roles:', rolesError);
        // Continuar mesmo se houver erro nas roles
      }

      // Combinar profiles com roles
      const usersWithRoles = profiles.map((profile: any) => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || 'user'
        };
      });

      console.log('Usuários finais:', usersWithRoles);
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