import React from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import type { NormalizedImage } from '../../../utils/imageHelpers';
import { VerticalThumbnailCarousel } from '../../molecules/VerticalThumbnailCarousel/VerticalThumbnailCarousel';

interface AdGalleryProps {
  images: NormalizedImage[];
  title: string;
  currentIndex: number;
  onIndexChange: (i: number) => void;
  onOpenLightbox: () => void;
}

export const AdGallery: React.FC<AdGalleryProps> = ({ images, title, currentIndex, onIndexChange, onOpenLightbox }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden p-3">
      <div className="flex gap-3">

        <div className="hidden lg:flex self-stretch bg-gray-100 rounded-lg p-2">
          <VerticalThumbnailCarousel
            images={images}
            currentIndex={currentIndex}
            onSelect={onIndexChange}
            thumbSize={120}
            maxVisible={4}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="relative aspect-[4/3] bg-gray-100 group rounded-lg overflow-hidden">
            <img
              src={images[currentIndex].url}
              alt={`${title} - Imagen ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onOpenLightbox}
              className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Ver imagen completa"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {images.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full pointer-events-none">
                {currentIndex + 1} / {images.length}
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => onIndexChange(currentIndex === 0 ? images.length - 1 : currentIndex - 1)}
                  className="lg:hidden absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onIndexChange(currentIndex === images.length - 1 ? 0 : currentIndex + 1)}
                  className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md"
                  aria-label="Siguiente imagen"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
