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
  membrosList?: Array<any>;
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
        const membersList = (colabData || []).filter((c: any) => c.equipe_id === e.id).map((c: any) => ({
          id: c.id,
          nome: c.nome,
          foto_url: c.foto_url,
          status: c.status
        }));
        const active = membersList.filter((m: any) => m.status === 'ativo').length;
        const tasks = ordensCountByEquipe[e.id] || 0;
        // determine status: if most members active -> working, else break/offline
        const status: TeamView['status'] = active >= Math.ceil(membersList.length * 0.7) ? 'working' : (active > 0 ? 'break' : 'offline');

        return {
          id: e.id,
          nome: e.nome || e.nome_equipe || 'Equipe',
          lider: e.lider || null,
          members: membersList.length,
          membrosList: membersList,
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

  const findCollaborator = (members: any[] | undefined, key: string | null) => {
    if (!members || !key) return null;
    let f = members.find(m => m.id === key);
    if (f) return f;
    f = members.find(m => m.nome === key);
    return f || null;
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
                  <div className="flex items-center gap-3">
                    <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{team.nome}</h4>
                    <div className="flex -space-x-2">
                      {team.membrosList && team.membrosList.slice(0,4).map((m) => (
                        <div key={m.id} className="w-8 h-8 rounded-full ring-2 ring-white overflow-hidden bg-gray-200">
                          {m.foto_url ? (
                            <img src={m.foto_url} alt={m.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-700 bg-gray-100">{(m.nome || '').split(' ').map((n: string) => n[0]).slice(0,2).join('')}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-2`}>
                    {(() => {
                      const leader = findCollaborator(team.membrosList, team.lider || null);
                      if (leader) {
                        return (
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200">
                            {leader.foto_url ? (
                              <img src={leader.foto_url} alt={leader.nome} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-700 bg-gray-100">{(leader.nome || '').split(' ').map((n: string) => n[0]).slice(0,2).join('')}</div>
                            )}
                          </div>
                        );
                      }
                      return <span className="text-xs">—</span>;
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(team.status)}`}></span>
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{getStatusText(team.status)}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {team.membrosList && team.membrosList.slice(0,4).map((m) => (
                      <div key={`sm-${m.id}`} className="w-6 h-6 rounded-full ring-1 ring-white overflow-hidden bg-gray-200">
                        {m.foto_url ? (
                          <img src={m.foto_url} alt={m.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] font-semibold text-gray-700 bg-gray-100">{(m.nome || '').split(' ').map((n: string) => n[0]).slice(0,2).join('')}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="ml-2 text-sm">
                    <i className={`ri-user-line text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                    <span className={`ml-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{team.active}/{team.members}</span>
                  </div>
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
