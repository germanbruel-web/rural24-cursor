/**
 * CategoryQuickNav — Mobile only
 * Barra horizontal de 8 categorías debajo del hero/banner.
 * Cada pill hace scroll suave a la sección de esa categoría en FeaturedAdsSection.
 * Las categorías renderizan con id={slug} en FeaturedAdsSection.
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface Category {
  id: string;
  slug: string;
  display_name: string;
  name: string;
}

export const CategoryQuickNav = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, slug, display_name, name')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setCategories(data || []));
  }, []);

  // Intersection observer: resalta la categoría visible
  useEffect(() => {
    if (categories.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSlug(entry.target.id);
            break;
          }
        }
      },
      { threshold: 0.25 }
    );
    categories.forEach((cat) => {
      const el = document.getElementById(cat.slug);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories]);

  if (categories.length === 0) return null;

  const handleClick = (slug: string) => {
    const el = document.getElementById(slug);
    if (!el) return;
    // Offset: header (~64px) + este nav (~48px)
    const top = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveSlug(slug);

    // Centrar el pill activo en el nav
    const pillEl = navRef.current?.querySelector(`[data-slug="${slug}"]`) as HTMLElement;
    if (pillEl && navRef.current) {
      const navWidth = navRef.current.offsetWidth;
      const pillLeft = pillEl.offsetLeft;
      const pillWidth = pillEl.offsetWidth;
      navRef.current.scrollTo({
        left: pillLeft - navWidth / 2 + pillWidth / 2,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav
      className="lg:hidden bg-white border-b border-gray-100"
      aria-label="Ir a categoría"
    >
      <div
        ref={navRef}
        className="flex gap-2 px-3 py-2.5 overflow-x-auto mobile-hide-scrollbar"
      >
        {categories.map((cat) => {
          const isActive = activeSlug === cat.slug;
          return (
            <button
              key={cat.id}
              data-slug={cat.slug}
              onClick={() => handleClick(cat.slug)}
              className={`flex-none text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-brand-50 hover:text-brand-700'
              }`}
            >
              {cat.display_name || cat.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
