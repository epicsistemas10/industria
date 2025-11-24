
import { useState } from 'react';

export function ProjectsSection() {
  const [activeProject, setActiveProject] = useState(0);

  const projects = [
    {
      title: "Digital Art Installation",
      description: "Interactive LED wall for contemporary art museum featuring real-time generative visuals",
      date: "2024",
      image: "https://readdy.ai/api/search-image?query=modern%20art%20museum%20with%20large%20interactive%20LED%20wall%20displaying%20colorful%20abstract%20digital%20art%2C%20visitors%20silhouettes%20in%20foreground%2C%20dramatic%20lighting%2C%20contemporary%20gallery%20space%2C%20high-tech%20installation&width=600&height=400&seq=project-art-001&orientation=landscape"
    },
    {
      title: "Corporate Headquarters",
      description: "Immersive lobby experience with curved LED displays showcasing brand storytelling",
      date: "2024",
      image: "https://readdy.ai/api/search-image?query=luxury%20corporate%20lobby%20with%20curved%20LED%20display%20walls%20showing%20dynamic%20brand%20content%2C%20modern%20architecture%2C%20professional%20lighting%2C%20sleek%20design%2C%20business%20environment&width=600&height=400&seq=project-corp-001&orientation=landscape"
    },
    {
      title: "Concert Stage Design",
      description: "Dynamic stage backdrop with synchronized LED panels for live music performances",
      date: "2023",
      image: "https://readdy.ai/api/search-image?query=concert%20stage%20with%20massive%20LED%20screen%20backdrop%20displaying%20vibrant%20synchronized%20visuals%2C%20dramatic%20stage%20lighting%2C%20music%20performance%20setup%2C%20entertainment%20venue%2C%20dynamic%20colors&width=600&height=400&seq=project-concert-001&orientation=landscape"
    }
  ];

  return (
    <section id="projects" className="py-24">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Project List */}
          <div className="space-y-8">
            <h3 className="text-4xl font-extralight text-white mb-12 tracking-[0.05em]">
              Recent <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Projects</span>
            </h3>
            
            {projects.map((project, index) => (
              <div 
                key={index}
                className={`group cursor-pointer transition-all duration-500 ${
                  activeProject === index ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                }`}
                onClick={() => setActiveProject(index)}
              >
                <div className="flex items-center justify-between py-6 border-b border-gray-700/30 group-hover:border-violet-500/30 transition-colors duration-500">
                  <div className="space-y-2">
                    <h4 className="text-xl font-light text-white group-hover:text-violet-400 transition-colors duration-500 tracking-wide">{project.title}</h4>
                    <p className="text-white font-light text-sm">{project.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-white text-sm font-light">{project.year}</span>
                    <i className="ri-arrow-right-line text-white group-hover:text-violet-400 transition-colors duration-500"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Project Image */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden relative group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url('${projects[activeProject].image}')`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 group-hover:from-black/40 transition-all duration-700"></div>
              </div>
              
              {/* Project overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <h4 className="text-white text-2xl font-light mb-2 tracking-wide">
                  {projects[activeProject].title}
                </h4>
                <p className="text-gray-300 font-light">
                  {projects[activeProject].description}
                </p>
              </div>

              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
