
import React from 'react';

const TechSection: React.FC = () => {
  const techFeatures = [
    {
      title: "AI-Powered Visual Recognition",
      description: "Advanced machine learning algorithms analyze and optimize display content in real-time, ensuring perfect visual quality across all environments.",
      image: "https://readdy.ai/api/search-image?query=futuristic%20AI%20technology%20interface%20with%20neural%20networks%2C%20digital%20brain%20visualization%2C%20blue%20and%20purple%20holographic%20displays%2C%20advanced%20computing%20systems%2C%20high-tech%20laboratory%20environment%20with%20glowing%20screens&width=600&height=400&seq=ai-tech-001&orientation=landscape"
    },
    {
      title: "Cloud-Based Collaboration",
      description: "Seamlessly connect multiple displays across different locations with our cloud infrastructure, enabling synchronized content delivery worldwide.",
      image: "https://readdy.ai/api/search-image?query=modern%20cloud%20computing%20data%20center%20with%20server%20racks%2C%20blue%20LED%20lighting%2C%20high-tech%20networking%20equipment%2C%20futuristic%20server%20room%20with%20glowing%20connections%2C%20professional%20technology%20infrastructure&width=600&height=400&seq=cloud-tech-001&orientation=landscape"
    },
    {
      title: "Edge Computing Integration",
      description: "Process data locally with minimal latency using our edge computing solutions, delivering instant responses and real-time analytics.",
      image: "https://readdy.ai/api/search-image?query=advanced%20edge%20computing%20facility%20with%20modern%20servers%2C%20purple%20and%20blue%20ambient%20lighting%2C%20high-tech%20processing%20units%2C%20futuristic%20data%20processing%20center%2C%20sleek%20technology%20equipment%20with%20LED%20indicators&width=600&height=400&seq=edge-tech-001&orientation=landscape"
    }
  ];

  return (
    <section className="bg-black py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-6">
            Cutting-Edge Technology Stack
          </h2>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Our innovative solutions combine the latest advances in AI, cloud computing, 
            and edge processing to deliver unmatched performance and reliability.
          </p>
        </div>

        {/* Technology cards */}
        <div className="space-y-2">
          <div className="bg-gradient-to-b from-gray-900 to-black rounded-lg overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-colors">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 aspect-video md:aspect-auto relative overflow-hidden">
                <img 
                  src="https://readdy.ai/api/search-image?query=futuristic%20AI%20technology%20interface%20with%20neural%20networks%2C%20digital%20brain%20visualization%2C%20blue%20and%20purple%20holographic%20displays%2C%20advanced%20computing%20systems%2C%20high-tech%20laboratory%20environment%20with%20glowing%20screens&width=600&height=400&seq=ai-tech-001&orientation=landscape"
                  alt="AI-Powered Visual Recognition"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
              </div>
              <div className="md:w-1/2 p-2 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-white mb-1">AI-Powered Visual Recognition</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  Advanced machine learning algorithms analyze and optimize display content in real-time, ensuring perfect visual quality across all environments.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-gray-900 to-black rounded-lg overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-colors">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 aspect-video md:aspect-auto relative overflow-hidden">
                <img 
                  src="https://readdy.ai/api/search-image?query=modern%20cloud%20computing%20data%20center%20with%20server%20racks%2C%20blue%20LED%20lighting%2C%20high-tech%20networking%20equipment%2C%20futuristic%20server%20room%20with%20glowing%20connections%2C%20professional%20technology%20infrastructure&width=600&height=400&seq=cloud-tech-001&orientation=landscape"
                  alt="Cloud-Based Collaboration"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
              </div>
              <div className="md:w-1/2 p-2 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-white mb-1">Cloud-Based Collaboration</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  Seamlessly connect multiple displays across different locations with our cloud infrastructure, enabling synchronized content delivery worldwide.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-gray-900 to-black rounded-lg overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-colors">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 aspect-video md:aspect-auto relative overflow-hidden">
                <img 
                  src="https://readdy.ai/api/search-image?query=advanced%20edge%20computing%20facility%20with%20modern%20servers%2C%20purple%20and%20blue%20ambient%20lighting%2C%20high-tech%20processing%20units%2C%20futuristic%20data%20processing%20center%2C%20sleek%20technology%20equipment%20with%20LED%20indicators&width=600&height=400&seq=edge-tech-001&orientation=landscape"
                  alt="Edge Computing Integration"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
              </div>
              <div className="md:w-1/2 p-2 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-white mb-1">Edge Computing Integration</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  Process data locally with minimal latency using our edge computing solutions, delivering instant responses and real-time analytics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechSection;
