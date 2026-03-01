import { useState, useEffect } from 'react';
import type { BannerClean } from '@/types';
import { getHeroVIPBanners, incrementBannerImpression, incrementBannerClick } from '@/services/bannersCleanService';
import { optimizeCloudinaryUrl } from '@/utils/imageOptimizer';

interface HeroVIPBannerProps {
  currentCategory?: string;  // 'all' | 'inmuebles' | 'vehiculos' | 'maquinarias' | 'insumos' | 'empleos'
}

export default function HeroVIPBanner({ currentCategory = 'all' }: HeroVIPBannerProps) {
  const [banner, setBanner] = useState<BannerClean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRandomBanner();
  }, [currentCategory]);

  const loadRandomBanner = async () => {
    try {
      setLoading(true);
      const banners = await getHeroVIPBanners(currentCategory);
      
      if (banners.length > 0) {
        // Selección aleatoria
        const randomBanner = banners[Math.floor(Math.random() * banners.length)];
        setBanner(randomBanner);
        
        // Registrar impresión
        incrementBannerImpression(randomBanner.id);
      } else {
        setBanner(null);
      }
    } catch (error) {
      console.error('Error cargando banner Hero VIP:', error);
      setBanner(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (banner) {
      incrementBannerClick(banner.id);
      if (banner.link_url) {
        window.open(banner.link_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-gray-200 animate-pulse rounded-lg">
        <div className="hidden md:block h-[200px]"></div>
        <div className="md:hidden h-[100px]"></div>
      </div>
    );
  }

  if (!banner) {
    return null;
  }

  return (
    <div
      onClick={handleClick}
      className={`w-full overflow-hidden rounded-lg ${banner.link_url ? 'cursor-pointer' : ''}`}
    >
      {/* Banner Desktop — altura fija para evitar CLS */}
      {banner.desktop_image_url && (
        <img
          src={optimizeCloudinaryUrl(banner.desktop_image_url, { width: 1100, height: 200, quality: 'auto', format: 'auto' })}
          alt={banner.title}
          className="hidden md:block w-full object-cover"
          width={1100}
          height={200}
          decoding="async"
        />
      )}

      {/* Banner Mobile — altura fija para evitar CLS */}
      {banner.mobile_image_url && (
        <img
          src={optimizeCloudinaryUrl(banner.mobile_image_url, { width: 600, height: 100, quality: 'auto', format: 'auto' })}
          alt={banner.title}
          className="md:hidden w-full object-cover"
          width={600}
          height={100}
          decoding="async"
        />
      )}
    </div>
  );
}
