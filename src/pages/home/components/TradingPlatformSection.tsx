
export function TradingPlatformSection() {
  const platforms = [
    {
      title: 'Web Platform',
      description: 'Full-featured trading experience in your browser',
      icon: 'ri-computer-line',
      features: ['Advanced Charts', 'Real-time Data', 'Portfolio Management']
    },
    {
      title: 'Mobile App',
      description: 'Trade on the go with our mobile application',
      icon: 'ri-smartphone-line',
      features: ['iOS & Android', 'Push Notifications', 'Biometric Security']
    },
    {
      title: 'API Access',
      description: 'Build custom trading solutions with our API',
      icon: 'ri-code-line',
      features: ['REST API', 'WebSocket', 'Documentation']
    },
    {
      title: 'Desktop App',
      description: 'Professional trading software for desktop',
      icon: 'ri-macbook-line',
      features: ['Windows & Mac', 'Advanced Tools', 'High Performance']
    }
  ];

  return (
    <section className="bg-gray-900 py-16">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Trade Crypto on
            <br />
            KuCoin Worldwide
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Access our trading platform from anywhere in the world with multiple options
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {platforms.map((platform, index) => (
            <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                <i className={`${platform.icon} text-xl text-white`}></i>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">{platform.title}</h3>
              <p className="text-gray-400 text-sm mb-4">{platform.description}</p>
              
              <ul className="space-y-1">
                {platform.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="text-gray-300 text-sm flex items-center">
                    <i className="ri-check-line text-green-400 mr-2 text-xs"></i>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trading Interface Preview */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold text-white mb-4">Advanced Trading Interface</h3>
              <div className="bg-gray-900 rounded-lg p-4 h-64">
                {/* Chart mockup */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-4">
                    <span className="text-white font-medium">BTC/USDT</span>
                    <span className="text-green-400">$43,250.00</span>
                    <span className="text-green-400 text-sm">+2.45%</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm whitespace-nowrap">1H</button>
                    <button className="px-3 py-1 bg-green-500 text-white rounded text-sm whitespace-nowrap">4H</button>
                    <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm whitespace-nowrap">1D</button>
                  </div>
                </div>
                
                <div className="h-40 bg-gray-800 rounded flex items-end justify-between p-4">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 ${Math.random() > 0.5 ? 'bg-green-400' : 'bg-red-400'} rounded-t`}
                      style={{ height: `${Math.random() * 80 + 20}%` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Order Book</h3>
              <div className="bg-gray-900 rounded-lg p-4 h-64">
                <div className="space-y-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className={i % 2 === 0 ? 'text-red-400' : 'text-green-400'}>
                        {(43250 + Math.random() * 100).toFixed(2)}
                      </span>
                      <span className="text-gray-400">
                        {(Math.random() * 10).toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
