/**
 * FeaturedAdsByCategory - Muestra avisos destacados agrupados por categoría
 * Diseño: Banner + 8 avisos en grid 4 columnas + Links subcategorías
 */

import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { getFeaturedAdsByCategories, type FeaturedAdsByCategory } from '../../services/featuredAdsService';
import { UnifiedAdCard } from '../UnifiedAdCard';

interface Props {
  onAdClick?: (adId: string) => void;
  onCategoryClick?: (categorySlug: string) => void;
  onSubcategoryClick?: (categorySlug: string, subcategorySlug: string) => void;
}

export const FeaturedAdsSection: React.FC<Props> = ({ 
  onAdClick, 
  onCategoryClick,
  onSubcategoryClick 
}) => {
  const [categoriesData, setCategoriesData] = useState<FeaturedAdsByCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedAds();
  }, []);

  const loadFeaturedAds = async () => {
    console.log('🚀 FeaturedAdsSection - loadFeaturedAds START');
    setLoading(true);
    const data = await getFeaturedAdsByCategories(8); // 8 avisos por categoría
    console.log('📦 FeaturedAdsSection - data received:', { 
      categoriesCount: data.length,
      categories: data.map(c => ({ name: c.category_name, adsCount: c.ads.length }))
    });
    setCategoriesData(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          {/* Skeleton de 2 categorías con 3 cards cada una */}
          {[1, 2].map((catIndex) => (
            <div key={catIndex} className={`mb-16 ${catIndex > 1 ? 'pt-8 border-t border-gray-200' : ''}`}>
              {/* Skeleton Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              
              {/* Skeleton Grid 3 columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3].map((cardIndex) => (
                  <div key={cardIndex} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100">
                    {/* Skeleton Imagen */}
                    <div className="w-full aspect-[16/9] bg-gray-200 animate-pulse"></div>
                    
                    {/* Skeleton Contenido */}
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse mt-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse mt-4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (categoriesData.length === 0) {
    return null; // No mostrar nada si no hay avisos destacados
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">

        {/* Por cada categoría */}
        {categoriesData.map((catData, idx) => (
          <div 
            key={catData.category_id} 
            className={`mb-16 last:mb-0 ${idx > 0 ? 'pt-8 border-t border-gray-200' : ''}`}
          >
            
            {/* Banner de Categoría (si existe) */}
            {catData.banner_url && (
              <div 
                className="relative h-32 sm:h-40 mb-8 rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => onCategoryClick?.(catData.category_slug)}
              >
                <img 
                  src={catData.banner_url} 
                  alt={catData.category_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center px-8">
                  <h3 className="text-3xl sm:text-4xl font-bold text-white">
                    {catData.category_name}
                  </h3>
                </div>
              </div>
            )}

            {/* Header de Categoría (sin banner) */}
            {!catData.banner_url && (
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-green-600 rounded-full"></span>
                  {catData.category_name}
                </h3>
                
                <button 
                  onClick={() => onCategoryClick?.(catData.category_slug)}
                  className="text-green-600 hover:text-green-700 font-semibold flex items-center gap-2 transition-colors"
                >
                  Ver todos
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Grid de 4 columnas - 8 avisos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {catData.ads.map((ad) => {
                // Extraer imagen real (puede ser string o {url, sort_order})
                let imageUrl = '';
                if (ad.images?.length > 0) {
                  const first = ad.images[0];
                  imageUrl = typeof first === 'string' ? first : (first as any)?.url || '';
                  console.log('🖼️ Image from ad.images:', { adId: ad.id, type: typeof first, imageUrl });
                } else if (ad.image_urls?.length > 0) {
                  const first = ad.image_urls[0];
                  imageUrl = typeof first === 'string' ? first : (first as any)?.url || '';
                  console.log('🖼️ Image from ad.image_urls:', { adId: ad.id, type: typeof first, imageUrl });
                } else {
                  console.warn('⚠️ No images found for ad:', { adId: ad.id, title: ad.title });
                }
                
                return (
                  <UnifiedAdCard 
                    key={ad.id} 
                    product={{
                      ...ad,
                      imageUrl,
                      sourceUrl: '',
                      isSponsored: false,
                    }}
                    onViewDetail={() => onAdClick?.(ad.id)}
                  />
                );
              })}
            </div>

            {/* Footer: Links a Subcategorías */}
            {catData.subcategories.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-sm font-bold text-gray-700 mb-4">
                  Explorá por tipo:
                </h4>
                <div className="flex flex-wrap gap-3">
                  {catData.subcategories.map((subcat) => (
                    <button
                      key={subcat.id}
                      onClick={() => onSubcategoryClick?.(catData.category_slug, subcat.slug)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-green-600 hover:text-green-600 transition-colors"
                    >
                      {subcat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
