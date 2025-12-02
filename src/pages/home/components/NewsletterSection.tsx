
import React, { useState } from 'react';

const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('subscribe', 'true');
      
      const response = await fetch('https://readdy.ai/api/form/submit/newsletter', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        setIsSubscribed(true);
        setEmail('');
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative py-20 bg-black text-white overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full">
        <video
          className="w-full h-full object-cover opacity-30"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="https://video.wixstatic.com/video/c837a6_0ac213e0571d4fc9a818c86d5df13601/1080p/mp4/file.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <img 
              src="https://static.wixstatic.com/media/c837a6_3db75a7a30a44c8b971a94e4de575680~mv2.png/v1/fill/w_182,h_182,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Artboard%201%20copy%206.png" 
              alt="Newsletter Icon" 
              className="w-16 h-16"
            />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Subscribe to our newsletter<br />
            to get all the updates and news about TechFlow.
          </h2>
        </div>

        {isSubscribed ? (
          <div className="bg-green-600 text-white p-6 rounded-2xl">
            <h3 className="text-xl font-semibold mb-2">Thank you for subscribing!</h3>
            <p>You'll receive the latest updates about TechFlow directly in your inbox.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto" data-readdy-form id="newsletter-form">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email here"
                required
                className="flex-1 px-6 py-4 rounded-full text-black text-lg focus:outline-none focus:ring-2 focus:ring-white/50"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="bg-white text-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
            <div className="mt-4">
              <label className="flex items-center justify-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  name="subscribe"
                  required
                  className="rounded"
                />
                <span>Yes, subscribe me to your newsletter. *</span>
              </label>
            </div>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="mt-20 pt-12 border-t border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
            <div>
              <h3 className="text-2xl font-bold mb-4">TechFlow.</h3>
            </div>
            <div>
              <div className="space-y-2">
                <a href="/features" className="block text-white/80 hover:text-white transition-colors">Features</a>
                <a href="/pricing" className="block text-white/80 hover:text-white transition-colors">Pricing</a>
                <a href="/resources" className="block text-white/80 hover:text-white transition-colors">Resources</a>
                <a href="/contact" className="block text-white/80 hover:text-white transition-colors">Contact</a>
                <button className="text-white/80 hover:text-white transition-colors">Book a Demo</button>
              </div>
            </div>
            <div>
              <div className="text-white/80 text-sm space-y-1">
                <p>500 Terry Francine Street</p>
                <p>San Francisco, CA 94158</p>
                <p>info@techflow.com</p>
                <p>123-456-7890</p>
              </div>
              <button className="mt-4 text-white/80 hover:text-white transition-colors text-sm">
                About TechFlow
              </button>
            </div>
            <div>
              <p className="text-white/80 text-sm mb-4">
                We're looking for talented, passionate folks to join our team.
              </p>
              <button className="text-white/80 hover:text-white transition-colors text-sm">
                Jobs at TechFlow
              </button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center mt-12 pt-8 border-t border-white/20">
            <p className="text-white/60 text-sm">
              © 2024 by TechFlow. <a href="https://readdy.ai/?origin=logo" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Powered by Readdy</a>
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <img 
                  src="https://static.wixstatic.com/media/0fdef751204647a3bbd7eaa2827ed4f9.png/v1/fill/w_30,h_30,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/0fdef751204647a3bbd7eaa2827ed4f9.png" 
                  alt="Facebook" 
                  className="w-6 h-6"
                />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <img 
                  src="https://static.wixstatic.com/media/01c3aff52f2a4dffa526d7a9843d46ea.png/v1/fill/w_30,h_30,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/01c3aff52f2a4dffa526d7a9843d46ea.png" 
                  alt="Instagram" 
                  className="w-6 h-6"
                />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <img 
                  src="https://static.wixstatic.com/media/c7d035ba85f6486680c2facedecdcf4d.png/v1/fill/w_30,h_30,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/c7d035ba85f6486680c2facedecdcf4d.png" 
                  alt="Twitter" 
                  className="w-6 h-6"
                />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <img 
                  src="https://static.wixstatic.com/media/6ea5b4a88f0b4f91945b40499aa0af00.png/v1/fill/w_30,h_30,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/6ea5b4a88f0b4f91945b40499aa0af00.png" 
                  alt="LinkedIn" 
                  className="w-6 h-6"
                />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <img 
                  src="https://static.wixstatic.com/media/78aa2057f0cb42fbbaffcbc36280a64a.png/v1/fill/w_30,h_30,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/78aa2057f0cb42fbbaffcbc36280a64a.png" 
                  alt="YouTube" 
                  className="w-6 h-6"
                />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <img 
                  src="https://static.wixstatic.com/media/11062b_6e7994bdd94b41178720ff1641a0f323~mv2.png/v1/fill/w_30,h_30,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/11062b_6e7994bdd94b41178720ff1641a0f323~mv2.png" 
                  alt="TikTok" 
                  className="w-6 h-6"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
