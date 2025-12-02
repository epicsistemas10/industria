
import { useState } from 'react';

export function MediaShowcaseSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="relative py-24">
        <div className="container mx-auto px-6">
          <div className="relative max-w-6xl mx-auto">
            <div className="flex items-center justify-center">
              <div className="relative aspect-square w-full max-w-2xl mx-auto bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden group cursor-pointer">
                {/* 移除了背景图片，只保留渐变背景 */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-violet-800/20" />

                {/* Play Button */}
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  onClick={() => setIsModalOpen(true)}
                >
                  <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
                    <i className="ri-play-fill text-white text-3xl ml-1"></i>
                  </div>
                </div>

                {/* Overlay Content */}
                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-2xl md:text-3xl font-light text-white mb-2">
                    Experience the Future of Technology
                  </h3>
                  <p className="text-gray-300 text-lg">
                    Discover how our AI-driven solutions are transforming industries worldwide
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative max-w-4xl w-full mx-6">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <i className="ri-play-circle-line text-6xl mb-4 opacity-50"></i>
                  <p className="text-xl opacity-75">Video Player Placeholder</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-3xl"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}