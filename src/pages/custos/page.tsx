import { useState, useEffect } from 'react';
import { formatEquipamentoName } from '../../utils/format';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';
import { custosAPI, equipamentosAPI, componentesAPI } from '../../lib/api';
import { usePermissions } from '../../hooks/usePermissions';

interface Custo {
  id: string;
  equipamento_id?: string;
  componente_id?: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  fornecedor?: string;
  numero_nota?: string;
  tipo_custo: string;
  categoria_investimento: string;
  justificativa?: string;
  data: string;
  responsavel?: string;
  equipamentos?: { nome: string };
  componentes?: { nome: string };
}

export default function CustosPage() {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);
  const [custos, setCustos] = useState<Custo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterMes, setFilterMes] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCusto, setEditingCusto] = useState<Custo | null>(null);
  const { canCreate, canEdit, canDelete } = usePermissions();

  // Form state
  const [formData, setFormData] = useState({
    equipamento_id: '',
    componente_id: '',
    quantidade: 1,
    valor_unitario: 0,
    fornecedor: '',
    numero_nota: '',
    tipo_custo: 'Manutenção',
    categoria_investimento: 'OPEX',
    justificativa: '',
    data: new Date().toISOString().split('T')[0],
    responsavel: ''
  });

  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [componentes, setComponentes] = useState<any[]>([]);

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
      const [custosData, equipamentosData, componentesData] = await Promise.all([
        custosAPI.getAll(),
        equipamentosAPI.getAll(),
        componentesAPI.getAll()
      ]);
      setCustos(custosData || []);
      setEquipamentos(equipamentosData || []);
      setComponentes(componentesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Classificação automática CAPEX/OPEX
      let categoriaAuto = formData.categoria_investimento;
      let justificativaAuto = formData.justificativa;

      // Regras automáticas de classificação
      if (formData.tipo_custo === 'Peças' && formData.valor_unitario * formData.quantidade > 5000) {
        categoriaAuto = 'CAPEX';
        justificativaAuto = justificativaAuto || 'Investimento em peças de alto valor (>R$ 5.000)';
      } else if (formData.tipo_custo === 'Manutenção' || formData.tipo_custo === 'Mão de Obra') {
        categoriaAuto = 'OPEX';
        justificativaAuto = justificativaAuto || 'Despesa operacional recorrente';
      } else if (formData.tipo_custo === 'Serviços' && formData.valor_unitario * formData.quantidade > 10000) {
        categoriaAuto = 'CAPEX';
        justificativaAuto = justificativaAuto || 'Investimento em serviços de alto valor (>R$ 10.000)';
      }

      const custoData = {
        ...formData,
        categoria_investimento: categoriaAuto,
        justificativa: justificativaAuto,
        valor_total: formData.quantidade * formData.valor_unitario,
        equipamento_id: formData.equipamento_id || null,
        componente_id: formData.componente_id || null
      };

      if (editingCusto) {
        await custosAPI.update(editingCusto.id, custoData);
      } else {
        await custosAPI.create(custoData);
      }

      setShowModal(false);
      setEditingCusto(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar custo:', error);
      alert('Erro ao salvar custo');
    }
  };

  const handleEdit = (custo: Custo) => {
    setEditingCusto(custo);
    setFormData({
      equipamento_id: custo.equipamento_id || '',
      componente_id: custo.componente_id || '',
      quantidade: custo.quantidade,
      valor_unitario: custo.valor_unitario,
      fornecedor: custo.fornecedor || '',
      numero_nota: custo.numero_nota || '',
      tipo_custo: custo.tipo_custo,
      data: custo.data,
      responsavel: custo.responsavel || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este custo?')) return;
    try {
      await custosAPI.delete(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir custo:', error);
      alert('Erro ao excluir custo');
    }
  };

  const resetForm = () => {
    setFormData({
      equipamento_id: '',
      componente_id: '',
      quantidade: 1,
      valor_unitario: 0,
      fornecedor: '',
      numero_nota: '',
      tipo_custo: 'Manutenção',
      data: new Date().toISOString().split('T')[0],
      responsavel: ''
    });
  };

  const filteredCustos = custos.filter(custo => {
    const matchSearch = 
      custo.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custo.numero_nota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custo.equipamentos?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custo.componentes?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTipo = !filterTipo || custo.tipo_custo === filterTipo;
    const matchMes = !filterMes || custo.data.startsWith(filterMes);
    const matchCategoria = !filterCategoria || custo.categoria_investimento === filterCategoria;
    
    return matchSearch && matchTipo && matchMes && matchCategoria;
  });

  const totalCustos = filteredCustos.reduce((sum, custo) => sum + custo.valor_total, 0);
  const totalCAPEX = filteredCustos.filter(c => c.categoria_investimento === 'CAPEX').reduce((sum, c) => sum + c.valor_total, 0);
  const totalOPEX = filteredCustos.filter(c => c.categoria_investimento === 'OPEX').reduce((sum, c) => sum + c.valor_total, 0);

  const tiposCusto = ['Manutenção', 'Peças', 'Mão de Obra', 'Serviços', 'Outros'];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Custos com CAPEX/OPEX</h1>
            <p className="text-gray-600">Controle financeiro automático de manutenção e operações</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Total Geral</span>
                <i className="ri-money-dollar-circle-line text-2xl text-green-500"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                R$ {totalCustos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">CAPEX</span>
                <i className="ri-funds-line text-2xl text-blue-500"></i>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                R$ {totalCAPEX.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {totalCustos > 0 ? ((totalCAPEX / totalCustos) * 100).toFixed(1) : 0}% do total
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">OPEX</span>
                <i className="ri-line-chart-line text-2xl text-orange-500"></i>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                R$ {totalOPEX.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {totalCustos > 0 ? ((totalOPEX / totalCustos) * 100).toFixed(1) : 0}% do total
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Registros</span>
                <i className="ri-file-list-3-line text-2xl text-purple-500"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">{filteredCustos.length}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Média por Registro</span>
                <i className="ri-bar-chart-line text-2xl text-emerald-500"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                R$ {filteredCustos.length > 0 ? (totalCustos / filteredCustos.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
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
                    placeholder="Fornecedor, nota..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Custo</label>
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os tipos</option>
                  {tiposCusto.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={filterCategoria}
                  onChange={(e) => setFilterCategoria(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas</option>
                  <option value="CAPEX">CAPEX</option>
                  <option value="OPEX">OPEX</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mês</label>
                <input
                  type="month"
                  value={filterMes}
                  onChange={(e) => setFilterMes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {canCreate && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setEditingCusto(null);
                      resetForm();
                      setShowModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    <i className="ri-add-line text-xl"></i>
                    Novo Custo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Equipamento/Componente</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fornecedor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nota Fiscal</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Qtd</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Valor Unit.</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Valor Total</th>
                    {(canEdit || canDelete) && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        <i className="ri-loader-4-line text-3xl animate-spin"></i>
                        <p className="mt-2">Carregando custos...</p>
                      </td>
                    </tr>
                  ) : filteredCustos.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        <i className="ri-inbox-line text-5xl text-gray-300 mb-2"></i>
                        <p>Nenhum custo encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustos.map((custo) => (
                      <tr key={custo.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(custo.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            custo.categoria_investimento === 'CAPEX' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {custo.categoria_investimento}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            {custo.tipo_custo}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {custo.equipamentos?.nome || custo.componentes?.nome || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{custo.fornecedor || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{custo.numero_nota || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{custo.quantidade}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          R$ {custo.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">
                          R$ {custo.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        {(canEdit || canDelete) && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              {canEdit && (
                                <button
                                  onClick={() => handleEdit(custo)}
                                  className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <i className="ri-edit-line text-lg"></i>
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(custo.id)}
                                  className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <i className="ri-delete-bin-line text-lg"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">
                {editingCusto ? 'Editar Custo' : 'Novo Custo'}
              </h2>
              <p className="text-green-100 text-sm mt-1">Classificação CAPEX/OPEX automática</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Custo *
                  </label>
                  <select
                    value={formData.tipo_custo}
                    onChange={(e) => setFormData({ ...formData, tipo_custo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    {tiposCusto.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria de Investimento *
                  </label>
                  <select
                    value={formData.categoria_investimento}
                    onChange={(e) => setFormData({ ...formData, categoria_investimento: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="OPEX">OPEX - Despesa Operacional</option>
                    <option value="CAPEX">CAPEX - Investimento de Capital</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Será classificado automaticamente baseado no valor e tipo
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipamento
                  </label>
                  <select
                    value={formData.equipamento_id}
                    onChange={(e) => setFormData({ ...formData, equipamento_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {equipamentos.map(eq => (
                      <option key={eq.id} value={eq.id}>{formatEquipamentoName(eq)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Componente
                  </label>
                  <select
                    value={formData.componente_id}
                    onChange={(e) => setFormData({ ...formData, componente_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {componentes.map(comp => (
                      <option key={comp.id} value={comp.id}>{comp.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Unitário (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_unitario}
                    onChange={(e) => setFormData({ ...formData, valor_unitario: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número da Nota Fiscal
                  </label>
                  <input
                    type="text"
                    value={formData.numero_nota}
                    onChange={(e) => setFormData({ ...formData, numero_nota: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Justificativa da Classificação
                  </label>
                  <textarea
                    value={formData.justificativa}
                    onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
                    rows={2}
                    placeholder="Será preenchida automaticamente se deixada em branco"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg mb-6 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    <strong>Valor Total:</strong> R$ {(formData.quantidade * formData.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    formData.categoria_investimento === 'CAPEX' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-orange-500 text-white'
                  }`}>
                    {formData.categoria_investimento}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  ℹ️ Valores acima de R$ 5.000 em peças ou R$ 10.000 em serviços são automaticamente classificados como CAPEX
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCusto(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium whitespace-nowrap"
                >
                  {editingCusto ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
