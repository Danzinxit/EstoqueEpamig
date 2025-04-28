import React, { useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Trash, Package, Plus, ArrowUpDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

interface Equipment {
  id: string;
  name: string;
}

interface Movement {
  id: string;
  equipment_id: string;
  equipment: { name: string };
  quantity: number;
  type: 'in' | 'out';
  description: string;
  created_at: string;
}

export default function StockMovements() {
  const { session } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [form, setForm] = useState({ equipmentId: '', quantity: 0, type: 'in' as 'in' | 'out', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<Movement | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Carregar equipamentos
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, name')
        .order('name');

      if (equipmentError) throw equipmentError;
      setEquipment(equipmentData || []);

      // Carregar movimentações
      const { data: movementsData, error: movementsError } = await supabase
        .from('stock_movements')
        .select(`
          id,
          equipment_id,
          equipment:equipment_id (name),
          quantity,
          type,
          description,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (movementsError) throw movementsError;
      
      const typedMovements = (movementsData || []).map(movement => ({
        id: movement.id,
        equipment_id: movement.equipment_id,
        equipment: { 
          name: movement.equipment ? movement.equipment.name : 'Equipamento não encontrado' 
        },
        quantity: movement.quantity,
        type: movement.type as 'in' | 'out',
        description: movement.description || '',
        created_at: movement.created_at
      }));
      
      setMovements(typedMovements);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setError(error.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.equipmentId || form.quantity <= 0) {
      setError('Equipamento e quantidade válidos são obrigatórios.');
      return;
    }

    try {
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          equipment_id: form.equipmentId,
          quantity: form.quantity,
          type: form.type,
          description: form.description
        }]);

      if (movementError) throw movementError;

      setSuccess('Movimentação registrada com sucesso!');
      setForm({ equipmentId: '', quantity: 0, type: 'in', description: '' });
      await loadData();
    } catch (error: any) {
      console.error('Erro ao registrar movimentação:', error);
      setError(error.message || 'Erro ao registrar movimentação.');
    }
  };

  const handleDeleteMovement = async (movement: Movement) => {
    setMovementToDelete(movement);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!movementToDelete) return;

    try {
      const { error } = await supabase
        .from('stock_movements')
        .delete()
        .eq('id', movementToDelete.id);

      if (error) throw error;
      
      setSuccess('Movimentação deletada com sucesso.');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao deletar movimentação:', error);
      setError(error.message || 'Erro ao deletar movimentação.');
    } finally {
      setShowDeleteModal(false);
      setMovementToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent 
                     rounded-full animate-spin">
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center space-x-2">
          <ArrowUpDown size={28} className="text-green-600" />
          <span>Movimentações de Estoque</span>
        </h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-xl transform hover:scale-[1.01] 
                     transition-all duration-300">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Plus size={24} className="text-green-600" />
            <span>Registrar Movimentação</span>
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Equipamento</label>
              <div className="relative">
                <select
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                           focus:ring-green-500 transition-all duration-200 pl-10"
                  value={form.equipmentId}
                  onChange={(e) => setForm({ ...form, equipmentId: e.target.value })}
                >
                  <option value="">Selecione um equipamento...</option>
                  {equipment.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <Package size={20} className="absolute left-3 top-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
              <input
                type="number"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                         focus:ring-green-500 transition-all duration-200"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                         focus:ring-green-500 transition-all duration-200"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'in' | 'out' })}
              >
                <option value="in">Entrada</option>
                <option value="out">Saída</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
              <textarea
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                         focus:ring-green-500 transition-all duration-200"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 
                       rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200
                       flex items-center justify-center space-x-2"
            >
              <Plus size={20} className="animate-bounce-light" />
              <span>Registrar Movimentação</span>
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-xl transform hover:scale-[1.01] 
                     transition-all duration-300">
          <h3 className="text-lg font-semibold mb-4">Histórico de Movimentações</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {movement.equipment.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{movement.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {movement.type === 'in' ? (
                        <span className="text-green-600 flex items-center">
                          <ArrowUpCircle size={16} className="mr-1" /> Entrada
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <ArrowDownCircle size={16} className="mr-1" /> Saída
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {movement.description || 'Sem descrição'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(movement.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteMovement(movement)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr>
                    <td className="px-6 py-4 text-center text-gray-500" colSpan={6}>
                      Nenhuma movimentação registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMovementToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja deletar a movimentação do equipamento "${movementToDelete?.equipment.name}"?`}
        type="warning"
        confirmText="Deletar"
        cancelText="Cancelar"
      />
    </div>
  );
} 