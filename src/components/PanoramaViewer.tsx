import React from 'react';

interface PanoramaViewerProps {
  url: string;
  onClose?: () => void;
}

export default function PanoramaViewer({ url, onClose }: PanoramaViewerProps) {
  // Placeholder panorama viewer: for now shows the image fullscreen
  // Later we can swap to a proper 360 viewer library.
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-white/10 text-white rounded-full p-2 hover:bg-white/20">
          <i className="ri-close-line"></i>
        </button>
        <img src={url} alt="Panorama" className="w-full h-full object-contain" />
      </div>
    </div>
  );
}
