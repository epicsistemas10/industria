import { useState, useEffect } from 'react';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';
import { melhoriasAPI, equipamentosAPI } from '../../lib/api';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../hooks/useToast';

interface Melhoria {
  id: string;
  titulo: string;
  descricao?: string;
  equipamento_id?: string;
  setor?: string;
  tipo: string;
  prioridade: string;
  status: string;
  custo_estimado?: number;
  economia_estimada?: number;
  categoria_investimento: string;
  roi_estimado?: number;
  payback_meses?: number;
  responsavel?: string;
  data_criacao: string;
  data_implementacao?: string;
  observacoes?: string;
  equipamentos?: { nome: string };
}

export default function MelhoriasPage() {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(false);
  const [melhorias, setMelhorias] = useState<Melhoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMelhoria, setEditingMelhoria] = useState<Melhoria | null>(null);
  const { canEdit, canDelete } = usePermissions();

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    equipamento_id: '',
    setor: '',
    tipo: 'Eficiência',
    prioridade: 'Média',
    status: 'Proposta',
    custo_estimado: 0,
    economia_estimada: 0,
    categoria_investimento: 'CAPEX',
    roi_estimado: 0,
    payback_meses: 0,
    responsavel: '',
    data_criacao: new Date().toISOString().split('T')[0],
    data_implementacao: '',
    observacoes: ''
  });

  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [melhoriasData, equipamentosData] = await Promise.all([
        melhoriasAPI.getAll(),
        equipamentosAPI.getAll()
      ]);
      setMelhorias(melhoriasData || []);
      setEquipamentos(equipamentosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Cálculos automáticos de ROI e Payback
      let roiCalculado = 0;
      let paybackCalculado = 0;

      if (formData.custo_estimado > 0 && formData.economia_estimada > 0) {
        // ROI = (Economia - Custo) / Custo * 100
        roiCalculado = ((formData.economia_estimada - formData.custo_estimado) / formData.custo_estimado) * 100;
        
        // Payback em meses = Custo / (Economia / 12)
        const economiaMensal = formData.economia_estimada / 12;
        paybackCalculado = Math.ceil(formData.custo_estimado / economiaMensal);
      }

      // Classificação automática CAPEX/OPEX
      let categoriaAuto = formData.categoria_investimento;
      if (formData.custo_estimado > 10000) {
        categoriaAuto = 'CAPEX';
      } else if (formData.tipo === 'Eficiência' || formData.tipo === 'Produtividade') {
        categoriaAuto = 'OPEX';
      }

      // Normalize numeric fields and nullable values before sending to API
      const melhoriaData = {
        ...formData,
        categoria_investimento: categoriaAuto,
        custo_estimado: Number(formData.custo_estimado) || 0,
        economia_estimada: Number(formData.economia_estimada) || 0,
        roi_estimado: Number(roiCalculado.toFixed(2)),
        payback_meses: Number(paybackCalculado) || null,
        equipamento_id: formData.equipamento_id ? formData.equipamento_id : null,
        data_implementacao: formData.data_implementacao ? formData.data_implementacao : null
      };

      if (editingMelhoria) {
        await melhoriasAPI.update(editingMelhoria.id, melhoriaData);
        success('Melhoria atualizada');
      } else {
        await melhoriasAPI.create(melhoriaData);
        success('Melhoria criada');
      }

      setShowModal(false);
      setEditingMelhoria(null);
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('Erro ao salvar melhoria:', err);
      showError('Erro ao salvar melhoria');
    }
  };

  const handleEdit = (melhoria: Melhoria) => {
    setEditingMelhoria(melhoria);
    setFormData({
      titulo: melhoria.titulo,
      descricao: melhoria.descricao || '',
      equipamento_id: melhoria.equipamento_id || '',
      setor: melhoria.setor || '',
      tipo: melhoria.tipo,
      prioridade: melhoria.prioridade,
      status: melhoria.status,
      custo_estimado: melhoria.custo_estimado || 0,
      economia_estimada: melhoria.economia_estimada || 0,
      categoria_investimento: melhoria.categoria_investimento,
      roi_estimado: melhoria.roi_estimado || 0,
      payback_meses: melhoria.payback_meses || 0,
      responsavel: melhoria.responsavel || '',
      data_criacao: melhoria.data_criacao,
      data_implementacao: melhoria.data_implementacao || '',
      observacoes: melhoria.observacoes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta melhoria?')) return;
    try {
      await melhoriasAPI.delete(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir melhoria:', error);
      alert('Erro ao excluir melhoria');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      equipamento_id: '',
      setor: '',
      tipo: 'Eficiência',
      prioridade: 'Média',
      status: 'Proposta',
      custo_estimado: 0,
      economia_estimada: 0,
      categoria_investimento: 'CAPEX',
      roi_estimado: 0,
      payback_meses: 0,
      responsavel: '',
      data_criacao: new Date().toISOString().split('T')[0],
      data_implementacao: '',
      observacoes: ''
    });
  };

  const filteredMelhorias = melhorias.filter(melhoria => {
    const matchSearch = 
      melhoria.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      melhoria.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      melhoria.setor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = !filterStatus || melhoria.status === filterStatus;
    const matchTipo = !filterTipo || melhoria.tipo === filterTipo;
    const matchCategoria = !filterCategoria || melhoria.categoria_investimento === filterCategoria;
    
    return matchSearch && matchStatus && matchTipo && matchCategoria;
  });

  const tipos = ['Eficiência', 'Segurança', 'Qualidade', 'Custo', 'Produtividade', 'Outro'];
  const prioridades = ['Baixa', 'Média', 'Alta', 'Crítica'];
  const statusList = ['Proposta', 'Em Análise', 'Aprovada', 'Em Implementação', 'Concluída', 'Rejeitada'];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Proposta': 'bg-gray-100 text-gray-800',
      'Em Análise': 'bg-blue-100 text-blue-800',
      'Aprovada': 'bg-green-100 text-green-800',
      'Em Implementação': 'bg-yellow-100 text-yellow-800',
      'Concluída': 'bg-emerald-100 text-emerald-800',
      'Rejeitada': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadeColor = (prioridade: string) => {
    const colors: Record<string, string> = {
      'Baixa': 'bg-blue-100 text-blue-800',
      'Média': 'bg-yellow-100 text-yellow-800',
      'Alta': 'bg-orange-100 text-orange-800',
      'Crítica': 'bg-red-100 text-red-800'
    };
    return colors[prioridade] || 'bg-gray-100 text-gray-800';
  };

  const totalCAPEX = filteredMelhorias.filter(m => m.categoria_investimento === 'CAPEX').reduce((sum, m) => sum + (m.custo_estimado || 0), 0);
  const totalOPEX = filteredMelhorias.filter(m => m.categoria_investimento === 'OPEX').reduce((sum, m) => sum + (m.custo_estimado || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Melhorias com CAPEX/OPEX</h1>
            <p className="text-gray-600">Propostas e implementações com análise de ROI e Payback</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Total de Melhorias</span>
                <i className="ri-lightbulb-line text-2xl text-yellow-500"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">{melhorias.length}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">CAPEX Total</span>
                <i className="ri-funds-line text-2xl text-blue-500"></i>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                R$ {totalCAPEX.toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">OPEX Total</span>
                <i className="ri-line-chart-line text-2xl text-orange-500"></i>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                R$ {totalOPEX.toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Concluídas</span>
                <i className="ri-checkbox-circle-line text-2xl text-green-500"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {melhorias.filter(m => m.status === 'Concluída').length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Economia Estimada</span>
                <i className="ri-money-dollar-circle-line text-2xl text-emerald-500"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                R$ {melhorias.reduce((sum, m) => sum + (m.economia_estimada || 0), 0).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Título, descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  <option value="">Todos os status</option>
                  {statusList.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  <option value="">Todos os tipos</option>
                  {tipos.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={filterCategoria}
                  onChange={(e) => setFilterCategoria(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  <option value="">Todas</option>
                  <option value="CAPEX">CAPEX</option>
                  <option value="OPEX">OPEX</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setEditingMelhoria(null);
                    resetForm();
                    setShowModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-medium whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="ri-add-line text-xl"></i>
                  Nova Melhoria
                </button>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <i className="ri-loader-4-line text-4xl text-gray-400 animate-spin"></i>
              </div>
            ) : filteredMelhorias.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <i className="ri-lightbulb-line text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">Nenhuma melhoria encontrada</p>
              </div>
            ) : (
              filteredMelhorias.map((melhoria) => (
                <div key={melhoria.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{melhoria.titulo}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(melhoria.status)}`}>
                          {melhoria.status}
                        </span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPrioridadeColor(melhoria.prioridade)}`}>
                          {melhoria.prioridade}
                        </span>
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                          {melhoria.tipo}
                        </span>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          melhoria.categoria_investimento === 'CAPEX' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-orange-500 text-white'
                        }`}>
                          {melhoria.categoria_investimento}
                        </span>
                      </div>
                    </div>
                  </div>

                  {melhoria.descricao && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{melhoria.descricao}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    {melhoria.equipamentos?.nome && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <i className="ri-settings-3-line"></i>
                        <span>{melhoria.equipamentos.nome}</span>
                      </div>
                    )}
                    {melhoria.setor && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <i className="ri-building-line"></i>
                        <span>{melhoria.setor}</span>
                      </div>
                    )}
                    {melhoria.responsavel && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <i className="ri-user-line"></i>
                        <span>{melhoria.responsavel}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="ri-calendar-line"></i>
                      <span>{new Date(melhoria.data_criacao).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Análise Financeira */}
                  <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    {(melhoria.custo_estimado ?? 0) > 0 && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Custo</p>
                        <p className="text-sm font-semibold text-red-600">
                          R$ {(melhoria.custo_estimado ?? 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {(melhoria.economia_estimada ?? 0) > 0 && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Economia</p>
                        <p className="text-sm font-semibold text-green-600">
                          R$ {(melhoria.economia_estimada ?? 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {melhoria.roi_estimado !== undefined && melhoria.roi_estimado !== null && melhoria.roi_estimado !== 0 && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">ROI</p>
                        <p className={`text-sm font-semibold ${melhoria.roi_estimado > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {melhoria.roi_estimado.toFixed(1)}%
                        </p>
                      </div>
                    )}
                    {melhoria.payback_meses !== undefined && melhoria.payback_meses !== null && melhoria.payback_meses > 0 && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Payback</p>
                        <p className="text-sm font-semibold text-blue-600">
                          {melhoria.payback_meses} meses
                        </p>
                      </div>
                    )}
                  </div>

                  {(canEdit || canDelete) && (
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      {canEdit && (
                        <button
                          onClick={() => handleEdit(melhoria)}
                          className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium whitespace-nowrap flex items-center justify-center gap-2"
                        >
                          <i className="ri-edit-line"></i>
                          Editar
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(melhoria.id)}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium whitespace-nowrap flex items-center justify-center gap-2"
                        >
                          <i className="ri-delete-bin-line"></i>
                          Excluir
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">
                {editingMelhoria ? 'Editar Melhoria' : 'Nova Melhoria'}
              </h2>
              <p className="text-purple-100 text-sm mt-1">ROI e Payback calculados automaticamente</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    {tipos.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridade *
                  </label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    {prioridades.map(prioridade => (
                      <option key={prioridade} value={prioridade}>{prioridade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    {statusList.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipamento
                  </label>
                  <select
                    value={formData.equipamento_id}
                    onChange={(e) => setFormData({ ...formData, equipamento_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {equipamentos.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Setor
                  </label>
                  <input
                    type="text"
                    value={formData.setor}
                    onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custo Estimado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custo_estimado}
                    onChange={(e) => setFormData({ ...formData, custo_estimado: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Economia Estimada (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.economia_estimada}
                    onChange={(e) => setFormData({ ...formData, economia_estimada: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Criação *
                  </label>
                  <input
                    type="date"
                    value={formData.data_criacao}
                    onChange={(e) => setFormData({ ...formData, data_criacao: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Implementação
                  </label>
                  <input
                    type="date"
                    value={formData.data_implementacao}
                    onChange={(e) => setFormData({ ...formData, data_implementacao: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria de Investimento *
                  </label>
                  <select
                    value={formData.categoria_investimento}
                    onChange={(e) => setFormData({ ...formData, categoria_investimento: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="CAPEX">CAPEX - Investimento de Capital</option>
                    <option value="OPEX">OPEX - Despesa Operacional</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Classificado automaticamente baseado no valor e tipo
                  </p>
                </div>
              </div>

              {/* Análise Financeira Preview */}
              {formData.custo_estimado > 0 && formData.economia_estimada > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6 border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-3">📊 Análise Financeira Automática</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">ROI Estimado</p>
                      <p className={`text-lg font-bold ${
                        ((formData.economia_estimada - formData.custo_estimado) / formData.custo_estimado) * 100 > 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {(((formData.economia_estimada - formData.custo_estimado) / formData.custo_estimado) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Payback</p>
                      <p className="text-lg font-bold text-blue-600">
                        {Math.ceil(formData.custo_estimado / (formData.economia_estimada / 12))} meses
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Categoria</p>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        formData.custo_estimado > 10000 ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
                      }`}>
                        {formData.custo_estimado > 10000 ? 'CAPEX' : 'OPEX'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Retorno Líquido</p>
                      <p className="text-lg font-bold text-emerald-600">
                        R$ {(formData.economia_estimada - formData.custo_estimado).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMelhoria(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-medium whitespace-nowrap"
                >
                  {editingMelhoria ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
