/**
 * MobileOnboardingScreen — Solo mobile (< lg).
 * Intro full-screen 9:16 antes del formulario de auth.
 * Se muestra solo 1 vez por browser (localStorage 'rural24_onboarding_seen').
 * Swipe por touch + auto-avance cada 5s.
 * bg_color e image_fit configurables por slide desde el CMS.
 */

import { useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const STORAGE_KEY = 'rural24_onboarding_seen';
const AUTO_ADVANCE_MS = 5000;
const SWIPE_THRESHOLD = 50;
const DEFAULT_BG = '#14532d';

interface Slide {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  bg_color: string;
  image_fit: 'cover' | 'contain';
}

interface MobileOnboardingScreenProps {
  onComplete: (intent: 'login' | 'register') => void;
}

export default function MobileOnboardingScreen({ onComplete }: MobileOnboardingScreenProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/onboarding/slides?device=mobile`)
      .then(r => r.json())
      .then(d => {
        if (d.slides?.length) {
          setSlides(d.slides);
        } else {
          dismiss('register');
        }
        setLoaded(true);
      })
      .catch(() => {
        dismiss('register');
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => advance((current + 1) % slides.length), AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [current, slides.length]);

  const advance = (index: number) => {
    if (fading || index === current) return;
    setFading(true);
    setTimeout(() => { setCurrent(index); setFading(false); }, 280);
  };

  const dismiss = (intent: 'login' | 'register') => {
    localStorage.setItem(STORAGE_KEY, '1');
    onComplete(intent);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta > 0) advance((current + 1) % slides.length);
    else advance((current - 1 + slides.length) % slides.length);
  };

  if (!loaded || slides.length === 0) return null;

  const slide = slides[current];
  const bgColor = slide?.bg_color ?? DEFAULT_BG;
  const isCover = (slide?.image_fit ?? 'cover') === 'cover';

  return (
    <div
      className="fixed inset-0 z-[60] select-none transition-colors duration-500"
      style={{ backgroundColor: bgColor }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Imagen — siempre visible si existe; bg_color llena el resto */}
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

      {/* Overlay degradado */}
      <div className={`absolute inset-0 bg-gradient-to-t
        ${isCover
          ? 'from-black/90 via-black/20 to-black/5'
          : 'from-black/70 via-black/10 to-transparent'}`}
      />

      {/* Logo arriba */}
      <div className="absolute top-10 left-0 right-0 flex justify-center z-10">
        <span className="text-white text-2xl font-black tracking-tight drop-shadow-lg">
          Rural
          <span className="bg-white text-brand-600 rounded-md px-1.5 py-0.5 ml-0.5 text-xl">
            24
          </span>
        </span>
      </div>

      {/* Contenido del slide */}
      <div
        className={`absolute left-0 right-0 bottom-0 z-10 px-7 pb-10 transition-all duration-280 ${
          fading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        {slide && (
          <>
            <h2 className="text-white text-2xl font-black leading-tight mb-2 drop-shadow">
              {slide.title}
            </h2>
            {slide.description && (
              <p className="text-white/75 text-sm leading-relaxed mb-5">
                {slide.description}
              </p>
            )}
          </>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="flex items-center gap-2 mb-6">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => advance(i)}
                aria-label={`Slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? 'bg-white w-6 h-1.5' : 'bg-white/40 w-1.5 h-1.5'
                }`}
              />
            ))}
          </div>
        )}

        {/* CTAs */}
        <button
          onClick={() => dismiss('register')}
          className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-700 text-white font-bold text-base rounded-xl transition-colors mb-3"
        >
          Crear cuenta gratis
        </button>
        <button
          onClick={() => dismiss('login')}
          className="w-full py-2.5 text-white/70 text-sm font-medium"
        >
          Ya tengo cuenta — Iniciar sesión
        </button>
      </div>
    </div>
  );
}
