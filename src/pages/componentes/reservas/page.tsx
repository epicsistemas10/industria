import React, { useEffect, useState } from 'react';
import Sidebar from '../../dashboard/components/Sidebar';
import TopBar from '../../dashboard/components/TopBar';
import useSidebar from '../../../hooks/useSidebar';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../hooks/useToast';

interface Reserva {
  id: string;
  componente_id: string;
  quantidade: number;
  local: string;
  criado_em?: string;
  componentes?: { id: string; nome: string; codigo_interno?: string };
}

export default function ComponentesReservasPage() {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingReservaId, setEditingReservaId] = useState<string | null>(null);
  const [componentesList, setComponentesList] = useState<any[]>([]);
  const [newReserva, setNewReserva] = useState({ componente_id: '', quantidade: 1, local: '' });
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadReservas();
  }, []);

  const loadReservas = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('componentes_reservas')
        .select('*, componentes(id, nome, codigo_interno)')
        .order('criado_em', { ascending: false });
      if (data) setReservas(data as any);
    } catch (err) {
      console.error('Erro ao carregar reservas:', err);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };
  const loadComponentes = async () => {
    try {
      const { data } = await supabase
        .from('componentes')
        .select('id, nome, codigo_interno')
        .order('nome');
      if (data) setComponentesList(data as any);
    } catch (err) {
      console.error('Erro ao carregar componentes:', err);
    }
  };

  useEffect(() => {
    loadComponentes();
  }, []);

  const handleSaveReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReserva.componente_id) {
      showError('Selecione um componente');
      return;
    }
    try {
      setLoading(true);
      if (editingReservaId) {
        const { error } = await supabase
          .from('componentes_reservas')
          .update({
            componente_id: newReserva.componente_id,
            quantidade: newReserva.quantidade,
            local: newReserva.local
          })
          .eq('id', editingReservaId);
        if (error) throw error;
        success('Reserva atualizada');
      } else {
        const { data, error } = await supabase.from('componentes_reservas').insert([
          {
            componente_id: newReserva.componente_id,
            quantidade: newReserva.quantidade,
            local: newReserva.local
          }
        ]);
        if (error) throw error;
        success('Reserva criada');
      }
      setShowNewModal(false);
      setEditingReservaId(null);
      setNewReserva({ componente_id: '', quantidade: 1, local: '' });
      loadReservas();
    } catch (err: any) {
      console.error('Erro ao salvar reserva:', err);
      if (err?.status === 404 || (err?.message && err.message.includes('404'))) {
        showError('Tabela `componentes_reservas` não encontrada no banco. Verifique a migration.');
        console.warn('Crie a tabela com o SQL em `sql/15_componentes_reservas.sql`');
      } else {
        showError('Erro ao salvar reserva');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (r: Reserva) => {
    setEditingReservaId(r.id);
    setNewReserva({ componente_id: r.componente_id, quantidade: r.quantidade, local: r.local || '' });
    setShowNewModal(true);
  };

  const handleDeleteReserva = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta reserva?')) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('componentes_reservas').delete().eq('id', id);
      if (error) throw error;
      success('Reserva removida');
      loadReservas();
    } catch (err) {
      console.error('Erro ao remover reserva:', err);
      showError('Erro ao remover reserva');
    } finally {
      setLoading(false);
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
              <h1 className="text-3xl font-bold text-white">Componentes Reservas</h1>
              <p className="text-gray-400 mt-1">Gerencie componentes reservados e local de armazenamento.</p>
            </div>
            <div>
              <button
                onClick={() => {
                  setEditingReservaId(null);
                  setNewReserva({ componente_id: '', quantidade: 1, local: '' });
                  setShowNewModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg"
              >
                Nova Reserva
              </button>
            </div>
          </div>

          {/* Modal Nova / Editar Reserva */}
          {showNewModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">{editingReservaId ? 'Editar Reserva' : 'Nova Reserva'}</h3>
                  <button
                    onClick={() => { setShowNewModal(false); setEditingReservaId(null); }}
                    className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-700"
                  >
                    <i className="ri-close-line text-xl text-gray-400"></i>
                  </button>
                </div>

                <form onSubmit={handleSaveReserva} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Componente *</label>
                    <select
                      value={newReserva.componente_id}
                      onChange={(e) => setNewReserva({ ...newReserva, componente_id: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border bg-slate-700 border-slate-600 text-white"
                      required
                    >
                      <option value="">Selecione um componente</option>
                      {componentesList.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}{c.codigo_interno ? ` — ${c.codigo_interno}` : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Quantidade *</label>
                    <input
                      type="number"
                      min={1}
                      value={newReserva.quantidade}
                      onChange={(e) => setNewReserva({ ...newReserva, quantidade: Number(e.target.value) || 1 })}
                      className="w-full px-4 py-2 rounded-lg border bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Local</label>
                    <input
                      type="text"
                      value={newReserva.local}
                      onChange={(e) => setNewReserva({ ...newReserva, local: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => { setShowNewModal(false); setEditingReservaId(null); }}
                      className="flex-1 px-6 py-3 rounded-lg border border-slate-600 text-gray-300 hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-60"
                    >
                      {editingReservaId ? 'Salvar' : 'Criar Reserva'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-slate-800 rounded-xl p-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            ) : reservas.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Nenhuma reserva encontrada</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="text-sm text-gray-300 bg-slate-900">
                    <tr>
                      <th className="text-left px-4 py-3">Componente</th>
                      <th className="text-left px-4 py-3">Código</th>
                      <th className="text-left px-4 py-3">Quantidade</th>
                      <th className="text-left px-4 py-3">Local</th>
                      <th className="text-left px-4 py-3">Criado</th>
                      <th className="text-right px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservas.map(r => (
                      <tr key={r.id} className="hover:bg-slate-700/40 transition-colors">
                        <td className="px-4 py-3 text-white">{r.componentes?.nome || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{r.componentes?.codigo_interno || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{r.quantidade}</td>
                        <td className="px-4 py-3 text-gray-300">{r.local || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{r.criado_em ? new Date(r.criado_em).toLocaleString('pt-BR') : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(r)}
                              disabled={loading}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-60"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteReserva(r.id)}
                              disabled={loading}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm disabled:opacity-60"
                            >
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
