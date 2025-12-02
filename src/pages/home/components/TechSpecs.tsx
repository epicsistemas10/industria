
import React from 'react';

const TechSpecs: React.FC = () => {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-wider uppercase mb-4">
            Technology Specifications
          </p>
          <h2 className="text-4xl font-bold text-white mb-6">
            VIDIOS™ redefines global experiences with innovative LED solutions, inspiring audiences worldwide through transformative technology and creativity.
          </h2>
        </div>

        {/* Main Tech Display */}
        <div className="relative mb-16">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 border border-gray-800 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left - Tech Visualization */}
              <div className="relative">
                <div 
                  className="h-80 rounded-2xl overflow-hidden"
                  style={{
                    backgroundImage: `url('https://readdy.ai/api/search-image?query=futuristic%20holographic%20display%20showing%20startup%20growth%20charts%20and%20data%20visualization%2C%20purple%20and%20blue%20neon%20colors%2C%20high-tech%20interface%2C%20dark%20background%2C%20digital%20innovation&width=600&height=400&seq=tech-display&orientation=landscape')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-purple-500 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-500 rounded-full animate-pulse delay-300"></div>
              </div>

              {/* Right - Specifications */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-8">Advanced Startup Platform</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-3 border-b border-gray-800">
                    <span className="text-gray-400">Processing Power</span>
                    <span className="text-white font-semibold">AI-Enhanced</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-800">
                    <span className="text-gray-400">Data Analytics</span>
                    <span className="text-white font-semibold">Real-time</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-800">
                    <span className="text-gray-400">Scalability</span>
                    <span className="text-white font-semibold">Unlimited</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-800">
                    <span className="text-gray-400">Integration</span>
                    <span className="text-white font-semibold">500+ APIs</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <span className="text-gray-400">Security</span>
                    <span className="text-white font-semibold">Enterprise-grade</span>
                  </div>
                </div>

                <button className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all cursor-pointer whitespace-nowrap">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-gray-800 hover:border-purple-500/50 transition-all cursor-pointer">
            <div 
              className="w-full h-32 rounded-xl mb-6"
              style={{
                backgroundImage: `url('https://readdy.ai/api/search-image?query=startup%20team%20collaboration%20in%20modern%20office%20with%20digital%20screens%2C%20innovative%20workspace%2C%20purple%20lighting%2C%20tech%20environment%2C%20professional%20atmosphere&width=400&height=200&seq=feature-1&orientation=landscape')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            ></div>
            <h4 className="text-lg font-semibold text-white mb-3">Team Collaboration</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              Seamless collaboration tools designed for distributed startup teams to work efficiently across time zones.
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-gray-800 hover:border-blue-500/50 transition-all cursor-pointer">
            <div 
              className="w-full h-32 rounded-xl mb-6"
              style={{
                backgroundImage: `url('https://readdy.ai/api/search-image?query=advanced%20data%20visualization%20dashboard%20with%20charts%20and%20graphs%2C%20blue%20and%20purple%20interface%2C%20modern%20analytics%20platform%2C%20dark%20theme%2C%20tech%20startup%20tools&width=400&height=200&seq=feature-2&orientation=landscape')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            ></div>
            <h4 className="text-lg font-semibold text-white mb-3">Smart Analytics</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI-powered analytics provide deep insights into market trends and customer behavior patterns.
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-gray-800 hover:border-green-500/50 transition-all cursor-pointer">
            <div 
              className="w-full h-32 rounded-xl mb-6"
              style={{
                backgroundImage: `url('https://readdy.ai/api/search-image?query=global%20network%20visualization%20with%20connected%20nodes%2C%20world%20map%20with%20glowing%20connections%2C%20tech%20startup%20expansion%2C%20dark%20background%20with%20neon%20accents&width=400&height=200&seq=feature-3&orientation=landscape')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            ></div>
            <h4 className="text-lg font-semibold text-white mb-3">Global Reach</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              Expand your startup globally with our international network and localization tools.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechSpecs;
