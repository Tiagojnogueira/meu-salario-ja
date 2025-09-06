import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './useSupabaseAuth';

export const useAdminAuth = () => {
  const { user, profile } = useSupabaseAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      console.log('useAdminAuth: Checking admin role for user:', user?.id);
      
      if (!user) {
        console.log('useAdminAuth: No user found, setting isAdmin to false');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        console.log('useAdminAuth: Querying user_roles for user_id:', user.id);
        
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        console.log('useAdminAuth: Query result:', { data, error });

        if (error) {
          console.error('useAdminAuth: Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          const isAdminUser = !!data;
          console.log('useAdminAuth: Setting isAdmin to:', isAdminUser);
          setIsAdmin(isAdminUser);
        }
      } catch (error) {
        console.error('useAdminAuth: Catch error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        console.log('useAdminAuth: Setting loading to false');
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  return { isAdmin, loading };
};