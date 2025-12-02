import { useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  title?: string;
  onDelete?: (index: number) => void;
  canDelete?: boolean;
}

export default function ImageGallery({ images, title, onDelete, canDelete = false }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <i className="ri-image-line text-4xl mb-2"></i>
        <p>Nenhuma imagem disponível</p>
      </div>
    );
  }

  const handlePrevious = () => {
    if (selectedImage !== null && selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
    }
  };

  const handleNext = () => {
    if (selectedImage !== null && selectedImage < images.length - 1) {
      setSelectedImage(selectedImage + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedImage === null) return;
    
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') setSelectedImage(null);
  };

  return (
    <>
      <div className="space-y-4">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer"
              onClick={() => setSelectedImage(index)}
            >
              <img
                src={image}
                alt={`Imagem ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              
              {/* Overlay com ações */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(index);
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full transition-colors"
                  title="Visualizar"
                >
                  <i className="ri-eye-line text-gray-900 text-lg"></i>
                </button>
                
                {canDelete && onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Deseja realmente excluir esta imagem?')) {
                        onDelete(index);
                      }
                    }}
                    className="w-10 h-10 flex items-center justify-center bg-red-500/90 hover:bg-red-500 rounded-full transition-colors"
                    title="Excluir"
                  >
                    <i className="ri-delete-bin-line text-white text-lg"></i>
                  </button>
                )}
              </div>

              {/* Número da imagem */}
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {index + 1}/{images.length}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de visualização em tela cheia */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
          onKeyDown={handleKeyDown as any}
        >
          {/* Botão fechar */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <i className="ri-close-line text-white text-2xl"></i>
          </button>

          {/* Contador */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full z-10">
            {selectedImage + 1} / {images.length}
          </div>

          {/* Botão anterior */}
          {selectedImage > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <i className="ri-arrow-left-s-line text-white text-2xl"></i>
            </button>
          )}

          {/* Botão próximo */}
          {selectedImage < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <i className="ri-arrow-right-s-line text-white text-2xl"></i>
            </button>
          )}

          {/* Imagem */}
          <div
            className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[selectedImage]}
              alt={`Imagem ${selectedImage + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Miniaturas */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] px-4 py-2 bg-black/70 rounded-full">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(index);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === selectedImage
                    ? 'border-blue-500 scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={image}
                  alt={`Miniatura ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
