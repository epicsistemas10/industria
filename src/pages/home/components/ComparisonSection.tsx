export default function ComparisonSection() {
  const lanxFeatures = [
    'Effortless global collaboration',
    'Highly scalable & flexible solutions',
    'Advanced dashboard control',
    'Built-in data-driven analytics',
    'Latest automation solutions'
  ];

  const othersFeatures = [
    'Limited global collaboration',
    'Rigid and non-scalable options',
    'Basic dashboard functionalities',
    'Lack of advanced analytics',
    'Outdated and complex interfaces'
  ];

  return (
    <section id="comparison" className="py-24 bg-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full px-6 py-2 mb-6">
            <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">COMPARISON</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Why LanX Stands Out</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See how we compare against others in performance, growth
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* LanderX Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-blue-500"></div>
            
            {/* Header */}
            <div className="text-center mb-8">
              <img 
                src="https://framerusercontent.com/images/FbO4dnbdmZd5UO3ULm6CTPenvIo.png" 
                alt="LanderX Logo" 
                className="h-12 mx-auto mb-4"
              />
            </div>

            {/* Features */}
            <div className="space-y-4">
              {lanxFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="ri-check-line text-green-400 text-sm"></i>
                  </div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Others Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="ri-question-line text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-white">Others</h3>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {othersFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="ri-close-line text-red-400 text-sm"></i>
                  </div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}