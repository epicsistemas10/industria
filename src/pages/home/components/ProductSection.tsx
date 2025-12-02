
import { useEffect, useState } from 'react';

export function ProductSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedHeights, setAnimatedHeights] = useState([0, 0, 0, 0, 0, 0, 0]);
  const targetHeights = [65, 80, 95, 88, 92, 100, 85];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // 延迟启动动画
            setTimeout(() => {
              animateChart();
            }, 300);
          }
        });
      },
      { threshold: 0.3 }
    );

    const chartElement = document.getElementById('performance-chart');
    if (chartElement) {
      observer.observe(chartElement);
    }

    return () => observer.disconnect();
  }, []);

  const animateChart = () => {
    targetHeights.forEach((targetHeight, index) => {
      setTimeout(() => {
        setAnimatedHeights(prev => {
          const newHeights = [...prev];
          newHeights[index] = targetHeight;
          return newHeights;
        });
      }, index * 150); // 每个柱子延迟150ms
    });
  };

  return (
    <section id="products" className="py-24">
      <div className="container mx-auto px-6">
        {/* Product Title */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-extralight text-white mb-6 tracking-[0.1em]">
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Vivid Edge
            </span>
            <br />
            Series 2000
          </h2>
        </div>

        {/* Product Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Product Mockup */}
          <div className="relative group h-full">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl p-8 backdrop-blur-sm border border-gray-700/30 hover:border-violet-500/30 transition-all duration-700 hover:scale-105 h-full flex items-center justify-center">
              <div className="aspect-square w-full max-w-md bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl relative overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('https://static.readdy.ai/image/ef1aae41220ad17a1705abffff22a58b/398e09eeb37faf1cc23ba8d94bc92510.jpeg')`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                {/* Inner glow effect */}
                <div className="absolute inset-4 border border-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              </div>
              
              {/* Floating glow - 调整为与右侧文字等高 */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl h-full"></div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="space-y-8 h-full flex flex-col justify-center">
            <div className="space-y-6">
              <p className="text-white text-lg leading-relaxed font-light">
                Experience the future of intelligent display technology with our flagship 
                series featuring ultra-high resolution, real-time processing, and seamless 
                integration capabilities.
              </p>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="text-violet-400 text-sm font-light tracking-wide">RESOLUTION</div>
                <div className="text-white text-xl font-light">8K Ultra HD</div>
              </div>
              <div className="space-y-2">
                <div className="text-violet-400 text-sm font-light tracking-wide">REFRESH RATE</div>
                <div className="text-white text-xl font-light">120Hz</div>
              </div>
              <div className="space-y-2">
                <div className="text-violet-400 text-sm font-light tracking-wide">RESPONSE TIME</div>
                <div className="text-white text-xl font-light">&lt;1ms</div>
              </div>
              <div className="space-y-2">
                <div className="text-violet-400 text-sm font-light tracking-wide">COLOR GAMUT</div>
                <div className="text-white text-xl font-light">100% DCI-P3</div>
              </div>
            </div>

            {/* Performance Visualization */}
            <div 
              id="performance-chart"
              className="bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-2xl p-6 border border-gray-700/30 hover:border-violet-500/20 transition-all duration-500"
            >
              <div className="flex items-end space-x-3 h-20">
                {animatedHeights.map((height, i) => (
                  <div 
                    key={i}
                    className="bg-gradient-to-t from-violet-500 to-purple-400 rounded-t flex-1 transition-all duration-1000 ease-out hover:from-violet-400 hover:to-purple-300 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/30 cursor-pointer"
                    style={{ 
                      height: `${height}%`,
                      transitionDelay: `${i * 150}ms`,
                      animation: isVisible ? `pulse-glow 2s ease-in-out infinite ${i * 0.2}s` : 'none'
                    }}
                  ></div>
                ))}
              </div>
              <div className="text-gray-400 text-sm mt-4 font-light">Performance Metrics</div>
            </div>

            <button className="group relative bg-transparent border border-gray-600 text-white px-12 py-4 rounded-xl text-base font-medium transition-all duration-300 hover:border-purple-400 hover:bg-purple-500/10 whitespace-nowrap cursor-pointer tracking-wide">
              View Specifications
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(139, 92, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.6), 0 0 30px rgba(139, 92, 246, 0.4);
          }
        }
      `}</style>
    </section>
  );
}
