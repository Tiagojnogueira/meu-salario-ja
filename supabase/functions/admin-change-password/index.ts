import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔑 Admin Change Password - Iniciando função');

    // Verificar se é uma requisição POST
    if (req.method !== 'POST') {
      console.log('❌ Método não permitido:', req.method);
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }), 
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obter dados da requisição
    const { userId, newPassword } = await req.json();
    console.log('📋 Dados recebidos:', { userId: userId?.substring(0, 8) + '...', passwordLength: newPassword?.length });

    // Validar dados
    if (!userId || !newPassword) {
      console.log('❌ Dados obrigatórios ausentes');
      return new Response(
        JSON.stringify({ error: 'userId e newPassword são obrigatórios' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (newPassword.length < 6) {
      console.log('❌ Senha muito curta');
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Criar cliente Supabase para operações administrativas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🔧 Cliente Supabase Admin criado');

    // Verificar se o usuário que está fazendo a requisição é admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('❌ Header de autorização ausente');
      return new Response(
        JSON.stringify({ error: 'Autorização necessária' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Criar cliente para verificar o usuário atual
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verificar se o usuário atual é admin
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.log('❌ Erro ao verificar usuário:', userError);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar se o usuário tem role de admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.log('❌ Usuário não é admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Permissão negada. Apenas administradores podem alterar senhas.' }), 
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Usuário verificado como admin');

    // Alterar a senha usando o cliente admin
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('❌ Erro ao alterar senha:', updateError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao alterar senha', 
          details: updateError.message 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Senha alterada com sucesso para usuário:', userId.substring(0, 8) + '...');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Senha alterada com sucesso' 
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Erro geral na função:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});