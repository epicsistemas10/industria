import { useState, useEffect } from 'react';
import useSetores from '../../hooks/useSetores';
import SetorModal from '../../components/modals/SetorModal';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';

export default function SetoresPage() {
  const { setores, loading, remove, load } = useSetores();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este setor?')) return;
    try {
      await remove(id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'} transition-colors`}> 
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />

        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Setores</h1>
            <div className="flex gap-2">
              <button onClick={() => { setEditId(undefined); setShowModal(true); }} className="px-4 py-2 bg-purple-600 text-white rounded">Novo Setor</button>
              <button onClick={() => load()} className="px-4 py-2 bg-gray-200 rounded">Atualizar</button>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg p-4` }>
            {loading ? (
              <div className="text-white">Carregando...</div>
            ) : (
              <ul className="space-y-2">
                {setores.map((s) => (
                  <li key={s.id} className={`flex items-center justify-between p-3 rounded ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
                    <div className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.nome}</div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditId(s.id); setShowModal(true); }} className="px-3 py-1 bg-blue-600 text-white rounded">Editar</button>
                      <button onClick={() => handleDelete(s.id)} className="px-3 py-1 bg-red-600 text-white rounded">Excluir</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <SetorModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load(); }} setorId={editId} />
        </main>
      </div>
    </div>
  );
}
