export default function BenefitsSection() {
  const benefits = [
    {
      icon: 'ri-flash-line',
      title: 'Instant Savings',
      description: 'Get immediate savings on every purchase, powered by AI to optimize your transactions.'
    },
    {
      icon: 'ri-eye-line',
      title: 'Real-Time Insights',
      description: 'Make smarter decisions with live data and actionable insights, delivered in real-time to stay ahead of the curve'
    },
    {
      icon: 'ri-settings-3-line',
      title: 'Flexible Plans',
      description: 'Choose plans that adapt to your business needs, offering unparalleled scalability and cost-effectiveness'
    },
    {
      icon: 'ri-shield-check-line',
      title: 'Secure Transactions',
      description: 'Prioritize safety with cutting-edge encryption and robust security features for every interaction'
    },
    {
      icon: 'ri-cpu-line',
      title: 'Adaptive Systems',
      description: 'Leverage AI-driven systems that evolve with your business, ensuring efficiency and innovation at every step'
    },
    {
      icon: 'ri-customer-service-2-line',
      title: 'Dedicated Support',
      description: 'Access expert assistance 24/7 to ensure you\'re never alone on your growth journey'
    }
  ];

  const scrollingBenefits = [
    'Instant Savings', 'Flexible Payments', 'Intelligent Spending', 'Customizable Plans', 'Smart Insights',
    'Real-Time Automation', 'Real-Time Reports', 'Custom AI Plans', 'Dedicated Support', 'Growth With AI'
  ];

  return (
    <section id="benefits" className="py-24 bg-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full px-6 py-2 mb-6">
            <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">BENEFITS</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Why Choose Us?</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Innovative tools and powerful insights designed to elevate your business
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <div key={index} className="group">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 h-full">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <i className={`${benefit.icon} text-2xl text-blue-400`}></i>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{benefit.title}</h3>
                <p className="text-gray-300 leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Scrolling Benefits */}
        <div className="space-y-4">
          {/* First Row */}
          <div className="flex animate-scroll-left">
            {[...scrollingBenefits, ...scrollingBenefits].map((benefit, index) => (
              <div key={index} className="flex-shrink-0 mx-4">
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-700">
                  <span className="text-gray-300 whitespace-nowrap">{benefit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Second Row */}
          <div className="flex animate-scroll-right">
            {[...scrollingBenefits.slice().reverse(), ...scrollingBenefits.slice().reverse()].map((benefit, index) => (
              <div key={index} className="flex-shrink-0 mx-4">
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-700">
                  <span className="text-gray-300 whitespace-nowrap">{benefit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
        
        .animate-scroll-right {
          animation: scroll-right 30s linear infinite;
        }
      `}</style>
    </section>
  );
}