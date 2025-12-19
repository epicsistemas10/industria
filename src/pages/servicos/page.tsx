import { useEffect, useState, useRef } from 'react';
import { formatEquipamentoName } from '../../utils/format';
import EquipamentoName from '../../components/base/EquipamentoName';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import { useNavigate } from 'react-router-dom';
import useSidebar from '../../hooks/useSidebar';
import { servicosAPI } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { equipamentosAPI } from '../../lib/api';
import { CheckCircle, AlertTriangle, Percent, Settings, Factory } from 'lucide-react';


export default function ServicosPage() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [servicos, setServicos] = useState<any[]>([]);
  const [servicosQuery, setServicosQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ codigo: '', nome: '', descricao: '', percentual_revisao: '', categoria: '' });
  const tipos = ['Preventiva', 'Preditiva', 'Corretiva', 'Melhoria'];
  const [formTipo, setFormTipo] = useState<string>(tipos[0]);
  const defaultCategories = ['Mecânico','Lubrificação','Segurança','Transmissão','Estrutural','Elétrica','Automação','Ventilação','Fitas','Roscas','Pintura','Limpeza','Específico'];
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [showVincularModal, setShowVincularModal] = useState(false);
  const [selectedServId, setSelectedServId] = useState<string | null>(null);
  const [selectedEquipIds, setSelectedEquipIds] = useState<string[]>([]);
  const [showLinkedModal, setShowLinkedModal] = useState(false);
  const [linkedEquipamentos, setLinkedEquipamentos] = useState<any[]>([]);
  const [loadingLinked, setLoadingLinked] = useState(false);
  // % Serviço x Equipamento feature
  const [showPercentModal, setShowPercentModal] = useState(false);
  const [percentSelectedEquip, setPercentSelectedEquip] = useState<string | null>(null);
  const [showEquipDropdown, setShowEquipDropdown] = useState(false);
  const equipDropdownRef = useRef<HTMLDivElement | null>(null);
  const [percentMap, setPercentMap] = useState<Record<string, number>>({});
  const [totalPercent, setTotalPercent] = useState<number>(0);
  const [percentError, setPercentError] = useState<string | null>(null);
  const [percentServices, setPercentServices] = useState<any[]>([]); // services shown in percent modal
  const [serviceCounts, setServiceCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const s = await servicosAPI.getAll();
      setServicos(s || []);
      const eq = await equipamentosAPI.getAll();
      setEquipamentos(eq || []);
      // load counts of linked equipamentos per service name
      await loadServiceCounts();
      // initialize percentMap for % modal
      const initial: Record<string, number> = {};
      (s || []).forEach((sv: any) => { initial[sv.id] = 0; });
      setPercentMap(initial);
    } catch (err) {
      console.error('Erro ao carregar serviços/equipamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadServiceCounts = async () => {
    try {
      const { data, error } = await supabase.from('equipamento_servicos').select('nome, equipamento_id');
      if (error) {
        console.warn('Could not load equipamento_servicos counts', error);
        setServiceCounts({});
        return;
      }
      const map: Record<string, Set<string>> = {};
      (data || []).forEach((row: any) => {
        const nome = row.nome || '';
        const eid = row.equipamento_id;
        if (!map[nome]) map[nome] = new Set();
        if (eid) map[nome].add(eid);
      });
      const counts: Record<string, number> = {};
      Object.keys(map).forEach(k => { counts[k] = map[k].size; });
      setServiceCounts(counts);
    } catch (err) {
      console.error('Erro ao carregar contagens de vinculos:', err);
      setServiceCounts({});
    }
  };

  const openNew = () => {
    setEditing(null);
    const newCode = generateCodigo();
    const categories = getCategories();
    setForm({ codigo: newCode, nome: '', descricao: '', percentual_revisao: '', categoria: categories[0] || '' });
    setFormTipo(tipos[0]);
    setShowModal(true);
  };

  const generateCodigo = () => {
    // Generate a SERIAL code using existing SERVICOS codes pattern 'SER###'.
    try {
      let max = 0;
      servicos.forEach(s => {
        const c: string = (s.codigo || '').toUpperCase();
        const m = c.match(/^SER0*(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n) && n > max) max = n;
        }
      });
      const next = (max + 1).toString().padStart(3, '0');
      return `SER${next}`;
    } catch (err) {
      return `SER${Date.now().toString().slice(-3)}`;
    }
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ codigo: s.codigo || '', nome: s.nome || '', descricao: s.descricao || '', percentual_revisao: s.percentual_revisao?.toString() || '', categoria: s.categoria || '' });
    setShowModal(true);
  };

  const submit = async (e?: any) => {
    if (e) e.preventDefault();
    try {
      const payload: any = { codigo: form.codigo, nome: form.nome, descricao: form.descricao || null, tipo: formTipo, categoria: form.categoria || null };
      if (form.percentual_revisao) payload.percentual_revisao = parseFloat(form.percentual_revisao);
      if (editing) {
        await servicosAPI.update(editing.id, payload);
      } else {
        await servicosAPI.create(payload);
      }
      setShowModal(false);
      await loadAll();
    } catch (err) {
      console.error('Erro ao salvar serviço:', err);
      alert('Erro ao salvar serviço');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover serviço?')) return;
    try {
      await servicosAPI.delete(id);
      await loadAll();
    } catch (err) {
      console.error('Erro ao excluir serviço:', err);
      alert('Erro ao excluir serviço');
    }
  };

  const openVincular = (servId: string) => {
    setSelectedServId(servId);
    setSelectedEquipIds([]);
    setShowVincularModal(true);
  };

  const openLinked = async (s: any) => {
    try {
      setLoadingLinked(true);
      setLinkedEquipamentos([]);
      const svcName = (s.nome || '').toString();
      // First try exact match
      let res = await supabase
        .from('equipamento_servicos')
        .select('equipamento_id, equipamentos(id, nome, codigo_interno)')
        .eq('nome', svcName);

      // If exact match fails (400) or returns error, try ilike fallback
      if (res.error || !res.data) {
        console.warn('Exact match for linked serviços failed, trying ilike fallback', res.error);
        res = await supabase
          .from('equipamento_servicos')
          .select('equipamento_id, equipamentos(id, nome, codigo_interno)')
          .ilike('nome', `%${svcName}%`);
      }

      if (res.error) throw res.error;
      const mapped = (res.data || []).map((row: any) => ({
        equipamento_id: row.equipamento_id,
        equipamento: row.equipamentos || null
      }));
      setLinkedEquipamentos(mapped);
      setShowLinkedModal(true);
    } catch (err) {
      console.error('Erro ao carregar vinculados:', err);
      alert('Erro ao carregar equipamentos vinculados');
    } finally {
      setLoadingLinked(false);
    }
  };

  const [equipSearch, setEquipSearch] = useState('');

  // helper: group services by categoria, applying an optional query filter
  const groupedServices = (list: any[], q: string) => {
    const normalizedQ = (q || '').toLowerCase().trim();
    const out: Record<string, any[]> = {};
    list.forEach(s => {
      if (normalizedQ) {
        const hay = ((s.nome || '') + ' ' + (s.codigo || '')).toLowerCase();
        if (!hay.includes(normalizedQ)) return;
      }
      const cat = s.categoria || 'Sem Categoria';
      out[cat] = out[cat] || [];
      out[cat].push(s);
    });
    // sort categories alphabetically
    const sorted: Record<string, any[]> = {};
    Object.keys(out).sort().forEach(k => { sorted[k] = out[k]; });
    return sorted;
  };

  // derive categories from existing services or use defaults
  const getCategories = () => {
    const set = new Set<string>();
    servicos.forEach(s => { if (s.categoria) set.add(s.categoria); });
    const arr = Array.from(set);
    if (arr.length === 0) return defaultCategories;
    // merge with defaults to keep common ordering
    const merged = Array.from(new Set([...defaultCategories, ...arr]));
    return merged;
  };

  // helper: group equipamentos by linha_setor (or fallback) and apply equipment search
  const groupEquipamentosByLinha = (list: any[], q: string) => {
    const normalizedQ = (q || '').toLowerCase().trim();
    const out: Record<string, any[]> = {};
    list.forEach(eq => {
      if (normalizedQ) {
        const hay = ((eq.nome || '') + ' ' + (eq.codigo_interno || '') + ' ' + (eq.setor || '')).toLowerCase();
        if (!hay.includes(normalizedQ)) return;
      }
      const linha = eq.linha_setor || eq.linha || 'Sem Linha';
      out[linha] = out[linha] || [];
      out[linha].push(eq);
    });
    // sort each group so lines are alphabetical and equipamentos are grouped by base name
    // and ordered by numeric suffix when present (e.g. "Alimentador 1", "Alimentador 2").
    // Compare equipment names by normalizing, extracting the LAST numeric token and
    // sorting by base name then numeric value.
    const normalizeForCompare = (s: string) => {
      if (!s) return '';
      let str = s.toString().trim();
      // remove ordinal symbols and unify separators
      str = str.replace(/[º°]/g, '');
      // replace non alnum with space
      str = str.replace(/[^0-9a-zA-Z\s]/g, ' ');
      str = str.replace(/\s+/g, ' ').trim().toLowerCase();
      return str;
    };

    const compareEquipNames = (aStr: string, bStr: string) => {
      const a = normalizeForCompare(aStr || '');
      const b = normalizeForCompare(bStr || '');
      const aNums = [...a.matchAll(/(\d+)/g)].map(m => m[1]);
      const bNums = [...b.matchAll(/(\d+)/g)].map(m => m[1]);
      const aNum = aNums.length ? parseInt(aNums[aNums.length - 1], 10) : Number.POSITIVE_INFINITY;
      const bNum = bNums.length ? parseInt(bNums[bNums.length - 1], 10) : Number.POSITIVE_INFINITY;
      // base is string without the last numeric token
      const aBase = aNums.length ? a.replace(new RegExp(aNums[aNums.length - 1] + '\\s*$'), '').trim() : a;
      const bBase = bNums.length ? b.replace(new RegExp(bNums[bNums.length - 1] + '\\s*$'), '').trim() : b;
      const baseCmp = aBase.localeCompare(bBase, undefined, { sensitivity: 'base' });
      if (baseCmp !== 0) return baseCmp;
      if (aNum === Number.POSITIVE_INFINITY && bNum === Number.POSITIVE_INFINITY) return a.localeCompare(b, undefined, { sensitivity: 'base' });
      if (aNum === Number.POSITIVE_INFINITY) return 1;
      if (bNum === Number.POSITIVE_INFINITY) return -1;
      return aNum - bNum;
    };

    const sorted: Record<string, any[]> = {};
    Object.keys(out).sort((a, b) => a.localeCompare(b)).forEach(k => {
      const arr = out[k].slice();
      arr.sort((aa, bb) => {
        const aKey = (formatEquipamentoName(aa) || aa.nome || aa.codigo_interno || '').toString();
        const bKey = (formatEquipamentoName(bb) || bb.nome || bb.codigo_interno || '').toString();
        return compareEquipNames(aKey, bKey);
      });
      sorted[k] = arr;
    });
    return sorted;
  };

  const vincular = async () => {
    if (!selectedServId || selectedEquipIds.length === 0) { alert('Selecione pelo menos um equipamento'); return; }
    try {
      const rows = selectedEquipIds.map(eid => ({
        equipamento_id: eid,
        nome: servicos.find(s=>s.id===selectedServId)?.nome || '',
        descricao: servicos.find(s=>s.id===selectedServId)?.descricao || null,
        percentual_revisao: servicos.find(s=>s.id===selectedServId)?.percentual_revisao || 0,
        // note: tabela equipamento_servicos não possui coluna servico_id no schema atual,
        // então não enviamos esse campo para evitar erro PGRST204
      }));
      // Use returning: 'minimal' to avoid PostgREST trying to return columns that may not exist in schema cache
      const { error } = await supabase.from('equipamento_servicos').insert(rows, { returning: 'minimal' });
      if (error) throw error;
      alert('Serviço vinculado aos equipamentos');
      // refresh counts
      await loadServiceCounts();
      setShowVincularModal(false);
        // also refresh percent counts if modal open
        if (showPercentModal) await loadServiceCounts();
    } catch (err) {
      console.error('Erro ao vincular serviço:', err);
      alert('Erro ao vincular serviço');
    }
  };

  // % Serviço x Equipamento handlers
  useEffect(() => {
    // compute totalPercent when percentMap changes
    const sum = Object.values(percentMap || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    setTotalPercent(Number(sum.toFixed(2)));
    if (sum > 100) setPercentError('Os percentuais não podem ultrapassar 100%');
    else setPercentError(null);
  }, [percentMap]);

  const handlePercentChange = (serviceId: string, nextValue: number) => {
    const current = percentMap[serviceId] || 0;
    const candidate = Object.values(percentMap).reduce((a, b) => a + (Number(b) || 0), 0) - current + nextValue;
    if (candidate > 100) {
      setPercentError('Os percentuais não podem ultrapassar 100%');
      return;
    }
    setPercentMap(prev => ({ ...prev, [serviceId]: Number(nextValue) }));
  };

  const openPercentModal = () => {
    // reset selection
    setPercentSelectedEquip(null);
    // reset percentMap and services list — will load when user selects an equipment
    setPercentMap({});
    setPercentServices([]);
    setShowPercentModal(true);
  };

  // when equipment selected in percent modal, load existing config or linked services
  useEffect(() => {
    const loadForEquip = async (equipId: string) => {
      try {
        // try to load existing percentage config
        const { data: existing, error: err1 } = await supabase
          .from('servicos_equipamentos')
          .select('servico_id, percentual')
          .eq('equipamento_id', equipId);

        if (!err1 && existing && existing.length) {
          const map: Record<string, number> = {};
          const svcIds: string[] = [];
          existing.forEach((r: any) => { map[r.servico_id] = Number(r.percentual || 0); svcIds.push(r.servico_id); });
          // build services array from servicos state
          const svs = svcIds.map(id => servicos.find((s: any) => s.id === id)).filter(Boolean);
          setPercentServices(svs);
          setPercentMap(map);
          return;
        }

        // no existing config: fall back to equipamento_servicos which list services linked by name
        const { data: links, error: err2 } = await supabase
          .from('equipamento_servicos')
          .select('nome')
          .eq('equipamento_id', equipId);

        if (!err2 && links && links.length) {
          // try to match by name to servicos
          const names = links.map((l: any) => (l.nome || '').toString().trim());
          const matched: any[] = [];
          names.forEach((nm: string) => {
            const m = servicos.find((s: any) => (s.nome || '').toString().trim() === nm);
            if (m) matched.push(m);
          });
          // if no exact matches, try partial match
          if (matched.length === 0) {
            names.forEach((nm: string) => {
              const m = servicos.find((s: any) => (s.nome || '').toString().toLowerCase().includes(nm.toLowerCase()));
              if (m) matched.push(m);
            });
          }
          // remove duplicates
          const unique = Array.from(new Set(matched.map(s => s.id))).map(id => matched.find((m: any) => m.id === id));
          if (unique.length) {
            const per = Math.floor((100 / unique.length) * 100) / 100; // two decimals
            const map: Record<string, number> = {};
            unique.forEach((u: any) => { map[u.id] = per; });
            // adjust to sum exactly 100 by distributing remainder to first item
            const sum = Object.values(map).reduce((a,b)=>a+b,0);
            const diff = Math.round((100 - sum) * 100) / 100;
            if (diff !== 0 && unique.length > 0) map[unique[0].id] = Number((map[unique[0].id] + diff).toFixed(2));
            setPercentServices(unique);
            setPercentMap(map);
            return;
          }
        }

        // If no existing config and no equipamento_servicos links, show empty list
        setPercentServices([]);
        setPercentMap({});
      } catch (err) {
        console.error('Erro loading percent config for equipment', err);
      }
    };

    if (percentSelectedEquip) loadForEquip(percentSelectedEquip);
    else {
      setPercentServices([]);
      // reset percentMap to zeros
      const initial: Record<string, number> = {};
      (servicos || []).forEach((sv: any) => { initial[sv.id] = 0; });
      setPercentMap(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentSelectedEquip]);

  // close equipment dropdown when clicking outside
  useEffect(() => {
    if (!showEquipDropdown) return;
    const onDocClick = (e: MouseEvent) => {
      if (equipDropdownRef.current && !equipDropdownRef.current.contains(e.target as Node)) {
        setShowEquipDropdown(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showEquipDropdown]);

  const savePercentConfig = async () => {
    if (!percentSelectedEquip) { alert('Selecione um equipamento'); return; }
    if (totalPercent !== 100) { alert('Distribua até fechar 100%'); return; }
    try {
      // remove existing config for equipamento
      const del = await supabase.from('servicos_equipamentos').delete().eq('equipamento_id', percentSelectedEquip);
      if (del.error) console.warn('Could not delete previous configs', del.error);
      const rows: any[] = [];
      Object.entries(percentMap).forEach(([servId, val]) => {
        const v = Number(val) || 0;
        if (v > 0) rows.push({ equipamento_id: percentSelectedEquip, servico_id: servId, percentual: v, concluido: false });
      });
      if (rows.length) {
        const ins = await supabase.from('servicos_equipamentos').insert(rows);
        if (ins.error) throw ins.error;
      }
      alert('Percentuais vinculados ao equipamento com sucesso');
      setShowPercentModal(false);
    } catch (err) {
      console.error('Erro ao salvar percentuais:', err);
      alert('Erro ao salvar percentuais');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Serviços</h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cadastre serviços padrão e vincule aos equipamentos</p>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={openNew} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg">Novo Serviço</button>
              <button onClick={openPercentModal} className="px-4 py-3 bg-emerald-600 text-white rounded-lg flex items-center gap-2">
                <Percent size={16} />
                Calculo Revisao
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Carregando...</div>
          ) : (
            <div>
              <div className="mb-4">
                <input value={servicosQuery} onChange={(e)=>setServicosQuery(e.target.value)} placeholder="Buscar serviços por código ou nome..." className="w-full px-3 py-2 rounded" />
              </div>

              <div className="space-y-6">
                {Object.entries(groupedServices(servicos, servicosQuery)).map(([categoria, items]) => (
                  <div key={categoria}>
                    <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{categoria}</h4>
                    <div className="space-y-2">
                      {items.map(s => (
                        <div key={s.id} className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow`}>
                          <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-400">{s.codigo}</div>
                              <div
                                  className={`font-semibold whitespace-normal break-words ${darkMode ? 'text-white' : 'text-gray-900'} cursor-pointer underline-offset-2 hover:underline flex items-center gap-2`}
                                onClick={() => openLinked(s)}
                                title="Ver equipamentos vinculados"
                              >
                                  <span className="whitespace-normal break-words">{s.nome}</span>
                                {(serviceCounts[s.nome] || 0) > 0 && (
                                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-300 text-amber-900">
                                    <i className="ri-link-line"></i>
                                    {serviceCounts[s.nome]}
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm mt-1 truncate ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{s.descricao}</p>
                                <p className={`text-sm mt-1 whitespace-normal break-words ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{s.descricao}</p>
                          </div>
                          <div className="flex items-center gap-4 ml-4">
                            <span className={`${darkMode ? 'text-xs px-2 py-1 rounded bg-slate-700 text-gray-200' : 'text-xs px-2 py-1 rounded bg-gray-200 text-gray-800'}`}>{s.categoria || 'Sem Categoria'}</span>
                            <div className="flex gap-2">
                              <button onClick={() => openVincular(s.id)} className="px-3 py-1 bg-emerald-600 text-white rounded">Vincular</button>
                              <button onClick={() => openEdit(s)} className="px-3 py-1 bg-blue-600 text-white rounded">Editar</button>
                              <button onClick={() => remove(s.id)} className="px-3 py-1 bg-red-600 text-white rounded">Excluir</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal criar/editar */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl w-full max-w-2xl p-6`}> 
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{editing ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                <form onSubmit={submit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400">Código do Serviço</label>
                    <input className="w-full px-3 py-2 rounded" value={form.codigo} onChange={(e)=>setForm({...form,codigo:e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">Nome</label>
                    <input className="w-full px-3 py-2 rounded" value={form.nome} onChange={(e)=>setForm({...form,nome:e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">Descrição</label>
                    <textarea className="w-full px-3 py-2 rounded" value={form.descricao} onChange={(e)=>setForm({...form,descricao:e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">Categoria</label>
                    <select className="w-full px-3 py-2 rounded" value={form.categoria} onChange={(e)=>setForm({...form,categoria:e.target.value})}>
                      {getCategories().map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">Tipo</label>
                    <select className="w-full px-3 py-2 rounded" value={formTipo} onChange={(e)=>setFormTipo(e.target.value)}>
                      {tipos.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* % Serviço x Equipamento Modal */}
          {showPercentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
              <div className={`${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'} rounded-2xl w-full max-w-5xl p-6`}> 
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Factory />
                    <div className="relative" ref={equipDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowEquipDropdown(v => !v)}
                        className={`px-3 py-2 rounded border ${darkMode ? 'bg-slate-800 text-white border-slate-600' : 'bg-white text-gray-900 border-gray-300'}`}
                      >
                        {percentSelectedEquip ? (equipamentos.find(eq => eq.id === percentSelectedEquip)?.nome || 'Selecionado') : 'Selecione um Equipamento'}
                      </button>
                      {showEquipDropdown && (
                        <div className={`absolute z-50 mt-2 w-80 max-h-64 overflow-y-auto rounded shadow-lg ${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}`}>
                          {equipamentos.length === 0 ? (
                            <div className="p-3 text-sm text-gray-400">Nenhum equipamento disponível</div>
                          ) : (
                            equipamentos.map(eq => (
                              <button key={eq.id} onClick={() => { setPercentSelectedEquip(eq.id); setShowEquipDropdown(false); }} className={`w-full text-left px-3 py-2 hover:${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}> 
                                <div className="font-medium">{eq.nome}</div>
                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{eq.codigo_interno || ''}</div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">Distribuição de Percentuais da Revisão</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>setShowPercentModal(false)} className={`px-4 py-2 rounded ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-300 text-gray-800'}`}>Cancelar</button>
                    <button onClick={savePercentConfig} disabled={totalPercent !== 100} className={`px-4 py-2 rounded ${totalPercent===100 ? 'bg-emerald-600 text-white' : (darkMode ? 'bg-slate-700 text-gray-400' : 'bg-gray-300 text-gray-600')}`}>
                      Salvar Configuração
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>Total distribuído: <strong>{totalPercent}%</strong></div>
                    {percentError && <div className="text-red-400">{percentError}</div>}
                  </div>
                  <div className={`h-4 rounded ${darkMode ? 'bg-slate-700' : 'bg-gray-200'} overflow-hidden`}>
                    <div className={`h-4 ${totalPercent>100 ? 'bg-red-500' : 'bg-emerald-500'} transition-all`} style={{ width: `${Math.min(totalPercent,100)}%` }} />
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {percentServices && percentServices.length > 0 ? (
                    percentServices.map(s => (
                      <div key={s.id} className={`flex items-center justify-between p-3 rounded ${darkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{s.nome}</div>
                            { (percentMap[s.id] || 0) > 0 ? <CheckCircle className="text-emerald-400" /> : null }
                          </div>
                          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-400'} text-sm`}>{s.codigo}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={percentMap[s.id] ?? 0}
                            onChange={(e) => {
                              const v = Number(e.target.value || 0);
                              handlePercentChange(s.id, v);
                            }}
                            className="w-28 px-3 py-2 rounded border bg-transparent text-right"
                          />
                          {percentMap[s.id] && percentMap[s.id] > 0 ? <CheckCircle className="text-emerald-500" /> : <AlertTriangle className="text-gray-400" />}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`p-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nenhum serviço vinculado a este equipamento.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal Vincular */}
          {showVincularModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className={`rounded-xl w-full max-w-3xl p-6 bg-slate-900 text-white`}> 
                <h3 className="text-lg font-semibold">Vincular Serviço a Equipamentos</h3>
                <div className="mt-4">
                  <input placeholder="Buscar equipamentos por nome ou código..." className="w-full px-3 py-2 rounded text-black" value={equipSearch} onChange={(e)=>setEquipSearch(e.target.value)} />
                </div>
                <div className="mt-4 max-h-72 overflow-y-auto space-y-4">
                  {Object.entries(groupEquipamentosByLinha(equipamentos, equipSearch)).map(([linha, list]) => (
                    <div key={linha}>
                      <div className="text-sm text-amber-300 font-medium mb-2">{linha}</div>
                      <div className="space-y-2">
                        {list.map(eq => (
                          <label key={eq.id} className="flex items-center gap-3 p-2 rounded bg-slate-800">
                            <input type="checkbox" checked={selectedEquipIds.includes(eq.id)} onChange={(e)=>{
                              if(e.target.checked) setSelectedEquipIds(prev=>[...prev,eq.id]); else setSelectedEquipIds(prev=>prev.filter(id=>id!==eq.id));
                            }} />
                            <div className="flex-1">
                              <EquipamentoName equipamento={eq} numberClassName="text-amber-300" />
                              <div className="text-xs text-slate-400 mt-1">{eq.codigo_interno || eq.ind || ''}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button onClick={()=>setShowVincularModal(false)} className="px-4 py-2 bg-transparent border border-white rounded">Cancelar</button>
                  <button onClick={vincular} className="px-4 py-2 bg-emerald-600 text-white rounded">Vincular</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Linked Equipamentos (read-only) */}
          {showLinkedModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className={`${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'} rounded-xl w-full max-w-2xl p-6`}>
                <h3 className="text-lg font-semibold">Equipamentos vinculados</h3>
                <div className="mt-4">
                  {loadingLinked ? (
                    <div className="text-sm text-gray-400">Carregando...</div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {linkedEquipamentos.length === 0 ? (
                        <div className="text-sm text-gray-500">Nenhum equipamento vinculado a este serviço.</div>
                      ) : (
                        linkedEquipamentos.map((row) => (
                          <div key={row.equipamento_id} className={`flex items-center justify-between p-2 rounded ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                            <div>
                              <div className={`${darkMode ? 'text-gray-200' : 'text-gray-900'} font-medium`}>{row.equipamento?.nome || 'Sem nome'}</div>
                              <div className="text-sm text-gray-500">IND: {row.equipamento?.ind || row.equipamento?.codigo_interno || '-'}</div>
                            </div>
                            <div>
                              <button onClick={() => { if (row.equipamento?.id) navigate(`/equipamento/${row.equipamento.id}`); }} className="px-3 py-1 bg-blue-600 text-white rounded">Abrir</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={() => setShowLinkedModal(false)} className="px-4 py-2">Fechar</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
