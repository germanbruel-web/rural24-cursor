/**
 * CategoryBannerSlider - Slider de banners por categoría
 * 
 * Diseño Mobile First:
 * - Mobile: 100% width, altura 64px
 * - Desktop: 650px width, altura 96px
 * - Auto-rotate cada 5s con dots navigation
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { optimizeCloudinaryUrl } from '../../utils/imageOptimizer';

interface Banner {
  id: string;
  image_url: string;
  link_url?: string;
  title: string;
}

interface CategoryBannerSliderProps {
  /** ID único para el elemento DOM */
  id?: string;
  banners: Banner[];
  categorySlug: string;
  onCategoryClick?: (slug: string) => void;
}

export const CategoryBannerSlider: React.FC<CategoryBannerSliderProps> = memo(({
  id,
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

  if (!hasBanners) {
    // Placeholder para espacios publicitarios disponibles
    return (
      <div 
        id={id}
        className="w-full lg:w-[650px] h-16 sm:h-20 lg:h-24 border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center rounded"
        role="banner"
        aria-label="Espacio publicitario disponible"
      >
        <div className="text-center px-3 sm:px-4">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-gray-400 mb-1 sm:mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-[10px] sm:text-xs text-gray-400">Banner disponible</p>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div 
      id={id}
      className="relative w-full lg:w-[650px] h-16 sm:h-20 lg:h-24 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group rounded"
      role="banner"
      aria-label={`Banner de ${categorySlug}`}
    >
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
          src={optimizeCloudinaryUrl(currentBanner.image_url, { width: 650, quality: 'auto:good' })}
          alt={currentBanner.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </a>

      {/* Dots Navigation - Solo si hay múltiples banners */}
      {hasMultipleBanners && (
        <nav 
          className="absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-1.5"
          aria-label="Navegación de banners"
        >
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-4 sm:w-6'
                  : 'w-1.5 sm:w-2 bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Ir al banner ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : undefined}
            />
          ))}
        </nav>
      )}

      {/* Counter Badge - Solo si hay múltiples banners */}
      {hasMultipleBanners && (
        <div 
          className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium"
          aria-live="polite"
        >
          {currentIndex + 1}/{banners.length}
        </div>
      )}
    </div>
  );
});

// Display name para debugging
CategoryBannerSlider.displayName = 'CategoryBannerSlider';
