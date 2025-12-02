import React, { useState } from 'react';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';
import usePanoramas from '../../hooks/usePanoramas';
import PanoramaViewer from '../../components/PanoramaViewer';
import { useToast } from '../../hooks/useToast';

export default function PanoramasPage() {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const { panoramas, loading, uploadAndCreate, remove } = usePanoramas();
  const toast = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAndCreate(file, { titulo: file.name });
    } catch (err) {
      toast.error('Erro ao enviar panorama');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'}`}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Panoramas</h1>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Gerencie panoramas 360° e visualize em fullscreen.</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer">
                Upload Panorama
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading && <div className="text-white">Carregando...</div>}
            {panoramas.map(p => (
              <div key={p.id} className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="h-40 w-full mb-3 overflow-hidden rounded">
                  <img src={p.url} alt={p.titulo} className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{p.titulo || 'Panorama'}</div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{new Date(p.created_at || '').toLocaleString() || ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedUrl(p.url)} className="px-3 py-1 bg-emerald-600 text-white rounded">Abrir</button>
                    <button onClick={() => remove(p.id)} className="px-3 py-1 bg-red-600 text-white rounded">Remover</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {selectedUrl && <PanoramaViewer url={selectedUrl} onClose={() => setSelectedUrl(null)} />}
    </div>
  );
}
