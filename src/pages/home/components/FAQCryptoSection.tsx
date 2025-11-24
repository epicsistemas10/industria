
import { useState } from 'react';

export function FAQCryptoSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What is KuCoin and how does it work?',
      answer: 'KuCoin is a global cryptocurrency exchange that allows users to trade, buy, and sell digital assets. We provide a secure platform with advanced trading tools, real-time market data, and comprehensive portfolio management features.'
    },
    {
      question: 'How do I start trading on KuCoin?',
      answer: 'To start trading, simply create an account, complete the verification process, deposit funds, and you can begin trading immediately. We offer spot trading, futures, and various other trading options.'
    },
    {
      question: 'What cryptocurrencies are available on KuCoin?',
      answer: 'KuCoin supports over 200 cryptocurrencies including Bitcoin, Ethereum, and many altcoins. We regularly add new tokens and trading pairs to provide our users with diverse investment opportunities.'
    },
    {
      question: 'Is KuCoin safe and secure?',
      answer: 'Yes, KuCoin employs industry-leading security measures including cold storage, multi-signature wallets, and advanced encryption. We also have insurance coverage and 24/7 security monitoring.'
    },
    {
      question: 'What are the trading fees on KuCoin?',
      answer: 'KuCoin offers competitive trading fees starting from 0.1% for both makers and takers. We also provide fee discounts for high-volume traders and KCS token holders.'
    }
  ];

  return (
    <section className="bg-gray-900 py-16">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Find answers to common questions about KuCoin and cryptocurrency trading
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-4">
              <button
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                className="w-full bg-gray-800 hover:bg-gray-750 rounded-lg p-6 text-left border border-gray-700 hover:border-gray-600 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white pr-4">
                    {faq.question}
                  </h3>
                  <i className={`ri-${openFAQ === index ? 'subtract' : 'add'}-line text-green-400 text-xl flex-shrink-0`}></i>
                </div>
              </button>
              
              {openFAQ === index && (
                <div className="bg-gray-800 border-l border-r border-b border-gray-700 rounded-b-lg p-6 -mt-1">
                  <p className="text-gray-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">Still have questions?</p>
          <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-medium transition-colors whitespace-nowrap">
            Contact Support
          </button>
        </div>
      </div>
    </section>
  );
}
