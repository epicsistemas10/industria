import { useState, useEffect } from 'react';

export default function TestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: 'Carlos Silva',
      role: 'Gerente de Manutenção',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20brazilian%20man%20engineer%20in%20industrial%20setting%2C%20confident%20maintenance%20manager%20portrait%2C%20modern%20factory%20background%20with%20soft%20lighting&width=100&height=100&seq=avatar-br-001&orientation=squarish',
      quote: 'A previsão de falhas por IA reduziu nossas paradas não programadas em 65%. O ROI foi alcançado em apenas 4 meses.',
      rating: 5,
      company: 'Metalúrgica São Paulo'
    },
    {
      name: 'Ana Paula Costa',
      role: 'Diretora de Operações',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20brazilian%20woman%20executive%20in%20industrial%20office%2C%20confident%20operations%20director%20portrait%2C%20modern%20corporate%20setting%20with%20professional%20lighting&width=100&height=100&seq=avatar-br-002&orientation=squarish',
      quote: 'O sistema transformou nossa gestão de manutenção. Conseguimos reduzir custos em 45% e aumentar a disponibilidade dos equipamentos.',
      rating: 5,
      company: 'Indústria Química Brasil'
    },
    {
      name: 'Roberto Oliveira',
      role: 'Coordenador de Manutenção',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20brazilian%20man%20supervisor%20in%20safety%20helmet%2C%20confident%20maintenance%20coordinator%20portrait%2C%20industrial%20plant%20background%20with%20natural%20lighting&width=100&height=100&seq=avatar-br-003&orientation=squarish',
      quote: 'A facilidade de uso e os relatórios detalhados nos deram total controle sobre nossos ativos. Recomendo para qualquer indústria.',
      rating: 5,
      company: 'Fábrica de Autopeças'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section className="relative py-24 bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            O Que Nossos <span className="text-purple-400">Clientes</span> Dizem
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Confiado por líderes industriais em todo o Brasil
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0">
                  <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-gray-700/50 text-center">
                    <div className="flex justify-center mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <i key={i} className="ri-star-fill text-yellow-400 text-xl mx-1"></i>
                      ))}
                    </div>

                    <blockquote className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-8 font-light">
                      "{testimonial.quote}"
                    </blockquote>

                    <div className="flex items-center justify-center space-x-4">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/30"
                      />
                      <div className="text-left">
                        <div className="text-white font-semibold text-lg">
                          {testimonial.name}
                        </div>
                        <div className="text-gray-400">
                          {testimonial.role}
                        </div>
                        <div className="text-purple-400 text-sm">
                          {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center space-x-3 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                  currentTestimonial === index
                    ? 'bg-purple-500 w-8'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
