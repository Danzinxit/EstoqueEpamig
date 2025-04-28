import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardCheck, Package2, AlertTriangle } from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  quantity: number;
}

export default function StockReduction() {
  const { session } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [form, setForm] = useState({
    equipmentId: '',
    quantity: '',
    ticket: '',
    observation: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Carregar dados dos equipamentos
  useEffect(() => {
    const loadEquipment = async () => {
      try {
        setLoading(true);
        setError('');

        if (!session) {
          throw new Error('Usuário não autenticado');
        }

        const { data, error: equipmentError } = await supabase
          .from('equipment')
          .select('id, name, quantity')
          .order('name');

        if (equipmentError) throw equipmentError;
        setEquipment(data || []);
      } catch (error: any) {
        console.error('Erro ao carregar equipamentos:', error);
        setError(error.message || 'Erro ao carregar equipamentos');
      } finally {
        setLoading(false);
      }
    };

    loadEquipment();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.equipmentId || !form.quantity || Number(form.quantity) <= 0) {
      setError('Equipamento e quantidade válidos são obrigatórios.');
      return;
    }

    // Verificar quantidade disponível
    const selectedEquipment = equipment.find(eq => eq.id === form.equipmentId);
    if (!selectedEquipment) {
      setError('Equipamento não encontrado.');
      return;
    }

    const quantityToReduce = Number(form.quantity);
    if (quantityToReduce > selectedEquipment.quantity) {
      setError(`Quantidade insuficiente em estoque. Disponível: ${selectedEquipment.quantity}`);
      return;
    }

    try {
      // Registrar a baixa como uma movimentação de saída
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          equipment_id: form.equipmentId,
          quantity: quantityToReduce,
          type: 'out',
          description: form.ticket 
            ? `Chamado: ${form.ticket}. ${form.observation}` 
            : form.observation
        }]);

      if (movementError) throw movementError;

      // Atualizar a quantidade do equipamento diretamente
      const { data: currentEquipment, error: fetchError } = await supabase
        .from('equipment')
        .select('quantity')
        .eq('id', form.equipmentId)
        .single();

      if (fetchError) throw fetchError;

      const newQuantity = (currentEquipment?.quantity || 0) - quantityToReduce;

      const { error: updateError } = await supabase
        .from('equipment')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', form.equipmentId);

      if (updateError) throw updateError;

      // Atualizar a lista de equipamentos após a baixa
      const { data: updatedEquipment, error: refreshError } = await supabase
        .from('equipment')
        .select('id, name, quantity')
        .order('name');

      if (refreshError) throw refreshError;
      setEquipment(updatedEquipment || []);

      setSuccess('Baixa registrada com sucesso!');
      setForm({ equipmentId: '', quantity: '', ticket: '', observation: '' });
    } catch (error: any) {
      console.error('Erro ao registrar baixa:', error);
      setError(error.message || 'Erro ao registrar baixa.');
    }
  };

  // Encontrar o equipamento selecionado
  const selectedEquipment = equipment.find(eq => eq.id === form.equipmentId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full animate-pulse">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent 
                     rounded-full animate-spin">
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 animate-fade-in">
      <div className="flex items-center space-x-3 mb-6">
        <ClipboardCheck size={32} className="text-green-600" />
        <h1 className="text-2xl font-bold text-gray-800">Registrar Baixa no Estoque</h1>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 
                     animate-slide-in-right shadow-md flex items-center space-x-2">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-6 
                     animate-slide-in-right shadow-md flex items-center space-x-2">
          <ClipboardCheck size={20} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-xl space-y-6 
                                           transform hover:shadow-2xl transition-all duration-300">
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
                  {item.name} (Disponível: {item.quantity})
                </option>
              ))}
            </select>
            <Package2 size={20} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantidade {selectedEquipment && (
              <span className="text-gray-500">
                (Máximo: {selectedEquipment.quantity})
              </span>
            )}
          </label>
          <input
            type="number"
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                    focus:ring-green-500 transition-all duration-200"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            max={selectedEquipment?.quantity || 0}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chamado</label>
          <input
            type="text"
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                    focus:ring-green-500 transition-all duration-200"
            value={form.ticket}
            onChange={(e) => setForm({ ...form, ticket: e.target.value })}
            placeholder="Número do chamado (opcional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Observação</label>
          <textarea
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 
                    focus:ring-green-500 transition-all duration-200"
            rows={4}
            value={form.observation}
            onChange={(e) => setForm({ ...form, observation: e.target.value })}
            placeholder="Detalhes adicionais sobre a baixa"
          ></textarea>
        </div>

        <button 
          type="submit" 
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 
                   rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200
                   flex items-center justify-center space-x-2 disabled:opacity-50 
                   disabled:cursor-not-allowed disabled:transform-none"
          disabled={!selectedEquipment || Number(form.quantity) > selectedEquipment.quantity}
        >
          <ClipboardCheck size={20} className="animate-bounce-light" />
          <span>Registrar Baixa</span>
        </button>
      </form>
    </div>
  );
} 