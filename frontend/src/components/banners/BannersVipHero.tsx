// BannersVipHero.tsx
// Banner VIP en Hero — Carrusel automático en Desktop (1100x200) y Mobile (480x100)

import { useEffect, useState, useRef } from 'react';
import { getHeroVIPBanners, incrementBannerImpression, incrementBannerClick } from '../../services/bannersCleanService';
import type { BannerClean } from '../../../types';
import { optimizeCloudinaryUrl } from '../../utils/imageOptimizer';

export const BannersVipHero = () => {
  const [allBanners, setAllBanners] = useState<BannerClean[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const impressionsRecorded = useRef<Set<string>>(new Set());

  // Detectar breakpoint (< 1024px → imagen mobile 480x100)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Carga única de todos los banners activos
  useEffect(() => {
    getHeroVIPBanners(undefined)
      .then(banners => {
        setAllBanners(banners);
        if (banners.length > 1) {
          setCurrentIndex(Math.floor(Math.random() * banners.length));
        }
      })
      .catch(e => console.error('[BannersVipHero]', e))
      .finally(() => setLoading(false));
  }, []);

  // Filtrar según breakpoint y disponibilidad de imagen
  const displayBanners = isMobile
    ? allBanners.filter(b => b.mobile_image_url)
    : allBanners.filter(b => b.desktop_image_url);

  const count = displayBanners.length;
  const safeIndex = count > 0 ? currentIndex % count : 0;

  // Auto-rotate cada 4 segundos
  useEffect(() => {
    if (count <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % count);
    }, 4000);
    return () => clearInterval(interval);
  }, [count]);

  // Registrar impresión del banner visible
  useEffect(() => {
    const banner = displayBanners[safeIndex];
    if (!banner || impressionsRecorded.current.has(banner.id)) return;
    incrementBannerImpression(banner.id).catch(console.error);
    impressionsRecorded.current.add(banner.id);
  }, [safeIndex, count]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = (banner: BannerClean) => {
    incrementBannerClick(banner.id).catch(console.error);
  };

  // Skeleton mientras carga
  if (loading) {
    return (
      <div
        className={`w-full overflow-hidden relative bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse ${
          isMobile ? 'h-[100px]' : 'h-[200px]'
        }`}
      />
    );
  }

  if (count === 0) return null;

  return (
    <div className="w-full">
      {/* Track del carrusel */}
      <div
        className="relative w-full overflow-hidden"
        style={{ paddingBottom: isMobile ? '20.83%' : '18.18%' }}
      >
        <div
          className="absolute inset-0 flex transition-transform duration-500 ease-out will-change-transform"
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {displayBanners.map((banner, idx) => (
            <a
              key={banner.id}
              href={banner.link_url || '#'}
              target={banner.link_url ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="relative w-full h-full flex-shrink-0"
              onClick={() => handleClick(banner)}
              aria-hidden={idx !== safeIndex}
            >
              <img
                src={
                  isMobile
                    ? optimizeCloudinaryUrl(banner.mobile_image_url!, { width: 480, quality: 'auto:good' })
                    : optimizeCloudinaryUrl(banner.desktop_image_url!, { width: 1100, quality: 'auto:good' })
                }
                alt={banner.client_name}
                loading={idx === 0 ? 'eager' : 'lazy'}
                className="absolute inset-0 w-full h-full object-contain object-center"
                style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
              />
            </a>
          ))}
        </div>
      </div>

      {/* Indicadores de posición */}
      {count > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {displayBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`rounded-full transition-all duration-300 ${
                index === safeIndex
                  ? 'bg-brand-600 w-4 h-1.5'
                  : 'bg-gray-300 w-1.5 h-1.5 hover:bg-gray-400'
              }`}
              aria-label={`Ver banner ${index + 1}`}
              aria-current={index === safeIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}
    </div>
  );
};
