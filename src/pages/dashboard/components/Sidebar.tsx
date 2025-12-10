import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  darkMode: boolean;
}

export default function Sidebar({ isOpen, onToggle, darkMode: _darkMode }: SidebarProps) {
  const location = useLocation();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('AlgodoTech');
  const [showSettings, setShowSettings] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Carregar logo e nome salvos
    const savedLogo = localStorage.getItem('company_logo');
    const savedName = localStorage.getItem('company_name');
    if (savedLogo) setCompanyLogo(savedLogo);
    if (savedName) setCompanyName(savedName);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCompanyLogo(result);
        localStorage.setItem('company_logo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameChange = (name: string) => {
    setCompanyName(name);
    localStorage.setItem('company_name', name);
  };

  const menuItems: Array<any> = [
    { id: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-line', path: '/dashboard' },
    { id: 'equipamentos', label: 'Equipamentos', icon: 'ri-tools-line', path: '/equipamentos' },
    {
      id: 'componentes_group',
      label: 'Componentes / Peças',
      icon: 'ri-settings-3-line',
      children: [
        { id: 'componentes', label: 'Componentes', path: '/componentes' },
        { id: 'pecas', label: 'Peças', path: '/pecas' },
        { id: 'estoque-tv', label: 'Estoque TV', path: '/estoque-tv' },
        { id: 'reservas', label: 'Componentes Reservas', path: '/componentes/reservas' }
      ]
    },
    { id: 'setores', label: 'Setores', icon: 'ri-stack-line', path: '/setores' },
    { id: 'servicos', label: 'Serviços', icon: 'ri-briefcase-line', path: '/servicos' },
    { id: 'mapa', label: 'Mapa Industrial', icon: 'ri-map-2-line', path: '/mapa' },
    { id: 'planejamento', label: 'Planejamento', icon: 'ri-calendar-line', path: '/planejamento' },
    { id: 'equipes', label: 'Equipes', icon: 'ri-team-line', path: '/equipes' },
    { id: 'os', label: 'Ordens de Serviço', icon: 'ri-file-list-3-line', path: '/ordens-servico' },
    { id: 'custos', label: 'Custos', icon: 'ri-money-dollar-circle-line', path: '/custos' },
    { id: 'tv', label: 'Dashboard TV', icon: 'ri-tv-line', path: '/dashboard-tv' },
    { id: 'melhorias', label: 'Melhorias', icon: 'ri-lightbulb-line', path: '/melhorias' },
    { id: 'relatorios', label: 'Relatórios', icon: 'ri-line-chart-line', path: '/relatorios' },
    { id: 'previsao-falhas', label: 'Previsão de Falhas', icon: 'ri-brain-line', path: '/previsao-falhas' },
    { id: 'usuarios', label: 'Usuários', icon: 'ri-user-line', path: '/usuarios' }
  ];

  return (
    <aside className={`fixed left-0 top-0 h-screen ${isOpen ? 'w-64' : 'w-20'} ${_darkMode ? 'bg-gray-900 border-r border-gray-800' : 'bg-gradient-to-br from-emerald-600 to-emerald-500'} transition-all duration-300 flex flex-col z-40`}>
      {/* Logo e Toggle */}
      <div className={`h-16 flex items-center justify-between px-4 ${_darkMode ? 'border-b border-gray-800' : ''}`}>
        {isOpen ? (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowSettings(!showSettings)}>
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" className={`w-10 h-10 rounded-lg object-contain flex-shrink-0 ${!_darkMode ? 'filter brightness-0 invert' : ''}`} />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-plant-line text-white text-xl"></i>
              </div>
            )}
            <span className="text-white font-semibold text-base truncate">{companyName}</span>
          </div>
        ) : (
          <div className="cursor-pointer" onClick={() => setShowSettings(!showSettings)}>
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" className={`w-10 h-10 rounded-lg object-contain ${!_darkMode ? 'filter brightness-0 invert' : ''}`} />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="ri-plant-line text-white text-xl"></i>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onToggle}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${_darkMode ? 'hover:bg-gray-800' : 'hover:bg-emerald-700/90'}`}
        >
          <i className={`${isOpen ? 'ri-menu-fold-line' : 'ri-menu-unfold-line'} ${_darkMode ? 'text-gray-400' : 'text-white'} text-xl`}></i>
        </button>
      </div>

      {/* Modal de Configurações */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-gray-800 rounded-xl p-6 w-96 max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Configurações da Empresa</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 cursor-pointer"
              >
                <i className="ri-close-line text-gray-400"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Logo da Empresa</label>
                <div className="flex items-center gap-4">
                  {companyLogo ? (
                    <img src={companyLogo} alt="Logo" className="w-20 h-20 rounded-lg object-contain bg-gray-700 p-2" />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <i className="ri-plant-line text-white text-3xl"></i>
                    </div>
                  )}
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer whitespace-nowrap">
                    <i className="ri-upload-2-line mr-2"></i>
                    Fazer Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {companyLogo && (
                    <button
                      onClick={() => {
                        setCompanyLogo(null);
                        localStorage.removeItem('company_logo');
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Empresa</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite o nome da empresa"
                />
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 cursor-pointer whitespace-nowrap"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => {
          if (item.children) {
            const anyChildActive = item.children.some((c: any) => location.pathname.startsWith(c.path));
            const open = openGroups[item.id] ?? anyChildActive;
            return (
              <div key={item.id} className="mb-1">
                <button
                  onClick={() => setOpenGroups(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all cursor-pointer ${
                    open || anyChildActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <i className={`${item.icon} text-xl w-6 h-6 flex items-center justify-center ${_darkMode ? 'text-gray-300' : item.id === 'componentes_group' ? 'text-white' : 'text-white/90'}`}></i>
                  {isOpen && <span className={`font-medium whitespace-nowrap flex-1 text-left ${!_darkMode && item.id === 'componentes_group' ? 'text-white' : ''}`}>{item.label}</span>}
                  {isOpen && <i className={`${open ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'} text-lg`} />}
                </button>

                {open && isOpen && (
                  <div className="pl-8 mt-1">
                    {item.children.map((child: any) => {
                      const childActive = location.pathname === child.path;
                      return (
                        <Link
                          key={child.id}
                          to={child.path}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer mb-1 ${
                            childActive ? (_darkMode ? 'bg-gray-700 text-white' : 'bg-emerald-800/80 text-white') : (_darkMode ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-white/90 hover:bg-emerald-700/60')
                          }`}
                        >
                          <span className={`text-sm ${!_darkMode && item.id === 'componentes_group' ? 'text-white' : ''}`}>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all cursor-pointer mb-1 ${
                  isActive
                    ? (_darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-emerald-700/90 text-white')
                    : (_darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-white/90 hover:bg-emerald-700/60')
                }`}
            >
              <i className={`${item.icon} text-xl w-6 h-6 flex items-center justify-center`}></i>
              {isOpen && <span className={`font-medium whitespace-nowrap ${!_darkMode && item.id === 'componentes_group' ? 'text-white' : ''}`}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4">
        <Link
          to="/login"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all cursor-pointer"
        >
          <i className="ri-logout-box-line text-xl w-6 h-6 flex items-center justify-center"></i>
          {isOpen && <span className="font-medium whitespace-nowrap">Sair</span>}
        </Link>
      </div>
    </aside>
  );
}
