import { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ordensServicoAPI, custosAPI, equipamentosAPI } from '../../lib/api';
import { defaultChartOptions, chartColors, multiColorPalette } from './components/ChartConfig';
import { useToast } from '../../hooks/useToast';

interface RelatorioData {
  ordensServico: any[];
  custos: any[];
  equipamentos: any[];
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RelatorioData>({
    ordensServico: [],
    custos: [],
    equipamentos: [],
  });
  const [periodo, setPeriodo] = useState('6'); // meses
  const { error: showError } = useToast();

  useEffect(() => {
    loadData();
  }, [periodo]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [os, custos, equipamentos] = await Promise.all([
        ordensServicoAPI.getAll(),
        custosAPI.getAll(),
        equipamentosAPI.getAll(),
      ]);

      setData({
        ordensServico: os || [],
        custos: custos || [],
        equipamentos: equipamentos || [],
      });
    } catch (err) {
      showError('Erro ao carregar dados dos relatórios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Gráfico de Ordens de Serviço por Mês
  const getOSPorMesData = () => {
    const meses = parseInt(periodo);
    const labels: string[] = [];
    const abertas: number[] = [];
    const concluidas: number[] = [];

    for (let i = meses - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const inicio = startOfMonth(date);
      const fim = endOfMonth(date);
      
      labels.push(format(date, 'MMM/yy', { locale: ptBR }));

      const osDoMes = data.ordensServico.filter((os) => {
        const dataAbertura = new Date(os.data_abertura);
        return dataAbertura >= inicio && dataAbertura <= fim;
      });

      abertas.push(osDoMes.length);
      concluidas.push(osDoMes.filter((os) => os.status === 'concluida').length);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Abertas',
          data: abertas,
          borderColor: chartColors.primary,
          backgroundColor: chartColors.primaryLight,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Concluídas',
          data: concluidas,
          borderColor: chartColors.success,
          backgroundColor: chartColors.successLight,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  // Gráfico de Custos por Mês
  const getCustosPorMesData = () => {
    const meses = parseInt(periodo);
    const labels: string[] = [];
    const valores: number[] = [];

    for (let i = meses - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const inicio = startOfMonth(date);
      const fim = endOfMonth(date);
      
      labels.push(format(date, 'MMM/yy', { locale: ptBR }));

      const custosDoMes = data.custos.filter((custo) => {
        const dataCusto = new Date(custo.data);
        return dataCusto >= inicio && dataCusto <= fim;
      });

      const total = custosDoMes.reduce((sum, custo) => sum + (custo.valor_total || 0), 0);
      valores.push(total);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Custos (R$)',
          data: valores,
          backgroundColor: chartColors.warning,
          borderColor: chartColors.warning,
          borderWidth: 2,
        },
      ],
    };
  };

  // Gráfico de OS por Status
  const getOSPorStatusData = () => {
    const statusCount: Record<string, number> = {};
    
    data.ordensServico.forEach((os) => {
      const status = os.status || 'indefinido';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const statusLabels: Record<string, string> = {
      aberta: 'Aberta',
      em_andamento: 'Em Andamento',
      pausada: 'Pausada',
      concluida: 'Concluída',
      cancelada: 'Cancelada',
    };

    return {
      labels: Object.keys(statusCount).map((s) => statusLabels[s] || s),
      datasets: [
        {
          data: Object.values(statusCount),
          backgroundColor: multiColorPalette,
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    };
  };

  // Gráfico de Equipamentos por Criticidade
  const getEquipamentosPorCriticidadeData = () => {
    const criticidadeCount: Record<string, number> = {};
    
    data.equipamentos.forEach((eq) => {
      const crit = eq.criticidade || 'indefinido';
      criticidadeCount[crit] = (criticidadeCount[crit] || 0) + 1;
    });

    const criticidadeLabels: Record<string, string> = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      critica: 'Crítica',
    };

    return {
      labels: Object.keys(criticidadeCount).map((c) => criticidadeLabels[c] || c),
      datasets: [
        {
          data: Object.values(criticidadeCount),
          backgroundColor: [
            chartColors.success,
            chartColors.warning,
            chartColors.danger,
            chartColors.purple,
          ],
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    };
  };

  // Estatísticas gerais
  const stats = {
    totalOS: data.ordensServico.length,
    osConcluidas: data.ordensServico.filter((os) => os.status === 'concluida').length,
    osAbertas: data.ordensServico.filter((os) => os.status === 'aberta').length,
    totalCustos: data.custos.reduce((sum, c) => sum + (c.valor_total || 0), 0),
    totalEquipamentos: data.equipamentos.length,
    equipamentosCriticos: data.equipamentos.filter((eq) => eq.criticidade === 'critica').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-5xl text-blue-600 animate-spin"></i>
          <p className="mt-4 text-slate-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <i className="ri-bar-chart-box-line text-xl text-white"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
                <p className="text-sm text-slate-500">Análise e estatísticas do sistema</p>
              </div>
            </div>

            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="3">Últimos 3 meses</option>
              <option value="6">Últimos 6 meses</option>
              <option value="12">Últimos 12 meses</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-file-list-3-line text-2xl text-blue-600"></i>
              </div>
              <span className="text-sm text-slate-500">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.totalOS}</h3>
            <p className="text-sm text-slate-600">Ordens de Serviço</p>
            <div className="mt-3 flex gap-4 text-xs">
              <span className="text-green-600">✓ {stats.osConcluidas} concluídas</span>
              <span className="text-blue-600">• {stats.osAbertas} abertas</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-2xl text-orange-600"></i>
              </div>
              <span className="text-sm text-slate-500">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(stats.totalCustos)}
            </h3>
            <p className="text-sm text-slate-600">Custos Totais</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="ri-settings-3-line text-2xl text-purple-600"></i>
              </div>
              <span className="text-sm text-slate-500">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.totalEquipamentos}</h3>
            <p className="text-sm text-slate-600">Equipamentos</p>
            <div className="mt-3 text-xs">
              <span className="text-red-600">⚠ {stats.equipamentosCriticos} críticos</span>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ordens de Serviço por Mês */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <i className="ri-line-chart-line text-blue-600"></i>
              Ordens de Serviço por Mês
            </h3>
            <div className="h-80">
              <Line data={getOSPorMesData()} options={defaultChartOptions} />
            </div>
          </div>

          {/* Custos por Mês */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <i className="ri-bar-chart-line text-orange-600"></i>
              Custos por Mês
            </h3>
            <div className="h-80">
              <Bar data={getCustosPorMesData()} options={defaultChartOptions} />
            </div>
          </div>

          {/* OS por Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <i className="ri-pie-chart-line text-purple-600"></i>
              Ordens de Serviço por Status
            </h3>
            <div className="h-80 flex items-center justify-center">
              <Doughnut
                data={getOSPorStatusData()}
                options={{
                  ...defaultChartOptions,
                  scales: undefined,
                }}
              />
            </div>
          </div>

          {/* Equipamentos por Criticidade */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <i className="ri-donut-chart-line text-pink-600"></i>
              Equipamentos por Criticidade
            </h3>
            <div className="h-80 flex items-center justify-center">
              <Doughnut
                data={getEquipamentosPorCriticidadeData()}
                options={{
                  ...defaultChartOptions,
                  scales: undefined,
                }}
              />
            </div>
          </div>
        </div>

        {/* Botão de Exportar */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-printer-line"></i>
            Imprimir Relatório
          </button>
        </div>
      </div>
    </div>
  );
}
