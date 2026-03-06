/**
 * CategoryBannerSlider - Slider de banners por categoría
 *
 * Responsive:
 * - Mobile: w-full, h-20 (80px), swipe touch habilitado
 * - Tablet (sm): h-24 (96px)
 * - Desktop (lg): w-[650px], h-28 (112px)
 *
 * Auto-rotate cada 5s. Dots navigation. Touch swipe en mobile.
 * Imágenes optimizadas por viewport vía Cloudinary.
 */

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { optimizeCloudinaryUrl } from '../../utils/imageOptimizer';

interface Banner {
  id: string;
  image_url: string;
  link_url?: string;
  title: string;
}

interface CategoryBannerSliderProps {
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

  // Touch swipe tracking
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const hasBanners         = banners.length > 0;
  const hasMultipleBanners = banners.length > 1;

  // Auto-rotate cada 5s
  useEffect(() => {
    if (!hasMultipleBanners || !isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length, hasMultipleBanners, isAutoPlaying]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const goPrev = useCallback(() => {
    goToSlide((currentIndex - 1 + banners.length) % banners.length);
  }, [currentIndex, banners.length, goToSlide]);

  const goNext = useCallback(() => {
    goToSlide((currentIndex + 1) % banners.length);
  }, [currentIndex, banners.length, goToSlide]);

  // Touch handlers para swipe mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Solo swipe horizontal (ignorar scroll vertical)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) goNext(); else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // ── Placeholder ───────────────────────────────────────────────────────────
  if (!hasBanners) {
    return (
      <div
        id={id}
        className="w-full lg:w-[650px] h-20 sm:h-24 lg:h-28 border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center rounded-lg"
        role="banner"
        aria-label="Espacio publicitario disponible"
      >
        <div className="text-center px-4">
          <svg className="w-7 h-7 mx-auto text-gray-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-[10px] text-gray-400">Espacio publicitario</p>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  // Imagen optimizada por viewport
  const imgSrcMobile  = optimizeCloudinaryUrl(currentBanner.image_url, { width: 390,  quality: 'auto:good' });
  const imgSrcDesktop = optimizeCloudinaryUrl(currentBanner.image_url, { width: 650,  quality: 'auto:good' });

  return (
    <div
      id={id}
      className="relative w-full lg:w-[650px] h-20 sm:h-24 lg:h-28 overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-lg group"
      role="banner"
      aria-label={`Banner de ${categorySlug}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Imagen con <picture> para servir versión mobile vs desktop */}
      <a
        href={currentBanner.link_url || '#'}
        target={currentBanner.link_url ? '_blank' : '_self'}
        rel={currentBanner.link_url ? 'noopener noreferrer' : undefined}
        onClick={e => {
          if (!currentBanner.link_url) {
            e.preventDefault();
            onCategoryClick?.(categorySlug);
          }
        }}
        className="block w-full h-full"
        draggable={false}
      >
        <picture>
          <source media="(min-width: 1024px)" srcSet={imgSrcDesktop} />
          <img
            src={imgSrcMobile}
            alt={currentBanner.title}
            className="w-full h-full object-cover select-none"
            loading="lazy"
            draggable={false}
          />
        </picture>
      </a>

      {/* Dots — solo con múltiples banners */}
      {hasMultipleBanners && (
        <nav
          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1"
          aria-label="Navegación de banners"
        >
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'bg-white w-5' : 'w-1.5 bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Banner ${i + 1}`}
              aria-current={i === currentIndex ? 'true' : undefined}
            />
          ))}
        </nav>
      )}

      {/* Contador */}
      {hasMultipleBanners && (
        <div
          className="absolute top-1.5 right-1.5 bg-black/50 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          aria-live="polite"
        >
          {currentIndex + 1}/{banners.length}
        </div>
      )}
    </div>
  );
});

CategoryBannerSlider.displayName = 'CategoryBannerSlider';
