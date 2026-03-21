import { useState, useEffect } from 'react';

export function useLightbox(imageCount: number) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft')
        setCurrentImageIndex(prev => (prev === 0 ? imageCount - 1 : prev - 1));
      if (e.key === 'ArrowRight')
        setCurrentImageIndex(prev => (prev === imageCount - 1 ? 0 : prev + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, imageCount]);

  return { currentImageIndex, lightboxOpen, setCurrentImageIndex, setLightboxOpen };
}
