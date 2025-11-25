import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import { equipamentosAPI } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';
import EquipamentoModal from '../../components/modals/EquipamentoModal';
import { useToast } from '../../hooks/useToast';

interface Equipamento {
  id: string;
  nome: string;
  setor?: string;
  criticidade: string;
  status_revisao: number;
  foto_url?: string;
  setores?: { nome: string };
}

export default function EquipamentosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { success, error: showError } = useToast();
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSetor, setFilterSetor] = useState('');
  const [filterCriticidade, setFilterCriticidade] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEquipamentoId, setSelectedEquipamentoId] = useState<string | undefined>();
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceTargetEquipId, setServiceTargetEquipId] = useState<string | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    loadEquipamentos();
  }, []);

  const loadEquipamentos = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await equipamentosAPI.getAll();
      setEquipamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
      setError(true);
      setEquipamentos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      alert('Você não tem permissão para excluir equipamentos');
      return;
    }

    if (confirm('Tem certeza que deseja excluir este equipamento?')) {
      try {
        await equipamentosAPI.delete(id);
        loadEquipamentos();
        success('Equipamento excluído');
      } catch (error) {
        console.error('Erro ao excluir equipamento:', error);
        showError('Erro ao excluir equipamento');
      }
    }
  };

  const handleEdit = (id: string) => {
    setSelectedEquipamentoId(id);
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedEquipamentoId(undefined);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedEquipamentoId(undefined);
  };

  const handleModalSuccess = () => {
    loadEquipamentos();
  };

  const filteredEquipamentos = equipamentos.filter(eq => {
    const matchSearch = (eq.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const setorNome = eq.setores?.nome || eq.setor || '';
    const matchSetor = !filterSetor || setorNome === filterSetor;
    const matchCriticidade = !filterCriticidade || eq.criticidade === filterCriticidade;
    return matchSearch && matchSetor && matchCriticidade;
  });

  const setores = [...new Set(equipamentos.map(eq => eq.setores?.nome || eq.setor).filter(Boolean))];
  const criticidades = ['Baixa', 'Média', 'Alta', 'Crítica'];

  const getCriticidadeColor = (criticidade: string) => {
    switch (criticidade?.toLowerCase()) {
      case 'baixa': return 'bg-green-500/20 text-green-400';
      case 'média':
      case 'media': return 'bg-yellow-500/20 text-yellow-400';
      case 'alta': return 'bg-orange-500/20 text-orange-400';
      case 'crítica':
      case 'critica': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 100) return 'bg-green-500';
    if (status >= 75) return 'bg-blue-500';
    if (status >= 50) return 'bg-yellow-500';
    if (status >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} darkMode={darkMode} />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <main className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <i className="ri-tools-line mr-3"></i>
                Equipamentos
              </h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Gerencie todos os equipamentos da planta industrial
              </p>
            </div>

            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg whitespace-nowrap cursor-pointer"
            >
              <i className="ri-add-line mr-2"></i>
              Novo Equipamento
            </button>
          </div>

          {/* Filtros */}
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 mb-6 shadow-lg`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <i className={`ri-search-line absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                <input
                  type="text"
                  placeholder="Buscar equipamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
              </div>

              <select
                value={filterSetor}
                onChange={(e) => setFilterSetor(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8`}
              >
                <option value="">Todos os Setores</option>
                {setores.map(setor => (
                  <option key={setor} value={setor}>{setor}</option>
                ))}
              </select>

              <select
                value={filterCriticidade}
                onChange={(e) => setFilterCriticidade(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8`}
              >
                <option value="">Todas as Criticidades</option>
                {criticidades.map(crit => (
                  <option key={crit} value={crit}>{crit}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-12 text-center shadow-lg`}>
              <i className={`ri-error-warning-line text-6xl mb-4 text-red-400`}></i>
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Erro ao carregar equipamentos
              </h3>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Ocorreu um erro ao buscar os dados. Tente novamente.
              </p>
              <button
                onClick={loadEquipamentos}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all whitespace-nowrap cursor-pointer"
              >
                <i className="ri-refresh-line mr-2"></i>
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Grid de Equipamentos */}
          {!loading && !error && filteredEquipamentos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEquipamentos.map((equipamento) => (
                <div
                  key={equipamento.id}
                  className={`rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer border overflow-hidden group ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
                >
                  {/* Imagem */}
                  <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
                    {equipamento.foto_url ? (
                      <img
                        src={equipamento.foto_url}
                        alt={equipamento.nome}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="ri-tools-line text-6xl text-gray-500"></i>
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${getCriticidadeColor(equipamento.criticidade)}`}>
                      {equipamento.criticidade || 'N/A'}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4">
                    <h3 className={`font-bold text-lg mb-2 truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{equipamento.nome}</h3>
                    
                    <div className={`flex items-center gap-2 text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <i className="ri-building-line"></i>
                      <span>{equipamento.setores?.nome || equipamento.setor || 'Sem setor'}</span>
                    </div>

                    {/* Progresso */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Progresso</span>
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{equipamento.status_revisao || 0}%</span>
                      </div>
                      <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        <div
                          className={`h-2 rounded-full transition-all ${getStatusColor(equipamento.status_revisao || 0)}`}
                          style={{ width: `${equipamento.status_revisao || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/equipamento/${equipamento.id}`)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-eye-line mr-1"></i>
                        Ver Detalhes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setServiceTargetEquipId(equipamento.id);
                          setServiceName('');
                          setServiceDesc('');
                          setShowServiceModal(true);
                        }}
                        className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap cursor-pointer"
                        title="Cadastrar Serviço"
                      >
                        <i className="ri-add-circle-line text-lg"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(equipamento.id);
                        }}
                        className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer"
                        title="Editar"
                      >
                        <i className="ri-edit-line text-lg"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(equipamento.id);
                        }}
                        className="w-10 h-10 flex items-center justify-center bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
                        title="Excluir"
                      >
                        <i className="ri-delete-bin-line text-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sem resultados */}
          {!loading && !error && filteredEquipamentos.length === 0 && (
            <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-12 text-center shadow-lg`}>
              <i className={`ri-tools-line text-6xl mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Nenhum equipamento encontrado
              </h3>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm || filterSetor || filterCriticidade 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece cadastrando um novo equipamento'}
              </p>
              {canCreate && !searchTerm && !filterSetor && !filterCriticidade && (
                <button
                  onClick={handleCreate}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-add-line mr-2"></i>
                  Cadastrar Primeiro Equipamento
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      <EquipamentoModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        equipamentoId={selectedEquipamentoId}
        darkMode={darkMode}
      />

      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl w-full max-w-lg p-6`}> 
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Cadastrar Serviço</h4>
              <button onClick={() => setShowServiceModal(false)} className={`w-8 h-8 rounded flex items-center justify-center ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                <i className={`ri-close-line ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nome do Serviço</label>
                <input type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="Ex: Troca de correia" />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Descrição (opcional)</label>
                <textarea value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} rows={3} />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowServiceModal(false)} className={`flex-1 px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Cancelar</button>
                <button onClick={async () => {
                  if (!serviceName || !serviceTargetEquipId) { alert('Informe nome do serviço'); return; }
                  try {
                    const { error } = await supabase
                      .from('equipamento_servicos')
                      .insert([{ equipamento_id: serviceTargetEquipId, nome: serviceName, descricao: serviceDesc || null }]);
                    if (error) { console.error('Erro ao criar serviço:', error); alert('Erro ao cadastrar serviço'); return; }
                    alert('Serviço cadastrado com sucesso');
                    setShowServiceModal(false);
                  } catch (err) { console.error(err); alert('Erro ao cadastrar serviço'); }
                }} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Cadastrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
