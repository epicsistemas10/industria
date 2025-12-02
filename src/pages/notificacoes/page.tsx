import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Notificacao {
  id: string;
  tipo: 'info' | 'alerta' | 'urgente' | 'sucesso';
  titulo: string;
  mensagem: string;
  lida: boolean;
  data: string;
  icone: string;
}

export default function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [filtro, setFiltro] = useState<'todas' | 'nao-lidas' | 'lidas'>('todas');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  const carregarNotificacoes = () => {
    // Notificações simuladas - em produção viriam do Supabase
    const notificacoesSimuladas: Notificacao[] = [
      {
        id: '1',
        tipo: 'urgente',
        titulo: 'Equipamento Parado',
        mensagem: 'Torno CNC-001 parou de funcionar. Manutenção urgente necessária.',
        lida: false,
        data: new Date().toISOString(),
        icone: 'ri-alert-line'
      },
      {
        id: '2',
        tipo: 'alerta',
        titulo: 'Manutenção Preventiva Atrasada',
        mensagem: 'Prensa Hidráulica PH-003 está com manutenção preventiva atrasada há 5 dias.',
        lida: false,
        data: new Date(Date.now() - 3600000).toISOString(),
        icone: 'ri-time-line'
      },
      {
        id: '3',
        tipo: 'info',
        titulo: 'OS Concluída',
        mensagem: 'Ordem de Serviço #1234 foi concluída pela equipe de manutenção.',
        lida: false,
        data: new Date(Date.now() - 7200000).toISOString(),
        icone: 'ri-checkbox-circle-line'
      },
      {
        id: '4',
        tipo: 'alerta',
        titulo: 'Componente em Estoque Baixo',
        mensagem: 'Rolamento SKF 6205 está com apenas 2 unidades em estoque.',
        lida: true,
        data: new Date(Date.now() - 86400000).toISOString(),
        icone: 'ri-box-3-line'
      },
      {
        id: '5',
        tipo: 'sucesso',
        titulo: 'Melhoria Aprovada',
        mensagem: 'Sua proposta de melhoria "Otimização do Sistema de Refrigeração" foi aprovada.',
        lida: true,
        data: new Date(Date.now() - 172800000).toISOString(),
        icone: 'ri-lightbulb-line'
      },
      {
        id: '6',
        tipo: 'info',
        titulo: 'Nova Equipe Cadastrada',
        mensagem: 'Equipe "Manutenção Elétrica B" foi cadastrada no sistema.',
        lida: true,
        data: new Date(Date.now() - 259200000).toISOString(),
        icone: 'ri-team-line'
      },
      {
        id: '7',
        tipo: 'urgente',
        titulo: 'Temperatura Crítica',
        mensagem: 'Compressor AR-002 atingiu temperatura crítica de 95°C.',
        lida: true,
        data: new Date(Date.now() - 345600000).toISOString(),
        icone: 'ri-temp-hot-line'
      },
      {
        id: '8',
        tipo: 'alerta',
        titulo: 'Revisão Programada',
        mensagem: 'Revisão trimestral do Torno CNC-002 agendada para amanhã às 08:00.',
        lida: true,
        data: new Date(Date.now() - 432000000).toISOString(),
        icone: 'ri-calendar-check-line'
      }
    ];

    setNotificacoes(notificacoesSimuladas);
  };

  const marcarComoLida = (id: string) => {
    setNotificacoes(prev =>
      prev.map(n => n.id === id ? { ...n, lida: true } : n)
    );
  };

  const marcarTodasComoLidas = () => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const excluirNotificacao = (id: string) => {
    setNotificacoes(prev => prev.filter(n => n.id !== id));
  };

  const notificacoesFiltradas = notificacoes.filter(n => {
    if (filtro === 'lidas' && !n.lida) return false;
    if (filtro === 'nao-lidas' && n.lida) return false;
    if (tipoFiltro !== 'todos' && n.tipo !== tipoFiltro) return false;
    return true;
  });

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  const getTipoConfig = (tipo: string) => {
    const configs = {
      urgente: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500' },
      alerta: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500' },
      info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500' },
      sucesso: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', badge: 'bg-green-500' }
    };
    return configs[tipo as keyof typeof configs] || configs.info;
  };

  const formatarData = (data: string) => {
    const agora = new Date();
    const dataNotif = new Date(data);
    const diff = agora.getTime() - dataNotif.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Agora';
    if (minutos < 60) return `${minutos}m atrás`;
    if (horas < 24) return `${horas}h atrás`;
    return `${dias}d atrás`;
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Notificações</h1>
              <p className="text-orange-100">Central de alertas e avisos do sistema</p>
            </div>
            {naoLidas > 0 && (
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <span className="text-white font-bold text-2xl">{naoLidas}</span>
                  <p className="text-xs text-orange-100">não lidas</p>
                </div>
                <button
                  onClick={marcarTodasComoLidas}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <i className="ri-check-double-line"></i>
                  Marcar todas como lidas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filtros */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Filtro Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Status:</span>
              <div className="flex gap-2">
                {[
                  { id: 'todas', nome: 'Todas', icon: 'ri-notification-line' },
                  { id: 'nao-lidas', nome: 'Não Lidas', icon: 'ri-notification-badge-line' },
                  { id: 'lidas', nome: 'Lidas', icon: 'ri-notification-off-line' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFiltro(f.id as any)}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                      filtro === f.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <i className={f.icon}></i>
                    {f.nome}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-6 w-px bg-gray-700"></div>

            {/* Filtro Tipo */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Tipo:</span>
              <div className="flex gap-2">
                {[
                  { id: 'todos', nome: 'Todos', icon: 'ri-filter-line' },
                  { id: 'urgente', nome: 'Urgente', icon: 'ri-alert-line' },
                  { id: 'alerta', nome: 'Alerta', icon: 'ri-error-warning-line' },
                  { id: 'info', nome: 'Info', icon: 'ri-information-line' },
                  { id: 'sucesso', nome: 'Sucesso', icon: 'ri-checkbox-circle-line' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTipoFiltro(t.id)}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                      tipoFiltro === t.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <i className={t.icon}></i>
                    {t.nome}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Notificações */}
        <div className="space-y-3">
          {notificacoesFiltradas.length === 0 ? (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
              <i className="ri-notification-off-line text-6xl text-gray-700 mb-4"></i>
              <h3 className="text-xl font-bold text-gray-400 mb-2">Nenhuma notificação</h3>
              <p className="text-gray-500">Não há notificações para exibir com os filtros selecionados.</p>
            </div>
          ) : (
            notificacoesFiltradas.map(notif => {
              const config = getTipoConfig(notif.tipo);
              return (
                <div
                  key={notif.id}
                  className={`bg-gray-900 rounded-lg border transition-all group ${
                    notif.lida ? 'border-gray-800' : `${config.border} border-2`
                  }`}
                >
                  <div className="p-4 flex items-start gap-4">
                    {/* Ícone */}
                    <div className={`w-12 h-12 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <i className={`${notif.icone} text-2xl ${config.text}`}></i>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className={`font-bold ${notif.lida ? 'text-gray-400' : 'text-white'}`}>
                            {notif.titulo}
                          </h3>
                          {!notif.lida && (
                            <span className={`w-2 h-2 rounded-full ${config.badge} animate-pulse`}></span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{formatarData(notif.data)}</span>
                      </div>
                      <p className={`text-sm ${notif.lida ? 'text-gray-500' : 'text-gray-300'}`}>
                        {notif.mensagem}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.lida && (
                        <button
                          onClick={() => marcarComoLida(notif.id)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                          title="Marcar como lida"
                        >
                          <i className="ri-check-line"></i>
                        </button>
                      )}
                      <button
                        onClick={() => excluirNotificacao(notif.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}