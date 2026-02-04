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

  // No mostrar nada si no hay categoría o no hay destacados
  if (!categoryId || (!loading && featuredAds.length === 0)) {
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
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-100 to-amber-50 rounded-full">
          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span className="font-semibold text-amber-700 text-sm">Destacados</span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent" />
      </div>

      {/* Grid de destacados */}
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
              {/* Borde dorado */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity" />
              
              {/* Badge destacado */}
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
                <Star className="w-3 h-3 fill-white" />
                Destacado
              </div>
              
              {/* Card */}
              <div className="relative bg-white rounded-xl overflow-hidden">
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
    </div>
  );
};

export default UserFeaturedAdsBar;
