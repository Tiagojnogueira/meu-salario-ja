import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

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
  active: boolean;
}

export const useUsers = () => {
  const { session, user } = useSupabaseAuth();

  return useQuery({
    queryKey: ['users', user?.id],
    queryFn: async () => {
      try {
        // Verificar se há sessão ativa
        if (!session || !user) {
          console.log('⚠️ Usuário não autenticado');
          throw new Error('Usuário não autenticado');
        }

        console.log('🔍 Buscando usuários do sistema...', { userId: user.id });
        
        // Query simples e direta para buscar todos os profiles
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            name,
            email,
            username,
            office_name,
            phone,
            created_at,
            active
          `)
          .order('name', { ascending: true });
        
        if (error) {
          console.error('❌ Erro na consulta:', error);
          throw error;
        }
        
        console.log('✅ Dados encontrados:', data);
        
        if (!data || data.length === 0) {
          console.log('⚠️ Nenhum usuário encontrado no banco');
          return [];
        }

        // Buscar roles para cada usuário
        const usersWithRoles = await Promise.all(
          data.map(async (user: any) => {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.user_id)
              .maybeSingle();
            
            return {
              ...user,
              role: roleData?.role || 'user'
            };
          })
        );

        console.log('✅ Usuários com roles:', usersWithRoles);
        return usersWithRoles as UserProfile[];
        
      } catch (error) {
        console.error('💥 Erro geral:', error);
        throw error;
      }
    },
    enabled: !!session && !!user, // Só executar se houver sessão ativa
    retry: 1,
    staleTime: 30000, // 30 segundos
  });
};

export const useUserStats = () => {
  const { session, user } = useSupabaseAuth();

  return useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!session || !user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, created_at');
      
      if (error) {
        throw error;
      }

      const totalUsers = profiles?.length || 0;
      const today = new Date().toISOString().split('T')[0];
      const newUsersToday = profiles?.filter(p => 
        p.created_at.startsWith(today)
      ).length || 0;

      return {
        totalUsers,
        newUsersToday
      };
    },
    enabled: !!session && !!user, // Só executar se houver sessão ativa
  });
};