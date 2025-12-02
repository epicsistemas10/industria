export default function StatsSection() {
  const stats = [
    {
      number: '99.9%',
      label: 'Disponibilidade',
      description: 'Uptime garantido'
    },
    {
      number: '70%',
      label: 'Redução de Falhas',
      description: 'Com previsão por IA'
    },
    {
      number: '50%',
      label: 'Economia de Custos',
      description: 'Em manutenção'
    },
    {
      number: '24/7',
      label: 'Monitoramento',
      description: 'Tempo real'
    }
  ];

  return (
    <section className="bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 py-16">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Resultados Comprovados
          </h2>
          <p className="text-xl text-gray-300">
            Empresas que usam nossa plataforma alcançam resultados extraordinários
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-green-400 font-semibold mb-1">
                {stat.label}
              </div>
              <div className="text-gray-300 text-sm">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
