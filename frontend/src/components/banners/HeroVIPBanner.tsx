import { useState, useEffect } from 'react';
import type { BannerClean } from '@/types';
import { getHeroVIPBanners, incrementBannerImpression, incrementBannerClick } from '@/services/bannersCleanService';

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
      {/* Banner Desktop */}
      {banner.desktop_image_url && (
        <img
          src={banner.desktop_image_url}
          alt={banner.title}
          className="hidden md:block w-full h-auto object-cover"
          style={{ maxHeight: '200px' }}
        />
      )}

      {/* Banner Mobile */}
      {banner.mobile_image_url && (
        <img
          src={banner.mobile_image_url}
          alt={banner.title}
          className="md:hidden w-full h-auto object-cover"
          style={{ maxHeight: '100px' }}
        />
      )}
    </div>
  );
}
