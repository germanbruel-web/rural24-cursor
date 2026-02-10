/**
 * FeaturedAdsSection - Avisos Destacados por Categoría
 * 
 * Estructura HTML semántica:
 * - section#HomePage_FeaturedAds_Container
 *   - article#HomePage_bloque_Cat_{category_id}  (por cada categoría)
 *     - header: Título + BannerSlider
 *     - div#HomePage_grid_Cat_{category_id}: Grid de productos
 *     - nav: Links de subcategorías
 * 
 * Mobile First: 1col → 2col (sm) → 3col (md) → 4col (lg) → 5col (xl)
 * 
 * HÍBRIDO: Combina avisos destacados por:
 * 1. Superadmin (featured_ads_queue)
 * 2. Usuarios que pagan créditos (featured_ads)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { getFeaturedAdsByCategories, type FeaturedAdsByCategory } from '../../services/featuredAdsService';
import { getFeaturedForHomepage } from '../../services/userFeaturedService';
import { useCategories } from '../../contexts/CategoryContext';
import { ProductCard } from '../organisms/ProductCard';
import { SubcategoriesExpressBar } from './SubcategoriesExpressBar';
import { CategoryBannerSlider } from './CategoryBannerSlider';

interface FeaturedAdsSectionProps {
  onAdClick?: (adId: string) => void;
  onCategoryClick?: (categorySlug: string) => void;
  onSubcategoryClick?: (categorySlug: string, subcategorySlug: string) => void;
  /** Cantidad máxima de avisos por categoría */
  maxAdsPerCategory?: number;
}

