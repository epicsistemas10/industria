import { useState } from 'react';

export default function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState(0);

  const faqs = [
    {
      question: 'What makes this template unique?',
      answer: 'This template is designed to streamline your SaaS or startup\'s online presence with modern, user-centric design and seamless functionality, ensuring you stand out from competitors.'
    },
    {
      question: 'Can I customize the template to match my brand?',
      answer: 'Absolutely! The template is fully customizable, allowing you to change colors, fonts, images, and content to perfectly align with your brand identity.'
    },
    {
      question: 'Is this template optimized for SEO and speed?',
      answer: 'Yes, this template is built with Framer, ensuring exceptional performance, fast loading times, and SEO-friendly design to boost your online visibility.'
    },
    {
      question: 'Is the template mobile-friendly?',
      answer: 'Yes, the template is fully responsive, ensuring a seamless user experience across desktop, tablet, and mobile devices.'
    },
    {
      question: 'Can I use this template for commercial projects?',
      answer: 'Yes. You\'re free to use this template for both personal and commercial projects — no attribution required.'
    }
  ];

  return (
    <section id="faqs" className="py-24 bg-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full px-6 py-2 mb-6">
            <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">FAQ'S SECTION</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Some Common FAQ's</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get answers to your questions and learn about our platform
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
              <button
                onClick={() => setOpenFAQ(openFAQ === index ? -1 : index)}
                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-700/30 transition-colors"
              >
                <span className="text-lg font-medium text-white pr-8">{faq.question}</span>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 transition-transform duration-300 ${
                  openFAQ === index ? 'rotate-180' : ''
                }`}>
                  <i className="ri-arrow-down-s-line text-white"></i>
                </div>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${
                openFAQ === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="px-8 pb-6">
                  <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}