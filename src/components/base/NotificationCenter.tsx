import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Notification {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  lida: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  darkMode?: boolean;
}

export default function NotificationCenter({ darkMode = true }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // Subscrever a mudanças em tempo real
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notificacoes',
      }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.lida).length);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);

      loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('lida', false);

      loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'success':
        return 'ri-checkbox-circle-fill text-green-500';
      case 'error':
        return 'ri-close-circle-fill text-red-500';
      case 'warning':
        return 'ri-error-warning-fill text-yellow-500';
      default:
        return 'ri-information-fill text-blue-500';
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
          darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
        }`}
      >
        <i className={`ri-notification-3-line text-xl ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className={`absolute right-0 mt-2 w-96 rounded-xl shadow-2xl border z-50 ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Notificações
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-purple-400 hover:text-purple-300 cursor-pointer"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <i className="ri-notification-off-line text-4xl text-gray-400 mb-2"></i>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Nenhuma notificação
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.lida && markAsRead(notification.id)}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      darkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'
                    } ${!notification.lida ? (darkMode ? 'bg-slate-700/30' : 'bg-blue-50') : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <i className={`${getIcon(notification.tipo)} text-xl mt-1`}></i>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {notification.titulo}
                          </h4>
                          {!notification.lida && (
                            <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {notification.mensagem}
                        </p>
                        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-700">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.REACT_APP_NAVIGATE('/notificacoes');
                  }}
                  className="w-full text-center text-sm text-purple-400 hover:text-purple-300 cursor-pointer"
                >
                  Ver todas as notificações
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
