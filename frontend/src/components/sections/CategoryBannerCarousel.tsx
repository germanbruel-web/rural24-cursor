/**
 * CategoryBannerCarousel - Carrusel de banners de categoría
 * Diseño: 650px width, alineado derecha, auto-rotate, dots navigation
 * Sistema adaptativo: mobile y desktop
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: string;
  image_url: string;
  link_url?: string;
  title: string;
}

interface CategoryBannerCarouselProps {
  banners: Banner[];
  categorySlug: string;
  onCategoryClick?: (slug: string) => void;
}

export const CategoryBannerCarousel: React.FC<CategoryBannerCarouselProps> = ({
  banners,
  categorySlug,
  onCategoryClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const hasBanners = banners.length > 0;
  const hasMultipleBanners = banners.length > 1;

  // Auto-rotate cada 5 segundos
  useEffect(() => {
    if (!hasMultipleBanners || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, hasMultipleBanners, isAutoPlaying]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume after 10s
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [banners.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [banners.length]);

  if (!hasBanners) {
    // Skeleton placeholder
    return (
      <div className="w-full lg:w-[650px] h-20 sm:h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center px-4">
          <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs text-gray-400">Banner disponible (650x100px)</p>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full lg:w-[650px] h-20 sm:h-24 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group">
      {/* Banner Image */}
      <a
        href={currentBanner.link_url || '#'}
        target={currentBanner.link_url ? '_blank' : '_self'}
        rel={currentBanner.link_url ? 'noopener noreferrer' : undefined}
        onClick={(e) => {
          if (!currentBanner.link_url) {
            e.preventDefault();
            onCategoryClick?.(categorySlug);
          }
        }}
        className="block w-full h-full"
      >
        <img
          src={currentBanner.image_url}
          alt={currentBanner.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </a>

      {/* Navigation Arrows - Solo si hay múltiples banners */}
      {hasMultipleBanners && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Banner siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dots Navigation - Solo si hay múltiples banners */}
      {hasMultipleBanners && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Ir al banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Counter Badge - Solo si hay múltiples banners */}
      {hasMultipleBanners && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
          {currentIndex + 1}/{banners.length}
        </div>
      )}
    </div>
  );
};
