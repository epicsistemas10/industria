import React, { useState, useEffect } from 'react';
import { formatEquipamentoName } from '../../utils/format';
import EquipamentoName from '../../components/base/EquipamentoName';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';
import { equipamentosAPI } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';
import EquipamentoModal from '../../components/modals/EquipamentoModal';
// import ImportarEquipamentos from '../../components/ImportarEquipamentos';
import { useToast } from '../../hooks/useToast';

interface Equipamento {
  id: string;
  nome: string;
  setor?: string;
  criticidade: string;
  status_revisao: number;
  foto_url?: string;
  setores?: { nome: string };
  codigo_interno?: string;
  linha_setor?: string;
  subgrupo?: string;
}

export default function EquipamentosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreate, canDelete } = usePermissions();
  const { success, error: showError } = useToast();
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSetor, setFilterSetor] = useState('');
  const [filterCriticidade, setFilterCriticidade] = useState('');
  const [filterSubgrupo, setFilterSubgrupo] = useState('');
  const [filterLinha, setFilterLinha] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEquipamentoId, setSelectedEquipamentoId] = useState<string | undefined>();
  const [selectedEquipamentoData, setSelectedEquipamentoData] = useState<any | undefined>();
  const [darkMode, setDarkMode] = useState(true);
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceTargetEquipId, setServiceTargetEquipId] = useState<string | null>(null);
  const [equipamentoComponentesMap, setEquipamentoComponentesMap] = useState<Record<string, any[]>>({});

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
      // load componentes for these equipamentos
      try {
        const ids = (data || []).map((d: any) => d.id).filter(Boolean);
        if (ids.length) {
          const { data: comps } = await supabase
            .from('equipamentos_componentes')
            .select('equipamento_id, quantidade_usada, componentes(id, nome, codigo_interno, marca)')
            .in('equipamento_id', ids);
          const map: Record<string, any[]> = {};
          (comps || []).forEach((row: any) => {
            const eqId = row.equipamento_id;
            map[eqId] = map[eqId] || [];
            if (row.componentes) map[eqId].push({ ...row.componentes, quantidade_usada: row.quantidade_usada });
          });
          setEquipamentoComponentesMap(map);
        }
      } catch (err) {
        console.error('Erro ao carregar componentes por equipamento:', err);
      }
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
    const eq = equipamentos.find(e => e.id === id);
    setSelectedEquipamentoData(eq);
    setSelectedEquipamentoId(id);
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedEquipamentoId(undefined);
    setSelectedEquipamentoData(undefined);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedEquipamentoId(undefined);
    setSelectedEquipamentoData(undefined);
  };

  const handleModalSuccess = () => {
    loadEquipamentos();
  };

  const q = searchTerm.trim().toLowerCase();
  const filteredEquipamentos = equipamentos.filter(eq => {
    const nome = eq.nome?.toLowerCase() || '';
    const codigo = (eq.codigo_interno || '').toLowerCase();
    const matchSearch = q === '' || nome.includes(q) || codigo.includes(q);
    const setorNome = eq.setores?.nome || eq.linha_setor || eq.setor || '';
    const matchSetor = !filterSetor || setorNome === filterSetor;
    const matchCriticidade = !filterCriticidade || eq.criticidade === filterCriticidade;
    const matchSubgrupo = !filterSubgrupo || (eq.subgrupo || '') === filterSubgrupo;
    const matchLinha = !filterLinha || (eq.linha_setor || 'Sem linha') === filterLinha;
    return matchSearch && matchSetor && matchCriticidade && matchSubgrupo && matchLinha;
  });

  // Agrupar por subgrupo -> linha e ordenar itens por `numero` (numéricos primeiro) e depois por `nome`
  const grouped = filteredEquipamentos.reduce((acc: Record<string, Record<string, Equipamento[]>> , eq) => {
    const sg = (eq.subgrupo || '') as string;
    const ln = (eq.linha_setor || 'Sem linha') as string;
    if (!acc[sg]) acc[sg] = {};
    if (!acc[sg][ln]) acc[sg][ln] = [];
    acc[sg][ln].push(eq);
    return acc;
  }, {});

  // Ordena cada lista dentro do grupo: equipamentos com `numero` aparecem primeiro em ordem asc,
  // depois os sem `numero` ordenados por `nome`.
  Object.values(grouped).forEach(linhasMap => {
    Object.values(linhasMap).forEach((items) => {
      // Ordenar por nome (alfabética) e, quando o nome for igual, ordenar por `numero`.
      // Equipamentos com `numero` aparecem primeiro para o mesmo nome, em ordem numérica.
      items.sort((a: any, b: any) => {
        const nameA = (a.nome || '').trim();
        const nameB = (b.nome || '').trim();
        const cmpName = nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
        if (cmpName !== 0) return cmpName;
        const na = a.numero;
        const nb = b.numero;
        const aHas = typeof na === 'number' && !Number.isNaN(na);
        const bHas = typeof nb === 'number' && !Number.isNaN(nb);
        if (aHas && bHas) return na - nb;
        if (aHas && !bHas) return -1; // a com numero primeiro
        if (!aHas && bHas) return 1; // b com numero primeiro
        // ambos sem numero: manter ordem por id para estabilidade
        return (a.id || '').localeCompare(b.id || '');
      });
    });
  });

  const setores = [...new Set(equipamentos.map(eq => eq.setores?.nome || eq.linha_setor || eq.setor).filter(Boolean))];
  const subgrupos = [...new Set(equipamentos.map(eq => eq.subgrupo || '').filter(Boolean))];
  const linhas = [...new Set(equipamentos.map(eq => eq.linha_setor || 'Sem linha').filter(Boolean))];
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
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />
      
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <i className={`ri-search-line absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                <input
                  type="text"
                  placeholder="Buscar equipamento ou IND..."
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
                value={filterSubgrupo}
                onChange={(e) => setFilterSubgrupo(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8`}
              >
                <option value="">Todos os Equipamentos</option>
                {subgrupos.map(sg => (
                  <option key={sg} value={sg}>{sg}</option>
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

              <select
                value={filterLinha}
                onChange={(e) => setFilterLinha(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8`}
              >
                <option value="">Todas as Linhas</option>
                {linhas.map(ln => (
                  <option key={ln} value={ln}>{ln}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Import button removed; import functionality moved to admin area if needed */}

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

          {/* Lista de Equipamentos (tabela) */}
          {!loading && !error && filteredEquipamentos.length > 0 && (
            <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-2 overflow-x-auto` }>
              <table className="w-full min-w-[800px]">
                <thead className={`${darkMode ? 'text-gray-300 bg-slate-900' : 'text-gray-700 bg-gray-50'}`}>
                  <tr>
                    <th className="text-left px-4 py-3">Foto</th>
                    <th className="text-left px-4 py-3">IND</th>
                    <th className="text-left px-4 py-3">Nome</th>
                    <th className="text-left px-4 py-3">Setor</th>
                    <th className="text-left px-4 py-3">Linha</th>
                    <th className="text-left px-4 py-3">Progresso</th>
                    <th className="text-left px-4 py-3">Ações</th>
                  </tr>
                </thead>
                    {Object.entries(grouped).map(([subgrupo, linhas]) => (
                      <tbody key={`group-${subgrupo}`}>
                        <tr className={`${darkMode ? 'bg-slate-900' : 'bg-gray-100'}`}>
                          <td colSpan={7} className="px-4 py-2 font-semibold">{subgrupo}</td>
                        </tr>
                    {Object.entries(linhas).map(([linha, items]) => (
                      <React.Fragment key={`ln-${subgrupo}-${linha}`}>
                            <tr className={`${darkMode ? 'bg-slate-800/60' : 'bg-gray-50'}`}>
                              <td colSpan={7} className="px-6 py-1 text-sm text-gray-400">Linha: {linha}</td>
                            </tr>
                        {items.map(equipamento => (
                          <tr key={equipamento.id} className={`${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition-colors`}>
                            <td className="px-4 py-3">
                              {equipamento.foto_url ? (
                                <img src={equipamento.foto_url} alt={equipamento.nome} className="w-12 h-12 object-cover rounded" />
                              ) : (
                                <div className="w-12 h-12 rounded bg-slate-700 flex items-center justify-center text-white"><i className="ri-tools-line"></i></div>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              {equipamento.codigo_interno ? (
                                <div className={`inline-block px-2 py-0.5 text-xs rounded-full ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-800'}`}>{equipamento.codigo_interno}</div>
                              ) : <span className="text-sm text-gray-400">-</span>}
                            </td>

                            <td className="px-4 py-3">
                              <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}><EquipamentoName equipamento={equipamento} className="" numberClassName="text-amber-300" /></div>
                              <div className={`text-sm ${getCriticidadeColor(equipamento.criticidade)}`}>{equipamento.criticidade || ''}</div>
                            </td>

                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-900'}`}>{equipamento.setores?.nome || equipamento.setor || 'Sem setor'}</td>
                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-900'}`}>{equipamento.linha_setor || '-'}</td>
                            <td className="px-4 py-3 w-56">
                              <div className="flex items-center gap-3">
                                <div className="w-full rounded-full h-2 bg-slate-700">
                                  <div className={`h-2 rounded-full ${getStatusColor(equipamento.status_revisao || 0)}`} style={{ width: `${equipamento.status_revisao || 0}%` }}></div>
                                </div>
                                <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ minWidth: 36 }}>{equipamento.status_revisao || 0}%</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => navigate(`/equipamento/${equipamento.id}`)} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Ver</button>
                                <button onClick={(e) => { e.stopPropagation(); setServiceTargetEquipId(equipamento.id); setServiceName(''); setServiceDesc(''); setShowServiceModal(true); }} className="px-2 py-1 bg-emerald-600 text-white rounded text-sm">+</button>
                                <button onClick={(e) => { e.stopPropagation(); handleEdit(equipamento.id); }} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">✎</button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(equipamento.id); }} className="px-2 py-1 bg-red-600 text-white rounded text-sm">🗑</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                ))}
              </table>
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
        initialData={selectedEquipamentoData}
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
