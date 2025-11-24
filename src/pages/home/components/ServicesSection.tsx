
import React from 'react';

const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: 'ri-lightbulb-line',
      title: 'Idea Validation',
      description: 'Validate your startup idea with market research, competitor analysis, and user feedback.',
      features: ['Market Research', 'Competitor Analysis', 'User Surveys', 'MVP Planning']
    },
    {
      icon: 'ri-code-s-slash-line',
      title: 'Product Development',
      description: 'Build your product with our expert development team using cutting-edge technologies.',
      features: ['Full-Stack Development', 'Mobile Apps', 'Cloud Architecture', 'DevOps Setup']
    },
    {
      icon: 'ri-rocket-line',
      title: 'Go-to-Market',
      description: 'Launch your product successfully with our comprehensive go-to-market strategies.',
      features: ['Marketing Strategy', 'Brand Development', 'Sales Funnel', 'PR & Media']
    },
    {
      icon: 'ri-funds-line',
      title: 'Funding Support',
      description: 'Connect with investors and secure funding with our extensive network and expertise.',
      features: ['Pitch Deck Creation', 'Investor Matching', 'Due Diligence', 'Legal Support']
    }
  ];

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
            <i className="ri-service-line mr-2"></i>
            Our Services
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            End-to-End Startup Solutions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From initial idea to successful exit, we provide comprehensive services 
            to support every stage of your startup journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <i className={`${service.icon} text-white text-2xl`}></i>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {service.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
          <p className="text-gray-600 mb-8">Join hundreds of successful startups who chose TechFlow</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer shadow-lg">
              Schedule Consultation
            </button>
            <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer">
              View Case Studies
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
