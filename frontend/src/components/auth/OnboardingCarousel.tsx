/**
 * OnboardingCarousel — Panel derecho de AuthPage.
 * Solo visible en desktop (lg+). Auto-avance cada 5 segundos.
 * Look & feel Rural24: verde brand, tipografía bold.
 */

import { useEffect, useState } from 'react';

interface Slide {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function OnboardingCarousel() {
  const [slides, setSlides]       = useState<Slide[]>([]);
  const [current, setCurrent]     = useState(0);
  const [fading, setFading]       = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/onboarding/slides?device=desktop`)
      .then(r => r.json())
      .then(d => { if (d.slides?.length) setSlides(d.slides); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => advance((current + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [current, slides.length]);

  const advance = (index: number) => {
    if (fading || index === current) return;
    setFading(true);
    setTimeout(() => { setCurrent(index); setFading(false); }, 280);
  };

  const slide = slides[current];

  return (
    <div className="relative w-full h-full bg-brand-700 overflow-hidden select-none">

      {/* Imagen de fondo */}
      {slide?.image_url && (
        <img
          key={slide.id}
          src={slide.image_url}
          alt={slide.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}
        />
      )}

      {/* Overlay degradado — de transparente arriba a oscuro abajo */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

      {/* Logo arriba a la izquierda */}
      <div className="absolute top-8 left-8 z-10">
        <span className="text-white text-xl font-black tracking-tight">
          Rural
          <span className="bg-white text-brand-600 rounded-md px-1.5 py-0.5 ml-0.5 text-base">
            24
          </span>
        </span>
        <p className="text-white/60 text-xs mt-0.5 font-medium">Clasificados Agrarios</p>
      </div>

      {/* Contenido del slide — abajo */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 px-10 pb-10 transition-all duration-280 ${
          fading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        {slide && (
          <>
            <h3 className="text-white text-2xl font-black leading-tight mb-2">
              {slide.title}
            </h3>
            {slide.description && (
              <p className="text-white/75 text-sm leading-relaxed mb-6 max-w-sm">
                {slide.description}
              </p>
            )}
          </>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => advance(i)}
                aria-label={`Slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? 'bg-white w-6 h-1.5'
                    : 'bg-white/40 w-1.5 h-1.5 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fallback sin slides — solo logo centrado */}
      {slides.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-8 text-center">
          <span className="text-white text-4xl font-black mb-2">
            Rural<span className="bg-white text-brand-600 rounded-lg px-2 ml-1">24</span>
          </span>
          <p className="text-white/70 text-base">Clasificados Agrarios de Argentina</p>
        </div>
      )}

    </div>
  );
}
