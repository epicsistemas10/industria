import React, { useEffect, useRef, useState } from 'react';

interface PanoramaViewerProps {
  url: string;
  onClose?: () => void;
}

export default function PanoramaViewer({ url, onClose }: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let viewer: any = null;
    let mounted = true;

    const init = async () => {
      setLoading(true);
      try {
        // Lazy-import photo-sphere-viewer to avoid adding it to initial bundle
        const [{ default: PhotoSphereViewer }, THREE] = await Promise.all([
          // ESM path for photo-sphere-viewer
          // @ts-ignore
          import('photo-sphere-viewer'),
          import('three'),
        ]);

        if (!mounted || !containerRef.current) return;

        viewer = new PhotoSphereViewer({
          container: containerRef.current,
          panorama: url,
          defaultLong: 0,
          navbar: false,
          size: { width: '100%', height: '100%' },
          useXmpData: false,
        });
      } catch (err: any) {
        console.error('Erro ao inicializar viewer 360:', err);
        setError('Não foi possível carregar o visualizador 360. Mostrando imagem simples.');
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      try {
        if (viewer && typeof viewer.destroy === 'function') viewer.destroy();
      } catch (e) {
        // ignore
      }
    };
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-black rounded">
        <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-white/10 text-white rounded-full p-2 hover:bg-white/20">
          <i className="ri-close-line"></i>
        </button>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-40">
            <div className="text-white">Carregando panorama...</div>
          </div>
        )}
        {error && (
          <div className="p-4 text-sm text-white z-40">{error}</div>
        )}
        <div ref={containerRef} className="w-full h-full" style={{ minHeight: 400 }}>
          {!error && !loading ? null : (
            // Fallback: simple image if viewer fails or is still loading
            <img src={url} alt="Panorama fallback" className="w-full h-full object-contain" />
          )}
        </div>
      </div>
    </div>
  );
}
