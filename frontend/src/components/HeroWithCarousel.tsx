// src/components/HeroWithCarousel.tsx
// Conectado al Hero CMS (site_settings.hero_config) + hero_images carousel
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getActiveHeroImages, type HeroImage } from '../services/heroImagesService';
import { getHeroConfig, buildYouTubeEmbedUrl, extractYouTubeId, onHeroConfigChanged, clearHeroCache, type HeroConfig } from '../services/heroCmsService';

interface HeroWithCarouselProps {
  children: React.ReactNode;
  bannerSlot?: React.ReactNode;
}

export const HeroWithCarousel: React.FC<HeroWithCarouselProps> = ({ children, bannerSlot }) => {
  const [config, setConfig] = useState<HeroConfig | null>(null);
  const [images, setImages] = useState<HeroImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Escuchar cambios desde el CMS panel y refrescar
  useEffect(() => {
    const unsub = onHeroConfigChanged(() => {
      clearHeroCache();
      loadData();
    });
    return unsub;
  }, []);

  const loadData = async () => {
    try {
      const [heroConfig, heroImages] = await Promise.all([
        getHeroConfig(),
        getActiveHeroImages(),
      ]);
      setConfig(heroConfig);
      setImages(heroImages);
    } catch (error) {
      console.error('Error loading hero data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-play carousel
  useEffect(() => {
    if (config?.background_type !== 'carousel' || images.length <= 1) return;

    const currentImage = images[currentIndex];
    const duration = currentImage?.fade_duration || 5000;

    autoPlayRef.current = setTimeout(() => {
      handleNext();
    }, duration);

    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
      }
    };
  }, [currentIndex, images, config?.background_type]);

  const handleNext = () => {
    if (isTransitioning || images.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const handlePrev = () => {
    if (isTransitioning || images.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  // Valores por defecto mientras carga
  const title = config?.title || 'Encontrá lo que necesitás para tu campo';
  const subtitle = config?.subtitle || 'Miles de productos agrícolas, maquinarias y servicios en un solo lugar';
  const overlayOpacity = config?.overlay_opacity ?? 40;
  const overlayColor = config?.overlay_color || '#000000';
  const backgroundType = config?.background_type || 'image';

  // Determinar si hay contenido de fondo real para mostrar
  const hasVideoContent = backgroundType === 'video' && !!config?.video_url;
  const hasImageContent = backgroundType === 'image' && !!config?.image_url;
  const hasCarouselContent = backgroundType === 'carousel' && images.length > 0;
  const hasAnyBackground = hasVideoContent || hasImageContent || hasCarouselContent;

  return (
    <section className="relative bg-white md:bg-black py-6 md:py-28 px-4 overflow-hidden">
      {/* ── FONDO: VIDEO (solo desktop) ──────────────────────────── */}
      {hasVideoContent && (
        <div className="hidden md:block absolute inset-0 w-full h-full overflow-hidden">
          <iframe
            className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            src={buildYouTubeEmbedUrl(config!)}
            title="Rural24 Background Video"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            style={{
              minWidth: '100vw',
              minHeight: '100vh',
              width: 'auto',
              height: 'auto',
            }}
          />
        </div>
      )}

      {/* ── FONDO: IMAGEN ESTÁTICA (solo desktop) ───────────────── */}
      {hasImageContent && (
        <div className="hidden md:block absolute inset-0 w-full h-full">
          <img
            src={config!.image_url}
            alt={config!.image_alt || 'Rural24 Hero'}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* ── FONDO: CAROUSEL DE IMÁGENES (solo desktop) ────────── */}
      {hasCarouselContent && (
        <div className="hidden md:block absolute inset-0 w-full h-full">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="absolute inset-0 w-full h-full transition-opacity duration-700"
              style={{ opacity: index === currentIndex ? 1 : 0 }}
            >
              <img
                src={image.image_url}
                alt={image.alt_text || `Rural24 Hero ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}

          {/* Carousel controls */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (!isTransitioning && index !== currentIndex) {
                        setIsTransitioning(true);
                        setCurrentIndex(index);
                        setTimeout(() => setIsTransitioning(false), 800);
                      }
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === currentIndex ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Ir a imagen ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── FONDO FALLBACK (solo desktop, sin contenido configurado) */}
      {!hasAnyBackground && (
        <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-brand-700 via-emerald-800 to-brand-800" />
      )}

      {/* Overlay para legibilidad (solo desktop) */}
      <div
        className="hidden md:block absolute inset-0 backdrop-blur-[1px]"
        style={{
          backgroundColor: overlayColor,
          opacity: overlayOpacity / 100,
        }}
      />

      {/* Contenido del hero (buscador, texto, etc.) */}
      <div className="relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 md:text-white mb-3 md:drop-shadow-lg">
            {title}
          </h1>
          <p className="hidden md:block text-base md:text-lg text-white/95 font-medium drop-shadow-md">
            {subtitle}
          </p>
        </div>
        {bannerSlot && (
          <div className="mb-6">
            {bannerSlot}
          </div>
        )}
        {children}
      </div>
    </section>
  );
};
