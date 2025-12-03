import React, { useState } from 'react';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';

export default function SuprimentosPage() {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Suprimentos</h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Gerencie suprimentos e regras de conversão para acompanhar equivalências.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all whitespace-nowrap">Adicionar Suprimento</button>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 shadow`}> 
            <p className="text-sm text-gray-300">Página inicial de Suprimentos — aqui você poderá adicionar produtos como "Sacaria para fardos" e definir suas regras de conversão (ex.: 100000 estoque = 100000 fardos). Vou deixar este espaço para você preencher as regras depois.</p>

            <div className="mt-6 overflow-x-auto">
              <table className={`min-w-full text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                <thead className={`${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="px-4 py-2 text-left">Nome</th>
                    <th className="px-4 py-2 text-left">Estoque</th>
                    <th className="px-4 py-2 text-left">Equivalência</th>
                    <th className="px-4 py-2 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3 text-center">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
