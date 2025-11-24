
import { useState } from 'react';

export function CaseStudiesSection() {
  const [selectedProject, setSelectedProject] = useState(0);

  const projects = [
    {
      name: 'Global Healthcare AI',
      date: '2024',
      description: 'Revolutionizing patient care with AI-powered diagnostic systems across 500+ hospitals worldwide',
      image: 'https://readdy.ai/api/search-image?query=modern%20hospital%20with%20advanced%20AI%20diagnostic%20equipment%2C%20futuristic%20medical%20technology%20with%20holographic%20displays%2C%20clean%20white%20environment%20with%20blue%20and%20purple%20accent%20lighting&width=600&height=400&seq=case-001&orientation=landscape',
      metrics: ['500+ Hospitals', '2M+ Patients', '95% Accuracy']
    },
    {
      name: 'Smart City Infrastructure',
      date: '2024',
      description: 'Implementing IoT and AI solutions for traffic optimization and energy management in metropolitan areas',
      image: 'https://readdy.ai/api/search-image?query=futuristic%20smart%20city%20with%20connected%20infrastructure%2C%20IoT%20sensors%20and%20AI%20traffic%20management%20systems%2C%20urban%20landscape%20with%20purple%20and%20cyan%20lighting%20at%20night&width=600&height=400&seq=case-002&orientation=landscape',
      metrics: ['15 Cities', '40% Traffic Reduction', '60% Energy Savings']
    },
    {
      name: 'Autonomous Manufacturing',
      date: '2023',
      description: 'Fully automated production lines with predictive maintenance and quality control systems',
      image: 'https://readdy.ai/api/search-image?query=advanced%20automated%20manufacturing%20facility%20with%20robotic%20arms%20and%20AI%20monitoring%20systems%2C%20futuristic%20factory%20floor%20with%20purple%20and%20blue%20lighting%2C%20high-tech%20industrial%20environment&width=600&height=400&seq=case-003&orientation=landscape',
      metrics: ['50+ Factories', '80% Efficiency Gain', '99.9% Uptime']
    },
    {
      name: 'Financial AI Platform',
      date: '2023',
      description: 'Real-time fraud detection and algorithmic trading systems for major financial institutions',
      image: 'https://readdy.ai/api/search-image?query=sophisticated%20financial%20trading%20floor%20with%20multiple%20holographic%20displays%20showing%20market%20data%2C%20futuristic%20fintech%20environment%20with%20purple%20and%20blue%20data%20visualizations&width=600&height=400&seq=case-004&orientation=landscape',
      metrics: ['100+ Banks', '$50B Protected', '0.01% False Positives']
    }
  ];

  return (
    <section className="relative py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Case <span className="text-blue-400">Studies</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Real-world implementations driving transformation across industries
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {/* Project List */}
          <div className="space-y-4">
            {projects.map((project, index) => (
              <div
                key={index}
                className={`group p-6 rounded-xl border transition-all duration-300 cursor-pointer ${
                  selectedProject === index
                    ? 'bg-purple-500/10 border-purple-500/50'
                    : 'bg-gray-900/30 border-gray-700/50 hover:border-gray-600/50'
                }`}
                onClick={() => setSelectedProject(index)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {project.name}
                    </h3>
                    <p className="text-gray-400 text-sm">{project.date}</p>
                  </div>
                  <i className={`ri-arrow-right-line text-2xl transition-colors ${
                    selectedProject === index ? 'text-purple-400' : 'text-gray-500'
                  }`}></i>
                </div>
              </div>
            ))}
          </div>

          {/* Project Details */}
          <div className="relative">
            <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-8 border border-gray-700/50">
              <div className="aspect-video mb-6 rounded-xl overflow-hidden">
                <img
                  src={projects[selectedProject].image}
                  alt={projects[selectedProject].name}
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-2xl font-semibold text-white mb-4">
                {projects[selectedProject].name}
              </h3>

              <p className="text-gray-300 mb-6 leading-relaxed">
                {projects[selectedProject].description}
              </p>

              <div className="grid grid-cols-3 gap-4">
                {projects[selectedProject].metrics.map((metric, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-1">
                      {metric.split(' ')[0]}
                    </div>
                    <div className="text-sm text-gray-400">
                      {metric.split(' ').slice(1).join(' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
