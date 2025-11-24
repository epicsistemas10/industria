import { useNavigate } from 'react-router-dom';

export default function FooterSection() {
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative py-20 bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Logo e Descrição */}
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Sistema de Gestão Industrial
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Plataforma completa para gestão de manutenção industrial com IA, 
              relatórios avançados e monitoramento em tempo real.
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-blue-600 transition-all duration-300 cursor-pointer">
                <i className="ri-linkedin-fill text-xl"></i>
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-blue-600 transition-all duration-300 cursor-pointer">
                <i className="ri-facebook-fill text-xl"></i>
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-blue-600 transition-all duration-300 cursor-pointer">
                <i className="ri-instagram-fill text-xl"></i>
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-blue-600 transition-all duration-300 cursor-pointer">
                <i className="ri-youtube-fill text-xl"></i>
              </a>
            </div>
          </div>

          {/* Funcionalidades */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Funcionalidades</h3>
            <ul className="space-y-3">
              <li>
                <button onClick={() => navigate('/equipamentos')} className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer text-left">
                  Gestão de Equipamentos
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/ordens-servico')} className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer text-left">
                  Ordens de Serviço
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/previsao-falhas')} className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer text-left">
                  Previsão de Falhas IA
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/relatorios')} className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer text-left">
                  Relatórios Avançados
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/mapa')} className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer text-left">
                  Mapa Industrial
                </button>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Empresa</h3>
            <ul className="space-y-3">
              <li>
                <button onClick={() => scrollToSection('features')} className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer text-left">
                  Sobre Nós
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer text-left">
                  Acessar Sistema
                </button>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer">
                  Suporte
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer">
                  Documentação
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer">
                  Contato
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-8"></div>

        {/* Copyright e Links Legais */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <span className="text-gray-400 text-sm">
            © 2024 Sistema de Gestão Industrial. Todos os direitos reservados.
          </span>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors duration-300 cursor-pointer">
              Política de Privacidade
            </a>
            <a href="#" className="hover:text-white transition-colors duration-300 cursor-pointer">
              Termos de Uso
            </a>
            <a href="#" className="hover:text-white transition-colors duration-300 cursor-pointer">
              Cookies
            </a>
            <a href="https://readdy.ai/?origin=logo" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors duration-300 cursor-pointer">
              Powered by Readdy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
