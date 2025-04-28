import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, UserPlus, UserCog, Users as UsersIcon, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [passwordForm, setPasswordForm] = useState<EditPasswordForm>({
    newPassword: '',
    confirmPassword: ''
  });
  const [newUser, setNewUser] = useState<NewUser>({ email: '', password: '', full_name: '', role: 'user' });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const isAdmin = user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';
    if (!isAdmin) {
      navigate('/');
    } else {
      fetchProfiles();
    }
  }, [user, navigate]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se o usuário está autenticado
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setError('Usuário não autenticado');
        return;
      }

      // Buscar perfis existentes
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('email');

      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        throw profilesError;
      }

      console.log('Perfis encontrados:', profilesData);

      // Mapear os dados dos perfis
      const mappedProfiles = (profilesData || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || profile.email?.split('@')[0] || '',
        role: profile.role || 'user',
        created_at: profile.created_at
      }));

      setProfiles(mappedProfiles);
    } catch (error: any) {
      console.error('Erro detalhado ao buscar perfis:', error);
      setError('Não foi possível carregar os usuários. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

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

      // Criar usuário já confirmado
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name,
            role: newUser.role
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (signUpError) {
        console.error('Erro ao criar usuário:', signUpError);
        throw signUpError;
      }

      if (data.user) {
        // Confirmar o email do usuário automaticamente
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          data.user.id,
          { email_confirm: true }
        );

        if (updateError) {
          console.error('Erro ao confirmar usuário:', updateError);
          // Continuar mesmo se falhar a confirmação
        }

        // Criar perfil para o novo usuário usando RPC
        const { error: rpcError } = await supabase.rpc('create_user_profile', {
          user_id: data.user.id,
          user_email: newUser.email,
          user_full_name: newUser.full_name,
          user_role: newUser.role
        });

        if (rpcError) {
          console.error('Erro ao criar perfil:', rpcError);
          throw rpcError;
        }

        setShowModal(false);
        setNewUser({ email: '', password: '', full_name: '', role: 'user' });
        await fetchProfiles();
        setSuccess('Usuário criado com sucesso!');
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
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (profile: Profile) => {
    setEditingProfile(profile);
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData(e.target as HTMLFormElement);
      const full_name = formData.get('full_name') as string;
      const role = formData.get('role') as string;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name,
          role,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProfile.id);

      if (error) throw error;

      setSuccess('Usuário atualizado com sucesso!');
      setShowModal(false);
      setEditingProfile(null);
      await fetchProfiles();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (!selectedUserId) {
        throw new Error('Usuário não selecionado');
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('As senhas não coincidem');
      }

      if (passwordForm.newPassword.length < 6) {
        throw new Error('A senha deve ter no mínimo 6 caracteres');
      }

      const { error } = await supabase.auth.admin.updateUserById(
        selectedUserId,
        { password: passwordForm.newPassword }
      );

      if (error) throw error;

      setSuccess('Senha atualizada com sucesso!');
      setShowPasswordModal(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setSelectedUserId(null);
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      setError(error.message || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center space-x-2">
          <UsersIcon size={28} className="text-green-600" />
          <span>Usuários do Sistema</span>
        </h2>
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg
                   shadow-lg transform hover:scale-105 transition-all duration-200
                   flex items-center space-x-2"
          onClick={() => {
            setEditingProfile(null);
            setShowModal(true);
            setError(null);
            setSuccess(null);
          }}
          disabled={loading}
        >
          <UserPlus size={20} className="animate-bounce-light" />
          <span>Adicionar Usuário</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg
                     animate-slide-in-right shadow-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg
                     animate-slide-in-right shadow-md">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar usuários..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 focus:border-green-500 
                       focus:ring-green-500 transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
            <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent 
                         rounded-full animate-spin">
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Criação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profiles
                  .filter(profile => 
                    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    profile.role.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((profile) => (
                    <tr key={profile.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {profile.full_name || 'Sem nome'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{profile.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                     ${profile.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                          {profile.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditClick(profile)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                          disabled={loading}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUserId(profile.id);
                            setShowPasswordModal(true);
                          }}
                          className="text-yellow-600 hover:text-yellow-900 transition-colors duration-200"
                          disabled={loading}
                        >
                          <Key size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteProfile(profile)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          disabled={loading}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Adicionar/Editar Usuário */}
      {showModal && !editingProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 animate-scale-in">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center space-x-2">
              <UserPlus size={24} className="text-green-500 animate-bounce-light" />
              <span>Adicionar Novo Usuário</span>
            </h2>
            <form onSubmit={handleAddUser} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                           focus:ring-green-500 transition-all duration-200"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                           focus:ring-green-500 transition-all duration-200"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  type="password"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                           focus:ring-green-500 transition-all duration-200"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                           focus:ring-green-500 transition-all duration-200"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  required
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700
                           hover:bg-gray-50 transform hover:scale-105 transition-all duration-200"
                  onClick={() => {
                    setShowModal(false);
                    setNewUser({ email: '', password: '', full_name: '', role: 'user' });
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg bg-green-600 text-white
                           hover:bg-green-700 transform hover:scale-105 transition-all duration-200
                           flex items-center space-x-2"
                  disabled={loading}
                >
                  <UserPlus size={20} className="animate-bounce-light" />
                  <span>{loading ? 'Criando...' : 'Criar Usuário'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showModal && editingProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 animate-scale-in">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center space-x-2">
              <UserCog size={24} className="text-blue-500 animate-bounce-light" />
              <span>Editar Usuário</span>
            </h2>
            <form onSubmit={handleEditProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  name="full_name"
                  defaultValue={editingProfile.full_name || ''}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                           focus:ring-green-500 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select
                  name="role"
                  defaultValue={editingProfile.role}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                           focus:ring-green-500 transition-all duration-200"
                  required
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700
                           hover:bg-gray-50 transform hover:scale-105 transition-all duration-200"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProfile(null);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white
                           hover:bg-blue-700 transform hover:scale-105 transition-all duration-200
                           flex items-center space-x-2"
                  disabled={loading}
                >
                  <UserCog size={20} className="animate-bounce-light" />
                  <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Alteração de Senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 animate-scale-in">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center space-x-2">
              <Key size={24} className="text-yellow-500 animate-bounce-light" />
              <span>Alterar Senha</span>
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                <input
                  type="password"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                           focus:ring-green-500 transition-all duration-200"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                           focus:ring-green-500 transition-all duration-200"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700
                           hover:bg-gray-50 transform hover:scale-105 transition-all duration-200"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ newPassword: '', confirmPassword: '' });
                    setSelectedUserId(null);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg bg-yellow-600 text-white
                           hover:bg-yellow-700 transform hover:scale-105 transition-all duration-200
                           flex items-center space-x-2"
                  disabled={loading}
                >
                  <Key size={20} className="animate-bounce-light" />
                  <span>{loading ? 'Alterando...' : 'Alterar Senha'}</span>
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