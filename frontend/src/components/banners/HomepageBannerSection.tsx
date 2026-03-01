// HomepageBannerSection.tsx
// Banner Buscador Dinámico - Posición 1 (1100x200)
// Muestra hasta 6 banners rotativos filtrados por categoría

import { useEffect, useState } from 'react';
import { getHomepageBanners } from '../../services/bannersService';
import { optimizeCloudinaryUrl } from '../../utils/imageOptimizer';
import type { Banner } from '../../../types';

interface Props {
  category?: string; // Opcional: filtrar por categoría actual
}

export const HomepageBannerSection: React.FC<Props> = ({ category }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, [category]);

  const loadBanners = async () => {
    setLoading(true);
    const data = await getHomepageBanners(category);
    console.log('📢 HomepageBanners loaded:', data.length);
    setBanners(data);
    setLoading(false);
  };

  // Auto-rotate cada 5 segundos
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners]);

  if (loading) {
    return (
      <div className="w-full h-[200px] bg-gray-200 animate-pulse" />
    );
  }

  if (banners.length === 0) {
    return null; // No mostrar si no hay banners
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full h-[200px] overflow-hidden shadow-lg group">
      {/* Banner Image */}
      <a
        href={currentBanner.link_url || '#'}
        target={currentBanner.link_url ? '_blank' : '_self'}
        rel="noopener noreferrer"
        className="block w-full h-full"
      >
        <img
          src={optimizeCloudinaryUrl(currentBanner.image_url, { width: 1100, height: 200, quality: 'auto', format: 'auto' })}
          alt={currentBanner.title}
          className="w-full h-full object-cover"
          decoding="async"
          width={1100}
          height={200}
        />
      </a>

      {/* Indicadores de posición */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-6' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Ver banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navegación manual */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Banner anterior"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Banner siguiente"
          >
            →
          </button>
        </>
      )}
    </div>
  );
};
