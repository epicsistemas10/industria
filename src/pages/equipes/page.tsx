import { useState, useEffect } from 'react';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import { equipesAPI } from '../../lib/api';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../lib/supabase';

interface Equipe {
  id: string;
  nome: string;
  turno?: string;
  especialidade?: string;
  lider?: string;
  membros?: string[];
  disponibilidade: boolean;
  observacoes?: string;
  created_at: string;
}

interface Colaborador {
  id: string;
  nome: string;
  cargo?: string;
  telefone?: string;
  email?: string;
  data_admissao?: string;
  salario?: number;
  foto_url?: string;
  status: string;
  equipe_id?: string;
}

export default function EquipesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTurno, setFilterTurno] = useState('');
  const [filterDisponibilidade, setFilterDisponibilidade] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEquipe, setEditingEquipe] = useState<Equipe | null>(null);
  const { canCreate, canEdit, canDelete } = usePermissions();

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    turno: 'Manhã',
    especialidade: '',
    lider: '',
    membros: [] as string[],
    disponibilidade: true,
    observacoes: ''
  });

  const [membroInput, setMembroInput] = useState('');
  const defaultLeaders = ['Wagner', 'Ernando', 'Claudiney', 'Manuel', 'Jailson'];

  const [showColaboradorModal, setShowColaboradorModal] = useState(false);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);
  const [colaboradorFormData, setColaboradorFormData] = useState({
    nome: '',
    cargo: '',
    telefone: '',
    email: '',
    data_admissao: '',
    salario: 0,
    foto_url: '',
    status: 'ativo',
    equipe_id: ''
  });

  // Novo estado para seleção múltipla de colaboradores
  const [showColaboradorSelector, setShowColaboradorSelector] = useState(false);
  const [selectedColaboradores, setSelectedColaboradores] = useState<string[]>([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    loadData();
    loadColaboradores();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await equipesAPI.getAll();
      setEquipes(data || []);
    } catch (error) {
      console.error('Erro ao carregar equipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadColaboradores = async () => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('nome');

      if (!error && data) {
        setColaboradores(data);
      }
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEquipe) {
        await equipesAPI.update(editingEquipe.id, formData);
      } else {
        await equipesAPI.create(formData);
      }

      setShowModal(false);
      setEditingEquipe(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar equipe:', error);
      alert('Erro ao salvar equipe');
    }
  };

  const handleColaboradorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Normalize payload: convert empty UUID strings to null to avoid Postgres 22P02 errors
      const payload: any = { ...colaboradorFormData };
      if (!payload.equipe_id || payload.equipe_id === '') payload.equipe_id = null;

      if (editingColaborador) {
        const { error } = await supabase
          .from('colaboradores')
          .update(payload)
          .eq('id', editingColaborador.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('colaboradores')
          .insert([payload]);
        
        if (error) throw error;
      }

      // Fechar modal primeiro
      setShowColaboradorModal(false);
      setEditingColaborador(null);
      resetColaboradorForm();
      
      // Aguardar um pouco antes de recarregar
      setTimeout(async () => {
        await loadColaboradores();
        alert(editingColaborador ? 'Colaborador atualizado com sucesso!' : 'Colaborador cadastrado com sucesso!');
      }, 300);
    } catch (error: any) {
      console.error('Erro ao salvar colaborador:', error);
      alert(`Erro ao salvar colaborador: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleEdit = (equipe: Equipe) => {
    setEditingEquipe(equipe);
    setFormData({
      nome: equipe.nome,
      turno: equipe.turno || 'Manhã',
      especialidade: equipe.especialidade || '',
      lider: equipe.lider || '',
      membros: equipe.membros || [],
      disponibilidade: equipe.disponibilidade,
      observacoes: equipe.observacoes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta equipe?')) return;
    try {
      await equipesAPI.delete(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir equipe:', error);
      alert('Erro ao excluir equipe');
    }
  };

  const handleDeleteColaborador = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este colaborador?')) return;
    try {
      await supabase.from('colaboradores').delete().eq('id', id);
      loadColaboradores();
    } catch (error) {
      console.error('Erro ao excluir colaborador:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      turno: 'Manhã',
      especialidade: '',
      lider: '',
      membros: [],
      disponibilidade: true,
      observacoes: ''
    });
    setMembroInput('');
  };

  const addMembro = () => {
    if (membroInput.trim() && !formData.membros.includes(membroInput.trim())) {
      setFormData({
        ...formData,
        membros: [...formData.membros, membroInput.trim()]
      });
      setMembroInput('');
    }
  };

  const addColaboradoresAsMembers = () => {
    const novosNomes = selectedColaboradores
      .map(id => colaboradores.find(c => c.id === id)?.nome)
      .filter(nome => nome && !formData.membros.includes(nome)) as string[];
    
    setFormData({
      ...formData,
      membros: [...formData.membros, ...novosNomes]
    });
    
    setSelectedColaboradores([]);
    setShowColaboradorSelector(false);
  };

  const removeMembro = (membro: string) => {
    setFormData({
      ...formData,
      membros: formData.membros.filter(m => m !== membro)
    });
  };

  const resetColaboradorForm = () => {
    setColaboradorFormData({
      nome: '',
      cargo: '',
      telefone: '',
      email: '',
      data_admissao: '',
      salario: 0,
      foto_url: '',
      status: 'ativo',
      equipe_id: ''
    });
  };

  const getStatusColaboradorColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-gray-100 text-gray-800';
      case 'ferias': return 'bg-blue-100 text-blue-800';
      case 'afastado': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEquipes = equipes.filter(equipe => {
    const matchSearch = 
      equipe.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipe.lider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipe.especialidade?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTurno = !filterTurno || equipe.turno === filterTurno;
    const matchDisponibilidade = 
      !filterDisponibilidade || 
      (filterDisponibilidade === 'disponivel' && equipe.disponibilidade) ||
      (filterDisponibilidade === 'indisponivel' && !equipe.disponibilidade);
    
    return matchSearch && matchTurno && matchDisponibilidade;
  });

  const turnos = ['Manhã', 'Tarde', 'Noite', 'Integral'];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} darkMode={darkMode} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header com Tabs */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              <i className="ri-team-line mr-3"></i>
              Gestão de Equipes e Colaboradores
            </h1>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => {
                  setEditingEquipe(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-team-line mr-2"></i>
                Nova Equipe
              </button>
              <button 
                onClick={() => {
                  setEditingColaborador(null);
                  resetColaboradorForm();
                  setShowColaboradorModal(true);
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-user-add-line mr-2"></i>
                Novo Colaborador
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Total de Equipes</span>
                <i className="ri-team-line text-2xl text-blue-500"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">{equipes.length}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Colaboradores</span>
                <i className="ri-user-line text-2xl text-purple-500"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">{colaboradores.length}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Ativos</span>
                <i className="ri-checkbox-circle-line text-2xl text-green-500"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {colaboradores.filter(c => c.status === 'ativo').length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Disponíveis</span>
                <i className="ri-checkbox-circle-line text-2xl text-green-500"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {equipes.filter(e => e.disponibilidade).length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Total de Membros</span>
                <i className="ri-group-line text-2xl text-orange-500"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {equipes.reduce((sum, e) => sum + (e.membros?.length || 0), 0)}
              </p>
            </div>
          </div>

          {/* Colaboradores Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              <i className="ri-user-line mr-2"></i>
              Colaboradores Cadastrados
            </h2>
            
            {colaboradores.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <i className="ri-user-line text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum colaborador cadastrado</h3>
                <p className="text-gray-600 mb-6">Comece adicionando o primeiro colaborador da sua equipe</p>
                <button
                  onClick={() => {
                    setEditingColaborador(null);
                    resetColaboradorForm();
                    setShowColaboradorModal(true);
                  }}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-user-add-line mr-2"></i>
                  Adicionar Primeiro Colaborador
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {colaboradores.map((colab) => (
                  <div key={colab.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden">
                        {colab.foto_url ? (
                          <img src={colab.foto_url} alt={colab.nome} className="w-12 h-12 object-cover rounded-full" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {colab.nome.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{colab.nome}</h3>
                        {colab.cargo && (
                          <p className="text-sm text-gray-600 truncate">{colab.cargo}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {colab.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <i className="ri-mail-line flex-shrink-0"></i>
                          <span className="truncate">{colab.email}</span>
                        </div>
                      )}
                      {colab.telefone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <i className="ri-phone-line flex-shrink-0"></i>
                          <span>{colab.telefone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColaboradorColor(colab.status)}`}>
                        {colab.status.charAt(0).toUpperCase() + colab.status.slice(1)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingColaborador(colab);
                            setColaboradorFormData({
                              nome: colab.nome,
                              cargo: colab.cargo || '',
                              telefone: colab.telefone || '',
                              email: colab.email || '',
                              data_admissao: colab.data_admissao || '',
                              salario: colab.salario || 0,
                              foto_url: colab.foto_url || '',
                              status: colab.status,
                              equipe_id: colab.equipe_id || ''
                            });
                            setShowColaboradorModal(true);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteColaborador(colab.id)}
                          className="w-7 h-7 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Equipes Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Equipes</h2>
            </div>

            {/* Filters and Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                  <div className="relative">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Nome, líder..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Turno</label>
                  <select
                    value={filterTurno}
                    onChange={(e) => setFilterTurno(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos os turnos</option>
                    {turnos.map(turno => (
                      <option key={turno} value={turno}>{turno}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilidade</label>
                  <select
                    value={filterDisponibilidade}
                    onChange={(e) => setFilterDisponibilidade(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas</option>
                    <option value="disponivel">Disponíveis</option>
                    <option value="indisponivel">Indisponíveis</option>
                  </select>
                </div>

                {canCreate && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setEditingEquipe(null);
                        resetForm();
                        setShowModal(true);
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 font-medium whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <i className="ri-add-line text-xl"></i>
                      Nova Equipe
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <i className="ri-loader-4-line text-4xl text-gray-400 animate-spin"></i>
                </div>
              ) : filteredEquipes.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <i className="ri-team-line text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">Nenhuma equipe encontrada</p>
                </div>
              ) : (
                filteredEquipes.map((equipe) => (
                  <div key={equipe.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{equipe.nome}</h3>
                        <div className="flex flex-wrap gap-2">
                          {equipe.turno && (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {equipe.turno}
                            </span>
                          )}
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            equipe.disponibilidade 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {equipe.disponibilidade ? 'Disponível' : 'Indisponível'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      {equipe.lider && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="ri-user-star-line text-lg"></i>
                          <span><strong>Líder:</strong> {equipe.lider}</span>
                        </div>
                      )}
                      {equipe.especialidade && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="ri-tools-line text-lg"></i>
                          <span><strong>Especialidade:</strong> {equipe.especialidade}</span>
                        </div>
                      )}
                      {equipe.membros && equipe.membros.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <i className="ri-group-line text-lg"></i>
                            <span><strong>Membros ({equipe.membros.length}):</strong></span>
                          </div>
                          <div className="flex flex-wrap gap-2 ml-6">
                            {equipe.membros.map((membro, index) => (
                              <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                {membro}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {equipe.observacoes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Observações:</p>
                        <p className="text-sm text-gray-700">{equipe.observacoes}</p>
                      </div>
                    )}

                    {(canEdit || canDelete) && (
                      <div className="flex gap-2 pt-4 border-t border-gray-100">
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(equipe)}
                            className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <i className="ri-edit-line"></i>
                            Editar
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(equipe.id)}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <i className="ri-delete-bin-line"></i>
                            Excluir
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">
                {editingEquipe ? 'Editar Equipe' : 'Nova Equipe'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Equipe *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Turno *
                  </label>
                  <select
                    value={formData.turno}
                    onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {turnos.map(turno => (
                      <option key={turno} value={turno}>{turno}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidade
                  </label>
                  <input
                    type="text"
                    value={formData.especialidade}
                    onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Líder da Equipe
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {defaultLeaders.map((ldr) => (
                      <button
                        key={ldr}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, lider: ldr });
                        }}
                        className={`px-3 py-1 rounded-full border ${formData.lider === ldr ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'} hover:shadow-sm`}
                      >
                        {ldr}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Outro (digite para sobrescrever)"
                    value={formData.lider}
                    onChange={(e) => setFormData({ ...formData, lider: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponibilidade *
                  </label>
                  <select
                    value={formData.disponibilidade ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, disponibilidade: e.target.value === 'true' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="true">Disponível</option>
                    <option value="false">Indisponível</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membros da Equipe
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={membroInput}
                      onChange={(e) => setMembroInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMembro())}
                      placeholder="Digite o nome e pressione Enter"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addMembro}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
                    >
                      <i className="ri-add-line"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowColaboradorSelector(true)}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors whitespace-nowrap cursor-pointer"
                      title="Selecionar colaboradores cadastrados"
                    >
                      <i className="ri-user-add-line"></i>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.membros.map((membro, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                        {membro}
                        <button
                          type="button"
                          onClick={() => removeMembro(membro)}
                          className="hover:text-blue-900"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEquipe(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 font-medium whitespace-nowrap"
                >
                  {editingEquipe ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Colaborador */}
      {showColaboradorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">
                {editingColaborador ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h2>
            </div>

            <form onSubmit={handleColaboradorSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    value={colaboradorFormData.nome}
                    onChange={(e) => setColaboradorFormData({ ...colaboradorFormData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foto</label>
                  <div className="flex items-center gap-3">
                    {colaboradorFormData.foto_url && (
                      <img src={colaboradorFormData.foto_url} alt="preview" className="w-16 h-16 object-cover rounded-md" />
                    )}
                    <label className="px-3 py-2 bg-gray-100 border rounded cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setColaboradorFormData({ ...colaboradorFormData, foto_url: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {colaboradorFormData.foto_url ? 'Alterar Foto' : 'Enviar Foto'}
                    </label>
                    {colaboradorFormData.foto_url && (
                      <button type="button" onClick={() => setColaboradorFormData({ ...colaboradorFormData, foto_url: '' })} className="text-sm text-red-600">Remover</button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                  <input
                    type="text"
                    value={colaboradorFormData.cargo}
                    onChange={(e) => setColaboradorFormData({ ...colaboradorFormData, cargo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select
                    value={colaboradorFormData.status}
                    onChange={(e) => setColaboradorFormData({ ...colaboradorFormData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="ferias">Férias</option>
                    <option value="afastado">Afastado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={colaboradorFormData.email}
                    onChange={(e) => setColaboradorFormData({ ...colaboradorFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={colaboradorFormData.telefone}
                    onChange={(e) => setColaboradorFormData({ ...colaboradorFormData, telefone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Admissão</label>
                  <input
                    type="date"
                    value={colaboradorFormData.data_admissao}
                    onChange={(e) => setColaboradorFormData({ ...colaboradorFormData, data_admissao: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={colaboradorFormData.salario}
                    onChange={(e) => setColaboradorFormData({ ...colaboradorFormData, salario: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Equipe</label>
                  <select
                    value={colaboradorFormData.equipe_id}
                    onChange={(e) => setColaboradorFormData({ ...colaboradorFormData, equipe_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Sem equipe</option>
                    {equipes.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowColaboradorModal(false);
                    setEditingColaborador(null);
                    resetColaboradorForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-medium whitespace-nowrap"
                >
                  {editingColaborador ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Seletor de Colaboradores */}
      {showColaboradorSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">
                Selecionar Colaboradores
              </h2>
              <p className="text-purple-100 text-sm mt-1">Marque os colaboradores que deseja adicionar à equipe</p>
            </div>

            <div className="p-6">
              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {colaboradores.filter(c => c.status === 'ativo').map((colab) => (
                  <label
                    key={colab.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColaboradores.includes(colab.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedColaboradores([...selectedColaboradores, colab.id]);
                        } else {
                          setSelectedColaboradores(selectedColaboradores.filter(id => id !== colab.id));
                        }
                      }}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                      {colab.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{colab.nome}</p>
                      {colab.cargo && (
                        <p className="text-sm text-gray-600">{colab.cargo}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColaboradorColor(colab.status)}`}>
                      {colab.status.charAt(0).toUpperCase() + colab.status.slice(1)}
                    </span>
                  </label>
                ))}
                {colaboradores.filter(c => c.status === 'ativo').length === 0 && (
                  <div className="text-center py-8">
                    <i className="ri-user-line text-5xl text-gray-300 mb-3"></i>
                    <p className="text-gray-500">Nenhum colaborador ativo cadastrado</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowColaboradorSelector(false);
                    setSelectedColaboradores([]);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={addColaboradoresAsMembers}
                  disabled={selectedColaboradores.length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar {selectedColaboradores.length > 0 ? `(${selectedColaboradores.length})` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
