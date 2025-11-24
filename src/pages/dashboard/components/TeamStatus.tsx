import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

interface TeamStatusProps {
  darkMode: boolean;
}

interface TeamView {
  id: string;
  nome: string;
  lider?: string | null;
  members: number;
  active: number;
  tasks: number;
  status: 'working' | 'break' | 'offline';
}

export default function TeamStatus({ darkMode }: TeamStatusProps) {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    try {
      // carregar equipes
      const { data: equipesData, error: equipesErr } = await supabase
        .from('equipes')
        .select('*')
        .order('nome');

      if (equipesErr) throw equipesErr;

      // carregar colaboradores
      const { data: colabData, error: colabErr } = await supabase
        .from('colaboradores')
        .select('*')
        .order('nome');

      if (colabErr) throw colabErr;

      // tentar carregar ordens_servico agrupadas por equipe (caso exista coluna equipe_id)
      let ordensCountByEquipe: Record<string, number> = {};
      try {
        const { data: ordData, error: ordErr } = await supabase
          .from('ordens_servico')
          .select('id, equipe_id');
        if (!ordErr && ordData) {
          ordData.forEach((o: any) => {
            const k = o.equipe_id || 'none';
            ordensCountByEquipe[k] = (ordensCountByEquipe[k] || 0) + 1;
          });
        }
      } catch (err) {
        // se tabela/coluna não existir, ignore silently
        ordensCountByEquipe = {};
      }

      const mapped: TeamView[] = (equipesData || []).map((e: any) => {
        const membersList = (colabData || []).filter((c: any) => c.equipe_id === e.id);
        const active = membersList.filter((m: any) => m.status === 'ativo').length;
        const tasks = ordensCountByEquipe[e.id] || 0;
        // determine status: if most members active -> working, else break/offline
        const status: TeamView['status'] = active >= Math.ceil(membersList.length * 0.7) ? 'working' : (active > 0 ? 'break' : 'offline');

        return {
          id: e.id,
          nome: e.nome || e.nome_equipe || 'Equipe',
          lider: e.lider || null,
          members: membersList.length,
          active,
          tasks,
          status,
        };
      });

      setTeams(mapped);
    } catch (err) {
      console.error('Erro ao carregar status das equipes:', err);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-green-500';
      case 'break':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'working':
        return 'Trabalhando';
      case 'break':
        return 'Intervalo';
      default:
        return 'Offline';
    }
  };

  return (
    <div className={`rounded-xl p-6 ${
      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
    } border shadow-lg`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Status das Equipes
        </h3>
        <button 
          onClick={() => navigate('/equipes')}
          className={`text-sm ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} cursor-pointer`}
        >
          Gerenciar
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-sm text-gray-400">Carregando equipes...</div>
        ) : (
          teams.map((team) => (
            <div key={team.id} className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{team.nome}</h4>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Líder: {team.lider || '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(team.status)}`}></span>
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{getStatusText(team.status)}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <i className={`ri-user-line text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{team.active}/{team.members}</span>
                </div>
                <div className="flex items-center gap-1">
                  <i className={`ri-task-line text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{team.tasks} tarefas</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
