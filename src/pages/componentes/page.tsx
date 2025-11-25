import { useState, useEffect } from 'react';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import { componentesAPI } from '../../lib/api';
import { usePermissions } from '../../hooks/usePermissions';
import ComponenteModal from '../../components/modals/ComponenteModal';
import TipoComponenteModal from '../../components/modals/TipoComponenteModal';
import { useToast } from '../../hooks/useToast';

interface Componente {
  id: string;
  nome: string;
  codigo_interno?: string;
  codigo_fabricante?: string;
  marca?: string;
  tipo?: string;
  preco_unitario?: number;
  foto_url?: string;
  tipos_componentes?: { nome: string };
}

export default function ComponentesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterMarca, setFilterMarca] = useState('');
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { success, error: showError } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedComponenteId, setSelectedComponenteId] = useState<string | undefined>();
  const [showTipoModal, setShowTipoModal] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    loadComponentes();
  }, []);

  const loadComponentes = async () => {
    try {
      setLoading(true);
      const data = await componentesAPI.getAll();
      setComponentes(data || []);
    } catch (error) {
      console.error('Erro ao carregar componentes:', error);
      setComponentes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      alert('Você não tem permissão para excluir componentes');
      return;
    }

    if (confirm('Tem certeza que deseja excluir este componente?')) {
      try {
        await componentesAPI.delete(id);
        loadComponentes();
        success('Componente excluído');
      } catch (error) {
        console.error('Erro ao excluir componente:', error);
        showError('Erro ao excluir componente');
      }
    }
  };

  const handleEdit = (id: string) => {
    setSelectedComponenteId(id);
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedComponenteId(undefined);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedComponenteId(undefined);
  };

  const handleModalSuccess = () => {
    loadComponentes();
  };

  const filteredComponentes = componentes.filter(comp => {
    const matchSearch = (comp.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                       (comp.codigo_interno?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                       (comp.codigo_fabricante?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchTipo = !filterTipo || comp.tipo === filterTipo || comp.tipos_componentes?.nome === filterTipo;
    const matchMarca = !filterMarca || comp.marca === filterMarca;
    return matchSearch && matchTipo && matchMarca;
  });

  const tipos = [...new Set(componentes.map(c => c.tipos_componentes?.nome || c.tipo).filter(Boolean))];
  const marcas = [...new Set(componentes.map(c => c.marca).filter(Boolean))];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} darkMode={darkMode} />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <main className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <i className="ri-settings-3-line mr-3"></i>
                Componentes
              </h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Gerencie peças e componentes do estoque
              </p>
            </div>

            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg whitespace-nowrap cursor-pointer"
            >
              <i className="ri-add-line mr-2"></i>
              Novo Componente
            </button>
            <button
              onClick={() => setShowTipoModal(true)}
              className="px-4 py-2 ml-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all whitespace-nowrap"
            >
              <i className="ri-list-unordered mr-2"></i>
              Tipos
            </button>
            {/* Nova Peça moved to dedicated Peças page */}
          </div>

          {/* Filtros */}
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 mb-6 shadow-lg`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <i className={`ri-search-line absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                <input
                  type="text"
                  placeholder="Buscar por nome ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="">Todos os Tipos</option>
                {tipos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>

              <select
                value={filterMarca}
                onChange={(e) => setFilterMarca(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="">Todas as Marcas</option>
                {marcas.map(marca => (
                  <option key={marca} value={marca}>{marca}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Tabela */}
          {!loading && filteredComponentes.length > 0 && (
            <div className={`rounded-xl shadow-lg border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`border-b ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Componente</th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Código Interno</th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Código Fabricante</th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Marca</th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tipo</th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Estoque Mín.</th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Preço Unit.</th>
                      <th className={`px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Ações</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                    {filteredComponentes.map((comp) => (
                      <tr key={comp.id} className={darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {comp.foto_url ? (
                              <img src={comp.foto_url} alt={comp.nome} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                                <i className={`ri-tools-fill ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}></i>
                              </div>
                            )}
                            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{comp.nome}</span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{comp.codigo_interno || '-'}</td>
                        <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{comp.codigo_fabricante || '-'}</td>
                        <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{comp.marca || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
                            {comp.tipos_componentes?.nome || comp.tipo || '-'}
                          </span>
                        </td>
                        
                        <td className={`px-6 py-4 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {comp.preco_unitario ? `R$ ${comp.preco_unitario.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {canEdit && (
                              <button 
                                onClick={() => handleEdit(comp.id)}
                                className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                              >
                                <i className="ri-edit-line"></i>
                              </button>
                            )}
                            {canDelete && (
                              <button 
                                onClick={() => handleDelete(comp.id)}
                                className="w-8 h-8 flex items-center justify-center bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sem resultados */}
          {!loading && filteredComponentes.length === 0 && (
            <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-12 text-center shadow-lg`}>
              <i className={`ri-box-3-line text-6xl mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Nenhum componente encontrado
              </h3>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm || filterTipo || filterMarca 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece cadastrando um novo componente'}
              </p>
              {canCreate && !searchTerm && !filterTipo && !filterMarca && (
                <button
                  onClick={handleCreate}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-add-line mr-2"></i>
                  Cadastrar Primeiro Componente
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      <ComponenteModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        componenteId={selectedComponenteId}
        darkMode={darkMode}
      />
      <TipoComponenteModal isOpen={showTipoModal} onClose={() => setShowTipoModal(false)} onSuccess={() => setShowTipoModal(false)} />
      {/* Peça modal now lives on the dedicated /pecas page */}
    </div>
  );
}
