import { useState, useEffect } from 'react';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';
import { ordensServicoAPI } from '../../lib/api';
import { usePermissions } from '../../hooks/usePermissions';
import OrdemServicoModal from '../../components/modals/OrdemServicoModal';
import { supabase } from '../../lib/supabase';

interface OrdemServico {
  id: string;
  numero_os: string;
  titulo: string;
  descricao?: string;
  prioridade: string;
  status: string;
  data_abertura: string;
  data_inicio?: string;
  data_conclusao?: string;
  responsavel?: string;
  custo_estimado?: number;
  custo_real?: number;
  equipamentos?: { nome: string };
}

export default function OrdensServicoPage() {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPrioridade, setFilterPrioridade] = useState('');
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [showModal, setShowModal] = useState(false);
  const [selectedOSId, setSelectedOSId] = useState<string | undefined>();
  const [generatingAuto, setGeneratingAuto] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    loadOrdens();
  }, []);

  const loadOrdens = async () => {
    try {
      setLoading(true);
      const data = await ordensServicoAPI.getAll();
      setOrdens(data || []);
    } catch (error) {
      console.error('Erro ao carregar ordens de serviço:', error);
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      alert('Você não tem permissão para excluir ordens de serviço');
      return;
    }

    if (confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      try {
        await ordensServicoAPI.delete(id);
        loadOrdens();
      } catch (error) {
        console.error('Erro ao excluir ordem de serviço:', error);
        alert('Erro ao excluir ordem de serviço');
      }
    }
  };

  const handleEdit = (id: string) => {
    setSelectedOSId(id);
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedOSId(undefined);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedOSId(undefined);
  };

  const handleModalSuccess = () => {
    loadOrdens();
  };

  const gerarOSAutomaticas = async () => {
    try {
      setGeneratingAuto(true);
      
      // Buscar equipamentos que precisam de manutenção
      const { data: equipamentos } = await supabase
        .from('equipamentos')
        .select('*')
        .or('status.eq.alerta,status.eq.manutencao,status.eq.parado')
        .order('criticidade', { ascending: false });

      if (!equipamentos || equipamentos.length === 0) {
        alert('ℹ️ Nenhum equipamento necessita de OS no momento.');
        return;
      }

      const osParaCriar = [];
      const hoje = new Date();

      for (const eq of equipamentos) {
        // Verificar se já existe OS aberta para este equipamento
        const { data: osExistente } = await supabase
          .from('ordens_servico')
          .select('id')
          .eq('equipamento_id', eq.id)
          .in('status', ['aberta', 'em_andamento'])
          .single();

        if (osExistente) continue;

        // Gerar número da OS
        const numeroOS = `OS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Determinar prioridade baseada no status e criticidade
        let prioridade = 'media';
        if (eq.status === 'parado' || eq.criticidade === 'critica') {
          prioridade = 'urgente';
        } else if (eq.status === 'alerta' || eq.criticidade === 'alta') {
          prioridade = 'alta';
        }

        // Determinar tipo de manutenção
        const tipo = eq.status === 'parado' ? 'Corretiva' : 'Preventiva';

        osParaCriar.push({
          numero_os: numeroOS,
          titulo: `Manutenção ${tipo} - ${eq.nome}`,
          descricao: `OS gerada automaticamente devido ao status: ${eq.status}. Criticidade: ${eq.criticidade}.`,
          equipamento_id: eq.id,
          prioridade,
          status: 'aberta',
          data_abertura: hoje.toISOString(),
          responsavel: 'Equipe de Manutenção',
          gerada_automaticamente: true,
          regra_geracao: `Status: ${eq.status}, Criticidade: ${eq.criticidade}`,
          created_at: hoje.toISOString()
        });
      }

      if (osParaCriar.length > 0) {
        const { error } = await supabase
          .from('ordens_servico')
          .insert(osParaCriar);

        if (error) throw error;

        alert(`✅ ${osParaCriar.length} ordens de serviço geradas automaticamente!`);
        loadOrdens();
      } else {
        alert('ℹ️ Todas as OS necessárias já foram criadas.');
      }
    } catch (error) {
      console.error('Erro ao gerar OS:', error);
      alert('❌ Erro ao gerar ordens de serviço automáticas');
    } finally {
      setGeneratingAuto(false);
    }
  };

  const filteredOrdens = ordens.filter(os => {
    const matchSearch = (os.numero_os?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                       (os.titulo?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchStatus = !filterStatus || os.status === filterStatus;
    const matchPrioridade = !filterPrioridade || os.prioridade === filterPrioridade;
    return matchSearch && matchStatus && matchPrioridade;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aberta': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'em_andamento': 
      case 'em andamento': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'pausada': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'concluida':
      case 'concluída': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelada': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade?.toLowerCase()) {
      case 'baixa': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'media':
      case 'média': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'alta': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'urgente': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aberta': return 'Aberta';
      case 'em_andamento': return 'Em Andamento';
      case 'pausada': return 'Pausada';
      case 'concluida': return 'Concluída';
      case 'cancelada': return 'Cancelada';
      default: return status || 'N/A';
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <main className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ordens de Serviço</h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Gerencie todas as ordens de serviço</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={gerarOSAutomaticas}
                disabled={generatingAuto}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingAuto ? (
                  <>
                    <i className="ri-loader-4-line text-xl animate-spin"></i>
                    Gerando...
                  </>
                ) : (
                  <>
                    <i className="ri-magic-line text-xl"></i>
                    Gerar Automático
                  </>
                )}
              </button>
              {canCreate && (
                <button 
                  onClick={handleCreate}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-add-line text-xl"></i>
                  Nova OS
                </button>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 mb-6 shadow-lg`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <i className={`ri-search-line absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                <input
                  type="text"
                  placeholder="Buscar por número ou título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              >
                <option value="">Todos os Status</option>
                <option value="aberta">Aberta</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="pausada">Pausada</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>

              <select
                value={filterPrioridade}
                onChange={(e) => setFilterPrioridade(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              >
                <option value="">Todas as Prioridades</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          )}

          {/* Lista de OS */}
          {!loading && filteredOrdens.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrdens.map((os) => (
                <div
                  key={os.id}
                  className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border shadow-lg hover:shadow-xl transition-all`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>#{os.numero_os}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(os.status)}`}>
                        {getStatusText(os.status)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPrioridadeColor(os.prioridade)}`}>
                        {os.prioridade?.charAt(0).toUpperCase() + os.prioridade?.slice(1) || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{os.titulo}</h3>
                  
                  {os.descricao && (
                    <p className={`text-sm mb-4 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{os.descricao}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    {os.equipamentos && (
                      <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <i className="ri-tools-line"></i>
                        <span>{os.equipamentos.nome}</span>
                      </div>
                    )}
                    <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <i className="ri-calendar-line"></i>
                      <span>{formatDate(os.data_abertura)}</span>
                    </div>
                    {os.responsavel && (
                      <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <i className="ri-user-line"></i>
                        <span>{os.responsavel}</span>
                      </div>
                    )}
                    {os.custo_estimado && (
                      <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <i className="ri-money-dollar-circle-line"></i>
                        <span>R$ {os.custo_estimado.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {canEdit && (
                      <button 
                        onClick={() => handleEdit(os.id)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer text-sm"
                      >
                        <i className="ri-edit-line mr-1"></i>
                        Editar
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        onClick={() => handleDelete(os.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer text-sm"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sem resultados */}
          {!loading && filteredOrdens.length === 0 && (
            <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-12 text-center shadow-lg`}>
              <i className={`ri-file-list-3-line text-6xl mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Nenhuma ordem de serviço encontrada
              </h3>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm || filterStatus || filterPrioridade 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando uma nova ordem de serviço'}
              </p>
              {canCreate && !searchTerm && !filterStatus && !filterPrioridade && (
                <button
                  onClick={handleCreate}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-add-line mr-2"></i>
                  Criar Primeira OS
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      <OrdemServicoModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        osId={selectedOSId}
        darkMode={darkMode}
      />
    </div>
  );
}
