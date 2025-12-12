import React, { useState, useEffect } from 'react';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';
import { usePecas } from '../../hooks/usePecas';
import useSuprimentos from '../../hooks/useSuprimentos';
import { supabase } from '../../lib/supabase';
import PecaModal from '../../components/modals/PecaModal';
import { useToast } from '../../hooks/useToast';
import ImportarPlanilhaPecas from '../../components/ImportarPlanilhaPecas';
import ImportarEstoque from '../../components/ImportarEstoque';
import rawGroupMapping from '../../data/group-mapping.json';

export default function PecasPage() {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);
  const { data: pecas, loading, fetch, create, update, remove, upsertLocal } = usePecas();
  const [dbTotalCount, setDbTotalCount] = useState<number | null>(null);
  const { data: suprimentosData, copyFromPeca } = useSuprimentos();
  const [showPecaModal, setShowPecaModal] = useState(false);
  const [selectedPecaId, setSelectedPecaId] = useState<string | undefined>();
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [colFilters, setColFilters] = useState({ nome: '', codigo: '', unidade: '', quantidadeMin: '', valorUnitMin: '' });
  const [deletingAll, setDeletingAll] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'min' | 'below' | 'zero'>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const { success, error: showError } = useToast();

  const handleEdit = (id: string) => {
    setSelectedPecaId(id);
    setShowPecaModal(true);
  };

  const handleDelete = async (id: string) => {
    // require password confirmation before deleting a piece (TV/kiosk safety)
    const pass = prompt('Informe a senha para confirmar exclusão da peça:');
    if (pass !== '123456') { alert('Senha incorreta. Exclusão cancelada.'); return; }
    if (!confirm('Remover peça?')) return;
    try {
      await remove(id);
      await fetch();
      success('Peça removida');
    } catch (err) {
      console.error(err);
      showError('Erro ao remover peça');
    }
  };

  useEffect(() => {
    const handler = (e: any) => {
      const id = e?.detail?.id;
      if (id) {
        setSelectedPecaId(id);
        setShowPecaModal(true);
      }
    };
    document.addEventListener('pecas-open-from-global', handler as EventListener);
    // listen for global requests to refresh peças list
    const refreshHandler = () => { console.info('PecasPage: pecas-refresh received, fetching...'); fetch(); };
    document.addEventListener('pecas-refresh', refreshHandler as EventListener);
    // handle focus requests: set search term to code and fetch to surface the existing item
    const focusHandler = async (e: any) => {
      try {
        const id = e?.detail?.id;
        const codigo = e?.detail?.codigo;
        console.info('PecasPage: pecas-focus received, id=', id, 'codigo=', codigo);
        // reset filters that could hide the item
        setFilterMode('all');
        setColFilters({ nome: '', codigo: '', unidade: '', quantidadeMin: '', valorUnitMin: '' });
        // fetch and inspect returned rows to ensure the item is present
        const returned = await fetch();
        const lowerCodigo = codigo ? String(codigo).trim().toLowerCase() : null;
        const found = (returned || []).find((r: any) => {
          const candidates = [r.nome, r.codigo_interno, r.codigo_fabricante, r.codigo_produto];
          return lowerCodigo && candidates.some((c: any) => (c || '').toString().toLowerCase().includes(lowerCodigo));
        });
        if (lowerCodigo) setSearchTerm(String(codigo));
        if (found) {
          const key = found.grupo_produto || 'Sem Grupo';
          // expand the group so the item is visible
          setCollapsedGroups(prev => ({ ...prev, [key]: false }));
          console.info('PecasPage: pecas-focus found item id=', found.id, 'grupo=', key);
        } else {
          console.info('PecasPage: pecas-focus did not find item after fetch — trying direct DB lookup');
          try {
            // do a direct lookup to bypass client-side pagination limits
            const code = codigo ? String(codigo).trim() : '';
            if (code) {
              // try equality on common code fields and ilike on name
              // include 'produto' (schema uses 'produto' column) as well as 'nome'
              const orQuery = `codigo_produto.eq.${code},codigo_interno.eq.${code},codigo_fabricante.eq.${code},nome.ilike.%${code}%,produto.ilike.%${code}%`;
              const { data: directRows, error: directErr } = await supabase.from('pecas').select('*').or(orQuery).limit(1);
                console.info('PecasPage: pecas-focus direct lookup query=', orQuery, 'error=', directErr);
                console.info('PecasPage: pecas-focus direct lookup returned rows=', Array.isArray(directRows) ? directRows.length : directRows);
                if (!directErr && Array.isArray(directRows) && directRows.length > 0) {
                  const df = directRows[0];
                  console.info('PecasPage: pecas-focus direct lookup found id=', df.id);
                // inject into local cache so it appears in the list despite pagination
                try { upsertLocal(df); } catch (e) { /* ignore */ }
                setSearchTerm(String(code));
                setSelectedPecaId(df.id);
                setShowPecaModal(true);
                const key2 = df.grupo_produto || 'Sem Grupo';
                setCollapsedGroups(prev => ({ ...prev, [key2]: false }));
              } else {
                console.info('PecasPage: pecas-focus direct lookup did not find anything', directErr);
              }
            }
          } catch (e) {
            console.warn('PecasPage: error during direct lookup', e);
          }
        }
      } catch (err) {
        console.warn('PecasPage: pecas-focus handler error', err);
      }
    };
    document.addEventListener('pecas-focus', focusHandler as EventListener);
    return () => {
      document.removeEventListener('pecas-open-from-global', handler as EventListener);
      document.removeEventListener('pecas-refresh', refreshHandler as EventListener);
      document.removeEventListener('pecas-focus', focusHandler as EventListener);
    };
  }, []);

  // keep an accurate total count from the DB (PostgREST exact count)
  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        const { count, error } = await supabase.from('pecas').select('id', { count: 'exact' }).range(0, 0);
        if (!error && mounted) setDbTotalCount(count ?? null);
      } catch (e) {
        // ignore
      }
    };
    // fetch when loading completes (after usePecas' fetch)
    if (!loading) fetchCount();
    return () => { mounted = false; };
  }, [loading]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Peças</h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Gerencie peças do estoque</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setSelectedPecaId(undefined); setShowPecaModal(true); }}
                className="px-4 py-2 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all whitespace-nowrap text-sm"
              >
                <i className="ri-add-line mr-2"></i>
                Nova Peça
              </button>
              <a href="/pecas/suprimentos" className="px-4 py-2 h-10 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all whitespace-nowrap text-sm">Suprimentos</a>
              <button
                onClick={() => setShowImportPanel(v => !v)}
                className="px-4 py-2 h-10 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all whitespace-nowrap text-sm"
              >
                <i className="ri-file-upload-line mr-2"></i>
                Importar Estoque Diário
              </button>
            </div>
          </div>

          {showImportPanel && (
            <div className="mb-6">
              {/* New advanced stock importer (supports .xlsx and .csv). If you prefer the legacy importer, keep ImportarPlanilhaPecas. */}
              <ImportarEstoque onClose={() => setShowImportPanel(false)} onImported={() => fetch()} />
            </div>
          )}

          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              {(() => {
                const count = dbTotalCount != null ? dbTotalCount : (pecas || []).length;
                // helper to parse numeric values returned from Supabase (handle pt-BR formatted strings)
                const parseNumberLocale = (v: any): number => {
                  if (v === null || v === undefined) return 0;
                  if (typeof v === 'number') return v;
                  let s = String(v).trim();
                  if (s === '') return 0;
                  // remove non-breaking spaces
                  s = s.replace(/\u00A0/g, '');
                  // if contains comma as decimal separator and dot as thousand, normalize
                  if (s.indexOf(',') > -1 && s.indexOf('.') > -1) {
                    s = s.replace(/\./g, '').replace(/,/g, '.');
                  } else {
                    s = s.replace(/,/g, '.');
                  }
                  s = s.replace(/[^0-9.-]/g, '');
                  const n = parseFloat(s);
                  return Number.isFinite(n) ? n : 0;
                };

                const totalValue = (pecas || []).reduce((s: number, p: any) => {
                  const qtd = parseNumberLocale(p.saldo_estoque ?? p.quantidade ?? 0);
                  const unit = parseNumberLocale(p.valor_unitario ?? 0);
                  return s + (qtd * unit);
                }, 0);
                const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalValue);
                return (
                  <>
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total de produtos: <span className="font-semibold">{count}</span></div>
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Valor total em estoque: <span className="font-semibold">R$ {formatted}</span></div>
                  </>
                );
              })()}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por nome, código ou grupo" className="px-3 py-2 rounded border w-72" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setFilterMode(f => f === 'min' ? 'all' : 'min')} className={`px-4 py-2 h-10 text-sm rounded whitespace-nowrap ${filterMode === 'min' ? 'bg-amber-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Mínimo</button>
                <button onClick={() => setFilterMode(f => f === 'below' ? 'all' : 'below')} className={`px-4 py-2 h-10 text-sm rounded whitespace-nowrap ${filterMode === 'below' ? 'bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Abaixo do Mínimo</button>
                <button onClick={() => setFilterMode(f => f === 'zero' ? 'all' : 'zero')} className={`px-4 py-2 h-10 text-sm rounded whitespace-nowrap ${filterMode === 'zero' ? 'bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Zerados</button>
              </div>
              <button onClick={() => { setSearchTerm(''); setColFilters({ nome: '', codigo: '', unidade: '', quantidadeMin: '', valorUnitMin: '' }); setFilterMode('all'); }} className="px-4 py-2 h-10 bg-gray-200 text-sm rounded hover:bg-gray-300 transition">Limpar filtros</button>
              <button onClick={async () => {
                setDeletingAll(true);
                // require password confirmation for bulk delete
                const pass = prompt('Informe a senha para confirmar exclusão de todas as peças:');
                if (pass !== '123456') { alert('Senha incorreta. Exclusão cancelada.'); setDeletingAll(false); return; }
                try {
                  const { data: rows, error: fetchErr } = await supabase.from('pecas').select('id').range(0, 19999);
                  if (fetchErr) {
                    console.error('Erro ao buscar ids das peças antes de deletar:', fetchErr);
                    showError('Erro ao buscar peças para exclusão');
                    return;
                  }
                  const ids = (rows || []).map((r: any) => r.id).filter(Boolean);
                  if (ids.length === 0) {
                    success('Nenhuma peça encontrada para remover');
                    await fetch();
                    return;
                  }

                  const chunkSize = 100;
                  let deletedCount = 0;
                  for (let i = 0; i < ids.length; i += chunkSize) {
                    const batch = ids.slice(i, i + chunkSize);
                    const { error: delErr } = await supabase.from('pecas').delete().in('id', batch);
                    if (delErr) {
                      console.error('Erro ao deletar lote de peças:', delErr, 'batchSize=', batch.length);
                      showError('Erro ao remover algumas peças. Veja o console para detalhes.');
                      break;
                    }
                    deletedCount += batch.length;
                  }

                  if (deletedCount > 0) {
                    success(`Removidas ${deletedCount} peças`);
                    await fetch();
                  }
                } catch (e: any) {
                  console.error('Erro ao deletar todas as peças:', e);
                  showError('Erro ao remover todas as peças');
                } finally {
                  setDeletingAll(false);
                }
              }} disabled={deletingAll} className={`px-4 py-2 h-10 text-sm rounded whitespace-nowrap ${deletingAll ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'} text-white transition`}>{deletingAll ? 'Removendo...' : 'Excluir tudo'}</button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && (pecas || []).length === 0 && (
            <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-12 text-center shadow-lg`}>
              <i className="ri-search-line text-6xl mb-4"></i>
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Nenhuma peça cadastrada</h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Crie a primeira peça usando o botão acima.</p>
            </div>
          )}

          {!loading && (pecas || []).length > 0 && (
            (() => {
              const term = searchTerm.trim().toLowerCase();
              const filtered = (pecas || []).filter((p: any) => {
                const grupo = (p.grupo || (p.observacoes ? (() => { try { const m = JSON.parse(p.observacoes); return m.grupo || ''; } catch { return ''; } })() : '') ) || '';
                // include codigo_produto in search (was missing, so codes saved in codigo_produto were hidden)
                const termOk = !term || (p.nome || '').toLowerCase().includes(term) || (p.codigo_interno || p.codigo_fabricante || p.codigo_produto || '').toLowerCase().includes(term) || (String(grupo) || '').toLowerCase().includes(term);

                const nomeFilter = (colFilters.nome || '').trim().toLowerCase();
                const codigoFilter = (colFilters.codigo || '').trim().toLowerCase();
                const quantidadeMin = colFilters.quantidadeMin ? Number(colFilters.quantidadeMin) : null;
                const valorUnitMin = colFilters.valorUnitMin ? Number(colFilters.valorUnitMin) : null;

                const nomeOk = !nomeFilter || (p.nome || '').toLowerCase().includes(nomeFilter);
                // allow filtering by codigo_produto as well
                const codigoOk = !codigoFilter || ( (p.codigo_interno || p.codigo_fabricante || p.codigo_produto || '') .toLowerCase().includes(codigoFilter) );
                const quantidadeOk = quantidadeMin == null || (Number(p.saldo_estoque) || 0) >= quantidadeMin;
                const valorUnitOk = valorUnitMin == null || (Number(p.valor_unitario) || 0) >= valorUnitMin;

                return termOk && nomeOk && codigoOk && quantidadeOk && valorUnitOk;
              });
              // Agrupar por grupo_produto (aplica filtro de modo se solicitado)
              const grouped: Record<string, any[]> = {};
              const sortedAll = filtered.slice().sort((a: any, b: any) => {
                const ga = (a.grupo_produto || 'zzzz').toString().toLowerCase();
                const gb = (b.grupo_produto || 'zzzz').toString().toLowerCase();
                if (ga < gb) return -1;
                if (ga > gb) return 1;
                // dentro do mesmo grupo, colocar quem tem estoque > 0 primeiro
                const aQtd = Number(a.saldo_estoque) || 0;
                const bQtd = Number(b.saldo_estoque) || 0;
                if ((aQtd === 0) !== (bQtd === 0)) return aQtd === 0 ? 1 : -1;
                // fallback: ordenar por nome
                return (a.nome || '').localeCompare(b.nome || '');
              });

              // aplica filtro de modo (todos / no minimo / abaixo do minimo)
              let modeFiltered = sortedAll;
              if (filterMode === 'min') {
                modeFiltered = sortedAll.filter((p: any) => {
                  const qtd = Number(p.saldo_estoque) || 0;
                  const min = p.estoque_minimo != null ? Number(p.estoque_minimo) : null;
                  return min != null && qtd === min;
                });
              } else if (filterMode === 'below') {
                modeFiltered = sortedAll.filter((p: any) => {
                  const qtd = Number(p.saldo_estoque) || 0;
                  const min = p.estoque_minimo != null ? Number(p.estoque_minimo) : null;
                  return min != null && qtd < min;
                });
              } else if (filterMode === 'zero') {
                modeFiltered = sortedAll.filter((p: any) => {
                  // include items with estoque_minimo === 0 or not determined (null/undefined)
                  const min = p.estoque_minimo != null ? Number(p.estoque_minimo) : null;
                  return min === 0 || min == null;
                });
              }

              for (const p of modeFiltered) {
                const key = p.grupo_produto || 'Sem Grupo';
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(p);
              }

              const groupKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

              return (
                <div className="overflow-x-auto bg-transparent rounded">
                  <table className={`min-w-full text-sm ${darkMode ? 'text-gray-100 bg-slate-900' : 'text-gray-900 bg-white'}`}>
                    <thead className={`${darkMode ? 'bg-slate-800 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
                      <tr>
                        <th className="px-4 py-2 text-left">Nome</th>
                        <th className="px-4 py-2 text-left">Código</th>
                        <th className="px-4 py-2 text-left">Unidade</th>
                        <th className="px-4 py-2 text-right">Quantidade</th>
                        <th className="px-4 py-2 text-right">Valor Unit.</th>
                        <th className="px-4 py-2 text-right">Valor Total</th>
                        <th className="px-4 py-2 text-right">Estoque Mínimo</th>
                        <th className="px-4 py-2 text-center">Alerta</th>
                        <th className="px-4 py-2 text-center">Ações</th>
                      </tr>
                      
                    </thead>
                    <tbody>
                      {groupKeys.map((g) => {
                        const isCollapsed = !!collapsedGroups[g];
                        // build a map from provided JSON mapping for display
                        const mappingArray: Array<{ codigo: string; grupo: string }> = Array.isArray(rawGroupMapping) ? rawGroupMapping : [];
                        const map: Record<string, string> = {};
                        mappingArray.forEach(m => { if (m && m.codigo && m.grupo) { map[String(m.codigo).trim()] = m.grupo; map[String(m.codigo).trim().replace(/^0+/, '')] = m.grupo; } });
                        const displayGroup = (g === 'Sem Grupo') ? g : (map[g] || map[g.replace(/^0+/, '')] || g);
                        return (
                          <React.Fragment key={g}>
                            <tr
                              key={`group-${g}`}
                              onClick={() => setCollapsedGroups(prev => ({ ...prev, [g]: !prev[g] }))}
                              className={`${darkMode ? 'bg-slate-700 text-gray-200' : 'bg-gray-100 text-gray-800'} font-semibold cursor-pointer`}
                            >
                              <td colSpan={8} className="px-4 py-2">
                                <div className="flex items-center justify-between">
                                  <span>
                                    {displayGroup}
                                    {grouped[g] && grouped[g].length > 0 ? (
                                      (() => {
                                        const groupTotal = grouped[g].reduce((s: number, p: any) => s + ((Number(p.saldo_estoque) || 0) * (Number(p.valor_unitario) || 0)), 0);
                                        const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(groupTotal);
                                        return (<span className="text-sm ml-3 opacity-80">— R$ {formatted}</span>);
                                      })()
                                    ) : null}
                                  </span>
                                  <span className="text-sm opacity-80">{isCollapsed ? '►' : '▼'}</span>
                                </div>
                              </td>
                            </tr>
                            {!isCollapsed && grouped[g].map((p: any) => {
                                const qtd = Number(p.saldo_estoque) || 0;
                                const unit = Number(p.valor_unitario) || 0;
                                const total = qtd * unit;
                                const fmtInt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
                                const fmtMoney = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              const min = p.estoque_minimo != null ? Number(p.estoque_minimo) : null;
                              const notDetermined = (p.estoque_minimo == null || Number(p.estoque_minimo) === 0) && qtd === 0;
                              const low = min != null && qtd < min;
                              return (
                                <tr key={p.id} className={`${(low || notDetermined) ? (darkMode ? 'bg-red-900/40' : 'bg-red-50') : ''} border-b`}>
                                  <td className="px-4 py-3">
                                        <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                          {p.nome}
                                          {((suprimentosData || []).some(s => String(s.peca_id) === String(p.id)) || ((p.codigo_produto || '') && (suprimentosData || []).some(s => String(s.codigo_produto) === String(p.codigo_produto)))) && (
                                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800/40 dark:text-yellow-200 text-xs">EM SUPRIMENTOS</span>
                                          )}
                                        </div>
                                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{p.codigo_interno || p.codigo_produto || p.codigo_fabricante || '-'}</div>
                                        </td>
                                    <td className="px-4 py-3">{p.codigo_produto || p.codigo_fabricante || '-'}</td>
                                  <td className="px-4 py-3">{p.unidade_medida || p.unidade || p.unidadeMedida || '-'}</td>
                                  <td className="px-4 py-3 text-right">{fmtInt.format(qtd)}</td>
                                  <td className="px-4 py-3 text-right">R$ {fmtMoney.format(unit)}</td>
                                  <td className="px-4 py-3 text-right">R$ {fmtMoney.format(total)}</td>
                                  <td className="px-4 py-3 text-right">{p.estoque_minimo != null ? Number(p.estoque_minimo) : '-'}</td>
                                  <td className="px-4 py-3 text-center">
                                    {notDetermined ? (
                                      <span className="inline-flex items-center gap-2 px-2 py-1 rounded animate-pulse bg-orange-600 text-white font-semibold">⚠ Sem mínimo</span>
                                    ) : (low ? (
                                      <span className="inline-flex items-center gap-2 px-2 py-1 rounded animate-pulse bg-red-600 text-white font-semibold">⚠ Abaixo</span>
                                    ) : (
                                      <span className="text-green-600">OK</span>
                                    ))}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button onClick={() => handleEdit(p.id)} className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center">
                                        <i className="ri-edit-line"></i>
                                      </button>
                                      {
                                        (() => {
                                          const existsByPeca = (suprimentosData || []).some(s => String(s.peca_id) === String(p.id));
                                          const existsByCode = (p.codigo_produto && (suprimentosData || []).some(s => String(s.codigo_produto) === String(p.codigo_produto)));
                                          const already = existsByPeca || existsByCode;
                                          return (
                                            <button
                                              onClick={async () => {
                                                if (already) return;
                                                try {
                                                  await copyFromPeca(p.id);
                                                  success('Copiado para Suprimentos');
                                                } catch (err) {
                                                  console.error('Erro ao copiar para suprimentos:', err);
                                                  showError('Erro ao copiar para Suprimentos');
                                                }
                                              }}
                                              disabled={already}
                                              className={`w-8 h-8 rounded flex items-center justify-center ${already ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-amber-600 text-white'}`}
                                              title={already ? 'Já presente em Suprimentos' : 'Copiar para Suprimentos'}
                                            >
                                              <i className="ri-file-copy-line"></i>
                                            </button>
                                          );
                                        })()
                                      }
                                      <button onClick={() => handleDelete(p.id)} className="w-8 h-8 bg-red-600 text-white rounded flex items-center justify-center">
                                        <i className="ri-delete-bin-line"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()
          )}

          <PecaModal isOpen={showPecaModal} onClose={() => setShowPecaModal(false)} onSuccess={async () => { await fetch(); setShowPecaModal(false); }} pecaId={selectedPecaId} />
        </main>
      </div>
    </div>
  );
}

// listen for external request to open a piece (dispatched by modal when duplicate found)
document.addEventListener('open-peca', (e: any) => {
  try {
    const id = e?.detail?.id;
    if (id) {
      // find the page component's open function via a custom event — we rely on the page being mounted
      const openEvent = new CustomEvent('pecas-open-from-global', { detail: { id } });
      document.dispatchEvent(openEvent);
    }
  } catch (err) {
    // ignore
  }
});
