export default function InsightsSection() {
  const insights = [
    {
      icon: 'ri-links-line',
      title: 'Effortless Integration',
      description: 'Your data is synced in real-time across devices, ensuring you stay connected and informed—online or offline.'
    },
    {
      icon: 'ri-shield-check-line',
      title: 'Secure & Scalable',
      description: 'Enterprise-grade encryption protects your information, while flexible tools adapt to your business needs.'
    },
    {
      icon: 'ri-lightbulb-line',
      title: 'Actionable Insights',
      description: 'Leverage AI-powered analytics to identify trends, predict outcomes, and optimize your workflow effortlessly.'
    }
  ];

  const features = [
    'Smart Analytics',
    'Real-Time Collaboration',
    'Task Prioritization'
  ];

  return (
    <section id="insights" className="py-24 bg-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Radar Animation */}
      <div className="absolute top-1/2 right-10 transform -translate-y-1/2 hidden lg:block">
        <div className="relative w-64 h-64">
          {/* Radar Circles */}
          <div className="absolute inset-0 border border-blue-500/20 rounded-full"></div>
          <div className="absolute inset-8 border border-blue-500/30 rounded-full"></div>
          <div className="absolute inset-16 border border-blue-500/40 rounded-full"></div>
          <div className="absolute inset-24 border border-blue-500/50 rounded-full"></div>
          
          {/* Radar Lines */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-500/20"></div>
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-blue-500/20"></div>
          
          {/* Scanning Beam */}
          <div className="absolute top-1/2 left-1/2 w-32 h-px bg-gradient-to-r from-blue-500 to-transparent transform -translate-y-1/2 origin-left animate-spin"></div>
          
          {/* Radar Dot */}
          <div className="absolute top-20 right-20 w-3 h-3 bg-blue-500 rounded-full animate-pulse">
            <img src="https://framerusercontent.com/images/ubO6hprNRTUPSD1LOKrAqhScc.png" alt="Target" className="w-full h-full rounded-full object-cover" />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full px-6 py-2 mb-6">
            <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">AI-DRIVEN EFFICIENCY</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Never Miss an Opportunity</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Capture leads, analyze trends, and centralize critical insights
          </p>
        </div>

        {/* Insights Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {insights.map((insight, index) => (
            <div key={index} className="group">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 h-full">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <i className={`${insight.icon} text-2xl text-blue-400`}></i>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{insight.title}</h3>
                <p className="text-gray-300 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-3 bg-gray-800/30 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-700">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}