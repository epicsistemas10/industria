
export function ProductsServicesSection() {
  const products = [
    {
      title: 'Spot Trading',
      description: 'Trade cryptocurrencies with zero fees on selected pairs',
      icon: 'ri-exchange-line',
      color: 'bg-blue-500',
      features: ['200+ Trading Pairs', 'Advanced Charts', 'Real-time Data']
    },
    {
      title: 'Buy Crypto',
      description: 'Purchase cryptocurrencies with credit card or bank transfer',
      icon: 'ri-shopping-cart-line',
      color: 'bg-green-500',
      features: ['Instant Purchase', 'Multiple Payment Methods', 'Secure Transactions']
    },
    {
      title: 'Crypto Derivatives',
      description: 'Trade futures and options with up to 100x leverage',
      icon: 'ri-line-chart-line',
      color: 'bg-purple-500',
      features: ['High Leverage', 'Risk Management', 'Professional Tools']
    }
  ];

  return (
    <section id="services-section" className="bg-gray-900 py-16">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Explore KuCoin Products
            <br />
            & Services
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover our comprehensive suite of cryptocurrency trading and investment tools
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <div key={index} className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer">
              <div className={`w-16 h-16 ${product.color} rounded-2xl flex items-center justify-center mb-6`}>
                <i className={`${product.icon} text-2xl text-white`}></i>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">{product.title}</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">{product.description}</p>
              
              <ul className="space-y-2 mb-6">
                {product.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-300">
                    <i className="ri-check-line text-green-400 mr-2"></i>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors whitespace-nowrap">
                Learn More
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
