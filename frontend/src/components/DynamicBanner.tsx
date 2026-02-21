import React from 'react';
import type { Banner } from '../../types';
import { optimizeCloudinaryUrl } from '../utils/imageOptimizer';

interface DynamicBannerProps {
  banner: Banner | null;
  position: 'homepage_search' | 'homepage_carousel' | 'results_intercalated' | 'results_lateral';
  className?: string;
  style?: React.CSSProperties;
}

export const DynamicBanner: React.FC<DynamicBannerProps> = ({ banner, position, className = '', style }) => {
  if (!banner) return null;

  // Dimensiones según el tipo de banner
  const dimensions = {
    homepage_search: 'max-w-[1100px] mx-auto', // 1100x300
    homepage_carousel: 'max-w-[648px]',        // 648x100
    results_intercalated: 'max-w-[648px]',     // 648x100
    results_lateral: 'max-w-full',             // Variable
  };

  const handleClick = () => {
    if (banner.link_url) {
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`${dimensions[position]} ${className} transition-all duration-300 ease-in-out`} style={style}>
      <div 
        className={`relative overflow-hidden rounded-lg shadow-lg ${
          banner.link_url ? 'cursor-pointer hover:shadow-xl' : ''
        } transition-all duration-300 transform hover:scale-[1.02]`}
        onClick={handleClick}
      >
        {/* Imagen del banner */}
        <img
          src={optimizeCloudinaryUrl(banner.image_url, { width: 1200, quality: 'auto:good' })}
          alt={banner.title}
          className="w-full h-auto object-cover"
          loading="lazy"
        />
        
        {/* Overlay sutil en hover si tiene link */}
        {banner.link_url && (
          <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity duration-300" />
        )}
      </div>
    </div>
  );
};

// Componente para banner de posición 1 (Homepage - Buscador Dinámico)
// Desktop: Controlado por hover | Mobile: Carrusel automático
interface HomepageSearchBannerProps {
  banner: Banner | null;
  allBanners?: Banner[];
  isMobile?: boolean;
}

export const HomepageSearchBanner: React.FC<HomepageSearchBannerProps> = ({ 
  banner, 
  allBanners = [], 
  isMobile = false 
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // Carrusel automático solo en mobile
  React.useEffect(() => {
    if (!isMobile || allBanners.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % allBanners.length);
        setIsTransitioning(false);
      }, 300);
    }, 3000); // Cambiar cada 3 segundos

    return () => clearInterval(interval);
  }, [isMobile, allBanners.length]);

  // Mobile: Usar banners del carrusel
  // Desktop: Usar banner seleccionado solo cuando hay hover
  const displayBanner = isMobile && allBanners.length > 0 
    ? allBanners[currentIndex] 
    : banner;

  if (!displayBanner) return null;

  return (
    <div className="relative">
      <DynamicBanner 
        banner={displayBanner} 
        position="homepage_search"
        className={`animate-fade-in ${isTransitioning ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`}
      />
      
      {/* Indicadores de carrusel solo en mobile */}
      {isMobile && allBanners.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {allBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-8 bg-brand-600' 
                  : 'w-2 bg-gray-300'
              }`}
              aria-label={`Ver banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente para banner de posición 2 (Homepage - Carrusel)
export const HomepageCarouselBanner: React.FC<{ banner: Banner | null }> = ({ banner }) => {
  if (!banner) return null;

  return (
    <DynamicBanner 
      banner={banner} 
      position="homepage_carousel"
      className="mb-4"
    />
  );
};

// Componente para banner de posición 3 (Resultados - Intercalado)
export const ResultsIntercalatedBanner: React.FC<{ banner: Banner | null }> = ({ banner }) => {
  if (!banner) return null;

  return (
    <DynamicBanner 
      banner={banner} 
      position="results_intercalated"
      className="my-6"
    />
  );
};

// Componente para banners de posición 4 (Resultados - Lateral)
export const ResultsLateralBanners: React.FC<{ banners: Banner[] }> = ({ banners }) => {
  if (banners.length === 0) return null;

  return (
    <div className="space-y-4 sticky top-20">
      {banners.map((banner, index) => (
        <DynamicBanner 
          key={banner.id || index}
          banner={banner} 
          position="results_lateral"
          className="animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  );
};
