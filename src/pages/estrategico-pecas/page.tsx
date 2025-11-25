import { useState, useEffect } from 'react';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import { supabase } from '../../lib/supabase';
import PecaModal from '../../components/modals/PecaModal';

interface PecaAnalise {
  nome: string;
  codigo: string;
  marca: string;
  tipo: string;
  quantidade_total: number;
  quantidade_trocada: number;
  custo_total: number;
  equipamentos: string[];
  fornecedores: string[];
  historico: Array<{
    data: string;
    quantidade: number;
    equipamento: string;
  }>;
}

export default function EstrategicoPecasPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedMarca, setSelectedMarca] = useState('');
  const [pecaAnalise, setPecaAnalise] = useState<PecaAnalise | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPecaModal, setShowPecaModal] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const buscarPeca = async () => {
    if (!searchTerm) return;
    
    setLoading(true);
    
    // Simulação de dados - em produção, viriam do Supabase com queries complexas
    const mockData: PecaAnalise = {
      nome: searchTerm,
      codigo: 'ROL-6206',
      marca: 'SKF',
      tipo: 'Rolamento',
      quantidade_total: 48,
      quantidade_trocada: 32,
      custo_total: 15680.00,
      equipamentos: ['Descaroçador 1', 'Descaroçador 2', 'Prensa 1', 'Prensa 2', 'Secador 1'],
      fornecedores: ['SKF Brasil', 'Rolamentos ABC', 'Distribuidora XYZ'],
      historico: [
        { data: '2024-01', quantidade: 4, equipamento: 'Descaroçador 1' },
        { data: '2024-02', quantidade: 6, equipamento: 'Prensa 1' },
        { data: '2024-03', quantidade: 5, equipamento: 'Descaroçador 2' },
        { data: '2024-04', quantidade: 8, equipamento: 'Prensa 2' },
        { data: '2024-05', quantidade: 4, equipamento: 'Secador 1' },
        { data: '2024-06', quantidade: 5, equipamento: 'Descaroçador 1' },
      ]
    };

    setTimeout(() => {
      setPecaAnalise(mockData);
      setLoading(false);
    }, 800);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} darkMode={darkMode} />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <main className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Análise Estratégica de Peças
            </h1>
            <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Consulta inteligente de peças e componentes
            </p>
          </div>

          {/* Busca */}
          <div className={`rounded-xl p-6 mb-6 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nome ou Código da Peça
                </label>
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Ex: Rolamento 6206, Correia A-45..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && buscarPeca()}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tipo
                </label>
                <select
                  value={selectedTipo}
                  onChange={(e) => setSelectedTipo(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border cursor-pointer ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Todos os Tipos</option>
                  <option value="Rolamento">Rolamento</option>
                  <option value="Correia">Correia</option>
                  <option value="Elétrica">Elétrica</option>
                  <option value="Hidráulica">Hidráulica</option>
                  <option value="Pneumática">Pneumática</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Marca
                </label>
                <select
                  value={selectedMarca}
                  onChange={(e) => setSelectedMarca(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border cursor-pointer ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Todas as Marcas</option>
                  <option value="SKF">SKF</option>
                  <option value="FAG">FAG</option>
                  <option value="NSK">NSK</option>
                  <option value="WEG">WEG</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
                <div className="flex gap-3">
                  <button
                    onClick={buscarPeca}
                    disabled={!searchTerm || loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Analisando...
                      </>
                    ) : (
                      <>
                        <i className="ri-search-line mr-2"></i>
                        Buscar Análise Completa
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowPecaModal(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all whitespace-nowrap"
                  >
                    <i className="ri-add-line mr-2"></i>
                    Nova Peça
                  </button>
                </div>
            </div>
          </div>

          {/* Resultados */}
          {pecaAnalise && (
            <>
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <i className="ri-stack-line text-blue-500 text-xl"></i>
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quantidade Total</span>
                  </div>
                  <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {pecaAnalise.quantidade_total}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">unidades na indústria</div>
                </div>

                <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <i className="ri-refresh-line text-orange-500 text-xl"></i>
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Trocadas</span>
                  </div>
                  <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {pecaAnalise.quantidade_trocada}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">última safra</div>
                </div>

                <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <i className="ri-money-dollar-circle-line text-red-500 text-xl"></i>
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Custo Acumulado</span>
                  </div>
                  <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(pecaAnalise.custo_total)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">investimento total</div>
                </div>

                <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <i className="ri-settings-4-line text-green-500 text-xl"></i>
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Equipamentos</span>
                  </div>
                  <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {pecaAnalise.equipamentos.length}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">utilizam esta peça</div>
                </div>
              </div>

              {/* Informações Detalhadas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Equipamentos que Utilizam */}
                <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <i className="ri-settings-4-line mr-2 text-purple-500"></i>
                    Equipamentos que Utilizam
                  </h3>
                  <div className="space-y-2">
                    {pecaAnalise.equipamentos.map((eq, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'} flex items-center justify-between`}
                      >
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{eq}</span>
                        <span className="text-sm text-gray-500">
                          {Math.floor(Math.random() * 8) + 2} unidades
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fornecedores */}
                <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <i className="ri-store-line mr-2 text-purple-500"></i>
                    Fornecedores Utilizados
                  </h3>
                  <div className="space-y-3">
                    {pecaAnalise.fornecedores.map((forn, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {forn}
                          </span>
                          <span className="text-sm text-green-500 font-semibold">
                            {formatCurrency(Math.random() * 5000 + 2000)}
                          </span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                            style={{ width: `${Math.random() * 40 + 30}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Histórico de Trocas */}
              <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg mb-6`}>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <i className="ri-line-chart-line mr-2 text-purple-500"></i>
                  Histórico de Trocas (Últimos 6 Meses)
                </h3>
                <div className="space-y-3">
                  {pecaAnalise.historico.map((hist, idx) => {
                    const maxQtd = Math.max(...pecaAnalise.historico.map(h => h.quantidade));
                    const percentage = (hist.quantidade / maxQtd) * 100;
                    
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {hist.data}
                            </span>
                            <span className="text-sm text-gray-500">{hist.equipamento}</span>
                          </div>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {hist.quantidade} unidades
                          </span>
                        </div>
                        <div className={`h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Análise e Previsões */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <i className="ri-alert-line mr-2 text-yellow-500"></i>
                    Impacto se Faltar
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <i className="ri-close-circle-line text-red-500"></i>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        5 equipamentos parados
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="ri-time-line text-orange-500"></i>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Perda de 120h de produção
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="ri-money-dollar-circle-line text-red-500"></i>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Prejuízo estimado: R$ 45.000
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <i className="ri-shopping-cart-line mr-2 text-green-500"></i>
                    Previsão de Compra
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Próxima Safra
                      </span>
                      <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        35 unidades
                      </div>
                    </div>
                    <div>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Investimento Previsto
                      </span>
                      <div className="text-xl font-bold text-green-500">
                        {formatCurrency(17150)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <i className="ri-bar-chart-box-line mr-2 text-purple-500"></i>
                    Classificação ABC
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Categoria
                      </span>
                      <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold">
                        Classe A
                      </span>
                    </div>
                    <div>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Criticidade
                      </span>
                      <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Alta
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      Peça crítica com alto impacto na produção
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {!pecaAnalise && !loading && (
            <>
              <div className="text-center py-12">
                <i className="ri-search-line text-6xl text-gray-700 mb-4"></i>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Pesquise uma peça para ver a análise completa
                </p>
              </div>
              <PecaModal isOpen={showPecaModal} onClose={() => setShowPecaModal(false)} onSuccess={() => setShowPecaModal(false)} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
