// BannersVipHero.tsx
// Banner VIP en Hero - Usa el nuevo sistema banners_clean
// Desktop: Banner destacado con imagen 1200x200, cambia en hover de categorías
// Mobile: Imagen 480x100 con carousel si hay múltiples

import { useEffect, useState, useCallback } from 'react';
import { getHeroVIPBanners, incrementBannerImpression, incrementBannerClick } from '../../services/bannersCleanService';
import type { BannerClean } from '../../../types';

interface Props {
  category?: string; // Categoría para filtrar (del hover en desktop)
}

// Mapeo de nombres de categorías del hover a slugs de banners_clean
// SINCRONIZADO con tabla categories en BD (nombres EXACTOS)
const CATEGORY_MAP: Record<string, string> = {
  // Nombres display del frontend → nombres EXACTOS en BD banners_clean.category
  'Maquinarias': 'MAQUINARIAS AGRICOLAS',
  'Maquinarias Agrícolas': 'MAQUINARIAS AGRICOLAS',
  'Ganadería': 'GANADERIA',
  'Insumos Agropecuarios': 'INSUMOS AGROPECUARIOS',
  'Inmuebles Rurales': 'INMUEBLES RURALES',
  'Servicios Rurales': 'SERVICIOS RURALES',
  'Guía del Campo': 'SERVICIOS RURALES', // Fallback legacy
};

export const BannersVipHero: React.FC<Props> = ({ category }) => {
  const [banners, setBanners] = useState<BannerClean[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [impressionsRecorded, setImpressionsRecorded] = useState<Set<string>>(new Set());

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mapear categoría del hover al slug
  const categorySlug = category ? CATEGORY_MAP[category] || category : undefined;

  const loadBanners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHeroVIPBanners(categorySlug);
      
      console.log('📢 BannersVipHero loaded:', { 
        category,
        categorySlug,
        isMobile,
        total: data.length 
      });
      
      setBanners(data);
      setCurrentIndex(0);
    } catch (error) {
      console.error('[BannersVipHero] Error loading banners:', error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, isMobile]);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  // Registrar impresión del banner actual
  useEffect(() => {
    if (banners.length === 0) return;
    
    const currentBanner = banners[currentIndex];
    if (!currentBanner || impressionsRecorded.has(currentBanner.id)) return;

    // Registrar impresión (sin await para no bloquear)
    incrementBannerImpression(currentBanner.id).catch(console.error);
    setImpressionsRecorded(prev => new Set([...prev, currentBanner.id]));
  }, [banners, currentIndex, impressionsRecorded]);

  // Auto-rotate SOLO en mobile
  useEffect(() => {
    if (!isMobile || banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners, isMobile]);

  // Handler de click para registrar métricas
  const handleClick = async (banner: BannerClean) => {
    try {
      await incrementBannerClick(banner.id);
    } catch (error) {
      console.error('[BannersVipHero] Error recording click:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[100px] md:h-[200px] bg-gray-200 animate-pulse rounded-lg" />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];
  const imageUrl = isMobile 
    ? currentBanner.mobile_image_url 
    : currentBanner.desktop_image_url;

  // Si no hay imagen para el dispositivo actual, no mostrar
  if (!imageUrl) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden shadow-lg rounded-lg group">
      {/* Banner Image - dimensiones exactas según diseño */}
      <a
        href={currentBanner.link_url || '#'}
        target={currentBanner.link_url ? '_blank' : '_self'}
        rel="noopener noreferrer"
        className="block w-full"
        onClick={() => handleClick(currentBanner)}
      >
        <img
          src={imageUrl}
          alt={currentBanner.client_name}
          className={`w-full object-cover ${
            isMobile ? 'h-[100px]' : 'h-[200px]'
          }`}
        />
      </a>

      {/* Badge de cliente */}
      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        {currentBanner.client_name}
      </div>

      {/* Indicadores SOLO en mobile con múltiples banners */}
      {isMobile && banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-4' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Ver banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navegación por dots - sin flechas */}
    </div>
  );
};
