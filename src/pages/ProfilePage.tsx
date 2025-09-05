import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, User, Save, Calculator } from 'lucide-react';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { profile, user, logout, refreshProfile } = useSupabaseAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    office_name: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordLoading, setPasswordLoading] = useState(false);

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        username: profile.username || '',
        phone: profile.phone || '',
        office_name: profile.office_name || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          username: formData.username,
          phone: formData.phone,
          office_name: formData.office_name,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
      await refreshProfile(); // Refresh the profile data
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      username: profile?.username || '',
      phone: profile?.phone || '',
      office_name: profile?.office_name || '',
    });
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Por favor, preencha todos os campos de senha');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success('Senha alterada com sucesso!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error('Erro ao alterar senha: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Calculator className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/horas-extras')}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Painel
              </Button>
              <User className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Minha Conta
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie seus dados pessoais
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>
                Visualize e edite suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    O e-mail não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone de Contato</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="office_name">Nome do Escritório</Label>
                  <Input
                    id="office_name"
                    type="text"
                    value={formData.office_name}
                    onChange={(e) => setFormData({ ...formData, office_name: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                    placeholder="Nome do seu escritório ou empresa"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    Editar Perfil
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Mantenha sua conta segura alterando sua senha regularmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Digite sua nova senha"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirme sua nova senha"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handlePasswordChange} 
                  disabled={passwordLoading || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>• A senha deve ter pelo menos 6 caracteres</p>
                <p>• Use uma combinação de letras, números e símbolos</p>
                <p>• Não compartilhe sua senha com outras pessoas</p>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>
                Detalhes sobre sua conta no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    ID do Usuário
                  </Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                    {profile.user_id}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Conta Criada em
                  </Label>
                  <p className="text-sm mt-1">
                    {new Date(profile.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};