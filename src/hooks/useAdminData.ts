import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from './useSupabaseAuth';

interface UserWithCalculations extends Profile {
  calculation_count: number;
  last_activity: string | null;
  user_roles?: Array<{ role: string }>;
}

export const useAdminData = () => {
  const [users, setUsers] = useState<UserWithCalculations[]>([]);
  const [allCalculations, setAllCalculations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      // First get profiles with calculation count
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          calculations(count)
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Then get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Transform the data to include calculation count and roles
      const usersWithCount = profiles?.map(profile => ({
        ...profile,
        calculation_count: Array.isArray(profile.calculations) ? profile.calculations.length : 0,
        last_activity: profile.updated_at,
        user_roles: userRoles?.filter(role => role.user_id === profile.user_id) || []
      })) || [];

      setUsers(usersWithCount);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchAllCalculations = async () => {
    try {
      const { data: calculations, error } = await supabase
        .from('calculations')
        .select(`
          *,
          profiles:user_id (
            name,
            email,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAllCalculations(calculations || []);
    } catch (error) {
      console.error('Error fetching all calculations:', error);
      setAllCalculations([]);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // First delete user roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then delete profile (calculations will cascade)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh data
      await Promise.all([fetchUsers(), fetchAllCalculations()]);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'user') => {
    try {
      // Delete existing role first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchAllCalculations()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    users,
    allCalculations,
    loading,
    fetchUsers,
    fetchAllCalculations,
    deleteUser,
    updateUserRole
  };
};