import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface EquipmentStatusProps {
  darkMode: boolean;
}

interface Equipment {
  id: string;
  nome: string;
  setor: string;
  status: string;
  status_revisao: number;
}

export default function EquipmentStatus({ darkMode }: EquipmentStatusProps) {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadEquipment();
    const interval = setInterval(loadEquipment, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadEquipment = async () => {
    try {
      setError(false);
      const { data, error: supabaseError } = await supabase
        .from('equipamentos')
        .select('id, nome, status_revisao, setores(nome)')
        .order('status_revisao', { ascending: false })
        .limit(6);

      if (supabaseError) {
        console.error('Erro ao carregar equipamentos:', supabaseError);
        setError(true);
        return;
      }

      if (data) {
        setEquipment(data.map(eq => {
          // Determinar status baseado no status_revisao
          let status = 'operacional';
          const revisao = eq.status_revisao || 0;
          
          if (revisao === 100) {
            status = 'operacional';
          } else if (revisao >= 50) {
            status = 'manutencao';
          } else if (revisao > 0) {
            status = 'alerta';
          } else {
            status = 'pendente';
          }

          return {
            id: eq.id,
            nome: eq.nome || 'Sem nome',
            setor: eq.setores?.nome || 'Sem setor',
            status,
            status_revisao: revisao,
          };
        }));
      } else {
        setEquipment([]);
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
      setError(true);
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operacional':
        return 'text-green-400';
      case 'manutencao':
        return 'text-blue-400';
      case 'parado':
        return 'text-red-400';
      case 'alerta':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operacional':
        return 'ri-checkbox-circle-fill';
      case 'manutencao':
        return 'ri-loader-4-line';
      case 'parado':
        return 'ri-close-circle-fill';
      case 'alerta':
        return 'ri-error-warning-fill';
      default:
        return 'ri-question-line';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress > 0) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className={`rounded-xl p-6 ${
      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
    } border shadow-lg`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Status dos Equipamentos
        </h3>
        <button 
          onClick={() => navigate('/equipamentos')}
          className={`text-sm ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} cursor-pointer`}
        >
          Ver todos
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'} animate-pulse`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${darkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                    <div className={`h-4 w-32 rounded ${darkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                  </div>
                  <div className={`h-4 w-8 rounded ${darkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className={`h-3 w-20 rounded ${darkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                  <div className={`w-24 h-2 rounded-full ${darkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <i className="ri-error-warning-line text-4xl text-red-400 mb-2"></i>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Erro ao carregar equipamentos
            </p>
            <button 
              onClick={loadEquipment}
              className="mt-2 text-sm text-blue-500 hover:text-blue-600 cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        ) : equipment.length === 0 ? (
          <div className="text-center py-8">
            <i className="ri-inbox-line text-4xl text-gray-400 mb-2"></i>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Nenhum equipamento cadastrado
            </p>
            <button 
              onClick={() => navigate('/equipamentos')}
              className="mt-2 text-sm text-blue-500 hover:text-blue-600 cursor-pointer"
            >
              Cadastrar equipamentos
            </button>
          </div>
        ) : (
          equipment.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/equipamento-detalhes?id=${item.id}`)}
              className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700/70' : 'bg-gray-50 hover:bg-gray-100'} cursor-pointer transition-colors`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <i className={`${getStatusIcon(item.status)} ${getStatusColor(item.status)}`}></i>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.nome}
                  </span>
                </div>
                <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {item.status_revisao}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {item.setor}
                </span>
                <div className={`w-24 h-1.5 rounded-full ${darkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                  <div
                    className={`h-full rounded-full ${getProgressColor(item.status_revisao)} transition-all duration-500`}
                    style={{ width: `${item.status_revisao}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
