import { useState } from 'react';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';
import { usePecas } from '../../hooks/usePecas';
import PecaModal from '../../components/modals/PecaModal';
import { useToast } from '../../hooks/useToast';

export default function PecasPage() {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);
  const { data: pecas, loading, fetch, create, update, remove } = usePecas();
  const [showPecaModal, setShowPecaModal] = useState(false);
  const [selectedPecaId, setSelectedPecaId] = useState<string | undefined>();
  const { success, error: showError } = useToast();

  const handleEdit = (id: string) => {
    setSelectedPecaId(id);
    setShowPecaModal(true);
  };

  const handleDelete = async (id: string) => {
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
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all whitespace-nowrap"
              >
                <i className="ri-add-line mr-2"></i>
                Nova Peça
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && pecas.length === 0 && (
            <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-12 text-center shadow-lg`}>
              <i className="ri-search-line text-6xl mb-4"></i>
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Nenhuma peça cadastrada</h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Crie a primeira peça usando o botão acima.</p>
            </div>
          )}

          {!loading && pecas.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {pecas.map((p: any) => (
                <div key={p.id} className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-lg relative`}>
                  <div className="flex items-center gap-3">
                    {p.foto_url ? (
                      <img src={p.foto_url} alt={p.nome} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                        <i className="ri-shopping-bag-line text-2xl"></i>
                      </div>
                    )}
                    <div>
                      <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{p.nome}</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{p.codigo_interno || p.codigo_fabricante || '-'}</div>
                    </div>
                  </div>

                  {/* metadata from observacoes (may be JSON text) */}
                  {(() => {
                    try {
                      const meta = typeof p.observacoes === 'string' ? JSON.parse(p.observacoes) : p.observacoes || {};
                      return (
                        <div className="mt-3">
                          {meta.categoria && <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>{meta.categoria}</div>}
                          {meta.descricao && <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{meta.descricao}</div>}
                          {Array.isArray(meta.aplicavel) && meta.aplicavel.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {meta.aplicavel.slice(0,6).map((a: string, idx: number) => (
                                <div key={idx} className="text-xs px-2 py-1 rounded bg-white/5 text-white">{a}</div>
                              ))}
                              {meta.aplicavel.length > 6 && <div className="text-xs px-2 py-1 rounded bg-white/5 text-white">+{meta.aplicavel.length - 6}...</div>}
                            </div>
                          )}
                        </div>
                      );
                    } catch (e) {
                      return null;
                    }
                  })()}

                  <div className="absolute top-3 right-3 flex gap-2">
                    <button onClick={() => handleEdit(p.id)} className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center">
                      <i className="ri-edit-line"></i>
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="w-8 h-8 bg-red-600 text-white rounded flex items-center justify-center">
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <PecaModal isOpen={showPecaModal} onClose={() => setShowPecaModal(false)} onSuccess={async () => { await fetch(); setShowPecaModal(false); }} pecaId={selectedPecaId} />
        </main>
      </div>
    </div>
  );
}
