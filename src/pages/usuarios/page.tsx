import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
  departamento?: string;
  perfil?: string;
  status?: string;
  telefone?: string;
  ativo?: boolean;
  page_permissions?: any;
}

const PAGES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'equipamentos', label: 'Equipamentos' },
  { key: 'pecas', label: 'Peças' },
  { key: 'ordens-servico', label: 'Ordens de Serviço' },
  { key: 'melhorias', label: 'Melhorias' },
  { key: 'mapa', label: 'Mapa' },
  { key: 'custos', label: 'Custos' }
];

export default function UsuariosPage() {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const { session } = useAuth();

  // CRUD states
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({ nome: '', email: '', cargo: 'tecnico', departamento: '', telefone: '', perfil: 'visualizador', ativo: true });

  // Permissions modal
  const [showPermModal, setShowPermModal] = useState(false);
  const [permUser, setPermUser] = useState<Usuario | null>(null);
  const [permDraft, setPermDraft] = useState<Record<string, { view?: boolean; edit?: boolean; delete?: boolean }>>({});

  useEffect(() => {
    carregarUsuarios();
    try {
      const t = localStorage.getItem('theme');
      if (t === 'light') setDarkMode(false);
      else setDarkMode(true);
    } catch {}
  }, [session]);

  const carregarUsuarios = async () => {
    setLoading(true);
    try {
      // Use select('*') to avoid errors if some columns don't exist in the DB schema cache
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome', { ascending: true });
      if (error) {
        console.error('Erro ao carregar usuários:', error);
        setUsuarios([]);
      } else if (data) {
        setUsuarios(data as Usuario[]);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to insert/update while stripping unknown columns reported by PostgREST (PGRST204)
  const tryWrite = async (opts: {
    action: 'insert' | 'update';
    table: string;
    payload: Record<string, any>;
    match?: Record<string, any>;
  }) => {
    let payload = { ...opts.payload };
    while (true) {
      let res: any;
      if (opts.action === 'insert') {
        res = await supabase.from(opts.table).insert([payload]);
      } else {
        if (!opts.match) throw new Error('match required for update');
        res = await supabase.from(opts.table).update(payload).match(opts.match);
      }
      if (!res.error) return res;
      const err = res.error;
      // If PostgREST reports a missing column, remove it and retry
      if (err?.code === 'PGRST204' && typeof err.message === 'string') {
        const m = err.message.match(/Could not find the '([^']+)' column/);
        if (m && m[1]) {
          const col = m[1];
          if (payload.hasOwnProperty(col)) {
            delete payload[col];
            // try again with the reduced payload
            continue;
          }
        }
      }
      // not recoverable here
      throw err;
    }
  };

  const openNew = () => {
    setEditingUser(null);
    setFormData({ nome: '', email: '', cargo: 'tecnico', departamento: '', telefone: '', perfil: 'visualizador', ativo: true });
    setShowModal(true);
  };

  const handleEdit = (u: Usuario) => {
    setEditingUser(u);
    setFormData({ nome: u.nome || '', email: u.email || '', cargo: u.cargo || 'tecnico', departamento: u.departamento || '', telefone: u.telefone || '', perfil: u.perfil || 'visualizador', ativo: !!u.ativo });
    setShowModal(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      let payload: any = {
        nome: formData.nome,
        email: formData.email,
        cargo: formData.cargo,
        departamento: formData.departamento,
        telefone: formData.telefone,
        perfil: formData.perfil,
        ativo: formData.ativo
      };

      // If creating a new user from the frontend, the DB requires a non-null senha_hash.
      // Use an empty string as a placeholder so PostgREST doesn't reject with 23502.
      if (!editingUser) {
        payload.senha_hash = '';
      }

      if (editingUser) {
        await tryWrite({ action: 'update', table: 'usuarios', payload, match: { id: editingUser.id } });
        alert('Usuário atualizado');
      } else {
        await tryWrite({ action: 'insert', table: 'usuarios', payload });
        alert('Usuário criado');
      }
      setShowModal(false);
      carregarUsuarios();
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      alert('Erro ao salvar usuário: ' + (err?.message || String(err)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', id);
      if (error) throw error;
      alert('Usuário excluído');
      carregarUsuarios();
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      alert('Erro ao excluir usuário');
    }
  };

  const openPermissionsModal = (u: Usuario) => {
    setPermUser(u);
    const raw = (u.page_permissions as any) || {};
    setPermDraft(typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {});
    setShowPermModal(true);
  };

  const savePermissions = async () => {
    if (!permUser) return;
    try {
      const payload = { page_permissions: permDraft };
      const { error } = await supabase.from('usuarios').update(payload).eq('id', permUser.id);
      if (error) throw error;
      alert('Permissões salvas');
      setShowPermModal(false);
      carregarUsuarios();
    } catch (err) {
      console.error('Erro ao salvar permissões:', err);
      alert('Erro ao salvar permissões');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="p-6">
          {/* debug panel removed */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Gestão de Usuários</h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Crie, edite e gerencie permissões por página</p>
            </div>
            <div>
              <button onClick={openNew} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg">Novo Usuário</button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Carregando...</div>
          ) : (
            (() => {
              const containerBg = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
              const headerBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
              const headerText = darkMode ? 'text-gray-400' : 'text-gray-600';
              const rowDivide = darkMode ? 'divide-gray-800' : 'divide-gray-100';
              const rowHover = darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50';
              const nameText = darkMode ? 'text-white' : 'text-gray-900';
              const emailText = darkMode ? 'text-gray-400' : 'text-gray-600';
              const permText = darkMode ? 'text-gray-400' : 'text-gray-600';
              const actionBtnBase = darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-white hover:bg-blue-50';
              return (
                <div className={`${containerBg} rounded-lg border overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`${headerBg} border-b`}>
                        <tr>
                          <th className={`px-6 py-4 text-left text-xs font-medium ${headerText} uppercase tracking-wider`}>Usuário</th>
                          <th className={`px-6 py-4 text-left text-xs font-medium ${headerText} uppercase tracking-wider`}>E-mail</th>
                          <th className={`px-6 py-4 text-left text-xs font-medium ${headerText} uppercase tracking-wider`}>Cargo</th>
                          <th className={`px-6 py-4 text-left text-xs font-medium ${headerText} uppercase tracking-wider`}>Permissões</th>
                          <th className={`px-6 py-4 text-right text-xs font-medium ${headerText} uppercase tracking-wider`}>Ações</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${rowDivide}`}>
                        {usuarios.map(u => (
                          <tr key={u.id} className={`${rowHover} transition-colors`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`${nameText} font-medium`}>{u.nome}</div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${emailText}`}>{u.email}</td>
                            <td className={`px-6 py-4 whitespace-nowrap ${emailText}`}>{u.cargo}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${permText}`}>{u.page_permissions ? 'Configurada' : '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleEdit(u)} className={`p-2 ${actionBtnBase} rounded-lg`}>Editar</button>
                                <button onClick={() => openPermissionsModal(u)} className={`p-2 ${actionBtnBase} rounded-lg`}>Permissões</button>
                                <button onClick={() => handleDelete(u.id)} className={`p-2 ${darkMode ? 'text-red-500 hover:text-white hover:bg-gray-800' : 'text-red-600 hover:bg-red-50'} rounded-lg`}>Excluir</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()
          )}

          {/* Modal de criação/edição */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                  <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-700"><i className="ri-close-line"></i></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Nome *</label>
                      <input required value={formData.nome} onChange={(e)=>setFormData({...formData, nome: e.target.value})} className="w-full px-3 py-2 rounded bg-slate-700" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">E-mail *</label>
                      <input required type="email" value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 rounded bg-slate-700" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Cargo</label>
                      <input value={formData.cargo} onChange={(e)=>setFormData({...formData, cargo: e.target.value})} className="w-full px-3 py-2 rounded bg-slate-700" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Departamento</label>
                      <input value={formData.departamento} onChange={(e)=>setFormData({...formData, departamento: e.target.value})} className="w-full px-3 py-2 rounded bg-slate-700" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Telefone</label>
                      <input value={formData.telefone} onChange={(e)=>setFormData({...formData, telefone: e.target.value})} className="w-full px-3 py-2 rounded bg-slate-700" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Perfil</label>
                      <select value={formData.perfil} onChange={(e)=>setFormData({...formData, perfil: e.target.value})} className="w-full px-3 py-2 rounded bg-slate-700">
                        <option value="admin">Administrador</option>
                        <option value="gestor">Gestor</option>
                        <option value="tecnico">Técnico</option>
                        <option value="visualizador">Visualizador</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={formData.ativo} onChange={(e)=>setFormData({...formData, ativo: e.target.checked})} id="ativo" />
                    <label htmlFor="ativo" className="text-sm text-gray-300">Usuário ativo</label>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-6 py-3 rounded border">Cancelar</button>
                    <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded">{editingUser? 'Atualizar' : 'Criar'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Permissões */}
          {showPermModal && permUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold">Permissões por Página — {permUser.nome}</h3>
                  <button onClick={()=>setShowPermModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-700"><i className="ri-close-line"></i></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PAGES.map(p => (
                    <div key={p.key} className="bg-slate-700 rounded p-3">
                      <div className="font-medium text-white mb-2">{p.label}</div>
                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={!!permDraft[p.key]?.view} onChange={(e)=>setPermDraft(prev=>({...prev,[p.key]:{...(prev[p.key]||{}), view: e.target.checked}}))} /> Ver</label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={!!permDraft[p.key]?.edit} onChange={(e)=>setPermDraft(prev=>({...prev,[p.key]:{...(prev[p.key]||{}), edit: e.target.checked}}))} /> Editar</label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={!!permDraft[p.key]?.delete} onChange={(e)=>setPermDraft(prev=>({...prev,[p.key]:{...(prev[p.key]||{}), delete: e.target.checked}}))} /> Excluir</label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={()=>setShowPermModal(false)} className="flex-1 px-6 py-3 rounded border">Cancelar</button>
                  <button onClick={savePermissions} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded">Salvar Permissões</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
