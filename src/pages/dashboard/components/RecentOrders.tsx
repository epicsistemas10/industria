import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface RecentOrdersProps {
  darkMode: boolean;
}

interface Order {
  id: string;
  numero_os: string;
  titulo: string;
  equipamento: string;
  prioridade: string;
  status: string;
}

export default function RecentOrders({ darkMode }: RecentOrdersProps) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      setError(false);
      const { data, error: supabaseError } = await supabase
        .from('ordens_servico')
        .select('id, numero_os, titulo, status, prioridade, equipamentos(nome)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (supabaseError) {
        console.error('Erro ao carregar ordens:', supabaseError);
        setError(true);
        return;
      }

      if (data) {
        setOrders(data.map(os => ({
          id: os.id,
          numero_os: os.numero_os || 'N/A',
          titulo: os.titulo || 'Sem título',
          equipamento: os.equipamentos?.nome || 'N/A',
          prioridade: os.prioridade || 'media',
          status: os.status || 'aberta',
        })));
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Erro ao carregar ordens de serviço:', error);
      setError(true);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return 'bg-red-500/20 text-red-400';
      case 'alta':
        return 'bg-orange-500/20 text-orange-400';
      case 'media':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'baixa':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'bg-green-500/20 text-green-400';
      case 'em_andamento':
        return 'bg-blue-500/20 text-blue-400';
      case 'pausada':
        return 'bg-orange-500/20 text-orange-400';
      case 'aberta':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelada':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'Concluída';
      case 'em_andamento':
        return 'Em Andamento';
      case 'pausada':
        return 'Pausada';
      case 'aberta':
        return 'Aberta';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <div className={`rounded-xl p-6 ${
      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
    } border shadow-lg`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Ordens de Serviço Recentes
        </h3>
        <button 
          onClick={() => navigate('/ordens-servico')}
          className={`text-sm ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} cursor-pointer`}
        >
          Ver todas
        </button>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'} animate-pulse`}>
                <div className="flex justify-between items-center">
                  <div className="flex gap-3">
                    <div className={`h-4 w-16 rounded ${darkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                    <div className={`h-4 w-24 rounded ${darkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                  </div>
                  <div className="flex gap-2">
                    <div className={`h-6 w-16 rounded-full ${darkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                    <div className={`h-6 w-16 rounded-full ${darkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <i className="ri-error-warning-line text-4xl text-red-400 mb-2"></i>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Erro ao carregar ordens de serviço
            </p>
            <button 
              onClick={loadOrders}
              className="mt-2 text-sm text-blue-500 hover:text-blue-600 cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <i className="ri-inbox-line text-4xl text-gray-400 mb-2"></i>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Nenhuma ordem de serviço cadastrada
            </p>
            <button 
              onClick={() => navigate('/ordens-servico')}
              className="mt-2 text-sm text-blue-500 hover:text-blue-600 cursor-pointer"
            >
              Criar primeira ordem
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className={`text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                <th className="pb-3">OS</th>
                <th className="pb-3">Equipamento</th>
                <th className="pb-3">Prioridade</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-700/50' : 'divide-gray-200'}`}>
              {orders.map((order) => (
                <tr 
                  key={order.id} 
                  onClick={() => navigate('/ordens-servico')}
                  className={`cursor-pointer ${darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'} transition-colors`}
                >
                  <td className="py-3">
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {order.numero_os}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {order.equipamento}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.prioridade)}`}>
                      {order.prioridade.charAt(0).toUpperCase() + order.prioridade.slice(1)}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
