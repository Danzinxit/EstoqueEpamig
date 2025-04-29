import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, UserCog, Users as UsersIcon, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

interface NewUser {
  email: string;
  password: string;
  full_name: string;
  role: string;
}

interface EditPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export default function Users() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [passwordForm, setPasswordForm] = useState<EditPasswordForm>({
    newPassword: '',
    confirmPassword: ''
  });
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<Profile | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({ email: '', password: '', full_name: '', role: 'user' });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const isAdmin = user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isAdmin) {
        // Se for admin, buscar todos os perfis
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('email');

        if (allProfilesError) throw allProfilesError;
        setProfiles(allProfiles || []);
      } else {
        // Se não for admin, buscar apenas o próprio perfil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .single();

        if (profileError) throw profileError;
        setProfiles(profileData ? [profileData] : []);
      }
    } catch (error: any) {
      console.error('Erro ao buscar perfis:', error);
      setError('Não foi possível carregar as informações. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // @ts-ignore - Esta função é utilizada no formulário de adição de usuário
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      // Verificar se está em cooldown
      if (cooldown > 0) {
        setError(`Por favor, aguarde ${cooldown} segundos antes de tentar criar outro usuário.`);
        return;
      }

      // Validar senha
      if (newUser.password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        return;
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUser.email)) {
        setError('Por favor, insira um email válido.');
        return;
      }

      // Verificar se o email já existe no profiles
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', newUser.email)
        .single();

      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        throw profileCheckError;
      }

      if (existingProfile) {
        setError('Este email já está cadastrado no sistema.');
        return;
      }

      // Criar usuário com confirmação automática
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name,
            role: newUser.role
          },
          emailRedirectTo: window.location.origin
        }
      });

      if (signUpError) {
        console.error('Erro ao criar usuário:', signUpError);
        
        if (signUpError.message.includes('6 seconds') || signUpError.message.includes('24 seconds')) {
          setCooldown(6);
          setError('Por favor, aguarde 6 segundos antes de tentar criar outro usuário. Esta é uma medida de segurança.');
          return;
        }
        
        throw signUpError;
      }

      if (data.user) {
        // Confirmar o email automaticamente
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
          data.user.id,
          { email_confirm: true }
        );

        if (confirmError) {
          console.error('Erro ao confirmar email:', confirmError);
          // Continuamos mesmo com erro na confirmação
        }

        // Aguardar um momento para garantir que o usuário foi criado
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Criar perfil diretamente na tabela profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            email: newUser.email,
            full_name: newUser.full_name,
            role: newUser.role,
            created_at: new Date().toISOString()
          }]);

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
          
          // Se o erro for de chave estrangeira, tentar novamente após um pequeno delay
          if (profileError.code === '23503') {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const { error: retryError } = await supabase
              .from('profiles')
              .insert([{
                id: data.user.id,
                email: newUser.email,
                full_name: newUser.full_name,
                role: newUser.role,
                created_at: new Date().toISOString()
              }]);

            if (retryError) {
              throw retryError;
            }
          } else {
            throw profileError;
          }
        }

        setShowModal(false);
        setNewUser({ email: '', password: '', full_name: '', role: 'user' });
        await fetchProfiles();
        setSuccess('Usuário criado com sucesso!');
        setCooldown(6);
      }
    } catch (error: any) {
      console.error('Erro detalhado:', error);
      let errorMessage = 'Erro ao adicionar usuário.';
      
      if (error.message?.includes('duplicate key')) {
        errorMessage = 'Este email já está registrado.';
      } else if (error.message?.includes('invalid email')) {
        errorMessage = 'Por favor, insira um email válido.';
      } else if (error.message?.includes('permission denied')) {
        errorMessage = 'Você não tem permissão para criar usuários.';
      } else if (error.message?.includes('weak password')) {
        errorMessage = 'A senha deve ter no mínimo 6 caracteres.';
      } else if (error.message?.includes('6 seconds') || error.message?.includes('24 seconds')) {
        errorMessage = 'Por favor, aguarde 6 segundos antes de tentar criar outro usuário. Esta é uma medida de segurança.';
      } else if (error.message?.includes('Apenas administradores podem criar perfis')) {
        errorMessage = 'Você não tem permissão de administrador para criar perfis.';
      } else if (error.code === '409') {
        errorMessage = 'Este email já está cadastrado no sistema.';
      } else if (error.code === '23503') {
        errorMessage = 'Erro ao criar perfil: O usuário não foi criado corretamente. Por favor, tente novamente.';
      } else if (error.message?.includes('User not allowed')) {
        errorMessage = 'Você não tem permissão para realizar esta operação.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Erro ao confirmar o email. Por favor, tente novamente.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // @ts-ignore - Esta função é utilizada nos botões de edição
  const handleEditClick = (profile: Profile) => {
    setEditingProfile(profile);
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      if (!editingProfile) return;

      const isAdmin = user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';
      if (!isAdmin && editingProfile.id !== user?.id) {
        setError('Você não tem permissão para editar outros usuários.');
        return;
      }

      if (isAdmin && editingProfile.id !== user?.id) {
        // Se for admin editando outro usuário, usa a função RPC
        const { error: rpcError } = await supabase.rpc('update_user_role', {
          user_id_to_update: editingProfile.id,
          new_role: editingProfile.role,
          new_full_name: editingProfile.full_name || ''
        });

        if (rpcError) throw rpcError;
      } else {
        // Se for usuário editando próprio perfil, apenas atualiza o nome
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: editingProfile.full_name
          })
          .eq('id', editingProfile.id);

        if (updateError) throw updateError;
      }

      await fetchProfiles();
      setEditingProfile(null);
      setShowModal(false);
      setSuccess('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      let errorMessage = 'Erro ao atualizar perfil. Por favor, tente novamente.';
      
      if (error.message?.includes('permission denied')) {
        errorMessage = 'Você não tem permissão para realizar esta operação.';
      } else if (error.message?.includes('User not allowed')) {
        errorMessage = 'Você não tem permissão para editar este usuário.';
      }
      
      setError(errorMessage);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      if (!selectedUserForPassword) {
        setError('Usuário não selecionado.');
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        return;
      }

      // Verifica se é um admin alterando senha de outro usuário
      if (isAdmin && selectedUserForPassword.id !== user?.id) {
        // Usa a função RPC para atualizar a senha
        const { data, error: rpcError } = await supabase.rpc('admin_update_user_password', {
          user_id_to_update: selectedUserForPassword.id,
          new_password: passwordForm.newPassword
        });

        if (rpcError) {
          console.error('Erro RPC:', rpcError);
          throw new Error(rpcError.message);
        }

        if (data && !data.success) {
          throw new Error(data.error || 'Erro ao atualizar senha');
        }
      } else if (selectedUserForPassword.id === user?.id) {
        // Usuário alterando própria senha
        const { error: updateError } = await supabase.auth.updateUser({
          password: passwordForm.newPassword
        });

        if (updateError) throw updateError;
      } else {
        throw new Error('Apenas administradores podem alterar senhas de outros usuários.');
      }

      setShowPasswordModal(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setSelectedUserForPassword(null);
      setSuccess('Senha atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      let errorMessage = 'Erro ao alterar senha. Por favor, tente novamente.';
      
      if (typeof error.message === 'string') {
        if (error.message.includes('permission denied')) {
          errorMessage = 'Você não tem permissão para realizar esta operação.';
        } else if (error.message.includes('User not allowed')) {
          errorMessage = 'Você não tem permissão para alterar a senha deste usuário.';
        } else if (error.message.includes('Apenas administradores')) {
          errorMessage = 'Apenas administradores podem alterar senhas de outros usuários.';
        } else if (error.message.includes('Invalid password')) {
          errorMessage = 'A senha fornecida é inválida. Certifique-se de que atende aos requisitos mínimos.';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'Usuário não encontrado.';
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleDeleteProfile = (profile: Profile) => {
    setUserToDelete(profile);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      
      const { error: rpcError } = await supabase.rpc('delete_user_safely', {
        user_id_to_delete: userToDelete.id
      });

      if (rpcError) throw rpcError;

      await fetchProfiles();
      setSuccess('Usuário deletado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      setError(error.message || 'Erro ao deletar usuário');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center space-x-3 mb-6">
        {isAdmin ? (
          <>
            <UsersIcon size={32} className="text-green-600" />
            <h1 className="text-2xl font-bold text-gray-800">Usuários do Sistema</h1>
          </>
        ) : (
          <>
            <UserCog size={32} className="text-green-600" />
            <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          {success}
        </div>
      )}

      {isAdmin ? (
        // Interface de Admin com lista completa de usuários
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Buscar usuários..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Criação</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {profiles
                    .filter(profile => 
                      profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      profile.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((profile) => (
                      <tr key={profile.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{profile.full_name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{profile.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            profile.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {profile.role === 'admin' ? 'Administrador' : 'Usuário'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => {
                                setEditingProfile(profile);
                                setShowModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUserForPassword(profile);
                                setShowPasswordModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Alterar senha"
                            >
                              <Key size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteProfile(profile)}
                              className="text-red-600 hover:text-red-900"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // Interface de Usuário com apenas seu próprio perfil
        <div className="bg-white rounded-lg shadow-lg p-6">
          {profiles.map((profile) => (
            <div key={profile.id} className="border-b border-gray-200 py-4 last:border-b-0">
              {editingProfile?.id === profile.id ? (
                <form onSubmit={handleEditProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <input
                      type="text"
                      value={editingProfile.full_name || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, full_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(null)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{profile.full_name || profile.email}</h3>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingProfile(profile);
                        setShowModal(true);
                      }}
                      className="text-green-600 hover:text-green-700"
                      title="Editar nome"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUserForPassword(profile);
                        setShowPasswordModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                      title="Alterar senha"
                    >
                      <Key size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de alteração de senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {isAdmin && selectedUserForPassword
                ? `Alterar Senha - ${selectedUserForPassword.full_name || selectedUserForPassword.email}`
                : 'Alterar Senha'}
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  minLength={6}
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUserForPassword(null);
                    setPasswordForm({ newPassword: '', confirmPassword: '' });
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {showModal && editingProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {isAdmin ? 'Editar Usuário' : 'Editar Perfil'}
            </h2>
            <form onSubmit={handleEditProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  value={editingProfile.full_name || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, full_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              
              {isAdmin && editingProfile.id !== user?.id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Função</label>
                  <select
                    value={editingProfile.role}
                    onChange={(e) => setEditingProfile({ ...editingProfile, role: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(null);
                    setShowModal(false);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja deletar o usuário "${userToDelete?.full_name || userToDelete?.email}"? Esta ação não pode ser desfeita.`}
        type="warning"
        confirmText="Deletar"
        cancelText="Cancelar"
      />
    </div>
  );
}