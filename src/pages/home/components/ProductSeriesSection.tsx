
import { useEffect, useRef, useState } from 'react';

export function ProductSeriesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const products = [
    {
      title: 'AI Vision Pro',
      description: 'Advanced computer vision systems with real-time processing capabilities',
      image: 'https://readdy.ai/api/search-image?query=sleek%20futuristic%20AI%20computer%20vision%20device%20with%20holographic%20interface%2C%20modern%20technology%20design%20with%20purple%20and%20blue%20accents%2C%20professional%20product%20photography%20with%20clean%20background&width=400&height=300&seq=product-001&orientation=landscape',
      features: ['Real-time Processing', 'Edge Computing', 'Neural Networks']
    },
    {
      title: 'Quantum Analytics',
      description: 'Next-generation data analytics powered by quantum computing principles',
      image: 'https://readdy.ai/api/search-image?query=quantum%20computing%20analytics%20dashboard%20with%20glowing%20data%20visualizations%2C%20futuristic%20interface%20design%20with%20cyan%20and%20purple%20lighting%2C%20high-tech%20data%20processing%20visualization&width=400&height=300&seq=product-002&orientation=landscape',
      features: ['Quantum Speed', 'Predictive Models', 'Big Data']
    },
    {
      title: 'Neural Interface',
      description: 'Brain-computer interface technology for seamless human-AI interaction',
      image: 'https://readdy.ai/api/search-image?query=advanced%20neural%20interface%20headset%20with%20glowing%20connections%2C%20futuristic%20brain-computer%20interface%20technology%2C%20sleek%20design%20with%20blue%20and%20purple%20lighting%20effects&width=400&height=300&seq=product-003&orientation=landscape',
      features: ['Mind Control', 'Neural Mapping', 'Adaptive Learning']
    }
  ];

  return (
    <section ref={sectionRef} className="relative py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Product <span className="text-purple-400">Series</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Cutting-edge solutions designed to push the boundaries of what's possible
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {products.map((product, index) => (
            <div
              key={index}
              className={`group relative bg-gray-900/30 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer transform ${
                isVisible 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-6 opacity-0'
              }`}
              style={{
                transitionDelay: `${index * 150}ms`,
                transitionTimingFunction: 'cubic-bezier(0.2, 0.9, 0.3, 1)'
              }}
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="aspect-video mb-6 rounded-xl overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                <h3 className="text-2xl font-semibold text-white mb-3">
                  {product.title}
                </h3>

                <p className="text-gray-300 mb-6 leading-relaxed">
                  {product.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {product.features.map((feature, featureIndex) => (
                    <span
                      key={featureIndex}
                      className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <button className="w-full bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white py-3 rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-300 whitespace-nowrap cursor-pointer">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
