export default function HeroSection() {
  const scrollToServices = () => {
    const servicesSection = document.getElementById('products');
    if (servicesSection) {
      servicesSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleLogin = () => {
    // Verifica se já está na página de login
    if (window.location.pathname === '/login') {
      // Se já estiver na página de login, rola para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Se não estiver, navega para a página de login
      window.REACT_APP_NAVIGATE('/login');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900" />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        {/* Main Heading */}
        <h1 className="text-7xl md:text-7xl font-extralight text-white mb-6 tracking-[0.1em] leading-tight text-center animate-fade-in">
          Gestão Inteligente para
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Sua Indústria
          </span>
        </h1>

        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light tracking-wide opacity-90">
          Sistema completo de manutenção industrial com inteligência artificial, previsão de falhas e automação de processos.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={handleLogin}
            className="group relative bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-base font-medium transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 whitespace-nowrap cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-2">
              <i className="ri-login-box-line"></i>
              Acessar Sistema
            </span>
          </button>
          
          <button 
            onClick={scrollToServices}
            className="group relative bg-transparent border border-gray-600 text-white px-8 py-4 rounded-xl text-base font-medium transition-all duration-300 hover:border-purple-400 hover:bg-purple-500/10 whitespace-nowrap cursor-pointer"
          >
            <span className="relative z-10">Ver serviços</span>
          </button>
        </div>
      </div>
    </section>
  );
}