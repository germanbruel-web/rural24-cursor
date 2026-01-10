import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BannerClean } from '@/types';
import { getCategoryCarouselBanners, incrementBannerImpression, incrementBannerClick } from '@/src/services/bannersCleanService';

interface CategoryCarouselProps {
  category: string;  // 'inmuebles' | 'vehiculos' | 'maquinarias' | 'insumos' | 'empleos'
}

export default function CategoryCarousel({ category }: CategoryCarouselProps) {
  const [banners, setBanners] = useState<BannerClean[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const impressionTracked = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadBanners();
  }, [category]);

  // Auto-rotate cada 5 segundos
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // Registrar impresión cuando cambia el banner visible
  useEffect(() => {
    const currentBanner = banners[currentIndex];
    if (currentBanner && !impressionTracked.current.has(currentBanner.id)) {
      incrementBannerImpression(currentBanner.id);
      impressionTracked.current.add(currentBanner.id);
    }
  }, [currentIndex, banners]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await getCategoryCarouselBanners(category);
      setBanners(data);
      setCurrentIndex(0);
      impressionTracked.current.clear();
    } catch (error) {
      console.error('Error cargando banners carousel:', error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handleBannerClick = (banner: BannerClean) => {
    incrementBannerClick(banner.id);
    if (banner.link_url) {
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-gray-200 animate-pulse rounded-lg h-[120px]"></div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full">
      {/* Banner Image */}
      <div 
        onClick={() => handleBannerClick(currentBanner)}
        className={`w-full overflow-hidden rounded-lg ${currentBanner.link_url ? 'cursor-pointer' : ''}`}
      >
        <img
          src={currentBanner.carousel_image_url || ''}
          alt={currentBanner.title}
          className="w-full h-auto object-cover"
          style={{ maxHeight: '120px' }}
        />
      </div>

      {/* Controles de navegación (solo si hay más de 1 banner) */}
      {banners.length > 1 && (
        <>
          {/* Botón Anterior */}
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Botón Siguiente */}
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            aria-label="Banner siguiente"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>

          {/* Indicadores de posición */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white w-4' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Ir al banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Contador de banners */}
      {banners.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {currentIndex + 1} / {banners.length}
        </div>
      )}
    </div>
  );
}
