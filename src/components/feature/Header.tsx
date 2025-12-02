import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false); // Close mobile menu after clicking
    }
  };

  

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-12">
            <h1 
              className="text-2xl text-white tracking-wide hover:text-purple-400 transition-all duration-300 font-light cursor-pointer"
              style={{ fontFamily: "'Share Tech', sans-serif" }}
            >
              Xtract
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('products')}
              className="text-white/80 hover:text-white transition-colors text-sm font-light cursor-pointer"
            >
              Products
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="text-white/80 hover:text-white transition-colors text-sm font-light cursor-pointer"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection('projects')}
              className="text-white/80 hover:text-white transition-colors text-sm font-light cursor-pointer"
            >
              Projects
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-white/80 hover:text-white transition-colors text-sm font-light cursor-pointer"
            >
              Contact
            </button>
            <button
              onClick={() => navigate('/setores')}
              className="text-white/80 hover:text-white transition-colors text-sm font-light cursor-pointer"
            >
              Setores
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white/80 hover:text-white transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i className={`text-xl ${isMenuOpen ? 'ri-close-line' : 'ri-menu-line'}`}></i>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-t border-white/10 md:hidden">
            <div className="px-6 py-4 space-y-4">
              <button 
                onClick={() => {
                  scrollToSection('products');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left text-white/80 hover:text-white transition-colors text-sm font-light cursor-pointer"
              >
                Products
              </button>
              <button 
                onClick={() => {
                  scrollToSection('about');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left text-white/80 hover:text-white transition-colors text-sm font-light cursor-pointer"
              >
                About
              </button>
              <button 
                onClick={() => {
                  scrollToSection('projects');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left text-white/80 hover:text-white transition-colors text-sm font-light cursor-pointer"
              >
                Projects
              </button>
              <button 
                onClick={() => {
                  scrollToSection('contact');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left text-white/80 hover:text-white transition-colors text-sm font-light cursor-pointer"
              >
                Contact
              </button>
              <button
                onClick={() => {
                  navigate('/setores');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left text-white/80 hover:text-white transition-colors text-sm font-light cursor-pointer"
              >
                Setores
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
