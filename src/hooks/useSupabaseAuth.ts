import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  username: string;
  phone?: string;
  office_name?: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Fetch user profile and verify if user is active
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
            
          if (error) {
            console.error('Error fetching profile:', error);
            // Force logout if profile not found
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
          } else if (!profileData.active) {
            // User is inactive, force logout and show message
            console.log('User is inactive, forcing logout');
            await supabase.auth.signOut();
            localStorage.clear();
            setSession(null);
            setUser(null);
            setProfile(null);
            toast.error('Sua conta está inativa. Entre em contato com o administrador.');
          } else {
            // User is active, set profile and session
            setProfile(profileData);
            setSession(session);
            setUser(session.user);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session and validate user status
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Verify if user is still active
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (error || !profileData?.active) {
          // User not found or inactive, force logout
          await supabase.auth.signOut();
          localStorage.clear();
          setSession(null);
          setUser(null);
          setProfile(null);
          if (!error && !profileData?.active) {
            toast.error('Sua conta está inativa. Entre em contato com o administrador.');
          }
        } else {
          // User is active
          setSession(session);
          setUser(session.user);
          setProfile(profileData);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async (userData: { name: string; email: string; username: string; password: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: userData.name,
            username: userData.username
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Este email já está cadastrado. Tente fazer login.');
          return false;
        }
        toast.error(error.message);
        return false;
      }

      toast.success('Cadastro realizado! Verifique seu email para confirmar a conta.');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Erro ao realizar cadastro');
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Primeiro tentar fazer login para validar credenciais
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        toast.error('Email ou senha incorretos');
        return false;
      }

      // Login foi bem sucedido, agora verificar se o usuário está ativo
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('active, user_id')
        .eq('email', email)
        .maybeSingle();

      // Se encontrou o usuário no profiles e está inativo
      if (userData && !userData.active) {
        // Usuário existe mas está inativo - fazer logout imediatamente
        await supabase.auth.signOut();
        localStorage.clear();
        setUser(null);
        setSession(null);
        setProfile(null);
        
        toast.error('Sua conta está inativa. Entre em contato com o administrador.');
        return false;
      }

      // Usuário ativo ou não encontrado no profiles - manter login
      toast.success('Login realizado com sucesso!');
      return true;

    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login');
      // Garantir limpeza em caso de erro
      await supabase.auth.signOut();
      localStorage.clear();
      return false;
    }
  };

  const logout = async () => {
    try {
      // Limpar estados locais primeiro
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Limpar localStorage (dados em cache)
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-vtvxneaveskidxjmfmiw-auth-token');
      localStorage.clear(); // Limpa todo o localStorage para garantir
      
      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        toast.error('Erro ao sair');
      } else {
        toast.success('Logout realizado com sucesso!');
      }
      
      // Forçar redirecionamento para página inicial
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao sair');
      // Mesmo com erro, limpar dados locais e redirecionar
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.clear();
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        toast.error('Erro ao enviar email de recuperação');
        return false;
      }

      toast.success('Email de recuperação enviado!');
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Erro ao enviar email de recuperação');
      return false;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error refreshing profile:', error);
      } else {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    register,
    login,
    logout,
    forgotPassword,
    refreshProfile
  };
};