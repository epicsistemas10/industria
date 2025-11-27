
import { useAuth } from '../../../contexts/AuthContext';
import NotificationCenter from '../../../components/base/NotificationCenter';
import useSidebar from '../../../hooks/useSidebar';

interface TopBarProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export default function TopBar({ darkMode, setDarkMode }: TopBarProps) {
  const { signOut } = useAuth();
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();

  return (
    <div className={`h-16 border-b ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} flex items-center justify-between px-6`}>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors text-gray-300"
          title={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          <i className={`text-xl ${sidebarOpen ? 'ri-menu-fold-line' : 'ri-menu-line'}`}></i>
        </button>
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Sistema de Manutenção Industrial
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Center */}
        <NotificationCenter darkMode={darkMode} />

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
            darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
          }`}
        >
          <i className={`${darkMode ? 'ri-sun-line' : 'ri-moon-line'} text-xl ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}></i>
        </button>

        {/* Logout Button */}
        <button
          onClick={signOut}
          className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center cursor-pointer hover:from-purple-700 hover:to-blue-700 transition-all"
          title="Sair"
        >
          <i className="ri-logout-box-line text-white"></i>
        </button>
      </div>
    </div>
  );
}
