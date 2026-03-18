/**
 * VerticalThumbnailCarousel
 *
 * Carrusel vertical de miniaturas con flechas ↑ / ↓.
 * Sin scroll, sin dependencias externas.
 *
 * Props:
 *   images       — array de { url: string }
 *   currentIndex — índice activo (controlado por el padre)
 *   onSelect     — callback al hacer click en una miniatura
 *   thumbSize    — ancho/alto del thumb en px (default 100)
 *   maxVisible   — cantidad de thumbs visibles a la vez (default 4)
 */

import React, { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ThumbImage {
  url: string;
}

interface VerticalThumbnailCarouselProps {
  images: ThumbImage[];
  currentIndex: number;
  onSelect: (index: number) => void;
  thumbSize?: number;
  maxVisible?: number;
  className?: string;
}

export const VerticalThumbnailCarousel: React.FC<VerticalThumbnailCarouselProps> = ({
  images,
  currentIndex,
  onSelect,
  thumbSize = 100,
  maxVisible = 4,
  className = '',
}) => {
  const [offset, setOffset] = useState(0);

  const total = images.length;
  const canUp = offset > 0;
  const canDown = offset + maxVisible < total;

  // Auto-scroll si el índice activo queda fuera de la ventana visible
  useEffect(() => {
    if (currentIndex < offset) {
      setOffset(currentIndex);
    } else if (currentIndex >= offset + maxVisible) {
      setOffset(currentIndex - maxVisible + 1);
    }
  }, [currentIndex, maxVisible, offset]);

  if (total <= 1) return null;

  const visibleImages = images.slice(offset, offset + maxVisible);

  return (
    <div
      className={`flex flex-col items-center gap-1 flex-shrink-0 ${className}`}
      style={{ width: thumbSize }}
    >
      {/* Flecha arriba */}
      <button
        onClick={() => setOffset(prev => Math.max(0, prev - 1))}
        disabled={!canUp}
        className="w-full flex items-center justify-center py-1 rounded-md transition-colors disabled:opacity-20 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-500 hover:text-gray-800"
        aria-label="Anterior miniatura"
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      {/* Miniaturas visibles */}
      <div className="flex flex-col gap-2">
        {visibleImages.map((img, i) => {
          const realIndex = offset + i;
          const isActive = realIndex === currentIndex;
          return (
            <button
              key={realIndex}
              onClick={() => onSelect(realIndex)}
              className={`overflow-hidden rounded-lg border-2 transition-all duration-150 flex-shrink-0 ${
                isActive
                  ? 'border-brand-600 ring-1 ring-brand-400'
                  : 'border-gray-200 hover:border-gray-400 opacity-60 hover:opacity-100'
              }`}
              style={{ width: thumbSize, height: thumbSize }}
              aria-label={`Imagen ${realIndex + 1}`}
              aria-pressed={isActive}
            >
              <img
                src={img.url}
                alt={`Miniatura ${realIndex + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          );
        })}
      </div>

      {/* Flecha abajo */}
      <button
        onClick={() => setOffset(prev => Math.min(total - maxVisible, prev + 1))}
        disabled={!canDown}
        className="w-full flex items-center justify-center py-1 rounded-md transition-colors disabled:opacity-20 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-500 hover:text-gray-800"
        aria-label="Siguiente miniatura"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
};

export default VerticalThumbnailCarousel;
