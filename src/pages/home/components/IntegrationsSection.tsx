export default function IntegrationsSection() {
  const integrations = [
    {
      name: 'OpenAI',
      description: 'GPT models to generate content and build intelligent agents.',
      icon: 'ri-openai-line'
    },
    {
      name: 'Notion',
      description: 'Summarize tasks, and organize info using Notion\'s powerful AI assistant.',
      icon: 'ri-notion-line'
    },
    {
      name: 'LinkedIn',
      description: 'Connect with LinkedIn and with dozens of other tools in it',
      icon: 'ri-linkedin-line'
    },
    {
      name: 'Twitter/X',
      description: 'Connect with Twitter and with dozens of other tools in it without code',
      icon: 'ri-twitter-x-line'
    }
  ];

  return (
    <section id="integrations" className="py-24 bg-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full px-6 py-2 mb-6">
            <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">INTEGRATIONS</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Seamless Integrations</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Connect with your favorite tools to streamline workflows
          </p>
        </div>

        {/* Integrations Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {integrations.map((integration, index) => (
            <div key={index} className="group">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <i className={`${integration.icon} text-2xl text-blue-400`}></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{integration.name}</h3>
                    <p className="text-gray-300">{integration.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Central Logo with Animation */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Pulsing Animation */}
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
            <div className="absolute inset-2 bg-blue-500/10 rounded-full animate-ping animation-delay-75"></div>
            <div className="absolute inset-4 bg-blue-500/5 rounded-full animate-ping animation-delay-150"></div>
            
            {/* Logo */}
            <div className="relative w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center border-2 border-blue-500/30">
              <img 
                src="https://framerusercontent.com/images/dgVEBclaou1On3YT6iSCEOOKkHg.png" 
                alt="LanderX Integration Hub" 
                className="w-12 h-12 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animation-delay-75 {
          animation-delay: 0.75s;
        }
        .animation-delay-150 {
          animation-delay: 1.5s;
        }
      `}</style>
    </section>
  );
}