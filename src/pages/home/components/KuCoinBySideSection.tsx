
import Button from '../../../components/base/Button';

export function KuCoinBySideSection() {
  const features = [
    'Advanced trading interface',
    'Real-time market data',
    'Professional charting tools',
    'Portfolio management',
    'Risk management tools',
    'API access for developers'
  ];

  return (
    <section className="bg-gray-900 py-16">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              KuCoin by Your Side
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              We provide comprehensive cryptocurrency trading solutions with advanced tools, 
              real-time data, and professional support to help you succeed in the crypto market.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
            
            <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 whitespace-nowrap">
              Start Trading Now
            </Button>
          </div>

          {/* Right Content - Illustration */}
          <div className="relative">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
              {/* Trading Interface Mockup */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Trading Dashboard</h3>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 text-sm">BTC/USDT</span>
                    <span className="text-green-400 text-sm">+2.45%</span>
                  </div>
                  <div className="text-white text-2xl font-bold mb-2">$43,250.00</div>
                  
                  {/* Chart representation */}
                  <div className="h-20 bg-gray-800 rounded flex items-end space-x-1 p-2">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 ${i % 3 === 0 ? 'bg-green-400' : 'bg-gray-600'} rounded-t`}
                        style={{ height: `${Math.random() * 60 + 20}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">24h Volume</div>
                    <div className="text-white font-semibold">$2.1B</div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Market Cap</div>
                    <div className="text-white font-semibold">$845B</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-green-500 rounded-full p-3">
              <i className="ri-trending-up-line text-white text-xl"></i>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-blue-500 rounded-full p-3">
              <i className="ri-shield-check-line text-white text-xl"></i>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
