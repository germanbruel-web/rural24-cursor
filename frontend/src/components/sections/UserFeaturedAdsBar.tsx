/**
 * UserFeaturedAdsBar - Avisos Destacados (Carrusel)
 *
 * Muestra avisos destacados de usuarios (pago) + superadmin (manual)
 * en un carrusel de 5 cards visibles (desktop) con navegación por flechas.
 *
 * Carga hasta 30 avisos por sesión en lotes de 10 ("Cargar más").
 * El carrusel navega dentro del conjunto visible con flechas prev/next.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Megaphone, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../organisms/ProductCard';
import { CardErrorBoundary } from '../common/CardErrorBoundary';
import { getFeaturedForResults, getFeaturedForDetail } from '../../services/userFeaturedService';
import { adaptAdToProduct } from '../../services/api/adapters';
import { useGlobalSetting } from '../../hooks/useGlobalSetting';

interface UserFeaturedAdsBarProps {
  categoryId?: string;
  onViewDetail?: (adId: string) => void;
  className?: string;
  placement?: 'results' | 'detail';
  excludeAdId?: string;
}

export const UserFeaturedAdsBar: React.FC<UserFeaturedAdsBarProps> = ({
  categoryId,
  onViewDetail,
  className = '',
  placement = 'results',
  excludeAdId,
}) => {
  const cardsPerPage = useGlobalSetting<number>('featured_bar_cards_per_page', 5);
  const loadBatch    = useGlobalSetting<number>('featured_bar_load_batch', 10);
  const maxAds       = useGlobalSetting<number>('featured_bar_max_ads', 30);

  const [allAds, setAllAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(loadBatch);
  const [currentPage, setCurrentPage] = useState(0);

  const featuredAds = allAds.slice(0, visibleCount);
  const totalPages = Math.ceil(featuredAds.length / cardsPerPage);

  useEffect(() => {
    const loadFeatured = async () => {
      if (!categoryId) {
        setAllAds([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = placement === 'detail' && excludeAdId
        ? await getFeaturedForDetail(categoryId, excludeAdId, maxAds)
        : await getFeaturedForResults(categoryId, maxAds, 0);

      if (error) {
        console.error('Error loading featured ads bar:', error);
        setAllAds([]);
      } else {
        setAllAds(data || []);
      }
      setLoading(false);
    };

    loadFeatured();
    setVisibleCount(loadBatch);
    setCurrentPage(0);
  }, [categoryId, placement, excludeAdId]);

  // Reset page when visible set changes
  useEffect(() => {
    setCurrentPage(0);
  }, [visibleCount]);

  const goNext = useCallback(() => {
    setCurrentPage(prev => (prev + 1) % totalPages);
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + loadBatch, maxAds));
  };

  if (!categoryId) return null;

  if (loading) {
    return (
      <div className={`mb-6 ${className}`}>
        <div className="bg-brand-100 border border-brand-300 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-brand-700 tracking-wide uppercase">Avisos Destacados</h3>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600 ml-1" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white/60 rounded-lg h-48 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (allAds.length === 0) return null;

  const showArrows = featuredAds.length > cardsPerPage;
  const canLoadMore = visibleCount < Math.min(allAds.length, maxAds);

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
            {showArrows && (
              <div className="flex items-center gap-1.5 mr-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentPage
                        ? 'bg-brand-600 w-3'
                        : 'bg-brand-600/50 hover:bg-brand-500 w-1.5'
                    }`}
                    aria-label={`Página ${i + 1}`}
                  />
                ))}
              </div>
            )}
            <span className="text-xs text-brand-600/70 font-medium">Publicidad</span>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          {showArrows && (
            <button
              onClick={goPrev}
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 shadow-md rounded-full flex items-center justify-center hover:bg-white transition-colors border border-brand-300/50"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4 text-brand-700" />
            </button>
          )}

          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {Array.from({ length: totalPages }).map((_, pageIdx) => (
                <div
                  key={pageIdx}
                  className="w-full flex-shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
                >
                  {featuredAds
                    .filter(Boolean)
                    .slice(pageIdx * cardsPerPage, (pageIdx + 1) * cardsPerPage)
                    .map((ad) => {
                      return (
                        <CardErrorBoundary key={ad.id}>
                          <ProductCard
                            product={adaptAdToProduct(ad, { isSponsored: true })}
                            variant="compact"
                            showLocation={true}
                            onViewDetail={() => onViewDetail?.(ad.id)}
                          />
                        </CardErrorBoundary>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>

          {showArrows && (
            <button
              onClick={goNext}
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 shadow-md rounded-full flex items-center justify-center hover:bg-white transition-colors border border-brand-300/50"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4 text-brand-700" />
            </button>
          )}
        </div>

        {/* Cargar más */}
        {canLoadMore && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={handleLoadMore}
              className="text-xs font-semibold text-brand-700 hover:text-brand-900 bg-white/70 hover:bg-white border border-brand-300 rounded-lg px-4 py-1.5 transition-colors"
            >
              Cargar más
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserFeaturedAdsBar;
