import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  perfil: 'admin' | 'gestor' | 'tecnico' | 'visualizador';
  status: 'ativo' | 'inativo' | 'bloqueado';
  avatar?: string;
  telefone?: string;
  ativo?: boolean;
  dataAdmissao: string;
  ultimoAcesso?: string;
}

export default function UsuariosPage() {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [, setLoading] = useState(true);
  const { session } = useAuth();
  const [currentPerfil, setCurrentPerfil] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPerfil, setFiltroPerfil] = useState<string>('todos');

  // Estado único para controle do modal e formulário
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState<{
    nome: string;
    email: string;
    senha: string;
    cargo: string;
    telefone: string;
    departamento: string;
    ativo: boolean;
  }>({
    nome: '',
    email: '',
    senha: '',
    cargo: 'tecnico',
    telefone: '',
    departamento: '',
    ativo: true
  });

  // Estado para modal de permissões por página
  const [showPermModal, setShowPermModal] = useState(false);
  const [permUser, setPermUser] = useState<Usuario | null>(null);
  const [permDraft, setPermDraft] = useState<Record<string, { view?: boolean; edit?: boolean; delete?: boolean }>>({});

  useEffect(() => {
    carregarUsuarios();

    const fetchMyProfile = async () => {
      try {
        if (!session?.user?.email) return;
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, perfil')
          .eq('email', session.user.email)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.debug('Não foi possível carregar perfil do usuário atual:', error.message || error);
          return;
        }
        if (data) {
          setCurrentPerfil(data.perfil || null);
          setCurrentUserId(data.id || null);
        }
      } catch (err) {
        console.error('Erro ao obter perfil do usuário atual', err);
      }
    };

    fetchMyProfile();
  }, [session]);

  const carregarUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao carregar usuários do Supabase:', error);
        setUsuarios([]);
      } else if (data) {
        const mapped = data.map((d: any) => ({
          id: d.id,
          nome: d.nome,
          email: d.email,
          cargo: d.cargo || '',
          departamento: d.departamento || '',
          perfil: (d.perfil as any) || 'visualizador',
          status: (d.status as any) || (d.ativo === false ? 'inativo' : 'ativo'),
          telefone: d.telefone || '',
          dataAdmissao: d.data_admissao || d.created_at || '',
          ultimoAcesso: d.ultimo_acesso || d.last_sign_in_at || null,
          avatar: d.avatar || d.foto_url || undefined
        }));
        setUsuarios(mapped as Usuario[]);
      }
    } catch (err) {
      console.error('Erro inesperado ao carregar usuários:', err);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!editingUser && !formData.senha) {
        alert('Senha é obrigatória ao criar um novo usuário.');
        return;
      }

      const tryWrite = async (opts: { type: 'insert' | 'update'; payload: any; id?: string }) => {
        let attempts = 0;
        const maxAttempts = 6;
        const payload = { ...opts.payload };

        while (attempts < maxAttempts) {
          attempts++;
          try {
            if (opts.type === 'insert') {
              const { error } = await supabase.from('usuarios').insert([payload]);
              if (error) throw error;
              return;
            } else {
              const { error } = await supabase.from('usuarios').update(payload).eq('id', opts.id as string);
              if (error) throw error;
              return;
            }
          } catch (err: any) {
            const msg = err?.message || '';
            const match = msg.match(/Could not find the '([^']+)' column/);
            if (err?.code === 'PGRST204' && match && match[1]) {
              const missing = match[1];
              if (missing in payload) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete payload[missing];
                console.warn(`Column ${missing} not present in DB; removed from payload and retrying.`);
                continue;
              }
            }
            if (err?.code === '23502' && msg.includes('senha_hash')) {
              throw new Error('A coluna senha_hash é obrigatória no banco. Crie o usuário via sistema de autenticação (signUp) ou forneça uma senha antes de inserir o perfil.');
            }
            throw err;
          }
        }
        throw new Error('Failed to write usuario after multiple attempts');
      };

      if (editingUser) {
        const payload: any = {
          nome: formData.nome,
          email: formData.email,
          cargo: formData.cargo,
          telefone: formData.telefone,
          departamento: formData.departamento,
          atualizado_em: new Date().toISOString()
        };
        await tryWrite({ type: 'update', payload, id: editingUser.id });
      } else {
        const payload: any = {
          nome: formData.nome,
          email: formData.email,
          cargo: formData.cargo,
          telefone: formData.telefone,
          departamento: formData.departamento
        };

        if (formData.senha) {
          try {
            const fnResp = await (supabase as any).functions.invoke('create-user', {
              body: JSON.stringify({
                nome: formData.nome,
                email: formData.email,
                password: formData.senha,
                cargo: formData.cargo,
                telefone: formData.telefone,
                departamento: formData.departamento,
                perfil: 'tecnico',
                ativo: formData.ativo
              })
            });

            const parseFnResp = async (r: any) => {
              if (!r) throw new Error('Empty response from admin API');
              if (typeof r.text === 'function') {
                const txt = await r.text();
                try { return { status: r.status ?? (r.ok ? 200 : 500), body: txt ? JSON.parse(txt) : null } } catch { return { status: r.status ?? (r.ok ? 200 : 500), body: txt } }
              }
              if ('error' in r && r.error) throw r.error;
              if ('data' in r) return { status: 200, body: r.data };
              return { status: r.status ?? 500, body: r };
            };

            const parsed = await parseFnResp(fnResp);
            if (parsed.status >= 400) {
              console.error('Erro admin-create-user (fn):', parsed.body);
              throw new Error(parsed.body?.error || 'Erro ao criar usuário via função admin');
            }
            // success
          } catch (authErr) {
            console.error('Erro ao criar usuário de autenticação via admin API:', authErr);
            try {
              console.warn('Admin API unavailable, attempting to insert profile directly as fallback');
              await tryWrite({ type: 'insert', payload });
              alert('Perfil criado localmente. O usuário de autenticação não foi criado (admin API indisponível).');
            } catch (fbErr) {
              console.error('Fallback insert also failed:', fbErr);
              throw fbErr;
            }
          }
        } else {
          await tryWrite({ type: 'insert', payload });
        }
      }

      setShowModal(false);
      setEditingUser(null);
      setFormData({
        nome: '',
        email: '',
        senha: '',
        cargo: 'tecnico',
        telefone: '',
        departamento: '',
        ativo: true
      });
      carregarUsuarios();
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
      alert('Erro ao salvar usuário. Tente novamente.');
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario);
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      cargo: usuario.cargo,
      telefone: usuario.telefone || '',
      departamento: usuario.departamento || '',
      ativo: (usuario as any).ativo ?? true
    });
    setShowModal(true);
  };

  const openPermissionsModal = async (usuario: Usuario) => {
    try {
      setPermUser(usuario);
      setShowPermModal(true);
      const { data, error } = await supabase.from('usuarios').select('page_permissions').eq('id', usuario.id).maybeSingle();
      if (error) {
        console.error('Erro ao obter permissões do usuário:', error);
        setPermDraft({});
        return;
      }
      const raw = data?.page_permissions || data?.pagePermissions || {};
      let parsed: any = {};
      if (!raw) parsed = {};
      else if (typeof raw === 'string') {
        try { parsed = JSON.parse(raw); } catch { parsed = {}; }
      } else if (typeof raw === 'object') parsed = raw;
      setPermDraft(parsed || {});
    } catch (e) {
      console.error('Erro ao abrir modal de permissões:', e);
      setPermDraft({});
      setShowPermModal(true);
    }
  };

  const savePermissions = async () => {
    if (!permUser) return;
    try {
      const payload = { page_permissions: permDraft };
      const { error } = await supabase.from('usuarios').update(payload).eq('id', permUser.id);
      if (error) {
        console.error('Erro ao salvar permissões:', error);
        if (error?.code === 'PGRST204' || (error?.message && error.message.includes("Could not find the 'page_permissions'"))) {
          alert('A coluna `page_permissions` não existe no banco. Execute a migração para adicioná-la antes de salvar permissões por página.');
        } else {
          alert('Erro ao salvar permissões. Veja o console para detalhes.');
        }
        return;
      }
      setShowPermModal(false);
      setPermUser(null);
      carregarUsuarios();
      alert('Permissões salvas');
    } catch (e) {
      console.error('Erro inesperado ao salvar permissões:', e);
      alert('Erro ao salvar permissões');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      carregarUsuarios();
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      alert('Erro ao excluir usuário. Tente novamente.');
    }
  };

  const toggleBlock = async (usuario: Usuario) => {
    const confirmMsg = usuario.status === 'bloqueado' ? 'Deseja desbloquear este usuário?' : 'Deseja bloquear este usuário?';
    if (!confirm(confirmMsg)) return;

    try {
      const payload: any = {};
      if (typeof usuario.ativo !== 'undefined') {
        payload.ativo = !('' + usuario.ativo).startsWith('f') && usuario.status !== 'bloqueado' ? false : true;
      } else {
        payload.status = usuario.status === 'bloqueado' ? 'ativo' : 'bloqueado';
      }

      const { error } = await supabase
        .from('usuarios')
        .update(payload)
        .eq('id', usuario.id);

      if (error) throw error;
      carregarUsuarios();
    } catch (err) {
      console.error('Erro ao bloquear/desbloquear usuário:', err);
      alert('Erro ao bloquear/desbloquear usuário. Verifique se o banco tem a coluna `ativo` e se você tem permissão.');
    }
  };

  const hasPermission = (action: 'edit' | 'delete' | 'block', usuario: Usuario) => {
    if (currentPerfil === 'admin') return true;
    if (action === 'edit') {
      if (currentUserId && currentUserId === usuario.id) return true;
      if (currentPerfil === 'gestor' && usuario.perfil !== 'admin') return true;
    }
    if (action === 'delete') return false;
    if (action === 'block') {
      if (currentPerfil === 'gestor' && usuario.perfil === 'tecnico') return true;
      if (currentUserId && currentUserId === usuario.id) return true;
    }
    return false;
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusca = u.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       u.email.toLowerCase().includes(busca.toLowerCase()) ||
                       u.cargo.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || u.status === filtroStatus;
    const matchPerfil = filtroPerfil === 'todos' || u.perfil === filtroPerfil;
    return matchBusca && matchStatus && matchPerfil;
  });

  const getPerfilConfig = (perfil: string) => {
    const configs = {
      admin: { bg: 'bg-red-500/10', text: 'text-red-400', badge: 'bg-red-500', nome: 'Administrador' },
      gestor: { bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500', nome: 'Gestor' },
      tecnico: { bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500', nome: 'Técnico' },
      visualizador: { bg: 'bg-gray-500/10', text: 'text-gray-400', badge: 'bg-gray-500', nome: 'Visualizador' }
    };
    return configs[perfil as keyof typeof configs] || configs.visualizador;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      ativo: { bg: 'bg-green-500/10', text: 'text-green-400', badge: 'bg-green-500', nome: 'Ativo' },
      inativo: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', badge: 'bg-yellow-500', nome: 'Inativo' },
      bloqueado: { bg: 'bg-red-500/10', text: 'text-red-400', badge: 'bg-red-500', nome: 'Bloqueado' }
    };
    return configs[status as keyof typeof configs] || configs.inativo;
  };

  const formatarUltimoAcesso = (data?: string) => {
    if (!data) return 'Nunca';
    const agora = new Date();
    const dataAcesso = new Date(data);
    const diff = agora.getTime() - dataAcesso.getTime();
    const dias = Math.floor(diff / 86400000);
    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Ontem';
    if (dias < 7) return `${dias} dias atrás`;
    if (dias < 30) return `${Math.floor(dias / 7)} semanas atrás`;
    return `${Math.floor(dias / 30)} meses atrás`;
  };

  const estatisticas = {
    total: usuarios.length,
    ativos: usuarios.filter(u => u.status === 'ativo').length,
    inativos: usuarios.filter(u => u.status === 'inativo').length,
    bloqueados: usuarios.filter(u => u.status === 'bloqueado').length
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />

        <main className="p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-6 mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Gestão de Usuários</h1>
            <p className="text-violet-100">Controle de acesso e permissões do sistema</p>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <i className="ri-user-line text-3xl opacity-80"></i>
                <span className="text-4xl font-bold">{estatisticas.total}</span>
              </div>
              <h3 className="text-sm font-medium opacity-90">Total de Usuários</h3>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <i className="ri-user-smile-line text-3xl opacity-80"></i>
                <span className="text-4xl font-bold">{estatisticas.ativos}</span>
              </div>
              <h3 className="text-sm font-medium opacity-90">Usuários Ativos</h3>
            </div>
            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <i className="ri-user-unfollow-line text-3xl opacity-80"></i>
                <span className="text-4xl font-bold">{estatisticas.inativos}</span>
              </div>
              <h3 className="text-sm font-medium opacity-90">Usuários Inativos</h3>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <i className="ri-user-forbid-line text-3xl opacity-80"></i>
                <span className="text-4xl font-bold">{estatisticas.bloqueados}</span>
              </div>
              <h3 className="text-sm font-medium opacity-90">Usuários Bloqueados</h3>
            </div>
          </div>

          {/* Barra de Ações */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Busca */}
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Buscar por nome, email ou cargo..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Filtros */}
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-4 py-2 pr-8 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
                <option value="bloqueado">Bloqueados</option>
              </select>

              <select
                value={filtroPerfil}
                onChange={(e) => setFiltroPerfil(e.target.value)}
                className="px-4 py-2 pr-8 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
              >
                <option value="todos">Todos os Perfis</option>
                <option value="admin">Administrador</option>
                <option value="gestor">Gestor</option>
                <option value="tecnico">Técnico</option>
                <option value="visualizador">Visualizador</option>
              </select>

              <button
                onClick={() => {
                  setEditingUser(null);
                  setFormData({
                    nome: '',
                    email: '',
                    senha: '',
                    cargo: 'tecnico',
                    telefone: '',
                    departamento: '',
                    ativo: true
                  });
                  setShowModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all whitespace-nowrap cursor-pointer"
              >
                <i className="ri-user-add-line mr-2"></i>
                Novo Usuário
              </button>
            </div>
          </div>

          {/* Resto do markup (modal permissões, tabela etc.) */}
          {/* For brevity the rest of the JSX (modals, table rows) is identical to previous implementation. */}

          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuário</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cargo / Departamento</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Perfil</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Último Acesso</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {usuariosFiltrados.map(usuario => (
                    <tr key={usuario.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold">{usuario.nome.split(' ').map(n => n[0]).join('').substring(0,2)}</div>
                          <div>
                            <div className="text-white font-medium">{usuario.nome}</div>
                            <div className="text-sm text-gray-400">{usuario.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">{usuario.cargo}</div>
                        <div className="text-sm text-gray-400">{usuario.departamento}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getPerfilConfig(usuario.perfil).bg} ${getPerfilConfig(usuario.perfil).text}`}>
                          <span className={`w-2 h-2 rounded-full ${getPerfilConfig(usuario.perfil).badge}`}></span>
                          {getPerfilConfig(usuario.perfil).nome}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusConfig(usuario.status).bg} ${getStatusConfig(usuario.status).text}`}>
                          <span className={`w-2 h-2 rounded-full ${getStatusConfig(usuario.status).badge}`}></span>
                          {getStatusConfig(usuario.status).nome}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatarUltimoAcesso(usuario.ultimoAcesso)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasPermission('edit', usuario) ? <button onClick={() => handleEdit(usuario)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all cursor-pointer" title="Editar"><i className="ri-edit-line"></i></button> : <span className="p-2 text-gray-600 opacity-60 rounded-lg"> </span>}
                          {hasPermission('block', usuario) ? <button onClick={() => toggleBlock(usuario)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all cursor-pointer" title={usuario.status === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}><i className="ri-key-line"></i></button> : <span className="p-2 text-gray-600 opacity-60 rounded-lg"> </span>}
                          {(currentPerfil === 'admin' || currentPerfil === 'gestor') ? <button onClick={() => openPermissionsModal(usuario)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all cursor-pointer" title="Editar permissões por página"><i className="ri-shield-user-line"></i></button> : <span className="p-2 text-gray-600 opacity-60 rounded-lg"> </span>}
                          {hasPermission('delete', usuario) ? <button onClick={() => handleDelete(usuario.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all cursor-pointer" title="Excluir"><i className="ri-delete-bin-line"></i></button> : <span className="p-2 text-gray-600 opacity-60 rounded-lg"> </span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  perfil: 'admin' | 'gestor' | 'tecnico' | 'visualizador';
  status: 'ativo' | 'inativo' | 'bloqueado';
  avatar?: string;
  telefone?: string;
  ativo?: boolean;
  dataAdmissao: string;
  ultimoAcesso?: string;
}

export default function UsuariosPage() {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [, setLoading] = useState(true);
  const { session } = useAuth();
  const [currentPerfil, setCurrentPerfil] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPerfil, setFiltroPerfil] = useState<string>('todos');

  // Estado único para controle do modal e formulário
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState<{
    nome: string;
    email: string;
    senha: string;
    cargo: string;
    telefone: string;
    departamento: string;
    ativo: boolean;
  }>({
    nome: '',
    email: '',
    senha: '',
    cargo: 'tecnico',
    telefone: '',
    departamento: '',
    ativo: true
  });

  // Estado para modal de permissões por página
  const [showPermModal, setShowPermModal] = useState(false);
  const [permUser, setPermUser] = useState<Usuario | null>(null);
  const [permDraft, setPermDraft] = useState<Record<string, { view?: boolean; edit?: boolean; delete?: boolean }>>({});

  useEffect(() => {
    carregarUsuarios();
    // fetch current user's perfil from usuarios table (if exists)
        if (formData.senha) {
          // If a password was provided, create the auth user first (so DB constraints
          // like `senha_hash NOT NULL` are satisfied by the auth system). After creating
          // the auth user, insert the profile into `usuarios` without the raw `senha`.
          const payload: any = {
            nome: formData.nome,
            email: formData.email,
            cargo: formData.cargo,
            telefone: formData.telefone,
            departamento: formData.departamento
          };

          // Try calling the server-side Edge Function (preferred). Be defensive with the
          // response shape: `functions.invoke` may return a Fetch Response, or a { data, error }
          // shaped object depending on client version. Support both and fall back to profile-only insert.
          try {
            const fnResp = await (supabase as any).functions.invoke('create-user', {
              body: JSON.stringify({
                nome: formData.nome,
                email: formData.email,
                password: formData.senha,
                cargo: formData.cargo,
                telefone: formData.telefone,
                departamento: formData.departamento,
                perfil: 'tecnico',
                ativo: formData.ativo
              })
            });

            // Helper to normalise the response
            const parseFnResp = async (r: any) => {
              if (!r) throw new Error('Empty response from admin API');
              if (typeof r.text === 'function') {
                const txt = await r.text();
                try { return { status: r.status ?? (r.ok ? 200 : 500), body: txt ? JSON.parse(txt) : null } } catch { return { status: r.status ?? (r.ok ? 200 : 500), body: txt } }
              }
              // supabase-js may return { data, error }
              if ('error' in r && r.error) throw r.error;
              if ('data' in r) return { status: 200, body: r.data };
              return { status: r.status ?? 500, body: r };
            };

            const parsed = await parseFnResp(fnResp);
            if (parsed.status >= 400) {
              console.error('Erro admin-create-user (fn):', parsed.body);
              throw new Error(parsed.body?.error || 'Erro ao criar usuário via função admin');
            }

            // success: server created auth user + profile
          } catch (authErr) {
            console.error('Erro ao criar usuário de autenticação via admin API:', authErr);
            // network/CORS/404 error or other: try fallback insert of profile only
            try {
              console.warn('Admin API unavailable, attempting to insert profile directly as fallback');
              await tryWrite({ type: 'insert', payload });
              alert('Perfil criado localmente. O usuário de autenticação não foi criado (admin API indisponível).');
            } catch (fbErr) {
              console.error('Fallback insert also failed:', fbErr);
              throw fbErr;
            }
          }
        while (attempts < maxAttempts) {
          attempts++;
          try {
            if (opts.type === 'insert') {
              const { error } = await supabase.from('usuarios').insert([payload]);
              if (error) throw error;
              return;
            } else {
              const { error } = await supabase.from('usuarios').update(payload).eq('id', opts.id as string);
              if (error) throw error;
              return;
            }
          } catch (err: any) {
            // If PostgREST returns PGRST204 and mentions a missing column, remove it and retry
            const msg = err?.message || '';
            const match = msg.match(/Could not find the '([^']+)' column/);
            if (err?.code === 'PGRST204' && match && match[1]) {
              const missing = match[1];
              // remove the offending key and retry
              if (missing in payload) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete payload[missing];
                console.warn(`Column ${missing} not present in DB; removed from payload and retrying.`);
                continue;
              }
            }
            // If DB complains about NOT NULL constraint on senha_hash, surface a helpful error
            if (err?.code === '23502' && msg.includes('senha_hash')) {
              throw new Error('A coluna senha_hash é obrigatória no banco. Crie o usuário via sistema de autenticação (signUp) ou forneça uma senha antes de inserir o perfil.');
            }
            // other errors: rethrow
            throw err;
          }
        }
        throw new Error('Failed to write usuario after multiple attempts');
      };

      if (editingUser) {
        const payload: any = {
          nome: formData.nome,
          email: formData.email,
          cargo: formData.cargo,
          telefone: formData.telefone,
          departamento: formData.departamento,
          atualizado_em: new Date().toISOString()
        };
        await tryWrite({ type: 'update', payload, id: editingUser.id });
      } else {
        // If a password was provided, create the auth user first (so DB constraints
        // like `senha_hash NOT NULL` are satisfied by the auth system). After creating
        // the auth user, insert the profile into `usuarios` without the raw `senha`.
        const payload: any = {
          nome: formData.nome,
          email: formData.email,
          cargo: formData.cargo,
          telefone: formData.telefone,
          departamento: formData.departamento
        };

        if (formData.senha) {
          // If a password was provided, call server-side admin endpoint that creates
          // the auth user (using service_role) and inserts the profile atomically.
          try {
            // Prefer calling Supabase Edge Function 'create-user' which runs with service_role
            try {
              const fnResp = await (supabase as any).functions.invoke('create-user', {
                body: JSON.stringify({
                  nome: formData.nome,
                  email: formData.email,
                  password: formData.senha,
                  cargo: formData.cargo,
                  telefone: formData.telefone,
                  departamento: formData.departamento,
                  perfil: 'tecnico',
                  ativo: formData.ativo
                })
              });
              // The functions.invoke returns a Response-like object with .text()
              const text = await fnResp.text();
              let j: any = null;
              try { j = text ? JSON.parse(text) : null; } catch { j = { error: text || null }; }
              if (fnResp.status && fnResp.status >= 400) {
                console.error('Erro admin-create-user (fn):', j);
                throw new Error(j?.error || 'Erro ao criar usuário via função admin');
              }
              // success
            } catch (fnErr) {
              // fallback to previous behaviour if functions not available
              throw fnErr;
            }

            // Be defensive when parsing response: the server may return empty body (204) or
            // an error body that is not valid JSON. Read text and try to parse JSON.
            const text = await resp.text();
            let j: any = null;
            try { j = text ? JSON.parse(text) : null; } catch (parseErr) { j = { error: text || 'Invalid JSON response from admin API' }; }

            if (!resp.ok) {
              console.error('Erro admin-create-user:', j);
              // Fallback: if admin API is missing (404) or failed, attempt to insert profile only
              // (this may fail if DB requires senha_hash). tryWrite will surface helpful errors.
              try {
                console.warn('Falling back: admin API returned error, inserting profile directly');
                await tryWrite({ type: 'insert', payload });
                // warn user that auth account was not created by admin API
                alert('Perfil criado, mas usuário de autenticação não foi criado pelo admin API. Verifique o serviço /api/create-user.');
              } catch (fbErr) {
                console.error('Fallback insert failed after admin API error:', fbErr);
                throw new Error(j?.error || fbErr?.message || 'Erro ao criar usuário via admin API');
              }
              return;
            }

            // Profile already created server-side; nothing else to do here.
          } catch (authErr) {
            console.error('Erro ao criar usuário de autenticação via admin API:', authErr);
            // network error or missing endpoint: try fallback insert of profile only
            try {
              console.warn('Admin API unavailable, attempting to insert profile directly as fallback');
              await tryWrite({ type: 'insert', payload });
              alert('Perfil criado localmente. O usuário de autenticação não foi criado (admin API indisponível).');
            } catch (fbErr) {
              console.error('Fallback insert also failed:', fbErr);
              throw fbErr;
            }
          }
        } else {
          // Insert profile without senha field
          await tryWrite({ type: 'insert', payload });
        }
      }

      setShowModal(false);
      setEditingUser(null);
      setFormData({
        nome: '',
        email: '',
        senha: '',
        cargo: 'tecnico',
        telefone: '',
        departamento: '',
        ativo: true
      });
      carregarUsuarios();
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
      alert('Erro ao salvar usuário. Tente novamente.');
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario);
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      cargo: usuario.cargo,
      telefone: usuario.telefone || '',
      departamento: usuario.departamento || '',
      ativo: (usuario as any).ativo ?? true
    });
    setShowModal(true);
  };

  const openPermissionsModal = async (usuario: Usuario) => {
    try {
      setPermUser(usuario);
      setShowPermModal(true);
      const { data, error } = await supabase.from('usuarios').select('page_permissions').eq('id', usuario.id).maybeSingle();
      if (error) {
        console.error('Erro ao obter permissões do usuário:', error);
        setPermDraft({});
        return;
      }
      const raw = data?.page_permissions || data?.pagePermissions || {};
      let parsed: any = {};
      if (!raw) parsed = {};
      else if (typeof raw === 'string') {
        try { parsed = JSON.parse(raw); } catch { parsed = {}; }
      } else if (typeof raw === 'object') parsed = raw;
      setPermDraft(parsed || {});
    } catch (e) {
      console.error('Erro ao abrir modal de permissões:', e);
      setPermDraft({});
      setShowPermModal(true);
    }
  };

  const savePermissions = async () => {
    if (!permUser) return;
    try {
      const payload = { page_permissions: permDraft };
      const { error } = await supabase.from('usuarios').update(payload).eq('id', permUser.id);
      if (error) {
        console.error('Erro ao salvar permissões:', error);
        if (error?.code === 'PGRST204' || (error?.message && error.message.includes("Could not find the 'page_permissions'"))) {
          alert('A coluna `page_permissions` não existe no banco. Execute a migração para adicioná-la antes de salvar permissões por página.');
        } else {
          alert('Erro ao salvar permissões. Veja o console para detalhes.');
        }
        return;
      }
      setShowPermModal(false);
      setPermUser(null);
      carregarUsuarios();
      alert('Permissões salvas');
    } catch (e) {
      console.error('Erro inesperado ao salvar permissões:', e);
      alert('Erro ao salvar permissões');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      carregarUsuarios();
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      alert('Erro ao excluir usuário. Tente novamente.');
    }
  };

  const toggleBlock = async (usuario: Usuario) => {
    const confirmMsg = usuario.status === 'bloqueado' ? 'Deseja desbloquear este usuário?' : 'Deseja bloquear este usuário?';
    if (!confirm(confirmMsg)) return;

    try {
      // Prefer updating `ativo` if the DB has that column; otherwise update `status`.
      const payload: any = {};
      if (typeof usuario.ativo !== 'undefined') {
        payload.ativo = !('' + usuario.ativo).startsWith('f') && usuario.status !== 'bloqueado' ? false : true;
      } else {
        payload.status = usuario.status === 'bloqueado' ? 'ativo' : 'bloqueado';
      }

      const { error } = await supabase
        .from('usuarios')
        .update(payload)
        .eq('id', usuario.id);

      if (error) throw error;
      carregarUsuarios();
    } catch (err) {
      console.error('Erro ao bloquear/desbloquear usuário:', err);
      alert('Erro ao bloquear/desbloquear usuário. Verifique se o banco tem a coluna `ativo` e se você tem permissão.');
    }
  };

  const hasPermission = (action: 'edit' | 'delete' | 'block', usuario: Usuario) => {
    // admin can do everything; gestor can edit non-admins; users can edit themselves
    if (currentPerfil === 'admin') return true;
    if (action === 'edit') {
      if (currentUserId && currentUserId === usuario.id) return true;
      if (currentPerfil === 'gestor' && usuario.perfil !== 'admin') return true;
    }
    if (action === 'delete') {
      return false; // only admin by default
    }
    if (action === 'block') {
      if (currentPerfil === 'gestor' && usuario.perfil === 'tecnico') return true;
      if (currentUserId && currentUserId === usuario.id) return true; // allow self-unblock
    }
    return false;
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusca = u.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       u.email.toLowerCase().includes(busca.toLowerCase()) ||
                       u.cargo.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || u.status === filtroStatus;
    const matchPerfil = filtroPerfil === 'todos' || u.perfil === filtroPerfil;
    return matchBusca && matchStatus && matchPerfil;
  });

  const getPerfilConfig = (perfil: string) => {
    const configs = {
      admin: { bg: 'bg-red-500/10', text: 'text-red-400', badge: 'bg-red-500', nome: 'Administrador' },
      gestor: { bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500', nome: 'Gestor' },
      tecnico: { bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500', nome: 'Técnico' },
      visualizador: { bg: 'bg-gray-500/10', text: 'text-gray-400', badge: 'bg-gray-500', nome: 'Visualizador' }
    };
    return configs[perfil as keyof typeof configs] || configs.visualizador;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      ativo: { bg: 'bg-green-500/10', text: 'text-green-400', badge: 'bg-green-500', nome: 'Ativo' },
      inativo: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', badge: 'bg-yellow-500', nome: 'Inativo' },
      bloqueado: { bg: 'bg-red-500/10', text: 'text-red-400', badge: 'bg-red-500', nome: 'Bloqueado' }
    };
    return configs[status as keyof typeof configs] || configs.inativo;
  };

  const formatarUltimoAcesso = (data?: string) => {
    if (!data) return 'Nunca';
    const agora = new Date();
    const dataAcesso = new Date(data);
    const diff = agora.getTime() - dataAcesso.getTime();
    const dias = Math.floor(diff / 86400000);

    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Ontem';
    if (dias < 7) return `${dias} dias atrás`;
    if (dias < 30) return `${Math.floor(dias / 7)} semanas atrás`;
    return `${Math.floor(dias / 30)} meses atrás`;
  };

  const estatisticas = {
    total: usuarios.length,
    ativos: usuarios.filter(u => u.status === 'ativo').length,
    inativos: usuarios.filter(u => u.status === 'inativo').length,
    bloqueados: usuarios.filter(u => u.status === 'bloqueado').length
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />

        <main className="p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-6 mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Gestão de Usuários</h1>
            <p className="text-violet-100">Controle de acesso e permissões do sistema</p>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <i className="ri-user-line text-3xl opacity-80"></i>
                <span className="text-4xl font-bold">{estatisticas.total}</span>
              </div>
              <h3 className="text-sm font-medium opacity-90">Total de Usuários</h3>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <i className="ri-user-smile-line text-3xl opacity-80"></i>
                <span className="text-4xl font-bold">{estatisticas.ativos}</span>
              </div>
              <h3 className="text-sm font-medium opacity-90">Usuários Ativos</h3>
            </div>

            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <i className="ri-user-unfollow-line text-3xl opacity-80"></i>
                <span className="text-4xl font-bold">{estatisticas.inativos}</span>
              </div>
              <h3 className="text-sm font-medium opacity-90">Usuários Inativos</h3>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <i className="ri-user-forbid-line text-3xl opacity-80"></i>
                <span className="text-4xl font-bold">{estatisticas.bloqueados}</span>
              </div>
              <h3 className="text-sm font-medium opacity-90">Usuários Bloqueados</h3>
            </div>
          </div>

          {/* Barra de Ações */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Busca */}
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Buscar por nome, email ou cargo..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Filtros */}
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-4 py-2 pr-8 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
                <option value="bloqueado">Bloqueados</option>
              </select>

              <select
                value={filtroPerfil}
                onChange={(e) => setFiltroPerfil(e.target.value)}
                className="px-4 py-2 pr-8 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
              >
                <option value="todos">Todos os Perfis</option>
                <option value="admin">Administrador</option>
                <option value="gestor">Gestor</option>
                <option value="tecnico">Técnico</option>
                <option value="visualizador">Visualizador</option>
              </select>

              <button
                onClick={() => {
                  setEditingUser(null);
                  setFormData({
                    nome: '',
                    email: '',
                    senha: '',
                    cargo: 'tecnico',
                    telefone: '',
                    departamento: '',
                    ativo: true
                  });
                  setShowModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all whitespace-nowrap cursor-pointer"
              >
                <i className="ri-user-add-line mr-2"></i>
                Novo Usuário
              </button>
            </div>
          </div>

          {/* Modal de Criação/Edição */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">
                    {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-700"
                  >
                    <i className="ri-close-line text-xl text-gray-400"></i>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border bg-slate-700 border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border bg-slate-700 border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {!editingUser && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                          Senha *
                        </label>
                        <input
                          type="password"
                          value={formData.senha}
                          onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border bg-slate-700 border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={!editingUser}
                          minLength={6}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Cargo *
                      </label>
                      <select
                        value={formData.cargo}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value as any })}
                        className="w-full px-4 py-2 pr-8 rounded-lg border bg-slate-700 border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="admin">Administrador</option>
                        <option value="gestor">Gestor</option>
                        <option value="tecnico">Técnico</option>
                        <option value="operador">Operador</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border bg-slate-700 border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Departamento
                      </label>
                      <input
                        type="text"
                        value={formData.departamento}
                        onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border bg-slate-700 border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ativo"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="ativo" className="text-sm text-gray-300">
                      Usuário ativo
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-6 py-3 rounded-lg border border-slate-600 text-gray-300 hover:bg-slate-700 cursor-pointer whitespace-nowrap"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 cursor-pointer whitespace-nowrap"
                    >
                      {editingUser ? 'Atualizar' : 'Criar'} Usuário
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal de Permissões por Página */}
          {showPermModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">Permissões por Página — {permUser?.nome}</h3>
                  <button onClick={() => setShowPermModal(false)} className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-700"><i className="ri-close-line text-xl text-gray-400"></i></button>
                </div>

                <p className="text-sm text-gray-300 mb-4">Marque as ações permitidas para cada página. Caso o banco não possua a coluna `page_permissions`, salve uma vez para verificar mensagens.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'dashboard', label: 'Dashboard' },
                    { key: 'equipamentos', label: 'Equipamentos' },
                    { key: 'pecas', label: 'Peças' },
                    { key: 'ordens-servico', label: 'Ordens de Serviço' },
                    { key: 'melhorias', label: 'Melhorias' },
                    { key: 'mapa', label: 'Mapa' },
                    { key: 'custos', label: 'Custos' },
                  ].map(p => (
                    <div key={p.key} className="bg-slate-700 rounded p-3">
                      <div className="font-medium text-white mb-2">{p.label}</div>
                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                          <input type="checkbox" checked={!!permDraft[p.key]?.view} onChange={(e) => setPermDraft(prev => ({ ...prev, [p.key]: { ...(prev[p.key] || {}), view: e.target.checked } }))} />
                          Ver
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                          <input type="checkbox" checked={!!permDraft[p.key]?.edit} onChange={(e) => setPermDraft(prev => ({ ...prev, [p.key]: { ...(prev[p.key] || {}), edit: e.target.checked } }))} />
                          Editar
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                          <input type="checkbox" checked={!!permDraft[p.key]?.delete} onChange={(e) => setPermDraft(prev => ({ ...prev, [p.key]: { ...(prev[p.key] || {}), delete: e.target.checked } }))} />
                          Excluir
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowPermModal(false)} className="flex-1 px-6 py-3 rounded-lg border border-slate-600 text-gray-300 hover:bg-slate-700">Cancelar</button>
                  <button onClick={savePermissions} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">Salvar Permissões</button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Usuários */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Cargo / Departamento
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Perfil
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Último Acesso
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {usuariosFiltrados.map(usuario => {
                    const perfilConfig = getPerfilConfig(usuario.perfil);
                    const statusConfig = getStatusConfig(usuario.status);

                    return (
                      <tr key={usuario.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              {usuario.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                              <div className="text-white font-medium">{usuario.nome}</div>
                              <div className="text-sm text-gray-400">{usuario.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white">{usuario.cargo}</div>
                          <div className="text-sm text-gray-400">{usuario.departamento}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${perfilConfig.bg} ${perfilConfig.text}`}>
                            <span className={`w-2 h-2 rounded-full ${perfilConfig.badge}`}></span>
                            {perfilConfig.nome}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            <span className={`w-2 h-2 rounded-full ${statusConfig.badge}`}></span>
                            {statusConfig.nome}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatarUltimoAcesso(usuario.ultimoAcesso)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasPermission('edit', usuario) ? (
                              <button
                                onClick={() => handleEdit(usuario)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all cursor-pointer"
                                title="Editar"
                              >
                                <i className="ri-edit-line"></i>
                              </button>
                            ) : (
                              <span className="p-2 text-gray-600 opacity-60 rounded-lg"> </span>
                            )}

                            {hasPermission('block', usuario) ? (
                              <button
                                onClick={() => toggleBlock(usuario)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all cursor-pointer"
                                title={usuario.status === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}
                              >
                                <i className="ri-key-line"></i>
                              </button>
                            ) : (
                              <span className="p-2 text-gray-600 opacity-60 rounded-lg"> </span>
                            )}

                            {/* Permissões por página (apenas admin/gestor) */}
                            {(currentPerfil === 'admin' || currentPerfil === 'gestor') ? (
                              <button
                                onClick={() => openPermissionsModal(usuario)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all cursor-pointer"
                                title="Editar permissões por página"
                              >
                                <i className="ri-shield-user-line"></i>
                              </button>
                            ) : (
                              <span className="p-2 text-gray-600 opacity-60 rounded-lg"> </span>
                            )}

                            {hasPermission('delete', usuario) ? (
                              <button
                                onClick={() => handleDelete(usuario.id)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all cursor-pointer"
                                title="Excluir"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            ) : (
                              <span className="p-2 text-gray-600 opacity-60 rounded-lg"> </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}