
import React, { useState, useEffect } from 'react';

const ClientsSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const testimonials = [
    {
      quote: "Ads performance increased - Our budget didn't",
      description: "I'm a paragraph. Click here to add your own text and edit me. I'm a great place for you to tell a story and let your users know a little more about you.",
      author: "Sam Whol",
      position: "Demand Generation lead at ZoZ AI",
      avatar: "https://static.wixstatic.com/media/c837a6_1a7a79e9bcb245299a9ec799b688de79~mv2.jpg/v1/crop/x_1988,y_0,w_2324,h_2318/fill/w_70,h_70,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1517120876.jpg"
    },
    {
      quote: "clics transformed our marketing strategy completely",
      description: "The platform's intuitive design and powerful features helped us streamline our advertising across all channels. Our ROI has never been better.",
      author: "Maria Chen",
      position: "Marketing Director at TechFlow",
      avatar: "https://static.wixstatic.com/media/c837a6_1a7a79e9bcb245299a9ec799b688de79~mv2.jpg/v1/crop/x_1988,y_0,w_2324,h_2318/fill/w_70,h_70,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1517120876.jpg"
    },
    {
      quote: "The best investment we made for our ad campaigns",
      description: "clics' smart budgeting and audience merging features saved us countless hours while improving our campaign performance significantly.",
      author: "David Rodriguez",
      position: "CEO at Digital Innovations",
      avatar: "https://static.wixstatic.com/media/c837a6_1a7a79e9bcb245299a9ec799b688de79~mv2.jpg/v1/crop/x_1988,y_0,w_2324,h_2318/fill/w_70,h_70,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1517120876.jpg"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
              Our Clients
            </h2>
            <p className="text-xl text-gray-700">
              Why companies like clics?
            </p>
          </div>

          {/* Right Content - Testimonial Slider */}
          <div className="relative">
            <div className="bg-gray-50 rounded-2xl p-8 min-h-[300px] flex flex-col justify-center">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-black mb-4">
                  "{testimonials[currentSlide].quote}"
                </h3>
                <p className="text-gray-600 mb-6">
                  {testimonials[currentSlide].description}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <img 
                  src={testimonials[currentSlide].avatar}
                  alt={testimonials[currentSlide].author}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-black">
                    {testimonials[currentSlide].author}
                  </p>
                  <p className="text-sm text-gray-600">
                    {testimonials[currentSlide].position}
                  </p>
                </div>
              </div>
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center space-x-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors cursor-pointer ${
                    index === currentSlide ? 'bg-black' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientsSection;
