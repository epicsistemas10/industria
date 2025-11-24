import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../lib/i18n';

interface KPI {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down';
  icon: string;
  color: string;
}

export default function DashboardExecutivo() {
  const { t } = useTranslation();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadKPIs();
    const interval = setInterval(loadKPIs, 60000); // Atualizar a cada minuto
    return () => clearInterval(interval);
  }, [periodo]);

  const loadKPIs = async () => {
    try {
      const dataInicio = new Date();
      if (periodo === '7d') dataInicio.setDate(dataInicio.getDate() - 7);
      else if (periodo === '30d') dataInicio.setDate(dataInicio.getDate() - 30);
      else dataInicio.setDate(dataInicio.getDate() - 90);

      // Disponibilidade de Equipamentos
      const { data: equipamentos } = await supabase.from('equipamentos').select('status');
      const totalEquip = equipamentos?.length || 0;
      const operacionais = equipamentos?.filter(e => e.status === 'operacional').length || 0;
      const disponibilidade = totalEquip > 0 ? (operacionais / totalEquip) * 100 : 0;

      // MTTR (Mean Time To Repair)
      const { data: osCompletas } = await supabase
        .from('ordens_servico')
        .select('data_abertura, data_conclusao')
        .eq('status', 'concluida')
        .gte('data_conclusao', dataInicio.toISOString());

      let mttr = 0;
      if (osCompletas && osCompletas.length > 0) {
        const tempos = osCompletas.map(os => {
          const inicio = new Date(os.data_abertura).getTime();
          const fim = new Date(os.data_conclusao).getTime();
          return (fim - inicio) / (1000 * 60 * 60); // horas
        });
        mttr = tempos.reduce((a, b) => a + b, 0) / tempos.length;
      }

      // MTBF (Mean Time Between Failures)
      const { data: historico } = await supabase
        .from('historico_revisoes')
        .select('data_revisao')
        .gte('data_revisao', dataInicio.toISOString())
        .order('data_revisao', { ascending: true });

      let mtbf = 0;
      if (historico && historico.length > 1) {
        const intervalos = [];
        for (let i = 1; i < historico.length; i++) {
          const anterior = new Date(historico[i - 1].data_revisao).getTime();
          const atual = new Date(historico[i].data_revisao).getTime();
          intervalos.push((atual - anterior) / (1000 * 60 * 60 * 24)); // dias
        }
        mtbf = intervalos.reduce((a, b) => a + b, 0) / intervalos.length;
      }

      // Custos Totais
      const { data: custos } = await supabase
        .from('custos')
        .select('valor')
        .gte('data', dataInicio.toISOString());

      const custoTotal = custos?.reduce((sum, c) => sum + c.valor, 0) || 0;

      // Taxa de Conclusão de OS
      const { data: todasOS } = await supabase
        .from('ordens_servico')
        .select('status')
        .gte('data_abertura', dataInicio.toISOString());

      const totalOS = todasOS?.length || 0;
      const concluidas = todasOS?.filter(os => os.status === 'concluida').length || 0;
      const taxaConclusao = totalOS > 0 ? (concluidas / totalOS) * 100 : 0;

      // Economia com Melhorias
      const { data: melhorias } = await supabase
        .from('melhorias')
        .select('economia_estimada')
        .eq('status', 'concluida')
        .gte('data_implementacao', dataInicio.toISOString());

      const economia = melhorias?.reduce((sum, m) => sum + (m.economia_estimada || 0), 0) || 0;

      // Backlog de Manutenção
      const { data: osAbertas } = await supabase
        .from('ordens_servico')
        .select('id')
        .in('status', ['aberta', 'em_andamento']);

      const backlog = osAbertas?.length || 0;

      // Eficiência da Equipe
      const { data: equipes } = await supabase.from('equipes').select('disponivel');
      const totalEquipes = equipes?.length || 0;
      const disponiveis = equipes?.filter(e => e.disponivel).length || 0;
      const eficienciaEquipe = totalEquipes > 0 ? (disponiveis / totalEquipes) * 100 : 0;

      setKpis([
        {
          label: 'Disponibilidade de Equipamentos',
          value: `${disponibilidade.toFixed(1)}%`,
          change: 2.5,
          trend: 'up',
          icon: 'ri-settings-3-line',
          color: 'from-blue-500 to-cyan-500',
        },
        {
          label: 'MTTR (Tempo Médio de Reparo)',
          value: `${mttr.toFixed(1)}h`,
          change: -5.2,
          trend: 'down',
          icon: 'ri-time-line',
          color: 'from-green-500 to-emerald-500',
        },
        {
          label: 'MTBF (Tempo Médio Entre Falhas)',
          value: `${mtbf.toFixed(0)} dias`,
          change: 8.3,
          trend: 'up',
          icon: 'ri-calendar-check-line',
          color: 'from-purple-500 to-pink-500',
        },
        {
          label: 'Custos de Manutenção',
          value: `R$ ${custoTotal.toLocaleString('pt-BR')}`,
          change: -3.1,
          trend: 'down',
          icon: 'ri-money-dollar-circle-line',
          color: 'from-orange-500 to-red-500',
        },
        {
          label: 'Taxa de Conclusão de OS',
          value: `${taxaConclusao.toFixed(1)}%`,
          change: 4.7,
          trend: 'up',
          icon: 'ri-checkbox-circle-line',
          color: 'from-teal-500 to-cyan-500',
        },
        {
          label: 'Economia com Melhorias',
          value: `R$ ${economia.toLocaleString('pt-BR')}`,
          change: 12.5,
          trend: 'up',
          icon: 'ri-lightbulb-line',
          color: 'from-yellow-500 to-orange-500',
        },
        {
          label: 'Backlog de Manutenção',
          value: backlog,
          change: -2.8,
          trend: 'down',
          icon: 'ri-file-list-3-line',
          color: 'from-red-500 to-pink-500',
        },
        {
          label: 'Eficiência da Equipe',
          value: `${eficienciaEquipe.toFixed(1)}%`,
          change: 3.2,
          trend: 'up',
          icon: 'ri-team-line',
          color: 'from-indigo-500 to-purple-500',
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">
          <i className="ri-loader-4-line animate-spin mr-2"></i>
          Carregando KPIs...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              <i className="ri-dashboard-line mr-3"></i>
              Dashboard Executivo
            </h1>
            <p className="text-slate-400">
              Indicadores-chave de desempenho em tempo real
            </p>
          </div>

          {/* Filtro de Período */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  periodo === p
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {p === '7d' ? '7 Dias' : p === '30d' ? '30 Dias' : '90 Dias'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all hover:shadow-xl hover:shadow-blue-500/10"
          >
            {/* Ícone e Trend */}
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                <i className={`${kpi.icon} text-2xl text-white`}></i>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                kpi.trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <i className={`${kpi.trend === 'up' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} text-sm`}></i>
                <span className="text-xs font-semibold">{Math.abs(kpi.change)}%</span>
              </div>
            </div>

            {/* Valor */}
            <div className="mb-2">
              <div className="text-3xl font-bold text-white mb-1">{kpi.value}</div>
              <div className="text-sm text-slate-400">{kpi.label}</div>
            </div>

            {/* Barra de Progresso (para percentuais) */}
            {typeof kpi.value === 'string' && kpi.value.includes('%') && (
              <div className="mt-4">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${kpi.color} transition-all duration-500`}
                    style={{ width: kpi.value }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Gráficos Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Tendência de Disponibilidade */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4">
            <i className="ri-line-chart-line mr-2"></i>
            Tendência de Disponibilidade
          </h3>
          <div className="h-64 flex items-center justify-center text-slate-500">
            <i className="ri-bar-chart-box-line text-6xl"></i>
          </div>
        </div>

        {/* Distribuição de Custos */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4">
            <i className="ri-pie-chart-line mr-2"></i>
            Distribuição de Custos
          </h3>
          <div className="h-64 flex items-center justify-center text-slate-500">
            <i className="ri-donut-chart-line text-6xl"></i>
          </div>
        </div>
      </div>

      {/* Alertas e Recomendações */}
      <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-bold text-white mb-4">
          <i className="ri-alarm-warning-line mr-2"></i>
          Alertas e Recomendações
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <i className="ri-error-warning-line text-2xl text-red-400 mt-1"></i>
            <div>
              <div className="font-semibold text-red-400">Backlog Elevado</div>
              <div className="text-sm text-slate-400">
                O backlog de manutenção está acima do ideal. Considere alocar mais recursos.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <i className="ri-alert-line text-2xl text-yellow-400 mt-1"></i>
            <div>
              <div className="font-semibold text-yellow-400">MTTR em Aumento</div>
              <div className="text-sm text-slate-400">
                O tempo médio de reparo aumentou 5.2%. Revise os processos de manutenção.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <i className="ri-checkbox-circle-line text-2xl text-green-400 mt-1"></i>
            <div>
              <div className="font-semibold text-green-400">Economia Significativa</div>
              <div className="text-sm text-slate-400">
                As melhorias implementadas geraram 12.5% de economia. Continue investindo em otimizações.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
