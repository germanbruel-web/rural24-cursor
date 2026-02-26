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
 * Tabla unificada: featured_ads (placement: homepage, category, results)
 * Incluye avisos activados por superadmin y usuarios con créditos
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { getFeaturedForHomepage } from '../../services/userFeaturedService';
import { getCategoryCarouselBanners } from '../../services/bannersCleanService';
import { useCategories } from '../../contexts/CategoryContext';
import { ProductCard } from '../organisms/ProductCard';
import { SubcategoriesExpressBar } from './SubcategoriesExpressBar';
import { CategoryBannerSlider } from './CategoryBannerSlider';
import { supabase } from '../../services/supabaseClient';

interface CategoryWithBanners {
  category_id: string;
  category_name: string;
  category_slug: string;
  banners: Array<{
    id: string;
    image_url: string;
    link_url?: string;
    title: string;
  }>;
  subcategories: any[];
}

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
  maxAdsPerCategory = 10  // Límite unificado: 10 slots
}) => {
  const [categoriesData, setCategoriesData] = useState<CategoryWithBanners[]>([]);
  const [featuredByCategory, setFeaturedByCategory] = useState<Map<string, any[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { categories: contextCategories } = useCategories();

  const loadFeaturedAds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Cargar categorías con banners y subcategorías
      const categories = contextCategories.length > 0 ? contextCategories : [];
      
      if (categories.length === 0) {
        const { data: catsData } = await supabase
          .from('categories')
          .select('id, name, display_name, slug')
          .eq('is_active', true)
          .order('sort_order');
        categories.push(...(catsData || []));
      }

      // 2. Para cada categoría, cargar subcategorías + destacados unificados
      // NOTA: Banners se manejan vía CategoryBannerSlider (tabla banners_clean)
      const categoriesWithData = await Promise.all(
        categories.map(async (cat) => {
          const categoryLookupValue = cat.slug || cat.display_name || cat.name;

          // Subcategorías con conteo de avisos activos
          const { data: subcategories } = await supabase
            .from('subcategories')
            .select('id, name, display_name, slug, sort_order')
            .eq('category_id', cat.id)
            .eq('is_active', true)
            .order('sort_order');

          // Banners de carrusel por categoría (banners_clean v2)
          // Incluye banners específicos + banners con category='all'
          let banners: CategoryWithBanners['banners'] = [];
          try {
            const categoryBanners = await getCategoryCarouselBanners(categoryLookupValue);
            banners = categoryBanners
              .filter((banner) => !!banner.carousel_image_url)
              .map((banner) => ({
                id: banner.id,
                image_url: banner.carousel_image_url || '',
                link_url: banner.link_url,
                title: banner.client_name || 'Banner',
              }));
          } catch (bannerError) {
            console.error(
              `[FeaturedAdsSection] Error loading category banners for ${categoryLookupValue}:`,
              bannerError
            );
          }

          // Contar avisos activos por subcategoría
          const subcatsWithCount = await Promise.all(
            (subcategories || []).map(async (s) => {
              const { count } = await supabase
                .from('ads')
                .select('id', { count: 'exact', head: true })
                .eq('subcategory_id', s.id)
                .eq('status', 'active')
                .eq('approval_status', 'approved');
              return {
                id: s.id,
                name: s.display_name || s.name,
                slug: s.slug,
                ads_count: count || 0,
              };
            })
          );

          return {
            category_id: cat.id,
            category_name: cat.display_name || cat.name,
            category_slug: cat.slug,
            banners,
            subcategories: subcatsWithCount,
          };
        })
      );

      setCategoriesData(categoriesWithData);
      
      // 3. Cargar destacados UNIFICADOS (user + superadmin) para cada categoría
      const featuredMap = new Map<string, any[]>();
      await Promise.all(
        categoriesWithData.map(async (catData) => {
          const { data: featuredAds } = await getFeaturedForHomepage(catData.category_id, maxAdsPerCategory);
          if (featuredAds && featuredAds.length > 0) {
            featuredMap.set(catData.category_id, featuredAds);
          }
        })
      );
      setFeaturedByCategory(featuredMap);
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

        {/* Por cada categoría */}
        {categoriesData.map((catData, idx) => {
          // IDs dinámicos para cada bloque
          const blockId = `HomePage_bloque_Cat_${catData.category_id}`;
          const gridId = `HomePage_grid_Cat_${catData.category_id}`;
          const bannerId = `HomePage_banner_Cat_${catData.category_id}`;
          const featuredAds = featuredByCategory.get(catData.category_id) || [];
          const hasFeaturedAds = featuredAds.length > 0;
          
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
                    className="w-1 sm:w-1.5 h-6 sm:h-8 bg-brand-600 rounded-full" 
                    aria-hidden="true"
                  />
                  <button
                    onClick={() => onCategoryClick?.(catData.category_slug)}
                    className="hover:text-brand-600 transition-colors"
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

              {/* Subtítulo: Avisos Destacados */}
              {hasFeaturedAds && (
                <div className="flex items-center gap-2 mb-4 sm:mb-5">
                  <span className="w-1 h-5 bg-brand-600 rounded-full" aria-hidden="true" />
                  <h3 className="text-sm sm:text-base font-semibold text-gray-600 uppercase tracking-wide">
                    Avisos Destacados
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">
                    ({featuredAds.length})
                  </span>
                </div>
              )}

              {/* Grid de Avisos Destacados Unificados */}
              {hasFeaturedAds ? (
                <div 
                  id={gridId}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4"
                >
                  {featuredAds.map((ad, adIdx) => {
                    // Extraer URL de imagen correctamente
                    const firstImage = ad.images?.[0];
                    const imageUrl = typeof firstImage === 'string' 
                      ? firstImage 
                      : ((firstImage as { url?: string })?.url || '');
                    
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
                            location: ad.province || ad.location || '',
                            imageUrl,
                            images: ad.images,
                            sourceUrl: '',
                            isSponsored: true,
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
              ) : (
                /* Skeleton cuando no hay avisos destacados */
                <div className="mb-3 sm:mb-4">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 sm:p-8 border border-gray-200">
                    <div className="text-center mb-6">
                      <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm sm:text-base">
                        Próximamente avisos destacados en esta categoría
                      </p>
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
