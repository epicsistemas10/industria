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
  perfil?: string;
  status?: string;
}

export default function UsuariosPage() {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const { session } = useAuth();

  useEffect(() => {
    carregarUsuarios();
    try {
      const t = localStorage.getItem('theme');
      if (t === 'light') setDarkMode(false);
      else setDarkMode(true);
    } catch {}
  }, [session]);

  const carregarUsuarios = async () => {
    try {
      const { data, error } = await supabase.from('usuarios').select('id, nome, email, perfil, status').order('nome', { ascending: true });
      if (error) {
        console.error('Erro ao carregar usuários:', error);
        setUsuarios([]);
        return;
      }
      setUsuarios((data || []) as Usuario[]);
    } catch (err) {
      console.error('Erro inesperado:', err);
      setUsuarios([]);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="p-6">
          <div className={`mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
            <p className="text-sm mt-1">Lista básica de usuários (temporário)</p>
          </div>

          <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-white'} p-4`}>
            {usuarios.length === 0 ? (
              <div className="text-sm text-gray-400">Nenhum usuário encontrado.</div>
            ) : (
              <ul className="space-y-2">
                {usuarios.map(u => (
                  <li key={u.id} className={`p-3 rounded ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-50 text-gray-900'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{u.nome}</div>
                        <div className="text-sm text-gray-400">{u.email}</div>
                      </div>
                      <div className="text-sm text-gray-400">{u.perfil || '-'}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
