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
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
            
          if (error) {
            console.error('Error fetching profile:', error);
          } else {
            setProfile(profileData);
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error('Email ou senha incorretos');
        return false;
      }

      toast.success('Login realizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login');
      return false;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('Erro ao sair');
      } else {
        toast.success('Logout realizado com sucesso!');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao sair');
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