
import { useAuth } from '../../../contexts/AuthContext';
import NotificationCenter from '../../../components/base/NotificationCenter';
import useSidebar from '../../../hooks/useSidebar';
import { useEffect } from 'react';

interface TopBarProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export default function TopBar({ darkMode, setDarkMode }: TopBarProps) {
  const { signOut } = useAuth();
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();

  // On mount, read persisted theme from localStorage and sync with parent state
  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored) {
        const isDark = stored === 'dark';
        if (isDark !== darkMode) setDarkMode(isDark);
      }
    } catch (e) {
      // ignore storage access errors (e.g., SSR or privacy settings)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`h-16 border-b ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} flex items-center justify-between px-6`}>
      <div className="flex items-center gap-4">
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Sistema de Manutenção Industrial
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Center */}
        <NotificationCenter darkMode={darkMode} />

        {/* Dark Mode Toggle */}
        <button
          onClick={() => {
            const newMode = !darkMode;
            try {
              localStorage.setItem('theme', newMode ? 'dark' : 'light');
            } catch (e) {
              // ignore
            }
            // apply class immediately for visual feedback
            if (newMode) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
            setDarkMode(newMode);
          }}
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
