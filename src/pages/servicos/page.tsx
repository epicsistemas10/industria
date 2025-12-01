import { useEffect, useState } from 'react';
import { formatEquipamentoName } from '../../utils/format';
import EquipamentoName from '../../components/base/EquipamentoName';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';
import { servicosAPI } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { equipamentosAPI } from '../../lib/api';

export default function ServicosPage() {
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
    } catch (err) {
      console.error('Erro ao carregar serviços/equipamentos:', err);
    } finally {
      setLoading(false);
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
      setShowVincularModal(false);
    } catch (err) {
      console.error('Erro ao vincular serviço:', err);
      alert('Erro ao vincular serviço');
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
            <div>
              <button onClick={openNew} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg">Novo Serviço</button>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {items.map(s => (
                        <div key={s.id} className={`p-4 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow`}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="text-sm text-gray-400">{s.codigo}</div>
                              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.nome}</h3>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => openVincular(s.id)} className="px-3 py-1 bg-emerald-600 text-white rounded">Vincular</button>
                              <button onClick={() => openEdit(s)} className="px-3 py-1 bg-blue-600 text-white rounded">Editar</button>
                              <button onClick={() => remove(s.id)} className="px-3 py-1 bg-red-600 text-white rounded">Excluir</button>
                            </div>
                          </div>
                                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{s.descricao}</p>
                                  <div className="mt-2">
                                    <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800">{s.categoria || 'Sem Categoria'}</span>
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
        </main>
      </div>
    </div>
  );
}
