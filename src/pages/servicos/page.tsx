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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ codigo: '', nome: '', descricao: '', percentual_revisao: '' });
  const tipos = ['Preventiva', 'Preditiva', 'Corretiva', 'Melhoria'];
  const [formTipo, setFormTipo] = useState<string>(tipos[0]);
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
    setForm({ codigo: newCode, nome: '', descricao: '', percentual_revisao: '' });
    setFormTipo(tipos[0]);
    setShowModal(true);
  };

  const generateCodigo = () => {
    // Try to generate a sequential code based on existing service codes.
    // Pattern: SV-YYYY-0001
    try {
      const year = new Date().getFullYear();
      const prefix = `SV-${year}-`;
      // find highest numeric suffix for this year
      let max = 0;
      servicos.forEach(s => {
        const c: string = s.codigo || '';
        if (c.startsWith(prefix)) {
          const suffix = c.replace(prefix, '');
          const n = parseInt(suffix, 10);
          if (!isNaN(n) && n > max) max = n;
        }
      });
      const next = (max + 1).toString().padStart(4, '0');
      return `${prefix}${next}`;
    } catch (err) {
      return `SV-${Date.now().toString(36).toUpperCase()}`;
    }
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ codigo: s.codigo || '', nome: s.nome || '', descricao: s.descricao || '', percentual_revisao: s.percentual_revisao?.toString() || '' });
    setShowModal(true);
  };

  const submit = async (e?: any) => {
    if (e) e.preventDefault();
    try {
      const payload: any = { codigo: form.codigo, nome: form.nome, descricao: form.descricao || null, tipo: formTipo };
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

  const vincular = async () => {
    if (!selectedServId || selectedEquipIds.length === 0) { alert('Selecione pelo menos um equipamento'); return; }
    try {
      const rows = selectedEquipIds.map(eid => ({ equipamento_id: eid, nome: servicos.find(s=>s.id===selectedServId)?.nome || '', descricao: servicos.find(s=>s.id===selectedServId)?.descricao || null, percentual_revisao: servicos.find(s=>s.id===selectedServId)?.percentual_revisao || 0, servico_id: selectedServId }));
      const { error } = await supabase.from('equipamento_servicos').insert(rows);
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {servicos.map(s => (
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
                </div>
              ))}
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
              <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl w-full max-w-2xl p-6`}> 
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Vincular Serviço a Equipamentos</h3>
                <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
                  {equipamentos.map(eq => (
                    <label key={eq.id} className="flex items-center gap-3 p-2 border rounded">
                      <input type="checkbox" checked={selectedEquipIds.includes(eq.id)} onChange={(e)=>{
                        if(e.target.checked) setSelectedEquipIds(prev=>[...prev,eq.id]); else setSelectedEquipIds(prev=>prev.filter(id=>id!==eq.id));
                      }} />
                      <div className="flex-1"><EquipamentoName equipamento={eq} numberClassName="text-amber-300" /></div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button onClick={()=>setShowVincularModal(false)} className="px-4 py-2">Cancelar</button>
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
