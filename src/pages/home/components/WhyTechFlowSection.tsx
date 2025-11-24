import React from 'react';

const WhyTechFlowSection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Why TechFlow</h2>
          <p className="text-xl text-gray-700 font-medium">Put TechFlow to work. Invest your time where it's needed</p>
        </div>

        {/* Easy Setup Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="relative">
            <img 
              src="https://static.wixstatic.com/media/c837a6_01abd41201e647cdaee48fbff8729628~mv2.jpg/v1/crop/x_1084,y_0,w_4637,h_3099/fill/w_446,h_297,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1125823856%20(1).jpg" 
              alt="Easy Setup" 
              className="w-full h-64 object-cover rounded-2xl shadow-lg"
            />
            <div className="absolute -bottom-4 -right-4 bg-white rounded-lg p-4 shadow-lg">
              <img 
                src="https://static.wixstatic.com/media/c837a6_5f282d4bd7a0494195e7cf1f5ee353f2~mv2.png/v1/fill/w_315,h_200,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/screen%204.png" 
                alt="Setup Interface" 
                className="w-32 h-20 rounded"
              />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Easy setup</h3>
            <p className="text-xl text-gray-700 mb-4 font-medium">Set it up once, and you're good to go. No hassle or code required.</p>
            <p className="text-gray-600 mb-6">
              Our intuitive setup process gets you up and running in minutes. With smart defaults and guided configuration, you can focus on building great products instead of wrestling with complex setup procedures.
            </p>
            <button className="bg-black text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-colors whitespace-nowrap cursor-pointer">
              Book a Demo
            </button>
          </div>
        </div>

        {/* Smart Budgeting Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="order-2 lg:order-1">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Smart budgeting</h3>
            <p className="text-xl text-gray-700 mb-6 font-medium">With TechFlow's budgeting system, you can rest assured your resources are spent wisely.</p>
            
            <div className="space-y-4 mb-6">
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
            
            <button className="bg-black text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-colors whitespace-nowrap cursor-pointer">
              Book a Demo
            </button>
          </div>
          <div className="order-1 lg:order-2 relative">
            <img 
              src="https://static.wixstatic.com/media/c837a6_679e2ea0ad1d447d90c99d8ce7216c58~mv2.png/v1/fill/w_314,h_455,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/screen%205.png" 
              alt="Smart Budgeting Interface" 
              className="w-full max-w-md mx-auto rounded-2xl shadow-lg"
            />
            <div className="absolute -top-4 -left-4 bg-white rounded-full p-4 shadow-lg">
              <img 
                src="https://static.wixstatic.com/media/c837a6_1bd1324f8f6348f7beaa57f56e70f7a6~mv2.jpg/v1/crop/x_1051,y_3,w_4327,h_4329/fill/w_278,h_277,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1863517984.jpg" 
                alt="Analytics" 
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Beautiful Templates Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <img 
              src="https://static.wixstatic.com/media/c837a6_efcbcaf47bf44f7092ffce664d83816b~mv2.png/v1/fill/w_346,h_547,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/screen%203.png" 
              alt="Beautiful Templates" 
              className="w-full max-w-sm mx-auto rounded-2xl shadow-lg"
            />
            <div className="absolute -bottom-4 -right-4 bg-white rounded-lg p-2 shadow-lg">
              <img 
                src="https://static.wixstatic.com/media/c837a6_2327c691ec1c438d8b7d2dbbf546e6d0~mv2.png/v1/fill/w_284,h_96,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/screen%206.png" 
                alt="Template Preview" 
                className="w-24 h-8 rounded"
              />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Beautiful app templates</h3>
            <p className="text-xl text-gray-700 mb-6 font-medium">Use TechFlow's epic design presets to match multiple platforms and formats.</p>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png" 
                  alt="Check" 
                  className="w-6 h-6"
                />
                <span className="text-gray-600">Web applications</span>
              </div>
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png" 
                  alt="Check" 
                  className="w-6 h-6"
                />
                <span className="text-gray-600">Mobile apps</span>
              </div>
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png" 
                  alt="Check" 
                  className="w-6 h-6"
                />
                <span className="text-gray-600">Desktop applications</span>
              </div>
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.wixstatic.com/media/c837a6_ccabc9e7490d460f94f17b6b3248bb06~mv2.png/v1/fill/w_40,h_40,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%203.png" 
                  alt="Check" 
                  className="w-6 h-6"
                />
                <span className="text-gray-600">Interactive dashboards</span>
              </div>
            </div>
            
            <button className="bg-black text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-colors whitespace-nowrap cursor-pointer">
              Book a Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyTechFlowSection;