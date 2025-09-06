import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export const useAdminAuth = () => {
  const { user, session, loading: authLoading } = useSupabaseAuth();

  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user?.id,
  });

  return {
    user,
    session,
    isAdmin: isAdmin || false,
    loading: authLoading || adminLoading,
    isAuthenticated: !!session,
  };
};