/**
 * OnboardingCarousel — Panel izquierdo de AuthPage (desktop lg+).
 * Logo + slogan configurables desde #/onboarding-cms vía site_settings.
 * bg_color e image_fit configurables por slide desde el CMS.
 * Auto-avance cada 5 segundos.
 */

import { useEffect, useState } from 'react';
import { useSiteSetting } from '../../hooks/useSiteSetting';

interface Slide {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  bg_color: string;
  image_fit: 'cover' | 'contain';
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const DEFAULT_BG = '#14532d';

export default function OnboardingCarousel() {
  const [slides, setSlides]   = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [fading, setFading]   = useState(false);

  const logoUrl = useSiteSetting('carousel_logo_url', '');
  const slogan  = useSiteSetting('carousel_slogan', 'Clasificados Agrarios');

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
  const bgColor = slide?.bg_color ?? DEFAULT_BG;
  const isCover = (slide?.image_fit ?? 'cover') === 'cover';

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none transition-colors duration-500"
      style={{ backgroundColor: bgColor }}
    >
      {/* Imagen de fondo */}
      {slide?.image_url && (
        <img
          key={slide.id}
          src={slide.image_url}
          alt={slide.title}
          className={`absolute inset-0 w-full h-full transition-opacity duration-300
            ${isCover ? 'object-cover' : 'object-contain p-8'}
            ${fading ? 'opacity-0' : 'opacity-100'}`}
        />
      )}

      {/* Overlay degradado — más suave en modo contain */}
      <div className={`absolute inset-0 bg-gradient-to-t
        ${isCover
          ? 'from-black/80 via-black/20 to-black/10'
          : 'from-black/60 via-black/10 to-transparent'}`}
      />

      {/* Logo + slogan — arriba izquierda */}
      <div className="absolute top-8 left-8 z-10">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className="h-10 w-auto object-contain drop-shadow-md"
          />
        ) : (
          <span className="text-white text-xl font-black tracking-tight">
            Rural
            <span className="bg-white text-brand-600 rounded-md px-1.5 py-0.5 ml-0.5 text-base">
              24
            </span>
          </span>
        )}
        {slogan && (
          <p className="text-white/60 text-xs mt-1 font-medium">{slogan}</p>
        )}
      </div>

      {/* Contenido del slide — abajo */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 px-8 pb-10 transition-all duration-280 ${
          fading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        {slide && (
          <>
            <h3 className="text-white text-3xl font-black leading-tight mb-3">
              {slide.title}
            </h3>
            {slide.description && (
              <p className="text-white/80 text-base leading-relaxed mb-6 max-w-sm">
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

      {/* Fallback sin slides */}
      {slides.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-8 text-center">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain mb-4 drop-shadow-md" />
          ) : (
            <span className="text-white text-4xl font-black mb-2">
              Rural<span className="bg-white text-brand-600 rounded-lg px-2 ml-1">24</span>
            </span>
          )}
          {slogan && <p className="text-white/70 text-base mt-1">{slogan}</p>}
        </div>
      )}
    </div>
  );
}
