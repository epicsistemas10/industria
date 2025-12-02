import { useState, useEffect } from 'react';
import { formatEquipamentoName } from '../../utils/format';
import { ordensServicoAPI } from '../../lib/api';
import { supabase } from '../../lib/supabase';

interface OrdemServicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  osId?: string;
  darkMode?: boolean;
}

export default function OrdemServicoModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  osId,
  darkMode = true 
}: OrdemServicoModalProps) {
  const [loading, setLoading] = useState(false);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    numero_os: '',
    equipamento_id: '',
    titulo: '',
    descricao: '',
    prioridade: 'Média' as 'Baixa' | 'Média' | 'Alta' | 'Urgente',
    status: 'Aberta' as 'Aberta' | 'Em Andamento' | 'Pausada' | 'Concluída' | 'Cancelada',
    data_abertura: new Date().toISOString().split('T')[0],
    data_inicio: '',
    data_conclusao: '',
    responsavel: '',
    equipe_id: '',
    custo_estimado: 0,
    custo_real: 0,
    observacoes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadEquipamentos();
      loadEquipes();
      if (osId) {
        loadOS();
      } else {
        resetForm();
        generateNumeroOS();
      }
    }
  }, [isOpen, osId]);

  const loadEquipamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('id, nome')
        .order('nome');
      if (error) throw error;
      setEquipamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
    }
  };

  const loadEquipes = async () => {
    try {
      const { data, error } = await supabase
        .from('equipes')
        .select('id, nome')
        .order('nome');
      if (error) throw error;
      setEquipes(data || []);
    } catch (error) {
      console.error('Erro ao carregar equipes:', error);
    }
  };

  const generateNumeroOS = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setFormData(prev => ({ ...prev, numero_os: `OS-${year}-${random}` }));
  };

  const loadOS = async () => {
    if (!osId) return;
    try {
      setLoading(true);
      const data = await ordensServicoAPI.getById(osId);
      setFormData({
        numero_os: data.numero_os || '',
        equipamento_id: data.equipamento_id || '',
        titulo: data.titulo || '',
        descricao: data.descricao || '',
        prioridade: data.prioridade || 'Média',
        status: data.status || 'Aberta',
        data_abertura: data.data_abertura || new Date().toISOString().split('T')[0],
        data_inicio: data.data_inicio || '',
        data_conclusao: data.data_conclusao || '',
        responsavel: data.responsavel || '',
        equipe_id: data.equipe_id || '',
        custo_estimado: data.custo_estimado || 0,
        custo_real: data.custo_real || 0,
        observacoes: data.observacoes || ''
      });
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      numero_os: '',
      equipamento_id: '',
      titulo: '',
      descricao: '',
      prioridade: 'Média',
      status: 'Aberta',
      data_abertura: new Date().toISOString().split('T')[0],
      data_inicio: '',
      data_conclusao: '',
      responsavel: '',
      equipe_id: '',
      custo_estimado: 0,
      custo_real: 0,
      observacoes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (osId) {
        await ordensServicoAPI.update(osId, formData);
      } else {
        await ordensServicoAPI.create(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar OS:', error);
      alert('Erro ao salvar ordem de serviço. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">
            <i className="ri-file-list-3-line mr-2"></i>
            {osId ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Número da OS *
              </label>
              <input
                type="text"
                required
                value={formData.numero_os}
                onChange={(e) => setFormData({ ...formData, numero_os: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-green-500`}
                placeholder="OS-2024-0001"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Equipamento
              </label>
              <select
                value={formData.equipamento_id}
                onChange={(e) => setFormData({ ...formData, equipamento_id: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border cursor-pointer ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-green-500 pr-8`}
              >
                <option value="">Selecione o equipamento</option>
                {equipamentos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {formatEquipamentoName(eq)}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Título *
              </label>
              <input
                type="text"
                required
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-green-500`}
                placeholder="Ex: Troca de rolamento"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Prioridade *
              </label>
              <select
                required
                value={formData.prioridade}
                onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as any })}
                className={`w-full px-4 py-2 rounded-lg border cursor-pointer ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-green-500 pr-8`}
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Status *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className={`w-full px-4 py-2 rounded-lg border cursor-pointer ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-green-500 pr-8`}
              >
                <option value="Aberta">Aberta</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Pausada">Pausada</option>
                <option value="Concluída">Concluída</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Data Abertura *
              </label>
              <input
                type="date"
                required
                value={formData.data_abertura}
                onChange={(e) => setFormData({ ...formData, data_abertura: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-green-500`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Data Início
              </label>
              <input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-green-500`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Data Conclusão
              </label>
              <input
                type="date"
                value={formData.data_conclusao}
                onChange={(e) => setFormData({ ...formData, data_conclusao: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-green-500`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Responsável
              </label>
              <input
                type="text"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-green-500`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Equipe
              </label>
              <select
                value={formData.equipe_id}
                onChange={(e) => setFormData({ ...formData, equipe_id: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border cursor-pointer ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-green-500 pr-8`}
              >
                <option value="">Selecione a equipe</option>
                {equipes.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Custo Estimado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.custo_estimado}
                onChange={(e) => setFormData({ ...formData, custo_estimado: parseFloat(e.target.value) })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-green-500`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Custo Real (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.custo_real}
                onChange={(e) => setFormData({ ...formData, custo_real: parseFloat(e.target.value) })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-green-500`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Descrição
              </label>
              <textarea
                rows={3}
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-green-500`}
                placeholder="Descreva o serviço..."
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Observações
              </label>
              <textarea
                rows={3}
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-green-500`}
                placeholder="Observações adicionais..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex-1 px-6 py-3 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                darkMode 
                  ? 'bg-slate-700 text-white hover:bg-slate-600' 
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Salvando...' : osId ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
