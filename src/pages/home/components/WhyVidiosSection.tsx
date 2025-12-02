
import React from 'react';

const WhyVidiosSection: React.FC = () => {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Why VIDIOS</h2>
          <p className="text-xl text-gray-300">Put VIDIOS to work. Invest your time where it's needed</p>
        </div>

        {/* Feature 1: Easy Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="relative">
            <img 
              src="https://static.wixstatic.com/media/c837a6_01abd41201e647cdaee48fbff8729628~mv2.jpg/v1/crop/x_1084,y_0,w_4637,h_3099/fill/w_446,h_297,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1125823856%20(1).jpg" 
              alt="Easy Setup" 
              className="w-full h-64 object-cover rounded-2xl mb-4"
            />
            <div className="absolute -bottom-8 -right-8">
              <img 
                src="https://static.wixstatic.com/media/c837a6_5f282d4bd7a0494195e7cf1f5ee353f2~mv2.png/v1/fill/w_315,h_200,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/screen%204.png" 
                alt="Setup Interface" 
                className="w-48 h-32 rounded-lg shadow-2xl"
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-3xl font-bold text-white mb-4">Easy Setup</h3>
            <p className="text-lg text-gray-300 mb-6">Set it up once, and you're good to go. No hassle or code required.</p>
            <p className="text-gray-400 mb-8">
              Our intuitive setup process gets you up and running in minutes. With drag-and-drop simplicity and automated configuration, you can focus on creating amazing visual experiences rather than wrestling with complex technical setup.
            </p>
            <button className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer">
              Book a Demo
            </button>
          </div>
        </div>

        {/* Feature 2: Smart Budgeting */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="lg:order-2">
            <h3 className="text-3xl font-bold text-white mb-4">Smart Resource Management</h3>
            <p className="text-lg text-gray-300 mb-6">With VIDIOS' intelligent system, you can rest assured your resources are optimized efficiently.</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png" 
                  alt="Check" 
                  className="w-6 h-6"
                />
                <p className="text-gray-300">Performance-based optimization</p>
              </div>
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png" 
                  alt="Check" 
                  className="w-6 h-6"
                />
                <p className="text-gray-300">Dynamic resource allocation</p>
              </div>
            </div>
            
            <button className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer">
              Book a Demo
            </button>
          </div>
          
          <div className="lg:order-1 relative">
            <img 
              src="https://static.wixstatic.com/media/c837a6_679e2ea0ad1d447d90c99d8ce7216c58~mv2.png/v1/fill/w_314,h_455,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/screen%205.png" 
              alt="Smart Management" 
              className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl"
            />
            <div className="absolute -top-8 -left-8">
              <img 
                src="https://static.wixstatic.com/media/c837a6_1bd1324f8f6348f7beaa57f56e70f7a6~mv2.jpg/v1/crop/x_1051,y_3,w_4327,h_4329/fill/w_278,h_277,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1863517984.jpg" 
                alt="Analytics" 
                className="w-32 h-32 rounded-full object-cover shadow-xl"
              />
            </div>
          </div>
        </div>

        {/* Feature 3: Beautiful Templates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <img 
              src="https://static.wixstatic.com/media/c837a6_efcbcaf47bf44f7092ffce664d83816b~mv2.png/v1/fill/w_346,h_547,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/screen%203.png" 
              alt="Visual Templates" 
              className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-4 -right-4">
              <img 
                src="https://static.wixstatic.com/media/c837a6_2327c691ec1c438d8b7d2dbbf546e6d0~mv2.png/v1/fill/w_284,h_96,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/screen%206.png" 
                alt="Template Preview" 
                className="w-40 h-16 rounded-lg shadow-xl"
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-3xl font-bold text-white mb-4">Beautiful Visual Templates</h3>
            <p className="text-lg text-gray-300 mb-6">Use VIDIOS epic design presets to match multiple formats and environments.</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png" 
                  alt="Check" 
                  className="w-6 h-6"
                />
                <p className="text-gray-300">LED Display Templates</p>
              </div>
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png" 
                  alt="Check" 
                  className="w-6 h-6"
                />
                <p className="text-gray-300">Interactive Experiences</p>
              </div>
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png" 
                  alt="Check" 
                  className="w-6 h-6"
                />
                <p className="text-gray-300">Immersive Environments</p>
              </div>
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png" 
                  alt="Check" 
                  className="w-6 h-6"
                />
                <p className="text-gray-300">Custom Visual Solutions</p>
              </div>
            </div>
            
            <button className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer">
              Book a Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyVidiosSection;
