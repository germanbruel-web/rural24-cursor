// src/components/HeroWithCarousel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getActiveHeroImages, type HeroImage } from '../services/heroImagesService';

interface HeroWithCarouselProps {
  children: React.ReactNode;
  bannerSlot?: React.ReactNode;
}

export const HeroWithCarousel: React.FC<HeroWithCarouselProps> = ({ children, bannerSlot }) => {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const data = await getActiveHeroImages();
    setImages(data);
    setIsLoading(false);
  };

  // Auto-play con loop suave
  useEffect(() => {
    if (images.length <= 1) return;

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
  }, [currentIndex, images]);

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

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  // Imagen por defecto si no hay imágenes configuradas
  const defaultImage = '/images/hero/hero.1.jpeg';
  
  // Video de YouTube como background
  const youtubeVideoId = 'mD_EWwLVuNs';

  return (
    <section className="relative bg-black py-28 px-4 overflow-hidden">
      {/* Video Background de YouTube */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <iframe
          className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${youtubeVideoId}&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0`}
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

      {/* Overlay oscuro para legibilidad */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

      {/* Contenido del hero (buscador, texto, etc.) */}
      <div className="relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">
            Encontrá lo que necesitás para tu campo
          </h1>
          <p className="text-base md:text-lg text-white/95 font-medium drop-shadow-md">
            Miles de productos agrícolas, maquinarias y servicios en un solo lugar
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
