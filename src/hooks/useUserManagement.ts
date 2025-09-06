import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./useUsers";

export const useUserManagement = () => {
  
  const updateUserProfile = async (userId: string, profileData: {
    name: string;
    email: string;
    username: string;
    office_name: string;
    phone: string;
  }) => {
    try {
      console.log('🔄 Atualizando perfil do usuário:', userId, profileData);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          email: profileData.email,
          username: profileData.username,
          office_name: profileData.office_name || null,
          phone: profileData.phone || null,
        })
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('❌ Erro ao atualizar perfil:', error);
        throw error;
      }

      console.log('✅ Perfil atualizado com sucesso:', data);
      return { success: true, data };
    } catch (error) {
      console.error('💥 Erro geral ao atualizar perfil:', error);
      return { success: false, error };
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      console.log('🔄 Atualizando role do usuário:', userId, newRole);
      
      // Primeiro, verificar se já existe uma role para este usuário
      const { data: existingRole, error: fetchError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Erro ao buscar role existente:', fetchError);
        throw fetchError;
      }

      let result;
      
      if (existingRole) {
        // Atualizar role existente
        const { data, error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId)
          .select();
        
        if (error) {
          console.error('❌ Erro ao atualizar role:', error);
          throw error;
        }
        result = data;
      } else {
        // Criar nova role
        const { data, error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole })
          .select();
        
        if (error) {
          console.error('❌ Erro ao criar role:', error);
          throw error;
        }
        result = data;
      }

      console.log('✅ Role atualizada com sucesso:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('💥 Erro geral ao atualizar role:', error);
      return { success: false, error };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      console.log('🗑️ Deletando usuário:', userId);
      
      // Primeiro, deletar roles do usuário
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) {
        console.error('❌ Erro ao deletar roles:', roleError);
        // Não vamos parar aqui, continuamos tentando deletar o perfil
      }

      // Deletar calculations do usuário
      const { error: calculationsError } = await supabase
        .from('calculations')
        .delete()
        .eq('user_id', userId);

      if (calculationsError) {
        console.error('❌ Erro ao deletar calculations:', calculationsError);
        // Continuar mesmo assim
      }

      // Depois, deletar o perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) {
        console.error('❌ Erro ao deletar perfil:', profileError);
        throw profileError;
      }

      console.log('✅ Usuário deletado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('💥 Erro geral ao deletar usuário:', error);
      return { success: false, error };
    }
  };

  const toggleUserActive = async (userId: string, active: boolean) => {
    try {
      console.log('🔄 Alterando status do usuário:', userId, active ? 'ativo' : 'inativo');
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          active: active,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('❌ Erro ao alterar status:', error);
        throw error;
      }

      console.log('✅ Status alterado com sucesso:', data);
      return { success: true, data };
    } catch (error) {
      console.error('💥 Erro geral ao alterar status:', error);
      return { success: false, error };
    }
  };

  return {
    updateUserProfile,
    updateUserRole,
    deleteUser,
    toggleUserActive,
  };
};