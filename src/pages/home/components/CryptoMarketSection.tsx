
import { useState } from 'react';

export function CryptoMarketSection() {
  const [activeTab, setActiveTab] = useState('spot');

  const cryptoData = [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      icon: '₿',
      iconColor: 'bg-orange-500',
      price: '$43,250.00',
      change: '+2.45%',
      changeColor: 'text-green-400',
      volume: '$2.1B'
    },
    {
      name: 'Ethereum',
      symbol: 'ETH',
      icon: 'Ξ',
      iconColor: 'bg-blue-500',
      price: '$2,650.00',
      change: '+1.23%',
      changeColor: 'text-green-400',
      volume: '$1.8B'
    },
    {
      name: 'Cardano',
      symbol: 'ADA',
      icon: '₳',
      iconColor: 'bg-blue-600',
      price: '$0.45',
      change: '-0.87%',
      changeColor: 'text-red-400',
      volume: '$245M'
    },
    {
      name: 'Polkadot',
      symbol: 'DOT',
      icon: '●',
      iconColor: 'bg-pink-500',
      price: '$7.23',
      change: '+3.12%',
      changeColor: 'text-green-400',
      volume: '$156M'
    },
    {
      name: 'Chainlink',
      symbol: 'LINK',
      icon: '⬢',
      iconColor: 'bg-blue-400',
      price: '$14.56',
      change: '+0.95%',
      changeColor: 'text-green-400',
      volume: '$89M'
    },
    {
      name: 'Litecoin',
      symbol: 'LTC',
      icon: 'Ł',
      iconColor: 'bg-gray-400',
      price: '$72.34',
      change: '-1.45%',
      changeColor: 'text-red-400',
      volume: '$234M'
    }
  ];

  return (
    <section className="bg-gray-900 py-16">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Crypto Market Today</h2>
          <a href="#" className="text-green-400 hover:text-green-300 cursor-pointer">View All Markets →</a>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-800 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('spot')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'spot'
                ? 'bg-green-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Spot Trading
          </button>
          <button
            onClick={() => setActiveTab('futures')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'futures'
                ? 'bg-green-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Futures
          </button>
          <button
            onClick={() => setActiveTab('margin')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'margin'
                ? 'bg-green-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Margin
          </button>
        </div>

        {/* Crypto List */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-700 text-gray-400 text-sm font-medium">
            <div>Name</div>
            <div className="text-right">Price</div>
            <div className="text-right">24h Change</div>
            <div className="text-right">Volume</div>
          </div>
          
          {cryptoData.map((crypto, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-700 last:border-b-0 hover:bg-gray-750 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${crypto.iconColor} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                  {crypto.icon}
                </div>
                <div>
                  <div className="text-white font-medium">{crypto.name}</div>
                  <div className="text-gray-400 text-sm">{crypto.symbol}</div>
                </div>
              </div>
              <div className="text-right text-white font-medium">{crypto.price}</div>
              <div className={`text-right font-medium ${crypto.changeColor}`}>{crypto.change}</div>
              <div className="text-right text-gray-400">{crypto.volume}</div>
            </div>
          ))}
        </div>

        {/* Market Summary */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">TOP</span>
              </div>
              <div>
                <div className="text-white font-semibold text-lg">Market Cap</div>
                <div className="text-gray-400">Total cryptocurrency market cap</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">$1.7T</div>
              <div className="text-green-400">+2.3% (24h)</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
