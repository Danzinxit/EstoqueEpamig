import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

interface Equipment {
  id: string;
  name: string;
  description: string;
  quantity: number;
  created_at: string;
  category: string;
  location: string;
  status: string;
}

interface FormData {
  id: string | null;
  name: string;
  description: string;
  quantity: number;
  category: string;
  location: string;
  status: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  notes?: string;
}

export default function Equipment() {
  const { session } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [form, setForm] = useState<FormData>({ 
    id: null, 
    name: '', 
    description: '', 
    quantity: 0, 
    category: '', 
    location: '', 
    status: '' 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch equipment data
  useEffect(() => {
    const loadEquipment = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!session) {
          throw new Error('Usuário não autenticado');
        }

        const { data, error } = await supabase
          .from('equipment')
          .select('*')
          .order('name');

        if (error) {
          console.error('Erro Supabase:', error);
          throw error;
        }
        
        setEquipment(data || []);
      } catch (error: any) {
        console.error('Erro ao carregar equipamentos:', error);
        setError(error.message || 'Erro ao carregar equipamentos. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadEquipment();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);
      
      if (isEditing && form.id) {
        const { error } = await supabase
          .from('equipment')
          .update({ 
            name: form.name, 
            description: form.description || null,
            quantity: form.quantity 
          })
          .eq('id', form.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('equipment')
          .insert([{ 
            name: form.name, 
            description: form.description || null,
            quantity: form.quantity 
          }]);

        if (error) throw error;
      }

      setForm({ 
        id: null, 
        name: '', 
        description: '', 
        quantity: 0,
        category: '',
        location: '',
        status: ''
      });
      setIsEditing(false);
      setShowModal(false);

      // Refresh equipment list
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('name');

      if (error) throw error;
      setEquipment(data || []);
    } catch (error: any) {
      console.error('Erro ao salvar equipamento:', error);
      setError(error.message || 'Erro ao salvar equipamento. Por favor, tente novamente.');
    }
  };

  const handleEdit = (item: Equipment) => {
    setForm({ 
      id: item.id, 
      name: item.name, 
      description: item.description || '', 
      quantity: item.quantity,
      category: item.category || '',
      location: item.location || '',
      status: item.status || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = (equipment: Equipment) => {
    setEquipmentToDelete(equipment);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!equipmentToDelete) return;

    try {
      // Verificar se o usuário tem permissão de admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session?.user?.id)
        .single();

      if (profileError) throw profileError;
      if (profile?.role !== 'admin') {
        throw new Error('Você não tem permissão para excluir equipamentos.');
      }

      // Primeiro, excluir todas as movimentações relacionadas
      const { error: deleteMovementsError } = await supabase
        .from('stock_movements')
        .delete()
        .eq('equipment_id', equipmentToDelete.id);

      if (deleteMovementsError) throw deleteMovementsError;

      // Depois, excluir o equipamento
      const { error: deleteError } = await supabase
        .from('equipment')
        .delete()
        .eq('id', equipmentToDelete.id);

      if (deleteError) throw deleteError;
      
      // Atualizar o estado local
      setEquipment(equipment.filter((item) => item.id !== equipmentToDelete.id));
      setSuccess('Equipamento excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao deletar equipamento:', error);
      setError(error.message || 'Erro ao deletar equipamento. Verifique suas permissões.');
    } finally {
      setShowDeleteModal(false);
      setEquipmentToDelete(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 animate-fade-in">
          Gerenciamento de Equipamentos
        </h1>
        <button
          onClick={() => {
            setIsEditing(false);
            setForm({ 
              id: null, 
              name: '', 
              description: '', 
              quantity: 0,
              category: '',
              location: '',
              status: ''
            });
            setShowModal(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg 
                     shadow-lg transform hover:scale-105 transition-all duration-200 
                     flex items-center space-x-2"
        >
          <Plus size={20} className="animate-bounce-light" />
          <span>Adicionar Equipamento</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-4 
                      animate-slide-in-right shadow-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-4 
                      animate-slide-in-right shadow-md">
          {success}
        </div>
      )}

      {/* Campo de Busca */}
      <div className="mb-4 animate-fade-in">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar equipamentos..."
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                     focus:ring-green-500 pl-4 pr-10 py-3 transition-all duration-200
                     hover:shadow-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute right-3 top-3 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabela de Equipamentos */}
      {loading ? (
        <div className="flex justify-center items-center py-8 animate-pulse">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden animate-fade-in">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantidade</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Data de Cadastro</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {equipment
                .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700">{item.description || 'Sem descrição'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-sm font-semibold
                                   bg-green-100 text-green-800">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-3">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg
                                 transform transition-all duration-200 inline-flex items-center space-x-1
                                 hover:scale-110 hover:shadow-lg active:scale-95 focus:outline-none"
                        onClick={() => handleEdit(item)}
                      >
                        <span className="animate-bounce-light">
                          <Edit2 size={16} />
                        </span>
                        <span>Editar</span>
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg
                                 transform transition-all duration-200 inline-flex items-center space-x-1
                                 hover:scale-110 hover:shadow-lg active:scale-95 focus:outline-none"
                        onClick={() => handleDeleteClick(item)}
                      >
                        <span className="animate-bounce-light">
                          <Trash2 size={16} />
                        </span>
                        <span>Excluir</span>
                      </button>
                    </td>
                  </tr>
                ))}
              {equipment.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 14h.01M12 16h.01M12 18h.01M12 20h.01M12 22h.01M12 22h.01" />
                      </svg>
                      <span className="text-lg">Nenhum equipamento encontrado</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 animate-scale-in">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Edit2 size={24} className="text-blue-500" />
                  <span>Editar Equipamento</span>
                </>
              ) : (
                <>
                  <Plus size={24} className="text-green-500" />
                  <span>Adicionar Equipamento</span>
                </>
              )}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Equipamento</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                           focus:ring-green-500 transition-all duration-200"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                           focus:ring-green-500 transition-all duration-200"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input
                  type="number"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                           focus:ring-green-500 transition-all duration-200"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700
                           hover:bg-gray-50 transform hover:scale-105 transition-all duration-200"
                  onClick={() => {
                    setShowModal(false);
                    setForm({ 
                      id: null, 
                      name: '', 
                      description: '', 
                      quantity: 0,
                      category: '',
                      location: '',
                      status: ''
                    });
                    setIsEditing(false);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg bg-green-600 text-white
                           hover:bg-green-700 transform hover:scale-105 transition-all duration-200"
                >
                  {isEditing ? 'Salvar Alterações' : 'Adicionar'}
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
          setEquipmentToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja deletar o equipamento "${equipmentToDelete?.name}"? Esta ação não pode ser desfeita.`}
        type="warning"
        confirmText="Deletar"
        cancelText="Cancelar"
      />
    </div>
  );
} 