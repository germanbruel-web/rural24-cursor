/**
 * UserFeaturedAdsBar - Avisos Destacados Unificados
 * 
 * Muestra avisos destacados de usuarios (pago) + superadmin (manual)
 * Orden de prioridad: Users > SuperAdmin manual
 * 
 * Caracteristicas:
 * - UNIFICADO: Users (pagos) + SuperAdmin (rellenar slots)
 * - Maximo 5 avisos en resultados (5 columnas desktop)
 * - 1 por usuario (FIFO)
 * - Fondo verde claro, diseno sutil sin emoticones
 * - Design System RURAL24
 */

import React, { useEffect, useState } from 'react';
import { Megaphone, Loader2 } from 'lucide-react';
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
      const { data, error } = await getFeaturedForResults(categoryId, 5, 0);
      
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
        <div className="bg-green-50/70 border border-green-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-semibold text-green-800 tracking-wide uppercase">Avisos Destacados</h3>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-green-500 ml-1" />
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

  // No mostrar si no hay avisos
  if (featuredAds.length === 0) {
    return null;
  }

  return (
    <div className={`mb-6 ${className}`}>
      <div className="bg-green-50/70 border border-green-100 rounded-xl p-4">
        {/* Header sutil */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-semibold text-green-800 tracking-wide uppercase">Avisos Destacados</h3>
          </div>
          <span className="text-xs text-green-600/70 font-medium">Publicidad</span>
        </div>

        {/* Grid 5 columnas desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {featuredAds.map((ad) => {
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
      </div>
    </div>
  );
};

export default UserFeaturedAdsBar;
