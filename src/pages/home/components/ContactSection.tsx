
import { useState } from 'react';

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('https://readdy.ai/api/form/d3l0hmupactfvd9kfkjg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          name: formData.name,
          email: formData.email,
          message: formData.message
        })
      });

      if (response.ok) {
        setSubmitStatus('Message sent successfully!');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setSubmitStatus('Failed to send message. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('Failed to send message. Please try again.');
    }
    
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" className="py-24 bg-gradient-to-b from-slate-900 via-violet-900/20 to-slate-900">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <h3 className="text-5xl md:text-6xl font-extralight text-white mb-6 leading-tight tracking-[0.05em]">
                Contact <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">XTRACT</span>
                <br />
                to learn more
              </h3>
              <p className="text-gray-400 text-lg font-light leading-relaxed">
                Ready to transform your vision into reality? Let's discuss how our innovative LED solutions can elevate your next project.
              </p>
            </div>
            
            <div className="text-6xl font-extralight text-white tracking-[0.2em] opacity-20">
              XTRACT
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gradient-to-br from-slate-800/30 to-slate-700/30 rounded-3xl p-8 backdrop-blur-sm border border-gray-700/30">
            <form id="contact-form" data-readdy-form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border border-gray-600/50 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-violet-500 focus:outline-none transition-colors duration-300 font-light"
                />
              </div>
              
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border border-gray-600/50 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-violet-500 focus:outline-none transition-colors duration-300 font-light"
                />
              </div>
              
              <div>
                <textarea
                  name="message"
                  placeholder="Your Message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  maxLength={500}
                  rows={5}
                  className="w-full bg-transparent border border-gray-600/50 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-violet-500 focus:outline-none transition-colors duration-300 resize-none font-light"
                ></textarea>
                <div className="text-right text-gray-5

00 text-sm mt-2">
                  {formData.message.length}/500
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-4 rounded-xl font-light hover:from-violet-500 hover:to-purple-500 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer tracking-wide"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
              
              {submitStatus && (
                <div className={`text-center py-2 ${submitStatus.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
                  {submitStatus}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
