import { useState, useEffect } from 'react';
import { formatEquipamentoName } from '../../utils/format';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';
import { ordensServicoAPI } from '../../lib/api';
import StartOsModal from '../../components/modals/StartOsModal';
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
  const { canCreate, canEdit, canDelete, canExecuteOS, permission } = usePermissions();
  const [showModal, setShowModal] = useState(false);
  const [selectedOSId, setSelectedOSId] = useState<string | undefined>();
  const [generatingAuto, setGeneratingAuto] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [startOs, setStartOs] = useState<any | null>(null);

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

        // Gerar número da OS (6 dígitos) — apenas para OS automáticas
        const numeroOS = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');

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
          // titulo não é necessário para as OS automáticas (UI mostrará apenas o serviço)
          titulo: ``,
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

  // carregar nomes dos serviços (mapa) para exibir descrição legível
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [equipesMap, setEquipesMap] = useState<Record<string, string>>({});
  const [equipesMeta, setEquipesMeta] = useState<Record<string, { nome: string; foto_url?: string }>>({});
  const [equipmentComponentsMap, setEquipmentComponentsMap] = useState<Record<string, any[]>>({});
  const [plannedNamesByOs, setPlannedNamesByOs] = useState<Record<string, string>>({});
  useEffect(() => {
    (async () => {
      try {
        // carregar equipes com primeiro colaborador (foto)
        const { data } = await supabase.from('equipes').select('id, nome');
        const map: Record<string, string> = {};
        (data || []).forEach((r: any) => { map[String(r.id)] = r.nome; });
        setEquipesMap(map);

        // carregar meta (foto do primeiro colaborador da equipe)
        const meta: Record<string, { nome: string; foto_url?: string }> = {};
        try {
          const ids = (data || []).map((d: any) => d.id);
          if (ids.length > 0) {
            const { data: cols } = await supabase.from('colaboradores').select('id, nome, foto_url, equipe_id').in('equipe_id', ids as any[]).order('nome');
            const grouped: Record<string, any[]> = {};
            (cols || []).forEach((c: any) => { grouped[String(c.equipe_id)] = grouped[String(c.equipe_id)] || []; grouped[String(c.equipe_id)].push(c); });
            (data || []).forEach((r: any) => {
              const g = grouped[String(r.id)] || [];
              meta[String(r.id)] = { nome: r.nome, foto_url: g[0]?.foto_url };
            });
          }
        } catch (e) {
          // ignore meta loading errors
        }
        setEquipesMeta(meta);
      } catch (e) {
        console.warn('Erro ao carregar equipes', e);
      }
    })();
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('servicos').select('id, nome');
        const map: Record<string, string> = {};
        (data || []).forEach((s: any) => map[String(s.id)] = s.nome || String(s.id));
        setServiceNames(map);
      } catch (e) {
        console.warn('Erro ao carregar nomes de serviços', e);
      }
    })();
  }, []);

  // ensure we have fetched any missing service names referenced inside ordens.observacoes.planned_services
  useEffect(() => {
    (async () => {
      try {
        const missing = new Set<string>();
        (ordens || []).forEach((os: any) => {
          try {
            const obs = os.observacoes ? JSON.parse(os.observacoes) : null;
            const ps = obs?.planned_services || [];
            (ps || []).forEach((p: any) => {
              // attempt to extract service id from multiple shapes
              const tryExtract = (obj: any) => {
                if (!obj) return null;
                if (typeof obj === 'string') return obj;
                if (typeof obj === 'object') {
                  if (obj.id) return obj.id;
                  if (obj.servico_id) return obj.servico_id;
                  if (obj.uuid) return obj.uuid;
                  if (obj.codigo) return obj.codigo;
                  // scan for any string value that looks like a UUID
                  const uuids = Object.values(obj).filter(v => typeof v === 'string' && /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/.test(v));
                  if (uuids.length > 0) return uuids[0];
                }
                return null;
              };
              const sidCandidate = tryExtract(p.servico_id || p.servico || p);
              if (sidCandidate && !serviceNames[String(sidCandidate)]) missing.add(String(sidCandidate));
            });
          } catch (e) { /* ignore */ }
        });
        if (missing.size === 0) return;
        const ids = Array.from(missing);
        const merged = { ...serviceNames };
        // try servicos table first
        try {
          const { data: svcData } = await supabase.from('servicos').select('id, nome').in('id', ids as any[]);
          (svcData || []).forEach((s: any) => { merged[String(s.id)] = s.nome || String(s.id); });
        } catch (e) {
          // ignore
        }
        // for any ids still unresolved, try equipamento_servicos (used by planejamento)
        const stillMissing = ids.filter(i => !merged[String(i)]);
        if (stillMissing.length > 0) {
          try {
            const { data: eqData } = await supabase.from('equipamento_servicos').select('id, nome').in('id', stillMissing as any[]);
            (eqData || []).forEach((s: any) => { merged[String(s.id)] = s.nome || String(s.id); });
          } catch (e) {
            // ignore
          }
        }
        setServiceNames(merged);
      } catch (e) { /* ignore */ }
    })();
  }, [ordens]);

  // enriquecer nomes planejados por OS (quando ordens ou serviceNames mudarem)
  useEffect(() => {
    try {
      const map: Record<string, string> = {};
      ordens.forEach((os: any) => {
        try {
          const obs = os.observacoes ? JSON.parse(os.observacoes) : null;
          const ps = obs?.planned_services || [];
          if (ps && ps.length > 0) {
            const first = ps[0];
            // Normalize possible shapes for the service identifier
            let sidRaw: any = first.servico_id || first.servico;
            let sid: string | null = null;
            if (sidRaw) {
              if (typeof sidRaw === 'string') sid = sidRaw;
              else if (typeof sidRaw === 'object' && sidRaw !== null) sid = sidRaw.id || sidRaw.servico_id || sidRaw.uuid || null;
            }

            // Prefer looking up the service name from loaded `serviceNames` map
            let name = sid ? serviceNames[String(sid)] : undefined;
            // fallbacks: explicit servico_nome in payload, nested object with name, or ordem descricao
            if (!name) name = first.servico_nome || (typeof first.servico === 'object' && first.servico?.nome) || os.descricao || '';
            map[String(os.id)] = name || '';
          } else {
            map[String(os.id)] = os.descricao || '';
          }
        } catch (e) {
          map[String(os.id)] = os.descricao || '';
        }
      });
      setPlannedNamesByOs(map);
    } catch (e) { /* ignore */ }
  }, [ordens, serviceNames]);

  // após carregar ordens, carregar componentes vinculados aos equipamentos (para exibir código+nome)
  useEffect(() => {
    (async () => {
      try {
        const equipIds = Array.from(new Set((ordens || []).map((o: any) => o.equipamento_id).filter(Boolean)));
        if (equipIds.length === 0) { setEquipmentComponentsMap({}); return; }
        const { data } = await supabase.from('equipamentos_componentes').select('equipamento_id, quantidade_usada, componentes(id, nome, codigo_interno)').in('equipamento_id', equipIds as any[]);
        const map: Record<string, any[]> = {};
        (data || []).forEach((row: any) => {
          const comp = { id: row.componentes?.id, nome: row.componentes?.nome, codigo_interno: row.componentes?.codigo_interno, quantidade_usada: row.quantidade_usada };
          map[String(row.equipamento_id)] = map[String(row.equipamento_id)] || [];
          map[String(row.equipamento_id)].push(comp);
        });
        setEquipmentComponentsMap(map);
      } catch (e) {
        console.warn('Erro ao carregar componentes por equipamento', e);
      }
    })();
  }, [ordens]);

  // agrupar ordens por equipe (usar nome da equipe quando disponível)
  const grouped = filteredOrdens.reduce((acc: Record<string, any[]>, os) => {
    let equipeName = 'Sem Equipe';
    if (os.equipe_id) equipeName = equipesMap[String(os.equipe_id)] || 'Sem Equipe';
    else {
      try {
        const obs = os.observacoes ? JSON.parse(os.observacoes) : null;
        const ps = obs?.planned_services || [];
        if (ps && ps.length > 0 && ps[0].equipe_id) {
          equipeName = equipesMap[String(ps[0].equipe_id)] || 'Sem Equipe';
        }
      } catch (e) { /* ignore */ }
    }
    const key = equipeName || 'Sem Equipe';
    if (!acc[key]) acc[key] = [];
    acc[key].push(os);
    return acc;
  }, {} as Record<string, any[]>);

  const formatNumeroOs = (raw: string) => {
    if (!raw) return '000000';
    // extrair somente dígitos
    const digits = (raw || '').toString().replace(/\D/g, '');
    const last = digits.slice(-6);
    return last.padStart(6, '0');
  };

  const handleStartOs = (os: OrdemServico) => {
    setStartOs(os);
    setStartModalOpen(true);
  };

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

  // Forçar exibição do botão Iniciar durante testes locais ou com ?forceStart=1
  const showStartButtonGlobally = (() => {
    try {
      if (typeof window === 'undefined') return false;
      const params = new URLSearchParams(window.location.search);
      if (params.get('forceStart') === '1') return true;
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return true;
      return false;
    } catch (e) { return false; }
  })();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-900'} transition-colors duration-300`}>
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

          {/* debug card removed */}

          {/* Filtros */}
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 mb-6 shadow-lg`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <i className={`ri-search-line absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                <input
                  type="text"
                  placeholder="Buscar por número, título ou serviço..."
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

          {!loading && filteredOrdens.length > 0 && (
            <div>
              {Object.keys(grouped).map((team) => (
                <div key={team} className="w-full mb-6">
                  <h2 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{team}</h2>
                  <div className="overflow-x-auto bg-transparent rounded">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="text-left text-sm text-gray-400">
                          <th className="px-3 py-2">Iniciar</th>
                          <th className="px-3 py-2">Nº</th>
                          <th className="px-3 py-2">IND / Equipamento</th>
                          <th className="px-3 py-2">Serviço planejado</th>
                          <th className="px-3 py-2">Início</th>
                          <th className="px-3 py-2">Equipe</th>
                        </tr>
                      </thead>
                      <tbody className="bg-transparent">
                        {grouped[team].map((os: any) => {
                          let plannedServiceName = '';
                          try {
                            const obs = os.observacoes ? JSON.parse(os.observacoes) : null;
                            const ps = obs?.planned_services || [];
                            if (ps && ps.length > 0) {
                              const first = ps[0];
                              const sid = first.servico_id || (first.servico && (first.servico.id || first.servico));
                              const name = sid ? (serviceNames[String(sid)] || sid) : (first.servico_nome || (first.servico && first.servico.nome) || 'Serviço');
                              plannedServiceName = ps.length > 1 ? `${name} (+${ps.length - 1} serviço(s))` : name;
                            } else {
                              plannedServiceName = plannedNamesByOs[String(os.id)] || os.descricao || '';
                            }
                          } catch (e) {
                            plannedServiceName = plannedNamesByOs[String(os.id)] || os.descricao || '';
                          }
                          const equipeMeta = equipesMeta[String(os.equipe_id)] || null;
                          return (
                            <tr key={os.id} className={`${darkMode ? 'bg-slate-800 border-b border-slate-700' : ''}`}>
                              <td className="px-3 py-3 align-top">
                                <div className="flex flex-col gap-2">
                                  {(canExecuteOS || showStartButtonGlobally) && (
                                    <button onClick={(e) => { e.stopPropagation(); handleStartOs(os); }} title="Iniciar" className="px-2 py-1 bg-green-600 text-white rounded text-sm">
                                      <i className="ri-play-line"></i>
                                    </button>
                                  )}
                                  <button onClick={(e) => { e.stopPropagation(); handleEdit(os.id); }} title="Editar" className="px-2 py-1 bg-blue-600 text-white rounded text-sm">
                                    <i className="ri-pencil-line"></i>
                                  </button>
                                </div>
                              </td>
                              <td className="px-3 py-3 align-top">#{formatNumeroOs(os.numero_os)}</td>
                              <td className="px-3 py-3 align-top">
                                <div className="text-sm font-medium">{os.equipamentos?.codigo_interno || '-'}</div>
                                <div className="text-sm text-gray-400">{os.equipamentos?.nome || ''}</div>
                              </td>
                              <td className="px-3 py-3 align-top text-sm">
                            <div className="flex items-center gap-2">
                              <div>{plannedServiceName || 'Serviço não informado'}</div>
                              {(() => {
                                try {
                                  const obs = os.observacoes ? JSON.parse(os.observacoes) : null;
                                  const ps = obs?.planned_services || [];
                                  const anyStarted = ps.some((p: any) => {
                                    if (!p?.iniciado_em) return false;
                                    const parsed = Date.parse(String(p.iniciado_em));
                                    return !isNaN(parsed) && isFinite(parsed);
                                  });
                                  if (anyStarted) return <div className="inline-block px-2 py-0.5 text-xs rounded bg-green-600 text-white">Em andamento</div>;
                                } catch (e) { /* ignore */ }
                                return null;
                              })()}
                            </div>
                          </td>
                              <td className="px-3 py-3 align-top text-sm">{os.data_inicio ? new Date(os.data_inicio).toLocaleString() : 'Aguardando início'}</td>
                              <td className="px-3 py-3 align-top text-sm flex items-center gap-2">
                                {equipeMeta?.foto_url ? <img src={equipeMeta.foto_url} alt={equipeMeta.nome} className="w-8 h-8 rounded-full object-cover" /> : <i className="ri-group-line text-2xl text-gray-400" />}
                                <div>{equipesMap[String(os.equipe_id)] || 'Sem Equipe'}</div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
      <StartOsModal
        isOpen={startModalOpen}
        onClose={() => { setStartModalOpen(false); setStartOs(null); }}
        ordem={startOs}
        onStarted={() => { setStartModalOpen(false); setStartOs(null); loadOrdens(); }}
        darkMode={darkMode}
      />
    </div>
  );
}
