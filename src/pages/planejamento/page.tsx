import { useState, useEffect } from 'react';
import { formatEquipamentoName } from '../../utils/format';
import EquipamentoName from '../../components/base/EquipamentoName';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';
import { supabase } from '../../lib/supabase';

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
    servico_id: '',
    equipe_id: '',
    observacoes: ''
  });

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
        setAtividades(data.map(item => ({
          id: item.id,
          equipamento_id: item.equipamento_id,
          equipamento_nome: item.equipamentos?.nome || 'Sem equipamento',
          servico_id: item.servico_id,
          servico_nome: item.equipamento_servicos?.nome || 'Sem serviço',
          equipe_id: item.equipe_id,
          equipe_nome: item.equipes?.nome || 'Sem equipe',
          dia_semana: item.dia_semana,
          concluido: item.concluido || false,
          observacoes: item.observacoes
        })));
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
      const { error } = await supabase
        .from('planejamento_semana')
        .insert([{
          equipamento_id: formData.equipamento_id,
          servico_id: formData.servico_id,
          equipe_id: formData.equipe_id,
          dia_semana: diaSelecionado,
          semana: semanaAtual,
          status: 'planejado',
          concluido: false,
          observacoes: formData.observacoes,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setShowModal(false);
      setFormData({
        equipamento_id: '',
        servico_id: '',
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
                                <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  🔧 {atividade.servico_nome}
                                </p>
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
                    onClick={() => { setEquipLineFilter('all'); setFormData({ ...formData, equipamento_id: '', servico_id: '' }); }}
                    className={`px-3 py-1 rounded-lg text-sm ${equipLineFilter === 'all' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEquipLineFilter('linha1'); setFormData({ ...formData, equipamento_id: '', servico_id: '' }); }}
                    className={`px-3 py-1 rounded-lg text-sm ${equipLineFilter === 'linha1' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Linha 1
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEquipLineFilter('linha2'); setFormData({ ...formData, equipamento_id: '', servico_id: '' }); }}
                    className={`px-3 py-1 rounded-lg text-sm ${equipLineFilter === 'linha2' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Linha 2
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEquipLineFilter('iba'); setFormData({ ...formData, equipamento_id: '', servico_id: '' }); }}
                    className={`px-3 py-1 rounded-lg text-sm ${equipLineFilter === 'iba' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                  >
                    IBA
                  </button>
                </div>
                <select
                  value={formData.equipamento_id}
                  onChange={(e) => setFormData({ ...formData, equipamento_id: e.target.value, servico_id: '' })}
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

              {equipamentoSelecionado && (!equipamentoSelecionado.servicos || equipamentoSelecionado.servicos.length === 0) && (
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    ⚠️ Este equipamento não possui serviços cadastrados. Cadastre os serviços na página de Equipamentos primeiro.
                  </p>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Equipe Responsável
                </label>
                <select
                  value={formData.equipe_id}
                  onChange={(e) => setFormData({ ...formData, equipe_id: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 outline-none pr-8`}
                  required
                >
                  <option value="">Selecione uma equipe</option>
                  {equipes.map(equipe => (
                    <option key={equipe.id} value={equipe.id}>{equipe.nome}</option>
                  ))}
                </select>
              </div>

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
