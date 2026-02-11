// BannersVipHero.tsx
// Banner VIP en Hero - Usa el nuevo sistema banners_clean
// Desktop: Banner 1200x200, cambia en hover de categorías, muestra 1 random al cargar
// Mobile: Carrusel automático 648x100 con TODOS los banners activos

import { useEffect, useState, useRef } from 'react';
import { getHeroVIPBanners, incrementBannerImpression, incrementBannerClick } from '../../services/bannersCleanService';
import type { BannerClean } from '../../../types';
import { optimizeCloudinaryUrl } from '../../utils/imageOptimizer';

interface Props {
  category?: string; // Categoría para filtrar (solo aplica en desktop)
}

// Mapeo de nombres de categorías del hover a slugs de banners_clean
const CATEGORY_MAP: Record<string, string> = {
  'Maquinarias': 'MAQUINARIAS AGRICOLAS',
  'Maquinarias Agrícolas': 'MAQUINARIAS AGRICOLAS',
  'Ganadería': 'GANADERIA',
  'Insumos Agropecuarios': 'INSUMOS AGROPECUARIOS',
  'Inmuebles Rurales': 'INMUEBLES RURALES',
  'Servicios Rurales': 'SERVICIOS RURALES',
  'Guía del Campo': 'SERVICIOS RURALES',
};

export const BannersVipHero: React.FC<Props> = ({ category }) => {
  // Estado compartido
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Estado para DESKTOP: un solo banner a la vez
  const [desktopBanner, setDesktopBanner] = useState<BannerClean | null>(null);
  
  // Estado para MOBILE: todos los banners para carrusel
  const [mobileBanners, setMobileBanners] = useState<BannerClean[]>([]);
  const [mobileIndex, setMobileIndex] = useState(0);
  
  const impressionsRecorded = useRef<Set<string>>(new Set());
  const hasLoadedInitial = useRef(false);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mapear categoría del hover al slug
  const categorySlug = category ? CATEGORY_MAP[category] || category : undefined;

  // Carga inicial: obtener TODOS los banners
  useEffect(() => {
    if (hasLoadedInitial.current) return;
    
    const loadInitialBanners = async () => {
      setLoading(true);
      try {
        const allBanners = await getHeroVIPBanners(undefined);
        
        if (allBanners.length > 0) {
          // DESKTOP: seleccionar uno aleatorio
          const randomIndex = Math.floor(Math.random() * allBanners.length);
          setDesktopBanner(allBanners[randomIndex]);
          
          // MOBILE: filtrar los que tienen imagen mobile y guardar todos
          const bannersWithMobile = allBanners.filter(b => b.mobile_image_url);
          setMobileBanners(bannersWithMobile);
          
          hasLoadedInitial.current = true;
          console.log('🎲 Banner desktop inicial:', allBanners[randomIndex].client_name);
          console.log('📱 Banners mobile disponibles:', bannersWithMobile.length);
        }
      } catch (error) {
        console.error('[BannersVipHero] Error loading banners:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialBanners();
  }, []);

  // DESKTOP: Cuando cambia la categoría (hover), cargar banner específico
  useEffect(() => {
    if (!category || isMobile) return;
    
    const loadCategoryBanner = async () => {
      try {
        const banners = await getHeroVIPBanners(categorySlug);
        
        if (banners.length > 0) {
          const randomIndex = Math.floor(Math.random() * banners.length);
          setDesktopBanner(banners[randomIndex]);
          console.log('📢 Banner por categoría:', banners[randomIndex].client_name);
        }
      } catch (error) {
        console.error('[BannersVipHero] Error loading category banner:', error);
      }
    };

    loadCategoryBanner();
  }, [category, categorySlug, isMobile]);

  // MOBILE: Auto-rotate carrusel cada 4 segundos
  useEffect(() => {
    if (!isMobile || mobileBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      setMobileIndex(prev => (prev + 1) % mobileBanners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isMobile, mobileBanners.length]);

  // Registrar impresión del banner actual
  useEffect(() => {
    const currentBanner = isMobile ? mobileBanners[mobileIndex] : desktopBanner;
    if (!currentBanner) return;
    if (impressionsRecorded.current.has(currentBanner.id)) return;

    incrementBannerImpression(currentBanner.id).catch(console.error);
    impressionsRecorded.current.add(currentBanner.id);
  }, [isMobile, mobileIndex, mobileBanners, desktopBanner]);

  // Handler de click para registrar métricas
  const handleClick = async (banner: BannerClean) => {
    try {
      await incrementBannerClick(banner.id);
    } catch (error) {
      console.error('[BannersVipHero] Error recording click:', error);
    }
  };

  // Skeleton animado mientras carga
  if (loading) {
    return (
      <div className={`w-full rounded-lg overflow-hidden relative bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse ${isMobile ? 'h-[100px]' : 'h-[200px]'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skeleton-shimmer" />
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .skeleton-shimmer {
            animation: shimmer 1.5s infinite;
          }
        `}</style>
      </div>
    );
  }

  // ====================================
  // RENDER MOBILE: Carrusel automático
  // ====================================
  if (isMobile) {
    if (mobileBanners.length === 0) return null;
    
    const currentBanner = mobileBanners[mobileIndex];
    if (!currentBanner?.mobile_image_url) return null;

    return (
      <div className="w-full">
        {/* Contenedor de imagen con bordes redondeados */}
        <div className="relative w-full overflow-hidden rounded shadow-lg bg-gray-100">
          {/* Contenedor del carrusel con aspect ratio fijo */}
          <div 
            className="relative w-full"
            style={{ paddingBottom: '22%' }} // Aspect ratio aumentado para mayor altura visual
          >
            {/* Track del carrusel */}
            <div 
              className="absolute inset-0 flex transition-transform duration-500 ease-out will-change-transform"
              style={{ transform: `translateX(-${mobileIndex * 100}%)` }}
            >
              {mobileBanners.map((banner, idx) => (
                <a
                  key={banner.id}
                  href={banner.link_url || '#'}
                  target={banner.link_url ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="relative w-full h-full flex-shrink-0"
                  onClick={() => handleClick(banner)}
                  aria-hidden={idx !== mobileIndex}
                >
                  <img
                    src={optimizeCloudinaryUrl(banner.mobile_image_url!, { width: 650, quality: 'auto:good' })}
                    alt={banner.client_name}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    style={{ 
                      imageRendering: 'auto',
                      WebkitBackfaceVisibility: 'hidden',
                      backfaceVisibility: 'hidden'
                    }}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Indicadores FUERA de la imagen */}
        {mobileBanners.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {mobileBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setMobileIndex(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === mobileIndex 
                    ? 'bg-[#16a135] w-4 h-1.5' 
                    : 'bg-gray-300 w-1.5 h-1.5 hover:bg-gray-400'
                }`}
                aria-label={`Ver banner ${index + 1}`}
                aria-current={index === mobileIndex ? 'true' : 'false'}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ====================================
  // RENDER DESKTOP: Un banner a la vez
  // ====================================
  if (!desktopBanner?.desktop_image_url) return null;

  return (
    <div className="relative w-full overflow-hidden shadow-lg rounded-lg group">
      <a
        href={desktopBanner.link_url || '#'}
        target={desktopBanner.link_url ? '_blank' : '_self'}
        rel="noopener noreferrer"
        className="block w-full"
        onClick={() => handleClick(desktopBanner)}
      >
        <img
          src={optimizeCloudinaryUrl(desktopBanner.desktop_image_url, { width: 1200, quality: 'auto:good' })}
          alt={desktopBanner.client_name}
          className="w-full h-[200px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </a>
    </div>
  );
};
