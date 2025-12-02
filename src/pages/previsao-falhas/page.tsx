import { useState, useEffect } from 'react';
import { aiPredictionService, PredictionData } from '../../lib/ai-predictions';
import { useToast } from '../../hooks/useToast';

export default function PrevisaoFalhasPage() {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'critico' | 'alto' | 'medio' | 'baixo'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      const data = await aiPredictionService.predictAllEquipments();
      setPredictions(data);
      success('Previsões atualizadas com sucesso!');
    } catch (err) {
      console.error('Erro ao carregar previsões:', err);
      showError('Erro ao carregar previsões');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (probability: number): string => {
    if (probability >= 80) return 'critico';
    if (probability >= 60) return 'alto';
    if (probability >= 40) return 'medio';
    return 'baixo';
  };

  const getRiskColor = (probability: number): string => {
    if (probability >= 80) return 'bg-red-500';
    if (probability >= 60) return 'bg-orange-500';
    if (probability >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskTextColor = (probability: number): string => {
    if (probability >= 80) return 'text-red-600';
    if (probability >= 60) return 'text-orange-600';
    if (probability >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskBgColor = (probability: number): string => {
    if (probability >= 80) return 'bg-red-50 border-red-200';
    if (probability >= 60) return 'bg-orange-50 border-orange-200';
    if (probability >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const filteredPredictions = predictions.filter(pred => {
    const matchesFilter = filter === 'todos' || getRiskLevel(pred.probabilidade_falha) === filter;
    const matchesSearch = pred.equipamento_nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: predictions.length,
    critico: predictions.filter(p => p.probabilidade_falha >= 80).length,
    alto: predictions.filter(p => p.probabilidade_falha >= 60 && p.probabilidade_falha < 80).length,
    medio: predictions.filter(p => p.probabilidade_falha >= 40 && p.probabilidade_falha < 60).length,
    baixo: predictions.filter(p => p.probabilidade_falha < 40).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Analisando equipamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <i className="ri-brain-line text-white text-2xl"></i>
              </div>
              Previsão de Falhas com IA
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Análise preditiva baseada em dados históricos e machine learning
            </p>
          </div>

          <button
            onClick={loadPredictions}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-refresh-line"></i>
            Atualizar Previsões
          </button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <i className="ri-dashboard-line text-blue-600 dark:text-blue-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-red-200 dark:border-red-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Crítico</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.critico}</p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-lg">
                <i className="ri-alarm-warning-line text-red-600 dark:text-red-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-orange-200 dark:border-orange-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Alto Risco</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.alto}</p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <i className="ri-error-warning-line text-orange-600 dark:text-orange-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-yellow-200 dark:border-yellow-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Médio Risco</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.medio}</p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <i className="ri-alert-line text-yellow-600 dark:text-yellow-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-200 dark:border-green-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Baixo Risco</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.baixo}</p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-green-100 dark:bg-green-900/30 rounded-lg">
                <i className="ri-checkbox-circle-line text-green-600 dark:text-green-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Buscar equipamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('todos')}
                className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  filter === 'todos'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Todos ({stats.total})
              </button>
              <button
                onClick={() => setFilter('critico')}
                className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  filter === 'critico'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Crítico ({stats.critico})
              </button>
              <button
                onClick={() => setFilter('alto')}
                className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  filter === 'alto'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Alto ({stats.alto})
              </button>
              <button
                onClick={() => setFilter('medio')}
                className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  filter === 'medio'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Médio ({stats.medio})
              </button>
              <button
                onClick={() => setFilter('baixo')}
                className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  filter === 'baixo'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Baixo ({stats.baixo})
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Previsões */}
        <div className="space-y-4">
          {filteredPredictions.map((pred) => (
            <div
              key={pred.equipamento_id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 ${getRiskBgColor(pred.probabilidade_falha)} dark:border-gray-700`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {pred.equipamento_nome}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <i className="ri-time-line"></i>
                      Atualizado: {pred.ultima_atualizacao.toLocaleString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="ri-database-2-line"></i>
                      {pred.historico_usado} registros analisados
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-4xl font-bold ${getRiskTextColor(pred.probabilidade_falha)}`}>
                    {pred.probabilidade_falha}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Probabilidade de Falha
                  </div>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`${getRiskColor(pred.probabilidade_falha)} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${pred.probabilidade_falha}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-calendar-line text-gray-600 dark:text-gray-400"></i>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tempo Estimado</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pred.dias_ate_falha} dias
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-shield-check-line text-gray-600 dark:text-gray-400"></i>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Confiança</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pred.confianca}%
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-alert-line text-gray-600 dark:text-gray-400"></i>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Fatores de Risco</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pred.fatores_risco.length}
                  </div>
                </div>
              </div>

              {/* Fatores de Risco */}
              {pred.fatores_risco.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <i className="ri-error-warning-line"></i>
                    Fatores de Risco Identificados:
                  </h4>
                  <ul className="space-y-2">
                    {pred.fatores_risco.map((fator, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <i className="ri-arrow-right-s-line text-red-500 mt-1"></i>
                        <span>{fator}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recomendações */}
              {pred.recomendacoes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <i className="ri-lightbulb-line"></i>
                    Recomendações:
                  </h4>
                  <ul className="space-y-2">
                    {pred.recomendacoes.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <i className="ri-checkbox-circle-line text-green-500 mt-1"></i>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {filteredPredictions.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <i className="ri-search-line text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600 dark:text-gray-400">
                Nenhuma previsão encontrada com os filtros aplicados
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
