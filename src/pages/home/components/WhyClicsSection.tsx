
import React from 'react';

const WhyClicsSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
            Why clics
          </h2>
          <p className="text-xl text-gray-700">
            Put clics to work. Invest your time where it's needed
          </p>
        </div>

        {/* Easy Setup Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="order-2 lg:order-1">
            <div className="relative">
              <img 
                src="https://static.wixstatic.com/media/c837a6_01abd41201e647cdaee48fbff8729628~mv2.jpg/v1/crop/x_1084,y_0,w_4637,h_3099/fill/w_446,h_297,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1125823856%20(1).jpg"
                alt="Easy Setup"
                className="w-full rounded-lg shadow-lg"
              />
              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-4">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_5f282d4bd7a0494195e7cf1f5ee353f2~mv2.png/v1/fill/w_315,h_200,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/screen%204.png"
                  alt="Dashboard Preview"
                  className="w-48 h-auto"
                />
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h3 className="text-3xl font-bold text-black mb-4">
              Easy setup
            </h3>
            <p className="text-lg text-gray-700 mb-6">
              Set it up once, and you're good to go. No hassle or code required.
            </p>
            <p className="text-gray-600 mb-8">
              I'm a paragraph. Click here to add your own text and edit me. I'm a great place for you to tell a story and let your users know a little more about you.
            </p>
            <button className="bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 whitespace-nowrap cursor-pointer">
              Book a Demo
            </button>
          </div>
        </div>

        {/* Smart Budgeting Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h3 className="text-3xl font-bold text-black mb-4">
              Smart budgeting
            </h3>
            <p className="text-lg text-gray-700 mb-6">
              With clics' budgeting system, you can rest assured your resources are spent wisely.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png"
                  alt="Check"
                  className="w-6 h-6"
                />
                <span className="text-gray-600">Performance-based budgeting</span>
              </div>
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png"
                  alt="Check"
                  className="w-6 h-6"
                />
                <span className="text-gray-600">Dynamic resources allocation</span>
              </div>
            </div>

            <button className="bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 whitespace-nowrap cursor-pointer">
              Book a Demo
            </button>
          </div>
          <div className="relative">
            <img 
              src="https://static.wixstatic.com/media/c837a6_679e2ea0ad1d447d90c99d8ce7216c58~mv2.png/v1/fill/w_314,h_455,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/screen%205.png"
              alt="Smart Budgeting"
              className="w-full max-w-md mx-auto"
            />
            <div className="absolute -top-4 -left-4">
              <img 
                src="https://static.wixstatic.com/media/c837a6_1bd1324f8f6348f7beaa57f56e70f7a6~mv2.jpg/v1/crop/x_1051,y_3,w_4327,h_4329/fill/w_278,h_277,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1863517984.jpg"
                alt="Analytics"
                className="w-32 h-32 rounded-full shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Beautiful Ads Templates Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="relative">
              <img 
                src="https://static.wixstatic.com/media/c837a6_efcbcaf47bf44f7092ffce664d83816b~mv2.png/v1/fill/w_346,h_547,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/screen%203.png"
                alt="Ad Templates"
                className="w-full max-w-sm mx-auto"
              />
              <div className="absolute -bottom-4 -right-4">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_2327c691ec1c438d8b7d2dbbf546e6d0~mv2.png/v1/fill/w_284,h_96,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/screen%206.png"
                  alt="Template Preview"
                  className="w-48 h-auto shadow-lg rounded"
                />
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h3 className="text-3xl font-bold text-black mb-4">
              Beautiful ads templates
            </h3>
            <p className="text-lg text-gray-700 mb-6">
              Use clics epic design presets to match multiple platforms and formats.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png"
                  alt="Check"
                  className="w-6 h-6"
                />
                <span className="text-gray-600">Image ads</span>
              </div>
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png"
                  alt="Check"
                  className="w-6 h-6"
                />
                <span className="text-gray-600">Video ads</span>
              </div>
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png"
                  alt="Check"
                  className="w-6 h-6"
                />
                <span className="text-gray-600">Story ads</span>
              </div>
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png"
                  alt="Check"
                  className="w-6 h-6"
                />
                <span className="text-gray-600">Interactive ads</span>
              </div>
            </div>

            <button className="bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 whitespace-nowrap cursor-pointer">
              Book a Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyClicsSection;
