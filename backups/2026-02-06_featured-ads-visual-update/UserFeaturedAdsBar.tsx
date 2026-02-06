/**
 * UserFeaturedAdsBar - Avisos destacados por usuarios
 * 
 * Muestra los avisos que usuarios han pagado para destacar
 * en la página de resultados de búsqueda.
 * 
 * Características:
 * - Máximo 4 avisos (1 por usuario)
 * - Orden FIFO (primero que paga, primero aparece)
 * - Badge "⭐ Destacado" con borde dorado
 * - Se inserta entre los resultados normales
 */

import React, { useEffect, useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    const loadFeatured = async () => {
      if (!categoryId) {
        setFeaturedAds([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await getFeaturedForResults(categoryId, 4, 0);
      
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

  // No mostrar nada si no hay categoría
  if (!categoryId) {
    return null;
  }

  if (loading) {
    return (
      <div className={`mb-6 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-gray-700">Avisos Destacados</span>
          <Loader2 className="w-4 h-4 animate-spin text-amber-500 ml-2" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-6 ${className}`}>
      {/* Grid de destacados */}
      {featuredAds.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
          ))}
          {!loading && (
            <div className="col-span-2 sm:col-span-4 text-sm text-gray-500">
              Aun no hay avisos destacados en esta categoria.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {featuredAds.map((ad) => {
            // Extraer imagen
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
                
                {/* Card con borde verde */}
                <div className="relative bg-white rounded-xl overflow-hidden border border-green-500">
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
                      isSponsored: true, // Para estilos premium
                    }}
                    variant="compact"
                    showBadges={false}
                    showLocation={true}
                    onViewDetail={() => onViewDetail?.(ad.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserFeaturedAdsBar;