export const FeaturedAdsSection: React.FC<FeaturedAdsSectionProps> = ({ 
  onAdClick, 
  onCategoryClick,
  onSubcategoryClick,
  maxAdsPerCategory = 12
}) => {
  const [categoriesData, setCategoriesData] = useState<FeaturedAdsByCategory[]>([]);
  const [userFeaturedByCategory, setUserFeaturedByCategory] = useState<Map<string, any[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { categories: contextCategories } = useCategories();

  const loadFeaturedAds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Cargar destacados de superadmin (pasar categorías del context para evitar query duplicado)
      const cats = contextCategories.length > 0 
        ? contextCategories.map(c => ({ id: c.id, name: c.name, display_name: c.display_name, icon: undefined, slug: c.slug }))
        : undefined;
      const data = await getFeaturedAdsByCategories(maxAdsPerCategory, cats);
      setCategoriesData(data);
      
      // 2. Cargar destacados de usuarios para cada categoría
      const userFeaturedMap = new Map<string, any[]>();
      await Promise.all(
        data.map(async (catData) => {
          const { data: userAds } = await getFeaturedForHomepage(catData.category_id, 10);
          if (userAds && userAds.length > 0) {
            userFeaturedMap.set(catData.category_id, userAds);
          }
        })
      );
      setUserFeaturedByCategory(userFeaturedMap);
    } catch (err) {
      console.error('[FeaturedAdsSection] Error loading featured ads:', err);
      setError('Error al cargar avisos destacados');
    } finally {
      setLoading(false);
    }
  }, [maxAdsPerCategory, contextCategories]);

  useEffect(() => {
    loadFeaturedAds();
  }, [loadFeaturedAds]);

  // Estado de carga - Skeleton Mobile First
  if (loading) {
    return (
      <section 
        id="HomePage_FeaturedAds_Container"
        className="py-8 sm:py-12 bg-white"
        aria-busy="true"
        aria-label="Cargando avisos destacados"
      >
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4">
          {[1, 2].map((catIndex) => (
            <article 
              key={catIndex} 
              className={`mb-12 sm:mb-16 ${catIndex > 1 ? 'pt-6 sm:pt-8 border-t border-gray-200' : ''}`}
            >
              {/* Skeleton Header - Stack en mobile, row en lg */}
              <header className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-6 sm:h-8 w-32 sm:w-48 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                {/* Banner skeleton - full width mobile, 650px desktop */}
                <div className="w-full lg:w-[650px] lg:ml-auto h-16 sm:h-20 bg-gray-200 animate-pulse rounded" />
              </header>
              
              {/* Skeleton Grid - Mobile First: 2 → 3 → 4 → 5 columnas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {[1, 2, 3, 4, 5].map((cardIndex) => (
                  <div 
                    key={cardIndex} 
                    className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border border-gray-100"
                  >
                    <div className="w-full aspect-[4/3] bg-gray-200 animate-pulse" />
                    <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                      <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                      <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/2 animate-pulse mt-3 sm:mt-4" />
                      <div className="h-8 sm:h-10 bg-gray-200 rounded animate-pulse mt-3 sm:mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  // Sin datos o error
  if (error || categoriesData.length === 0) {
    return null;
  }

  return (
    <section 
      id="HomePage_FeaturedAds_Container"
      className="py-8 sm:py-12 bg-white"
      aria-label="Avisos destacados por categoría"
    >
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4">

        {/* Por cada categoría (incluso sin avisos) */}
        {categoriesData.map((catData, idx) => {
          // IDs dinámicos para cada bloque
          const blockId = `HomePage_bloque_Cat_${catData.category_id}`;
          const gridId = `HomePage_grid_Cat_${catData.category_id}`;
          const bannerId = `HomePage_banner_Cat_${catData.category_id}`;
          const hasAds = catData.ads.length > 0;
          const hasUserAds = (userFeaturedByCategory.get(catData.category_id) || []).length > 0;
          
          return (
            <article 
              key={catData.category_id}
              id={catData.category_slug}
              data-block-id={blockId}
              data-category-slug={catData.category_slug}
              className={`mb-12 sm:mb-16 last:mb-0 ${idx > 0 ? 'pt-6 sm:pt-8 border-t border-gray-200' : ''}`}
            >
              
              {/* Header: Título + Banner Slider - Stack en mobile, row en lg */}
              <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                {/* Título de la Categoría */}
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                  <span 
                    className="w-1 sm:w-1.5 h-6 sm:h-8 bg-green-600 rounded-full" 
                    aria-hidden="true"
                  />
                  <button
                    onClick={() => onCategoryClick?.(catData.category_slug)}
                    className="hover:text-green-700 transition-colors"
                  >
                    {catData.category_name}
                  </button>
                </h2>

                {/* Banner Slider - Full width mobile, 650px desktop */}
                <CategoryBannerSlider
                  id={bannerId}
                  banners={catData.banners}
                  categorySlug={catData.category_slug}
                  onCategoryClick={onCategoryClick}
                />
              </header>

              {/* Avisos destacados por USUARIOS (pagados) - Antes del grid principal */}
              {userFeaturedByCategory.get(catData.category_id)?.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                    {userFeaturedByCategory.get(catData.category_id)!.slice(0, 5).map((ad, adIdx) => {
                      const firstImage = ad.images?.[0];
                      const imageUrl = typeof firstImage === 'string' 
                        ? firstImage 
                        : ((firstImage as { url?: string })?.url || '');
                      
                      return (
                        <div
                          key={ad.id}
                          className="relative group"
                        >
                          {/* Badge destacado */}
                          <div className="absolute -top-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded z-10">
                            ⚡ Destacado
                          </div>
                          <div className="relative border border-green-500 rounded-xl overflow-hidden">
                            <ProductCard
                              product={{
                                ...ad,
                                category: catData.category_name,
                                location: ad.province || ad.location || '',
                                imageUrl,
                                images: ad.images,
                                sourceUrl: '',
                                isSponsored: true,
                              }}
                              variant="featured"
                              showBadges={false}
                              showLocation={true}
                              onViewDetail={() => onAdClick?.(ad.id)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grid de Productos o Skeleton si no hay avisos */}
              {hasAds ? (
                <div 
                  id={gridId}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4"
                >
                  {catData.ads.map((ad, adIdx) => {
                    // Extraer URL de imagen correctamente
                    const firstImage = ad.images?.[0];
                    const imageUrl = typeof firstImage === 'string' 
                      ? firstImage 
                      : ((firstImage as { url?: string })?.url || ad.image_urls?.[0] || '');
                    
                    return (
                      <div 
                        key={ad.id}
                        id={`HomePage_ad_${ad.id}`}
                        data-position={adIdx + 1}
                      >
                        <ProductCard
                          product={{
                            ...ad,
                            category: catData.category_name,
                            location: ad.location || '',
                            imageUrl,
                            images: ad.images,
                            sourceUrl: '',
                            isSponsored: (ad as any).is_premium || false,
                          }}
                          variant="featured"
                          showBadges={true}
                          showLocation={true}
                          onViewDetail={() => onAdClick?.(ad.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : hasUserAds ? (
                <div className="mb-3 sm:mb-4">
                  <p className="text-xs text-gray-500">Sin destacados del equipo en esta categoría.</p>
                </div>
              ) : (
                /* Skeleton animado cuando no hay avisos */
                <div className="mb-3 sm:mb-4">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 sm:p-8 border border-gray-200">
                    <div className="text-center mb-6">
                      <p className="text-gray-500 text-sm sm:text-base">
                        Próximamente avisos destacados en esta categoría
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div 
                          key={i} 
                          className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse"
                        >
                          <div className="w-full aspect-[4/3] bg-gray-200" />
                          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                            <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2" />
                            <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/3 mt-3" />
                            <div className="h-8 sm:h-10 bg-gray-200 rounded mt-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Links de subcategorías */}
              <SubcategoriesExpressBar
                categorySlug={catData.category_slug}
                subcategories={catData.subcategories}
                onSubcategoryClick={onSubcategoryClick}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
};
