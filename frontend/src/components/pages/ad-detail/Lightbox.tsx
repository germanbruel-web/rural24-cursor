import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { NormalizedImage } from '../../../utils/imageHelpers';

interface LightboxProps {
  images: NormalizedImage[];
  title: string;
  currentIndex: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ images, title, currentIndex, onIndexChange, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-6 h-6" />
      </button>
      <div
        className="max-w-5xl w-full max-h-[90vh] px-16 flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={images[currentIndex].url}
          alt={`${title} - Imagen ${currentIndex + 1}`}
          className="max-w-full max-h-[80vh] object-contain rounded"
        />
      </div>
      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); onIndexChange(currentIndex === 0 ? images.length - 1 : currentIndex - 1); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onIndexChange(currentIndex === images.length - 1 ? 0 : currentIndex + 1); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
            aria-label="Siguiente imagen"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm font-medium px-3 py-1.5 rounded-full pointer-events-none">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};
