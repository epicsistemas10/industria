import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CTASection() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!email || !email.includes('@')) {
      alert('Por favor, insira um email válido.');
      return;
    }
    alert('Obrigado! Entraremos em contato em breve.');
    setEmail('');
  };

  return (
    <section className="py-24 bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Main Heading */}
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Pronto para Transformar
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {' '}
              Sua Indústria?
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Junte-se a centenas de indústrias que já usam nossa plataforma para 
            otimizar manutenção e reduzir custos operacionais.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="flex items-center justify-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <i className="ri-check-line text-green-400 text-xl"></i>
              <span className="text-white font-medium">Teste grátis por 30 dias</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <i className="ri-check-line text-green-400 text-xl"></i>
              <span className="text-white font-medium">Sem cartão de crédito</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <i className="ri-check-line text-green-400 text-xl"></i>
              <span className="text-white font-medium">Suporte em português</span>
            </div>
          </div>

          {/* Email Signup */}
          <div className="max-w-lg mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email corporativo"
                className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 text-lg"
              />
              <button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-lg text-base font-semibold transition-all duration-300 hover:from-green-600 hover:to-emerald-700 whitespace-nowrap cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <i className="ri-send-plane-fill mr-2"></i>
                Solicitar Demonstração
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-3">
              Ao se cadastrar, você concorda com nossos Termos de Uso e Política de Privacidade
            </p>
          </div>

          {/* Alternative CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/login')}
              className="group relative bg-white text-blue-900 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 hover:bg-gray-100 whitespace-nowrap cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <i className="ri-login-box-line mr-2"></i>
              <span className="relative z-10">Acessar Sistema</span>
            </button>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="group relative bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 hover:bg-white hover:text-blue-900 whitespace-nowrap cursor-pointer"
            >
              <i className="ri-phone-line mr-2"></i>
              <span className="relative z-10">Falar com Vendas</span>
            </button>
          </div>

          {/* Social Proof */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-gray-400 mb-4">Confiado por mais de 500 indústrias no Brasil</p>
            <div className="flex justify-center items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                  >
                    <i className="ri-building-line"></i>
                  </div>
                ))}
              </div>
              <span className="text-gray-300 ml-3">+500 indústrias</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
