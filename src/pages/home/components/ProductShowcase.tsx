
import React from 'react';

const ProductShowcase: React.FC = () => {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Product Display */}
        <div className="relative mb-20">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 border border-gray-800 shadow-2xl">
            <div 
              className="relative h-96 rounded-2xl overflow-hidden"
              style={{
                backgroundImage: `url('https://readdy.ai/api/search-image?query=modern%20startup%20workspace%20with%20multiple%20curved%20displays%20showing%20data%20analytics%2C%20purple%20and%20blue%20ambient%20lighting%2C%20sleek%20black%20furniture%2C%20futuristic%20office%20environment%2C%20tech%20innovation%20hub&width=1200&height=600&seq=workspace-main&orientation=landscape')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer">
                  <i className="ri-play-fill text-white text-2xl ml-1"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Series */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Vivid Edge Series 2000
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Revolutionary startup acceleration platform designed for the next generation of entrepreneurs
          </p>
        </div>

        {/* Product Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl p-8 border border-gray-800">
            <div 
              className="w-16 h-16 rounded-xl mb-6 flex items-center justify-center"
              style={{
                backgroundImage: `url('https://readdy.ai/api/search-image?query=abstract%20purple%20gradient%20geometric%20shape%2C%20minimalist%20design%2C%20tech%20icon%20style%2C%20dark%20background%2C%20modern%20digital%20art&width=200&height=200&seq=feature-icon-1&orientation=squarish')`,
                backgroundSize: 'cover'
              }}
            >
              <i className="ri-rocket-2-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Accelerated Growth</h3>
            <p className="text-gray-400 leading-relaxed">
              Advanced algorithms and AI-driven insights help startups scale faster than traditional methods, reducing time-to-market by 60%.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl p-8 border border-gray-800">
            <div 
              className="w-16 h-16 rounded-xl mb-6 flex items-center justify-center"
              style={{
                backgroundImage: `url('https://readdy.ai/api/search-image?query=abstract%20blue%20gradient%20geometric%20shape%2C%20minimalist%20design%2C%20tech%20icon%20style%2C%20dark%20background%2C%20modern%20digital%20art&width=200&height=200&seq=feature-icon-2&orientation=squarish')`,
                backgroundSize: 'cover'
              }}
            >
              <i className="ri-brain-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Smart Analytics</h3>
            <p className="text-gray-400 leading-relaxed">
              Real-time market analysis and predictive modeling provide actionable insights for strategic decision making and competitive advantage.
            </p>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl p-8 border border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">99.9%</div>
              <div className="text-gray-400">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">&lt;50ms</div>
              <div className="text-gray-400">Response Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">24/7</div>
              <div className="text-gray-400">Support Available</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
