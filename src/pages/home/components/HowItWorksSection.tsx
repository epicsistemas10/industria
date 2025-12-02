
import React from 'react';

const HowItWorksSection: React.FC = () => {
  return (
    <section className="relative py-20 bg-white overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full">
        <video
          className="w-full h-full object-cover opacity-20"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="https://video.wixstatic.com/video/c837a6_d1ecef05ccf2439795e947fcee38ebfa/1080p/mp4/file.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-white/80"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">How it Works</h2>
          <p className="text-xl text-gray-700 mb-4 font-medium">Meet TechFlow's all-in-one solution for efficient developers</p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            A one-stop platform that delivers your applications across all environments with seamless integration and powerful automation.
          </p>
        </div>

        {/* Platform Icons Row */}
        <div className="flex justify-center items-center space-x-12 mb-16">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <img 
                src="https://static.wixstatic.com/media/0fdef751204647a3bbd7eaa2827ed4f9.png/v1/fill/w_45,h_45,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/0fdef751204647a3bbd7eaa2827ed4f9.png" 
                alt="Platform 1" 
                className="w-8 h-8"
              />
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <img 
                src="https://static.wixstatic.com/media/01c3aff52f2a4dffa526d7a9843d46ea.png/v1/fill/w_45,h_45,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/01c3aff52f2a4dffa526d7a9843d46ea.png" 
                alt="Platform 2" 
                className="w-8 h-8"
              />
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <img 
                src="https://static.wixstatic.com/media/c7d035ba85f6486680c2facedecdcf4d.png/v1/fill/w_45,h_45,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/c7d035ba85f6486680c2facedecdcf4d.png" 
                alt="Platform 3" 
                className="w-8 h-8"
              />
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <img 
                src="https://static.wixstatic.com/media/78aa2057f0cb42fbbaffcbc36280a64a.png/v1/fill/w_45,h_45,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/78aa2057f0cb42fbbaffcbc36280a64a.png" 
                alt="Platform 4" 
                className="w-8 h-8"
              />
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
          </div>
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <img 
              src="https://static.wixstatic.com/media/11062b_6e7994bdd94b41178720ff1641a0f323~mv2.png/v1/fill/w_45,h_45,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/11062b_6e7994bdd94b41178720ff1641a0f323~mv2.png" 
              alt="Platform 5" 
              className="w-8 h-8"
            />
          </div>
        </div>

        {/* Main Dashboard Display */}
        <div className="relative mb-16">
          <img 
            src="https://static.wixstatic.com/media/c837a6_da61542a97d443ca9005e759ce146f72~mv2.png/v1/fill/w_974,h_577,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/screen%202.png" 
            alt="TechFlow Dashboard Interface" 
            className="w-full h-auto rounded-2xl shadow-2xl"
          />
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <img 
                src="https://static.wixstatic.com/media/c837a6_1045be3adbb14173aebfae46c5c230ee~mv2.png/v1/fill/w_185,h_185,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201.png" 
                alt="Merge Audiences" 
                className="w-16 h-16"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Merge<br />Audiences</h3>
          </div>
          <div className="text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <img 
                src="https://static.wixstatic.com/media/c837a6_c1a0b36ac9cd4978a39ab87c8f78397c~mv2.png/v1/fill/w_168,h_168,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%202.png" 
                alt="Save Time" 
                className="w-16 h-16"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Save<br />Time</h3>
          </div>
          <div className="text-center">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <img 
                src="https://static.wixstatic.com/media/c837a6_bbc8ce93eca1474eb713311e81aa6c0b~mv2.png/v1/fill/w_168,h_168,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy.png" 
                alt="Smart Budget Allocations" 
                className="w-16 h-16"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Budget Allocations</h3>
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Our comprehensive platform streamlines your development workflow with intelligent automation, seamless integrations, and powerful analytics that help you build better applications faster.
          </p>
          <button className="bg-black text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-colors whitespace-nowrap cursor-pointer">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
