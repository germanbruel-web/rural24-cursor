/**
 * UserFeaturedAdsBar - Avisos Destacados (Carrusel)
 * 
 * Muestra avisos destacados de usuarios (pago) + superadmin (manual)
 * en un carrusel de 4 cards visibles (desktop) con navegación por flechas.
 * 
 * Caracteristicas:
 * - Carrusel con 4 cards visibles en desktop, 2 en mobile, 3 en tablet
 * - Hasta 8 avisos cargados, paginados de a 4
 * - Transición suave con CSS transform
 * - Flechas prev/next elegantes
 * - Fondo brand-200, diseño sutil
 * - Design System RURAL24
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Megaphone, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../organisms/ProductCard';
import { getFeaturedForResults } from '../../services/userFeaturedService';

interface UserFeaturedAdsBarProps {
  categoryId?: string;
  onViewDetail?: (adId: string) => void;
  className?: string;
}

export const UserFeaturedAdsBar: React.FC<UserFeaturedAdsBarProps> = ({
  categoryId,
  onViewDetail,
  className = ''
}) => {
  const [featuredAds, setFeaturedAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  // Cards visibles por breakpoint (synced con CSS grid)
  const CARDS_PER_PAGE = 4; // desktop
  const totalPages = Math.ceil(featuredAds.length / CARDS_PER_PAGE);

  useEffect(() => {
    const loadFeatured = async () => {
      if (!categoryId) {
        setFeaturedAds([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await getFeaturedForResults(categoryId, 8, 0);
      
      if (error) {
        console.error('Error loading user featured ads:', error);
        setFeaturedAds([]);
      } else {
        setFeaturedAds(data || []);
      }
      setLoading(false);
    };

    loadFeatured();
  }, [categoryId]);

  // Reset page when ads change
  useEffect(() => {
    setCurrentPage(0);
  }, [featuredAds.length]);

  const goNext = useCallback(() => {
    setCurrentPage(prev => (prev + 1) % totalPages);
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  // No mostrar nada si no hay categoría
  if (!categoryId) {
    return null;
  }

  if (loading) {
    return (
      <div className={`mb-6 ${className}`}>
        <div className="bg-brand-200 border border-brand-300 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-brand-700 tracking-wide uppercase">Avisos Destacados</h3>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400 ml-1" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/60 rounded-lg h-48 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // No mostrar si no hay avisos
  if (featuredAds.length === 0) {
    return null;
  }

  const showArrows = featuredAds.length > CARDS_PER_PAGE;

  return (
    <div className={`mb-6 ${className}`}>
      <div className="bg-brand-200 border border-brand-300 rounded-xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-brand-700 tracking-wide uppercase">Avisos Destacados</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Dots indicator */}
            {showArrows && (
              <div className="flex items-center gap-1.5 mr-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      i === currentPage
                        ? 'bg-brand-600 w-3'
                        : 'bg-brand-400/50 hover:bg-brand-400'
                    }`}
                    aria-label={`Página ${i + 1}`}
                  />
                ))}
              </div>
            )}
            <span className="text-xs text-brand-600/70 font-medium">Publicidad</span>
          </div>
        </div>

        {/* Carousel container */}
        <div className="relative">
          {/* Prev arrow */}
          {showArrows && (
            <button
              onClick={goPrev}
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 dark:bg-neutral-800/90 shadow-md rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-neutral-700 transition-colors border border-brand-300/50"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4 text-brand-700" />
            </button>
          )}

          {/* Cards viewport */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {/* Render pages */}
              {Array.from({ length: totalPages }).map((_, pageIdx) => (
                <div
                  key={pageIdx}
                  className="w-full flex-shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
                >
                  {featuredAds
                    .slice(pageIdx * CARDS_PER_PAGE, (pageIdx + 1) * CARDS_PER_PAGE)
                    .map((ad) => {
                      const firstImage = ad.images?.[0];
                      const imageUrl = typeof firstImage === 'string'
                        ? firstImage
                        : ((firstImage as { url?: string })?.url || '');

                      return (
                        <div key={ad.id}>
                          <ProductCard
                            product={{
                              ...ad,
                              id: ad.id,
                              title: ad.title,
                              price: ad.price,
                              currency: ad.currency || 'ARS',
                              category: ad.categories?.name || '',
                              location: ad.province || ad.location || '',
                              imageUrl,
                              images: ad.images,
                              sourceUrl: '',
                              isSponsored: true,
                            }}
                            variant="compact"
                            showBadges={false}
                            showLocation={true}
                            onViewDetail={() => onViewDetail?.(ad.id)}
                          />
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>

          {/* Next arrow */}
          {showArrows && (
            <button
              onClick={goNext}
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 dark:bg-neutral-800/90 shadow-md rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-neutral-700 transition-colors border border-brand-300/50"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4 text-brand-700" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserFeaturedAdsBar;
