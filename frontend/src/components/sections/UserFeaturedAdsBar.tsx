/**
 * UserFeaturedAdsBar - Avisos Destacados Unificados
 * 
 * Muestra avisos destacados de usuarios (pago) + superadmin (manual)
 * Orden de prioridad: Users > SuperAdmin manual
 * 
 * Características:
 * - UNIFICADO: Users (pagos) + SuperAdmin (rellenar slots)
 * - Máximo 4 avisos en resultados
 * - 1 por usuario (FIFO)
 * - Sin stroke verde ni badges
 * - Título con icono Lucide Star
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
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
          <h3 className="font-semibold text-gray-700">Avisos Destacados</h3>
          <Loader2 className="w-4 h-4 animate-spin text-yellow-500 ml-2" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // No mostrar si no hay avisos
  if (featuredAds.length === 0) {
    return null;
  }

  return (
    <div className={`mb-6 ${className}`}>
      {/* Título */}
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
        <h3 className="font-semibold text-gray-700">Avisos Destacados</h3>
        <span className="text-sm text-gray-500">({featuredAds.length})</span>
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
                showBadges={true}
                showLocation={true}
                onViewDetail={() => onViewDetail?.(ad.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserFeaturedAdsBar;
