/**
 * FeaturedAdsSection - Avisos Destacados por Categoría + Últimos Avisos
 *
 * Estructura:
 * - 3 bloques de categorías con avisos DESTACADOS (pagos/manual superadmin)
 * - Sección "Últimos Avisos": carrusel horizontal compacto (8 col desktop)
 *   con lazy load de 16 items, separado visualmente para no mezclar
 *   avisos gratuitos con los pagos.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { getFeaturedForHomepage } from '../../services/userFeaturedService';
import { getCategoryCarouselBanners } from '../../services/bannersCleanService';
import { useCategories } from '../../contexts/CategoryContext';
import { ProductCard } from '../organisms/ProductCard';
import { SubcategoriesExpressBar } from './SubcategoriesExpressBar';
import { CategoryBannerSlider } from './CategoryBannerSlider';
import { supabase } from '../../services/supabaseClient';

const RECENT_ADS_PAGE_SIZE = 16;

// Configuración visual por categoría padre (slug → estilo)
const CATEGORY_VISUAL: Record<string, {
  tagline: string;
  accentBorder: string;
  accentBar: string;
}> = {
  ganaderia: {
    tagline: 'Hacienda, insumos, servicios y empresas del sector pecuario',
    accentBorder: 'border-brand-600',
    accentBar: 'bg-brand-600',
  },
  agricultura: {
    tagline: 'Insumos, servicios y empresas para el campo agrícola',
    accentBorder: 'border-brand-600',
    accentBar: 'bg-brand-600',
  },
  maquinarias: {
    tagline: 'Maquinaria agrícola, equipos y servicios de taller',
    accentBorder: 'border-brand-600',
    accentBar: 'bg-brand-600',
  },
};

const DEFAULT_VISUAL = {
  tagline: '',
  accentBorder: 'border-brand-600',
  accentBar: 'bg-brand-600',
};

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
  maxAdsPerCategory?: number;
}

export const FeaturedAdsSection: React.FC<FeaturedAdsSectionProps> = ({
  onAdClick,
  onCategoryClick,
  onSubcategoryClick,
  maxAdsPerCategory = 10,
}) => {
  const [categoriesData, setCategoriesData] = useState<CategoryWithBanners[]>([]);
  const [featuredByCategory, setFeaturedByCategory] = useState<Map<string, any[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Últimos avisos — carrusel unificado
  const [recentAds, setRecentAds] = useState<any[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentHasMore, setRecentHasMore] = useState(true);
  const [recentOffset, setRecentOffset] = useState(0);
  const recentCarouselRef = useRef<HTMLDivElement>(null);

  const { categories: contextCategories } = useCategories();

  // ─── Cargar categorías + destacados ──────────────────────────────────────
  const loadFeaturedAds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const categories = contextCategories.length > 0 ? contextCategories : [];

      if (categories.length === 0) {
        const { data: catsData } = await supabase
          .from('categories')
          .select('id, name, display_name, slug')
          .eq('is_active', true)
          .order('sort_order');
        categories.push(...(catsData || []) as any[]);
      }

      const categoriesWithData = await Promise.all(
        categories.map(async (cat) => {
          const categoryLookupValue = cat.slug || cat.display_name || cat.name;

          const { data: subcategories } = await supabase
            .from('subcategories')
            .select('id, name, display_name, slug, sort_order')
            .eq('category_id', cat.id)
            .eq('is_active', true)
            .order('sort_order');

          let banners: CategoryWithBanners['banners'] = [];
          try {
            const categoryBanners = await getCategoryCarouselBanners(categoryLookupValue);
            banners = categoryBanners
              .filter((b) => !!b.carousel_image_url)
              .map((b) => ({
                id: b.id,
                image_url: b.carousel_image_url || '',
                link_url: b.link_url,
                title: b.client_name || 'Banner',
              }));
          } catch {}

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

  // ─── Cargar últimos avisos (paginado) ────────────────────────────────────
  const loadRecentAds = useCallback(async (offset: number) => {
    setRecentLoading(true);
    try {
      const { data } = await supabase
        .from('ads')
        .select('id, title, price, currency, images, province, location, ad_type, category_id, slug')
        .eq('status', 'active')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false })
        .range(offset, offset + RECENT_ADS_PAGE_SIZE - 1);

      const newAds = data || [];
      setRecentAds((prev) => (offset === 0 ? newAds : [...prev, ...newAds]));
      setRecentHasMore(newAds.length === RECENT_ADS_PAGE_SIZE);
      setRecentOffset(offset + newAds.length);
    } catch (err) {
      console.error('[FeaturedAdsSection] Error loading recent ads:', err);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentAds(0);
  }, [loadRecentAds]);

  // ─── Carrusel "Últimos Avisos" — scroll por 4 cards ─────────────────────
  const scrollRecent = (dir: 'left' | 'right') => {
    const el = recentCarouselRef.current;
    if (!el) return;
    const cardWidth = 192; // ~w-48 = 192px + gap
    el.scrollBy({ left: dir === 'left' ? -cardWidth * 4 : cardWidth * 4, behavior: 'smooth' });
  };

  // ─── Skeleton ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section
        id="HomePage_FeaturedAds_Container"
        className="py-8 sm:py-10 bg-white"
        aria-busy="true"
        aria-label="Cargando avisos destacados"
      >
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4">
          {[1, 2].map((i) => (
            <article key={i} className="mb-6 sm:mb-8 rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-white px-4 sm:px-6 pt-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-1.5 h-8 bg-gray-300 rounded-full animate-pulse" />
                  <div className="h-7 w-48 bg-gray-300 rounded-lg animate-pulse" />
                </div>
                <div className="h-3 w-64 bg-gray-200 rounded animate-pulse mt-2" />
              </div>
              <div className="bg-white px-4 sm:px-6 pt-4 pb-5">
                <div className="flex gap-3 overflow-hidden">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="shrink-0 w-[48vw] min-w-[220px] max-w-[280px] rounded-xl border border-gray-100 overflow-hidden">
                      <div className="w-full aspect-[4/3] bg-gray-200 animate-pulse" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                        <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse mt-3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (error || categoriesData.length === 0) return null;

  return (
    <section
      id="HomePage_FeaturedAds_Container"
      className="py-8 sm:py-10 bg-white"
      aria-label="Avisos destacados por categoría"
    >
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4">

        {/* ── Bloques por categoría ─────────────────────────────────────── */}
        {categoriesData.map((catData) => {
          const blockId = `HomePage_bloque_Cat_${catData.category_id}`;
          const gridId = `HomePage_grid_Cat_${catData.category_id}`;
          const bannerId = `HomePage_banner_Cat_${catData.category_id}`;
          const featuredAds = featuredByCategory.get(catData.category_id) || [];
          const hasFeaturedAds = featuredAds.length > 0;
          const visual = CATEGORY_VISUAL[catData.category_slug] ?? DEFAULT_VISUAL;

          return (
            <article
              key={catData.category_id}
              id={catData.category_slug}
              data-block-id={blockId}
              data-category-slug={catData.category_slug}
              className="mb-6 sm:mb-8 last:mb-0 rounded-2xl overflow-hidden"
            >
              {/* Cabecera */}
              <div className="bg-white px-4 sm:px-6 pt-5 pb-4 border-b border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 flex items-center gap-2 sm:gap-3">
                      <span className={`w-1 sm:w-1.5 h-6 sm:h-8 ${visual.accentBar} rounded-full`} aria-hidden="true" />
                      <button
                        onClick={() => onCategoryClick?.(catData.category_slug)}
                        className="hover:text-brand-600 transition-colors"
                      >
                        {catData.category_name}
                      </button>
                    </h2>
                    {visual.tagline && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 ml-3 sm:ml-4">{visual.tagline}</p>
                    )}
                  </div>
                  <CategoryBannerSlider
                    id={bannerId}
                    banners={catData.banners}
                    categorySlug={catData.category_slug}
                    onCategoryClick={onCategoryClick}
                  />
                </div>
              </div>

              {/* Contenido */}
              <div className="bg-white px-4 sm:px-6 pt-4 pb-5">
                {hasFeaturedAds && (
                  <div className="flex items-center gap-2 mb-4 sm:mb-5">
                    <span className={`w-1 h-5 ${visual.accentBar} rounded-full`} aria-hidden="true" />
                    <h3 className="text-sm sm:text-base font-semibold text-gray-600 uppercase tracking-wide">
                      Avisos Destacados
                    </h3>
                    <span className="text-xs text-gray-400 font-medium">({featuredAds.length})</span>
                  </div>
                )}

                {hasFeaturedAds && (
                  <div
                    id={gridId}
                    className="flex md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 overflow-x-auto snap-x snap-mandatory mobile-hide-scrollbar -mx-3 px-3 md:mx-0 md:px-0 md:overflow-visible"
                  >
                    {featuredAds.map((ad, adIdx) => {
                      const firstImage = ad.images?.[0];
                      const imageUrl = typeof firstImage === 'string'
                        ? firstImage
                        : ((firstImage as { url?: string })?.url || '');
                      return (
                        <div
                          key={ad.id}
                          id={`HomePage_ad_${ad.id}`}
                          data-position={adIdx + 1}
                          className="shrink-0 w-[48vw] min-w-[230px] max-w-[300px] snap-start md:w-auto md:min-w-0 md:max-w-none md:shrink"
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
                )}

                {!hasFeaturedAds && (
                  <div className="mb-3 sm:mb-4">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 sm:p-8 border border-gray-200 text-center">
                      <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Próximamente avisos destacados en esta categoría</p>
                    </div>
                  </div>
                )}

                <SubcategoriesExpressBar
                  categorySlug={catData.category_slug}
                  subcategories={catData.subcategories}
                  onSubcategoryClick={onSubcategoryClick}
                />
              </div>
            </article>
          );
        })}

        {/* ── Últimos Avisos — carrusel unificado ────────────────────────── */}
        {(recentAds.length > 0 || recentLoading) && (
          <article
            id="HomePage_ultimos_avisos"
            className="rounded-2xl overflow-hidden"
          >
            {/* Cabecera */}
            <div className="bg-white px-4 sm:px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2 sm:gap-3">
                    <span className="w-1 sm:w-1.5 h-6 sm:h-8 bg-gray-400 rounded-full" aria-hidden="true" />
                    Últimos Avisos
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1 ml-3 sm:ml-4">
                    Los avisos publicados más recientemente en Rural24
                  </p>
                </div>
                {/* Navegación del carrusel */}
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => scrollRecent('left')}
                    aria-label="Anterior"
                    className="w-8 h-8 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => scrollRecent('right')}
                    aria-label="Siguiente"
                    className="w-8 h-8 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Carrusel — scroll horizontal en todas las pantallas */}
            <div className="bg-white px-4 sm:px-6 pt-4 pb-5">
              <div
                ref={recentCarouselRef}
                className="flex gap-2 sm:gap-3 overflow-x-auto snap-x snap-mandatory mobile-hide-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0"
                style={{ scrollbarWidth: 'none' }}
              >
                {recentAds.map((ad) => {
                  const firstImage = ad.images?.[0];
                  const imageUrl = typeof firstImage === 'string'
                    ? firstImage
                    : ((firstImage as { url?: string })?.url || '');
                  return (
                    <div
                      key={ad.id}
                      className="shrink-0 w-[44vw] min-w-[160px] max-w-[200px] snap-start"
                    >
                      <ProductCard
                        product={{
                          ...ad,
                          location: ad.province || ad.location || '',
                          imageUrl,
                          images: ad.images,
                          sourceUrl: '',
                          isSponsored: false,
                        }}
                        variant="compact"
                        showBadges={false}
                        showLocation={true}
                        onViewDetail={() => onAdClick?.(ad.id)}
                      />
                    </div>
                  );
                })}

                {/* Skeleton de carga inicial */}
                {recentLoading && recentAds.length === 0 &&
                  [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="shrink-0 w-[44vw] min-w-[160px] max-w-[200px] rounded-xl border border-gray-100 overflow-hidden">
                      <div className="w-full aspect-[4/3] bg-gray-200 animate-pulse" />
                      <div className="p-2 space-y-1.5">
                        <div className="h-2.5 bg-gray-200 rounded animate-pulse" />
                        <div className="h-2.5 bg-gray-200 rounded w-2/3 animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mt-2" />
                      </div>
                    </div>
                  ))
                }

                {/* Botón cargar más al final del carrusel */}
                {recentHasMore && recentAds.length > 0 && (
                  <div className="shrink-0 w-[44vw] min-w-[160px] max-w-[200px] flex items-center justify-center">
                    <button
                      onClick={() => loadRecentAds(recentOffset)}
                      disabled={recentLoading}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors w-full h-full min-h-[160px] text-gray-500 text-sm font-medium"
                    >
                      {recentLoading ? (
                        <span className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full" />
                      ) : (
                        <ChevronRight className="w-6 h-6" />
                      )}
                      <span>{recentLoading ? 'Cargando...' : 'Ver más'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>
        )}

      </div>
    </section>
  );
};
