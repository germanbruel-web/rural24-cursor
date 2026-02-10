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

  return (
    <section className="relative bg-gradient-to-br from-[#f0f9f4] to-[#e8f5ed] py-28 px-4 overflow-hidden">
      {/* Contenido del hero (buscador, texto, etc.) */}
      <div className="relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Encontrá lo que necesitás para tu campo
          </h1>
          <p className="text-base md:text-lg text-gray-600 font-medium">
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
