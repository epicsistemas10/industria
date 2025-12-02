import React from 'react';
import { useNavigate } from 'react-router-dom';

const FeaturesSection: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: 'ri-tools-line',
      title: 'Gestão de Equipamentos',
      description: 'Controle completo de todos os equipamentos industriais com histórico de manutenções, revisões e status em tempo real.',
      color: 'bg-blue-500'
    },
    {
      icon: 'ri-file-list-3-line',
      title: 'Ordens de Serviço',
      description: 'Crie, gerencie e acompanhe ordens de serviço com priorização automática e notificações em tempo real.',
      color: 'bg-purple-500'
    },
    {
      icon: 'ri-brain-line',
      title: 'Previsão de Falhas com IA',
      description: 'Algoritmo inteligente que prevê falhas antes que aconteçam, reduzindo paradas não programadas em até 70%.',
      color: 'bg-green-500'
    },
    {
      icon: 'ri-bar-chart-box-line',
      title: 'Relatórios Avançados',
      description: 'Gráficos interativos, exportação em PDF/Excel e dashboards executivos com KPIs em tempo real.',
      color: 'bg-orange-500'
    },
    {
      icon: 'ri-team-line',
      title: 'Gestão de Equipes',
      description: 'Organize equipes, distribua tarefas e acompanhe a produtividade com métricas detalhadas.',
      color: 'bg-indigo-500'
    },
    {
      icon: 'ri-map-pin-line',
      title: 'Mapa Industrial',
      description: 'Visualização geográfica de todos os equipamentos na planta com status e alertas em tempo real.',
      color: 'bg-pink-500'
    },
    {
      icon: 'ri-money-dollar-circle-line',
      title: 'Controle de Custos',
      description: 'Monitore custos de manutenção, peças e mão de obra com análises detalhadas e projeções.',
      color: 'bg-red-500'
    },
    {
      icon: 'ri-notification-3-line',
      title: 'Notificações Inteligentes',
      description: 'Alertas por email e push notification para eventos críticos, revisões próximas e falhas detectadas.',
      color: 'bg-yellow-500'
    },
    {
      icon: 'ri-qr-scan-line',
      title: 'Leitor OCR de Placas',
      description: 'Leia automaticamente códigos de equipamentos, números de série e informações de placas usando IA.',
      color: 'bg-teal-500'
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Funcionalidades Completas para Sua Indústria
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Nossa plataforma oferece todas as ferramentas necessárias para otimizar 
            a gestão de manutenção e aumentar a eficiência operacional da sua indústria.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:scale-105">
              <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                <i className={`${feature.icon} text-white text-2xl`}></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button 
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 whitespace-nowrap cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <i className="ri-login-box-line mr-2"></i>
            Começar Agora
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
