
export function AboutSection() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="about" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-5xl mx-auto">
          <h3 className="text-4xl md:text-5xl font-extralight text-white mb-8 leading-tight tracking-[0.05em]">
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">XTRACT™</span> redefines visual experiences with innovative LED solutions
          </h3>
          <p className="text-gray-400 text-xl leading-relaxed font-light max-w-4xl mx-auto mb-12">
            Inspiring audiences worldwide through transformative technology and creativity. 
            Our cutting‑edge display systems deliver unparalleled visual experiences that 
            push the boundaries of what's possible in digital visualization.
          </p>
          
          {/* CTA Button */}
          <div className="flex justify-center">
            <button 
              onClick={() => scrollToSection('projects')}
              className="group relative bg-transparent border border-gray-600 text-white px-8 py-4 rounded-xl text-base font-medium transition-all duration-300 hover:border-purple-400 hover:bg-purple-500/10 whitespace-nowrap cursor-pointer"
            >
              <span className="relative z-10">Discover Our Solutions</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
