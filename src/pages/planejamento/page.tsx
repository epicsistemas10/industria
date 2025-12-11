import { useState, useEffect } from 'react';
import { formatEquipamentoName } from '../../utils/format';
import EquipamentoName from '../../components/base/EquipamentoName';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';
import { supabase } from '../../lib/supabase';
import { planejamentoAPI } from '../../lib/api';

interface Servico {
  id: string;
  nome: string;
  percentual_revisao: number;
}

interface Equipamento {
  id: string;
  nome: string;
  servicos?: Servico[];
}

interface Equipe {
  id: string;
  nome: string;
}

interface AtividadePlanejada {
  id: string;
  equipamento_id: string;
  equipamento_nome: string;
  servico_id: string;
  servico_nome: string;
  equipe_id: string;
  equipe_nome: string;
  dia_semana: number;
  concluido: boolean;
  observacoes?: string;
  has_os?: boolean;
}

export default function PlanejamentoPage() {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [atividades, setAtividades] = useState<AtividadePlanejada[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [equipLineFilter, setEquipLineFilter] = useState<'all' | 'linha1' | 'linha2' | 'iba'>('all');
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [semanaAtual, setSemanaAtual] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<number>(1);
  const [formData, setFormData] = useState({
    equipamento_id: '',
    servico_ids: [] as string[],
    equipe_id: '',
    observacoes: ''
  });
  const [existingServiceIds, setExistingServiceIds] = useState<Set<string>>(new Set());

  const diasSemana = [
    { numero: 1, nome: 'Segunda-feira', abrev: 'SEG' },
    { numero: 2, nome: 'Terça-feira', abrev: 'TER' },
    { numero: 3, nome: 'Quarta-feira', abrev: 'QUA' },
    { numero: 4, nome: 'Quinta-feira', abrev: 'QUI' },
    { numero: 5, nome: 'Sexta-feira', abrev: 'SEX' },
    { numero: 6, nome: 'Sábado', abrev: 'SÁB' }
  ];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    loadData();
  }, [semanaAtual]);

  // when equipamento selection changes, load open OS for that equipamento
  useEffect(() => {
    const loadExisting = async () => {
      setExistingServiceIds(new Set());
      if (!formData.equipamento_id) return;
      try {
        const { data: osData, error: osErr } = await supabase
          .from('ordens_servico')
          .select('observacoes, status')
          .eq('equipamento_id', formData.equipamento_id);
        if (osErr) {
          console.warn('Erro ao buscar OS para equipamento:', osErr);
          return;
        }
        const set = new Set<string>();
        for (const osRow of osData || []) {
          const st = (osRow.status || '').toString().toLowerCase();
          if (st.includes('conclu') || st.includes('cancel')) continue;
          if (!osRow.observacoes) continue;
          try {
            const parsed = JSON.parse(osRow.observacoes);
            const planned = parsed?.planned_services || [];
            for (const p of planned) {
              if (p && (p.servico_id || p.servico)) set.add(String(p.servico_id || p.servico));
            }
          } catch (e) {
            // ignore
          }
        }
        setExistingServiceIds(set);
      } catch (e) {
        console.warn('Erro ao carregar OS existentes para equipamento:', e);
      }
    };
    loadExisting();
  }, [formData.equipamento_id]);

  const loadData = async () => {
    await Promise.all([
      loadEquipamentos(),
      loadEquipes(),
      loadAtividades()
    ]);
  };

  const loadEquipamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          id,
          nome,
          ind,
          linha_setor,
          linha,
          linha1,
          linha2,
          iba,
          equipamento_servicos (
            id,
            nome,
            percentual_revisao,
            ordem
          )
        `)
        .order('nome');

      console.log('loadEquipamentos response - error:', error, 'data length:', data?.length ?? 0);

      if (!error && data) {
        const mapped = data.map((eq: any) => ({
          id: eq.id,
          nome: eq.nome,
          ind: eq.ind || eq.codigo_interno || eq.codigoInterno,
          codigo_interno: eq.codigo_interno || eq.codigoInterno,
          linha_setor: eq.linha_setor || eq.linha || eq.linha1 || '',
          linha1: eq.linha1,
          linha2: eq.linha2,
          iba: eq.iba,
          servicos: (eq.equipamento_servicos || [])
            .slice()
            .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0))
            .map((s: any) => ({ id: s.id, nome: s.nome, percentual_revisao: s.percentual_revisao }))
        }));

        console.log('mapped equipamentos:', mapped.length, mapped.slice(0, 5));
        console.log('mapped equipamentos sample JSON:', JSON.stringify(mapped.slice(0,5), null, 2));
        setEquipamentos(mapped);
      } else {
        console.error('Supabase error loading equipamentos:', error);

        // Fallback: try a more permissive select in case some columns do not exist
        try {
          const fallback = await supabase
            .from('equipamentos')
            .select('*, equipamento_servicos(*)')
            .order('nome');

          console.log('loadEquipamentos fallback - error:', fallback.error, 'data length:', fallback.data?.length ?? 0);

          if (!fallback.error && fallback.data) {
            const mappedFb = fallback.data.map((eq: any) => ({
              id: eq.id,
              nome: eq.nome,
              ind: eq.ind,
              codigo_interno: eq.codigo_interno || eq.codigoInterno,
              linha_setor: eq.linha_setor || eq.linha || eq.linha1 || '',
              linha1: eq.linha1,
              linha2: eq.linha2,
              iba: eq.iba,
              servicos: (eq.equipamento_servicos || [])
                .slice()
                .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0))
                .map((s: any) => ({ id: s.id, nome: s.nome, percentual_revisao: s.percentual_revisao }))
            }));

            console.log('mapped equipamentos (fallback):', mappedFb.length, mappedFb.slice(0, 5));
            console.log('mapped equipamentos (fallback) sample fields:', mappedFb.slice(0,5).map((e:any)=>({ id: e.id, nome: e.nome, ind: e.ind, codigo_interno: e.codigo_interno || e.codigoInterno })));
            console.log('mapped equipamentos (fallback) JSON:', JSON.stringify(mappedFb.slice(0,5), null, 2));
            setEquipamentos(mappedFb);
          } else {
            console.error('Fallback also failed loading equipamentos:', fallback.error);
          }
        } catch (fbErr) {
          console.error('Erro no fallback loadEquipamentos:', fbErr);
        }
      }
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

      if (!error && data) {
        setEquipes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar equipes:', error);
    }
  };

  const loadAtividades = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('planejamento_semana')
        .select(`
          *,
          equipamentos (nome),
          equipamento_servicos (nome),
          equipes (nome)
        `)
        .eq('semana', semanaAtual)
        .order('dia_semana', { ascending: true });

      if (!error && data) {
        // build base atividades
        const mapped = data.map(item => ({
          id: item.id,
          equipamento_id: item.equipamento_id,
          equipamento_nome: item.equipamentos?.nome || 'Sem equipamento',
          servico_id: item.servico_id,
          servico_nome: item.equipamento_servicos?.nome || 'Sem serviço',
          equipe_id: item.equipe_id,
          equipe_nome: item.equipes?.nome || 'Sem equipe',
          dia_semana: item.dia_semana,
          concluido: item.concluido || false,
          observacoes: item.observacoes,
          has_os: false
        }));

        // collect equipamento ids to check existing OS
        const equipamentoIds = Array.from(new Set(mapped.map((m: any) => m.equipamento_id).filter(Boolean)));
        if (equipamentoIds.length) {
          try {
            const { data: osData, error: osErr } = await supabase
              .from('ordens_servico')
              .select('equipamento_id, observacoes, status')
              .in('equipamento_id', equipamentoIds);
            if (!osErr && osData) {
              const osMap: Record<string, Set<string>> = {};
              for (const osRow of osData) {
                const st = (osRow.status || '').toString().toLowerCase();
                // only consider non-finalized OS
                if (st.includes('conclu') || st.includes('cancel')) continue;
                if (!osRow.observacoes) continue;
                try {
                  const parsed = JSON.parse(osRow.observacoes);
                  const planned = parsed?.planned_services || [];
                  for (const p of planned) {
                    const eq = String(osRow.equipamento_id);
                    osMap[eq] = osMap[eq] || new Set<string>();
                    if (p && (p.servico_id || p.servico)) osMap[eq].add(String(p.servico_id || p.servico));
                  }
                } catch (e) {
                  // ignore parse errors
                }
              }

              // mark mapped atividades
              mapped.forEach((m: any) => {
                const set = osMap[String(m.equipamento_id)];
                if (set && set.has(String(m.servico_id))) m.has_os = true;
              });
            }
          } catch (e) {
            console.warn('Erro ao verificar OS existentes para marcar atividades:', e);
          }
        }

        setAtividades(mapped);
      }
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiaClick = (dia: number) => {
    setDiaSelecionado(dia);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const computeWeekStart = (offsetWeeks: number) => {
        const now = new Date();
        // JS: 0=Sunday,1=Monday,... we consider Monday as week start
        const day = now.getDay();
        const diffToMonday = (day === 0 ? -6 : 1 - day);
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday + (offsetWeeks * 7));
        // return date in YYYY-MM-DD which maps to SQL date
        return monday.toISOString().slice(0, 10);
      };

      const computeWeekEnd = (offsetWeeks: number) => {
        // week end we'll treat as Saturday (Monday + 5 days)
        const start = new Date(computeWeekStart(offsetWeeks));
        const end = new Date(start);
        end.setDate(start.getDate() + 5);
        return end.toISOString().slice(0, 10);
      };

      const semana_inicio = computeWeekStart(semanaAtual);
      const semana_fim = computeWeekEnd(semanaAtual);

      // prepare one or more items depending on selected services
      const serviceIds = Array.isArray(formData.servico_ids) ? formData.servico_ids : [formData.servico_ids];
      const toInsert = serviceIds.map(sid => ({
        equipamento_id: formData.equipamento_id,
        servico_id: sid,
        equipe_id: formData.equipe_id,
        dia_semana: diaSelecionado,
        semana: semanaAtual,
        semana_inicio,
        semana_fim,
        status: 'planejado',
        concluido: false,
        observacoes: formData.observacoes,
        created_at: new Date().toISOString()
      }));

      const { data: inserted, error } = await supabase
        .from('planejamento_semana')
        .insert(toInsert)
        .select();

      if (error) throw error;

      // after items created, generate OS automatically grouped by equipamento
      try {
        const createdItems = (inserted || []).map((r: any) => ({ equipamento_id: r.equipamento_id, servico_id: r.servico_id, equipe_id: r.equipe_id, responsavel_id: r.responsavel_id }));
        if (createdItems.length) await planejamentoAPI.generateOsFromItems(createdItems);
      } catch (e) {
        console.error('Erro ao gerar OS automáticas:', e);
      }

      setShowModal(false);
      setFormData({
        equipamento_id: '',
        servico_ids: [],
        equipe_id: '',
        observacoes: ''
      });
      loadAtividades();
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      alert('Erro ao criar atividade. Verifique os dados e tente novamente.');
    }
  };

  const handleConcluir = async (id: string, concluido: boolean) => {
    try {
      const { error } = await supabase
        .from('planejamento_semana')
        .update({
          concluido: !concluido,
          data_conclusao: !concluido ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
      loadAtividades();
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta atividade?')) {
      try {
        const { error } = await supabase
          .from('planejamento_semana')
          .delete()
          .eq('id', id);

        if (error) throw error;
        loadAtividades();
      } catch (error) {
        console.error('Erro ao excluir atividade:', error);
      }
    }
  };

  const getAtividadesPorDia = (dia: number) => {
    return atividades.filter(a => a.dia_semana === dia);
  };

  const equipamentoSelecionado = equipamentos.find(eq => eq.id === formData.equipamento_id);
  const filteredEquipamentos = equipamentos.filter((eq: any) => {
    if (equipLineFilter === 'all') return true;
    const raw = ((eq.linha_setor || eq.linha || eq.linha1 || eq.linha2 || eq.iba) || '').toString().toLowerCase();
    if (equipLineFilter === 'iba') return raw.includes('iba');
    if (equipLineFilter === 'linha1') return raw.includes('linha 1') || raw.includes('linha1') || raw.includes('1');
    if (equipLineFilter === 'linha2') return raw.includes('linha 2') || raw.includes('linha2') || raw.includes('2');
    return true;
  });

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                📅 Planejamento Semanal
              </h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Organize as atividades de manutenção da semana
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    const resp = await supabase.from('planejamento_semana').select('*').eq('semana', semanaAtual);
                    if (resp.error) throw resp.error;
                    const rows = resp.data || [];
                    const items = rows.map((r: any) => ({ equipamento_id: r.equipamento_id, servico_id: r.servico_id, equipe_id: r.equipe_id, responsavel_id: r.responsavel }));
                    if (items.length === 0) {
                      alert('Nenhuma atividade encontrada para gerar OS nesta semana.');
                      return;
                    }
                    await planejamentoAPI.generateOsFromItems(items);
                    alert('OS geradas para as atividades desta semana.');
                    loadAtividades();
                  } catch (e) {
                    console.error('Erro ao gerar OS da semana:', e);
                    alert('Erro ao gerar OS da semana. Veja o console para detalhes.');
                  }
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all whitespace-nowrap cursor-pointer"
              >
                <i className="ri-file-list-3-line text-lg"></i>
                Gerar OS da Semana
              </button>
            </div>
          </div>

          {/* Seletor de Semana */}
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 mb-6 shadow-lg`}>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSemanaAtual(semanaAtual - 1)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} transition-all cursor-pointer`}
              >
                <i className="ri-arrow-left-line"></i>
                Semana Anterior
              </button>
              
              <div className="text-center">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Semana {semanaAtual === 0 ? 'Atual' : semanaAtual > 0 ? `+${semanaAtual}` : semanaAtual}
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {atividades.length} atividades planejadas
                </p>
              </div>
              
              <button
                onClick={() => setSemanaAtual(semanaAtual + 1)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} transition-all cursor-pointer`}
              >
                Próxima Semana
                <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          </div>

          {/* Grid de Dias da Semana */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {diasSemana.map((dia) => {
                const atividadesDia = getAtividadesPorDia(dia.numero);
                const concluidasDia = atividadesDia.filter(a => a.concluido).length;
                
                return (
                  <div
                    key={dia.numero}
                    className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden`}
                  >
                    {/* Header do Dia */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-bold text-lg">{dia.nome}</h3>
                          <p className="text-blue-100 text-sm">
                            {atividadesDia.length} atividade{atividadesDia.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDiaClick(dia.numero)}
                          className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                        >
                          <i className="ri-add-line text-white text-2xl"></i>
                        </button>
                      </div>
                      
                      {/* Progresso do Dia */}
                      {atividadesDia.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-blue-100 mb-1">
                            <span>Progresso</span>
                            <span>{Math.round((concluidasDia / atividadesDia.length) * 100)}%</span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div
                              className="bg-white rounded-full h-2 transition-all"
                              style={{ width: `${(concluidasDia / atividadesDia.length) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lista de Atividades */}
                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                      {atividadesDia.length === 0 ? (
                        <div className="text-center py-8">
                          <i className={`ri-calendar-line text-4xl mb-2 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
                          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Nenhuma atividade planejada
                          </p>
                        </div>
                      ) : (
                        atividadesDia.map((atividade) => (
                          <div
                            key={atividade.id}
                            className={`p-3 rounded-lg border ${
                              atividade.concluido
                                ? darkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
                                : darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => handleConcluir(atividade.id, atividade.concluido)}
                                className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                                  atividade.concluido
                                    ? 'bg-green-500 border-green-500'
                                    : darkMode ? 'border-gray-500 hover:border-green-500' : 'border-gray-300 hover:border-green-500'
                                }`}
                              >
                                {atividade.concluido && (
                                  <i className="ri-check-line text-white text-xs"></i>
                                )}
                              </button>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-semibold text-sm mb-1 ${
                                  atividade.concluido
                                    ? darkMode ? 'text-green-400 line-through' : 'text-green-600 line-through'
                                    : darkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  <EquipamentoName equipamento={atividade.equipamento_nome} numberClassName="text-amber-300" />
                                </h4>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    🔧 {atividade.servico_nome}
                                  </p>
                                  {atividade.has_os && (
                                    <span className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800/40 dark:text-yellow-200">
                                      <i className="ri-link-m" />
                                      OS vinculada
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  👥 {atividade.equipe_nome}
                                </p>
                              </div>
                              
                              <button
                                onClick={() => handleDelete(atividade.id)}
                                className={`p-1 rounded hover:bg-red-500/20 transition-all cursor-pointer`}
                              >
                                <i className="ri-delete-bin-line text-red-400 text-sm"></i>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal Nova Atividade */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Nova Atividade - {diasSemana.find(d => d.numero === diaSelecionado)?.nome}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition-all cursor-pointer`}
              >
                <i className={`ri-close-line text-2xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Equipamento
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => { setEquipLineFilter('all'); setFormData({ ...formData, equipamento_id: '', servico_ids: [] }); }}
                    className={`px-3 py-1 rounded-lg text-sm ${equipLineFilter === 'all' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEquipLineFilter('linha1'); setFormData({ ...formData, equipamento_id: '', servico_ids: [] }); }}
                    className={`px-3 py-1 rounded-lg text-sm ${equipLineFilter === 'linha1' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Linha 1
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEquipLineFilter('linha2'); setFormData({ ...formData, equipamento_id: '', servico_ids: [] }); }}
                    className={`px-3 py-1 rounded-lg text-sm ${equipLineFilter === 'linha2' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Linha 2
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEquipLineFilter('iba'); setFormData({ ...formData, equipamento_id: '', servico_ids: [] }); }}
                    className={`px-3 py-1 rounded-lg text-sm ${equipLineFilter === 'iba' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                  >
                    IBA
                  </button>
                </div>
                <select
                  value={formData.equipamento_id}
                  onChange={(e) => setFormData({ ...formData, equipamento_id: e.target.value, servico_ids: [] })}
                  className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 outline-none pr-8`}
                  required
                >
                  <option value="">Selecione um equipamento</option>
                  {filteredEquipamentos.map((eq: any) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.ind || eq.codigo_interno || eq.codigoInterno ? `[${eq.ind || eq.codigo_interno || eq.codigoInterno}] ${eq.nome}` : formatEquipamentoName(eq)}
                    </option>
                  ))}
                </select>
              </div>

              {equipamentoSelecionado && equipamentoSelecionado.servicos && equipamentoSelecionado.servicos.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Serviço
                  </label>
                  <select
                    value={formData.servico_id}
                    onChange={(e) => setFormData({ ...formData, servico_id: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 outline-none pr-8`}
                    required
                  >
                    <option value="">Selecione um serviço</option>
                    {equipamentoSelecionado.servicos.map(servico => (
                      <option key={servico.id} value={servico.id}>
                        {servico.nome} ({servico.percentual_revisao}% da revisão)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {equipamentoSelecionado && equipamentoSelecionado.servicos && equipamentoSelecionado.servicos.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Serviços (marque um ou mais)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {equipamentoSelecionado.servicos.map((servico: any) => {
                      const checked = formData.servico_ids.includes(servico.id);
                      const hasOs = existingServiceIds.has(String(servico.id));
                      return (
                        <label key={servico.id} className={`flex items-center gap-2 p-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(formData.servico_ids || []);
                              if (e.target.checked) next.add(servico.id);
                              else next.delete(servico.id);
                              setFormData({ ...formData, servico_ids: Array.from(next) });
                            }}
                            className="w-4 h-4"
                          />
                          <div className="flex-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{servico.nome}</span>
                              <span className="text-xs text-gray-500">({servico.percentual_revisao}% da revisão)</span>
                              {hasOs && (
                                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800/40 dark:text-yellow-200 text-xs">
                                  <i className="ri-link-m" />
                                  OS vinculada
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Observações (opcional)
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 outline-none`}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`flex-1 px-6 py-3 rounded-lg border ${darkMode ? 'border-slate-600 text-gray-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} transition-all whitespace-nowrap cursor-pointer`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!formData.equipamento_id || !formData.servico_id || !formData.equipe_id}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar Atividade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
