import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';

interface Equipamento {
  id: string;
  nome: string;
  setor_id: string;
  descricao: string;
  fabricante: string;
  modelo: string;
  ano_fabricacao: number;
  criticidade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  status_revisao: number;
  foto_url: string;
  data_inicio_revisao: string;
  data_prevista_fim: string;
  mtbf: number;
  setores?: { nome: string };
}

interface Componente {
  id: string;
  nome: string;
  codigo_interno: string;
  marca: string;
  tipos_componentes?: { nome: string };
  quantidade_usada?: number;
}

interface OrdemServico {
  id: string;
  titulo: string;
  status: string;
  prioridade: string;
  data_abertura: string;
  data_conclusao: string;
}

interface HistoricoRevisao {
  id: string;
  data_revisao: string;
  tipo_revisao: string;
  descricao: string;
  custo_total: number;
}

export default function EquipamentoDetalhesPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const equipamentoId = id || searchParams.get('id');
  const navigate = useNavigate();
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('geral');
  const [equipamento, setEquipamento] = useState<Equipamento | null>(null);
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [historico, setHistorico] = useState<HistoricoRevisao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddComponenteModal, setShowAddComponenteModal] = useState(false);
  const [componentesDisponiveis, setComponentesDisponiveis] = useState<Componente[]>([]);
  const [selectedComponente, setSelectedComponente] = useState('');
  const [quantidade, setQuantidade] = useState(1);

  useEffect(() => {
    if (equipamentoId) {
      fetchEquipamento();
      fetchComponentes();
      fetchOrdensServico();
      fetchHistorico();
    }
  }, [equipamentoId]);

  const fetchEquipamento = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('equipamentos')
      .select('*, setores(nome)')
      .eq('id', equipamentoId)
      .single();
    if (data) setEquipamento(data);
    setLoading(false);
  };

  const fetchComponentes = async () => {
    const { data } = await supabase
      .from('equipamentos_componentes')
      .select('quantidade_usada, componentes(id, nome, codigo_interno, marca, tipos_componentes(nome))')
      .eq('equipamento_id', equipamentoId);
    
    if (data) {
      const componentesFormatados = data.map(item => ({
        id: item.componentes.id,
        nome: item.componentes.nome,
        codigo_interno: item.componentes.codigo_interno,
        marca: item.componentes.marca,
        tipos_componentes: item.componentes.tipos_componentes,
        quantidade_usada: item.quantidade_usada
      }));
      setComponentes(componentesFormatados);
    }
  };

  const fetchOrdensServico = async () => {
    const { data } = await supabase
      .from('ordens_servico')
      .select('*')
      .eq('equipamento_id', equipamentoId)
      .order('data_abertura', { ascending: false })
      .limit(10);
    if (data) setOrdensServico(data);
  };

  const fetchHistorico = async () => {
    const { data } = await supabase
      .from('historico_revisoes')
      .select('*')
      .eq('equipamento_id', equipamentoId)
      .order('data_revisao', { ascending: false });
    if (data) setHistorico(data);
  };

  const fetchComponentesDisponiveis = async () => {
    const { data } = await supabase
      .from('componentes')
      .select('id, nome, codigo_interno, marca, tipos_componentes(nome)')
      .order('nome');
    if (data) setComponentesDisponiveis(data);
  };

  const handleAddComponente = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('equipamentos_componentes').insert([{
      equipamento_id: equipamentoId,
      componente_id: selectedComponente,
      quantidade_usada: quantidade
    }]);
    setShowAddComponenteModal(false);
    setSelectedComponente('');
    setQuantidade(1);
    fetchComponentes();
  };

  const handleRemoveComponente = async (componenteId: string) => {
    if (confirm('Tem certeza que deseja remover este componente?')) {
      await supabase
        .from('equipamentos_componentes')
        .delete()
        .eq('equipamento_id', equipamentoId)
        .eq('componente_id', componenteId);
      fetchComponentes();
    }
  };

  const getCriticalityColor = (criticidade: string) => {
    switch (criticidade) {
      case 'Baixa': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Média': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Alta': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Crítica': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aberta': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Em Andamento': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Concluída': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Cancelada': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!equipamento) {
    return (
      <div className="min-h-screen bg-gray-950 flex">
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <i className="ri-error-warning-line text-6xl text-gray-700 mb-4"></i>
              <p className="text-gray-400 mb-4">Equipamento não encontrado</p>
              <button
                onClick={() => navigate('/equipamentos')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Voltar para Equipamentos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate('/equipamentos')}
              className="text-white/80 hover:text-white mb-4 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-line"></i>
              Voltar para Equipamentos
            </button>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{equipamento.nome}</h1>
                <div className="flex items-center gap-4 text-blue-100">
                  <span className="flex items-center gap-2">
                    <i className="ri-building-line"></i>
                    {equipamento.setores?.nome}
                  </span>
                  <span className="flex items-center gap-2">
                    <i className="ri-factory-line"></i>
                    {equipamento.fabricante}
                  </span>
                  <span className="flex items-center gap-2">
                    <i className="ri-settings-3-line"></i>
                    {equipamento.modelo}
                  </span>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${getCriticalityColor(equipamento.criticidade)}`}>
                {equipamento.criticidade}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Tabs */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 mb-6">
            <div className="flex border-b border-gray-800 overflow-x-auto">
              {[
                { id: 'geral', label: 'Geral', icon: 'ri-information-line' },
                { id: 'componentes', label: 'Componentes', icon: 'ri-settings-4-line' },
                { id: 'os', label: 'Ordens de Serviço', icon: 'ri-file-list-3-line' },
                { id: 'custos', label: 'Custos', icon: 'ri-money-dollar-circle-line' },
                { id: 'historico', label: 'Histórico', icon: 'ri-history-line' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <i className={tab.icon}></i>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Tab: Geral */}
              {activeTab === 'geral' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Imagem */}
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Imagem do Equipamento</h3>
                      <div className="relative h-64 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg overflow-hidden">
                        {equipamento.foto_url ? (
                          <img
                            src={equipamento.foto_url}
                            alt={equipamento.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <i className="ri-tools-line text-8xl text-gray-600"></i>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Informações */}
                    <div className="space-y-4">
                      <div className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Informações Técnicas</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Fabricante:</span>
                            <span className="text-white font-medium">{equipamento.fabricante}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Modelo:</span>
                            <span className="text-white font-medium">{equipamento.modelo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Ano de Fabricação:</span>
                            <span className="text-white font-medium">{equipamento.ano_fabricacao}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Setor:</span>
                            <span className="text-white font-medium">{equipamento.setores?.nome}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">MTBF:</span>
                            <span className="text-white font-medium">{equipamento.mtbf || 'N/A'} horas</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Status da Revisão</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Progresso:</span>
                            <span className="text-2xl font-bold text-blue-400">{equipamento.status_revisao}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                              style={{ width: `${equipamento.status_revisao}%` }}
                            ></div>
                          </div>
                          {equipamento.data_inicio_revisao && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Início:</span>
                              <span className="text-white">{new Date(equipamento.data_inicio_revisao).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                          {equipamento.data_prevista_fim && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Previsão de Término:</span>
                              <span className="text-white">{new Date(equipamento.data_prevista_fim).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  {/* Peças: mostrar associações rápidas na aba Geral */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Peças</h3>
                    {componentes.length === 0 ? (
                      <p className="text-gray-400">Nenhuma peça associada a este equipamento</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {componentes.slice(0, 6).map(c => (
                          <div key={c.id} className="bg-gray-700 px-3 py-1 rounded text-white text-sm">
                            <div className="font-medium">{c.nome}</div>
                            <div className="text-xs text-gray-300">{c.codigo_interno || ''}</div>
                          </div>
                        ))}
                        {componentes.length > 6 && (
                          <div className="bg-gray-700 px-3 py-1 rounded text-white text-sm">+{componentes.length - 6} mais</div>
                        )}
                      </div>
                    )}
                    <div className="mt-4">
                      <button onClick={() => setActiveTab('componentes')} className="px-3 py-2 bg-purple-600 text-white rounded">Ver todos</button>
                    </div>
                  </div>

                  {equipamento.descricao && (
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Descrição</h3>
                      <p className="text-gray-300 leading-relaxed">{equipamento.descricao}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Componentes */}
              {activeTab === 'componentes' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white">Componentes do Equipamento</h3>
                    <button
                      onClick={() => {
                        fetchComponentesDisponiveis();
                        setShowAddComponenteModal(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      <i className="ri-add-line"></i>
                      Adicionar Componente
                    </button>
                  </div>

                  {componentes.length === 0 ? (
                    <div className="text-center py-12">
                      <i className="ri-settings-4-line text-6xl text-gray-700 mb-4"></i>
                      <p className="text-gray-400">Nenhum componente cadastrado</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {componentes.map(componente => (
                        <div key={componente.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="text-white font-semibold mb-1">{componente.nome}</h4>
                              <p className="text-sm text-gray-400">{componente.tipos_componentes?.nome}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveComponente(componente.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <i className="ri-close-line text-xl"></i>
                            </button>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                              <i className="ri-barcode-line"></i>
                              <span>{componente.codigo_interno || 'Sem código'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <i className="ri-building-4-line"></i>
                              <span>{componente.marca || 'Sem marca'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-purple-400 font-semibold">
                              <i className="ri-stack-line"></i>
                              <span>Quantidade: {componente.quantidade_usada}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Ordens de Serviço */}
              {activeTab === 'os' && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6">Ordens de Serviço</h3>
                  {ordensServico.length === 0 ? (
                    <div className="text-center py-12">
                      <i className="ri-file-list-3-line text-6xl text-gray-700 mb-4"></i>
                      <p className="text-gray-400">Nenhuma ordem de serviço encontrada</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ordensServico.map(os => (
                        <div key={os.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500/50 transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-white font-semibold mb-2">{os.titulo}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <i className="ri-calendar-line"></i>
                                  {new Date(os.data_abertura).toLocaleDateString('pt-BR')}
                                </span>
                                {os.data_conclusao && (
                                  <span className="flex items-center gap-1">
                                    <i className="ri-check-line"></i>
                                    Concluída em {new Date(os.data_conclusao).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(os.status)}`}>
                                {os.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Custos */}
              {activeTab === 'custos' && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6">Análise de Custos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <i className="ri-money-dollar-circle-line text-2xl text-white"></i>
                        </div>
                        <div>
                          <p className="text-blue-100 text-sm">Custo Total</p>
                          <p className="text-2xl font-bold text-white">R$ 0,00</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <i className="ri-tools-line text-2xl text-white"></i>
                        </div>
                        <div>
                          <p className="text-purple-100 text-sm">Manutenções</p>
                          <p className="text-2xl font-bold text-white">R$ 0,00</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <i className="ri-settings-4-line text-2xl text-white"></i>
                        </div>
                        <div>
                          <p className="text-pink-100 text-sm">Componentes</p>
                          <p className="text-2xl font-bold text-white">R$ 0,00</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <i className="ri-bar-chart-line text-6xl text-gray-700 mb-4"></i>
                    <p className="text-gray-400">Dados de custos em desenvolvimento</p>
                  </div>
                </div>
              )}

              {/* Tab: Histórico */}
              {activeTab === 'historico' && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6">Histórico de Revisões</h3>
                  {historico.length === 0 ? (
                    <div className="text-center py-12">
                      <i className="ri-history-line text-6xl text-gray-700 mb-4"></i>
                      <p className="text-gray-400">Nenhum histórico encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {historico.map(item => (
                        <div key={item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-white font-semibold">{item.tipo_revisao}</h4>
                              <p className="text-sm text-gray-400">{new Date(item.data_revisao).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <span className="text-green-400 font-semibold">
                              R$ {item.custo_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {item.descricao && (
                            <p className="text-gray-300 text-sm">{item.descricao}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Adicionar Componente */}
        {showAddComponenteModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg max-w-md w-full border border-gray-800">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Adicionar Componente</h2>
                <button
                  onClick={() => setShowAddComponenteModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleAddComponente} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Componente *</label>
                  <select
                    required
                    value={selectedComponente}
                    onChange={(e) => setSelectedComponente(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Selecione...</option>
                    {componentesDisponiveis.map(comp => (
                      <option key={comp.id} value={comp.id}>
                        {comp.nome} - {comp.codigo_interno}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddComponenteModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all whitespace-nowrap"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
