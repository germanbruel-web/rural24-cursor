/**
 * DynamicHomeSections — CMS-A
 * Renderiza las secciones dinámicas de home_sections según su tipo y config.
 * Se monta en HomePage.tsx debajo de HowItWorksSection.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart2, Image as ImageIcon, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { getImageVariant } from '@/utils/imageOptimizer';
import type { Product } from '../../../types';
import { getHomeComposition } from '@/services/v2/homeSectionsService';
import type { HomeSection } from '@/services/v2/homeSectionsService';
import { supabase } from '@/services/supabaseClient';
import { navigateTo } from '@/hooks/useNavigate';
import { ProductCard } from '../organisms/ProductCard';
import { normalizeForComparison } from '@/services/bannersCleanService';

// ---- Tipos ----

interface SectionProps {
  section: HomeSection;
}

interface AdImage { url: string; public_id?: string; }

interface AdItem {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  currency: string;
  price_unit?: string;
  images: (string | AdImage)[];
  category_id: string;
  subcategory_id: string | null;
  province?: string;
  city?: string;
  ad_type?: string;
  attributes?: Record<string, unknown>;
  status: string;
  featured_expires_at?: string;
  categories?: { slug: string } | { slug: string }[] | null;
  subcategories?: { slug: string } | { slug: string }[] | null;
  user_id?: string;
  users?: { avatar_url: string | null } | { avatar_url: string | null }[] | null;
}

type FeaturedRow = { ad_id: string; expires_at?: string };
type SubcatRow   = { id: string };

// Contexto para habilitar countdown de vencimiento de destacados
const CountdownEnabledCtx = React.createContext(false);

// ---- Helpers: display_config → clases CSS ----

const BG_MAP: Record<string, string> = {
  'white':    'bg-white',
  'gray-50':  'bg-gray-50',
  'brand-50': 'bg-brand-50',
  'brand-600':'bg-brand-600',
  'gray-900': 'bg-gray-900',
};
const BORDER_MAP: Record<string, string> = {
  'white':    'border-gray-100',
  'gray-50':  'border-gray-100',
  'brand-50': 'border-brand-100',
  'brand-600':'border-brand-500',
  'gray-900': 'border-gray-800',
};
const TITLE_SIZE_MAP: Record<string, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
};
const TITLE_COLOR_MAP: Record<string, string> = {
  'gray-900':  'text-gray-900',
  'brand-600': 'text-brand-600',
  'white':     'text-white',
};
const SUB_COLOR_MAP: Record<string, string> = {
  'gray-500': 'text-gray-500',
  'gray-300': 'text-gray-300',
  'white':    'text-white',
  'brand-600':'text-brand-600',
};

function dc(section: HomeSection) {
  return (section.display_config ?? {}) as Record<string, unknown>;
}

function sectionBg(section: HomeSection) {
  const bg = dc(section).bg_color as string ?? 'white';
  return BG_MAP[bg] ?? 'bg-white';
}

function sectionBorder(section: HomeSection) {
  const bg = dc(section).bg_color as string ?? 'white';
  return BORDER_MAP[bg] ?? 'border-gray-100';
}

function titleClass(section: HomeSection) {
  const size  = dc(section).title_size as string ?? 'xl';
  const color = dc(section).title_color as string ?? 'gray-900';
  return `font-bold ${TITLE_SIZE_MAP[size] ?? 'text-xl'} ${TITLE_COLOR_MAP[color] ?? 'text-gray-900'}`;
}

function subtitleClass(section: HomeSection) {
  const color = dc(section).subtitle_color as string ?? 'gray-500';
  return `text-sm mt-1 ${SUB_COLOR_MAP[color] ?? 'text-gray-500'}`;
}

/** Construye la URL de búsqueda automática desde query_filter */
function buildAutoUrl(section: HomeSection): string {
  const qf = (section.query_filter ?? {}) as Record<string, unknown>;
  const params: string[] = [];
  if (qf.category_slug)        params.push(`cat=${qf.category_slug}`);
  if (qf.subcategory_slug)     params.push(`sub=${qf.subcategory_slug}`);
  if (qf.sub_subcategory_slug) params.push(`subsub=${qf.sub_subcategory_slug}`);
  return `/search${params.length ? '?' + params.join('&') : ''}`;
}

// ---- Hook compartido: carga de avisos ----

function useAds(section: HomeSection) {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredFallback, setFeaturedFallback] = useState(false);
  const countdownEnabled = React.useContext(CountdownEnabledCtx);

  const limit             = (section.query_filter?.limit as number) ?? 8;
  const categorySlug      = section.query_filter?.category_slug as string | undefined;
  const subcategorySlug   = section.query_filter?.subcategory_slug as string | undefined;
  const subSubSlug        = section.query_filter?.sub_subcategory_slug as string | undefined;
  const featuredOnly      = !!(section.query_filter?.featured_only);

  useEffect(() => {
    const load = async () => {
      try {
        let query = supabase
          .from('ads')
          .select('id, title, slug, price, currency, price_unit, images, category_id, subcategory_id, province, city, ad_type, attributes, status, user_id, users(avatar_url), subcategories(display_name), categories(slug)')
          .eq('status', 'active')
          .limit(limit);

        let resolvedCategoryId: string | undefined;

        if (categorySlug) {
          const { data: cat } = await supabase
            .from('categories').select('id').eq('slug', categorySlug).single();
          if (cat?.id) {
            query = query.eq('category_id', cat.id);
            resolvedCategoryId = cat.id;
          }
        }

        if (subcategorySlug) {
          let subQ = supabase.from('subcategories').select('id').eq('slug', subcategorySlug).is('parent_id', null);
          const { data: subcat } = await subQ.maybeSingle();
          if (subcat?.id) {
            if (subSubSlug) {
              const { data: subsubcat } = await supabase
                .from('subcategories').select('id')
                .eq('slug', subSubSlug).eq('parent_id', subcat.id).maybeSingle();
              if (subsubcat?.id) query = query.eq('subcategory_id', subsubcat.id);
            } else {
              const { data: children } = await supabase
                .from('subcategories').select('id').eq('parent_id', subcat.id);
              const ids = [subcat.id, ...(children ?? []).map((c: SubcatRow) => c.id)];
              query = query.in('subcategory_id', ids);
            }
          }
        }

        if (featuredOnly) {
          if (resolvedCategoryId) {
            const { data: rpcData, error: rpcErr } = await supabase.rpc(
              'get_featured_for_homepage',
              { p_category_id: resolvedCategoryId, p_limit: limit }
            );
            if (!rpcErr && rpcData?.length > 0) {
              // Hay destacados activos → mostrar solo esos
              query = query.in('id', rpcData.map((f: FeaturedRow) => f.ad_id));
            } else if (!rpcErr) {
              // Sin destacados activos → fallback a avisos regulares de la misma categoría
              setFeaturedFallback(true);
              // query ya tiene .eq('category_id', resolvedCategoryId) — continúa sin filtro featured
            } else {
              // RPC falló → fallback directo a featured_ads table
              const { data: fIds } = await supabase
                .from('featured_ads').select('ad_id').eq('status', 'active').eq('placement', 'homepage');
              const ids = (fIds ?? []).map((f: FeaturedRow) => f.ad_id);
              if (ids.length > 0) query = query.in('id', ids);
              else setFeaturedFallback(true); // sin datos, mostrar regulares
            }
          } else {
            // Sin categoría: fallback directo
            const { data: fIds } = await supabase
              .from('featured_ads').select('ad_id').eq('status', 'active').eq('placement', 'homepage');
            const ids = (fIds ?? []).map((f: FeaturedRow) => f.ad_id);
            if (ids.length > 0) query = query.in('id', ids);
            else setFeaturedFallback(true);
          }
        }

        // Filtro de atributo L4: ads.attributes @> { field: value }
        // Solo aplica entradas donde el valor es non-empty (evita filtros parciales guardados)
        const attrFilter = section.query_filter?.attribute_filter as Record<string, string> | undefined;
        if (attrFilter) {
          const validAttr = Object.fromEntries(
            Object.entries(attrFilter).filter(([, v]) => v !== '')
          );
          if (Object.keys(validAttr).length > 0) {
            query = query.contains('attributes', validAttr);
          }
        }

        const { data } = await query.order('created_at', { ascending: false });
        const adsData = (data ?? []) as unknown as AdItem[];

        // Enriquecer con expires_at de featured_ads (solo si countdown habilitado)
        if (countdownEnabled && adsData.length > 0) {
          const adIds = adsData.map(a => a.id);
          const { data: fa } = await supabase
            .from('featured_ads')
            .select('ad_id, expires_at')
            .in('ad_id', adIds)
            .eq('status', 'active');
          const expiresMap: Record<string, string> = {};
          (fa ?? []).forEach((f: FeaturedRow) => { if (f.expires_at) expiresMap[f.ad_id] = f.expires_at; });
          setAds(adsData.map(a => ({ ...a, featured_expires_at: expiresMap[a.id] })));
        } else {
          setAds(adsData);
        }
      } catch (e) {
        console.error('[DynamicHomeSections] Error cargando avisos:', e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [section.id, countdownEnabled]);

  return { ads, loading, featuredFallback };
}

// ---- Sub-componente: header de sección (estética bold) ----

function SectionHeader({ section, rightSlot }: { section: HomeSection; rightSlot?: React.ReactNode }) {
  const subtitle     = dc(section).subtitle as string | undefined;
  const showMore     = !!(dc(section).show_more);
  const showMoreAuto = !!(dc(section).show_more_auto);
  const showMoreUrl  = dc(section).show_more_url as string | undefined;
  const showMoreLabel = (dc(section).show_more_label as string) || 'Ver más';

  const moreUrl = showMore
    ? (showMoreAuto ? buildAutoUrl(section) : (showMoreUrl ?? ''))
    : '';

  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2 className="flex items-center gap-3">
          <span className="w-1 h-7 bg-brand-600 rounded-full shrink-0" aria-hidden="true" />
          <span className="font-black text-2xl text-gray-900 leading-tight">{section.title}</span>
        </h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1 ml-4">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {showMore && moreUrl && (
          <button
            onClick={() => navigateTo(moreUrl)}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            {showMoreLabel}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {rightSlot}
      </div>
    </div>
  );
}

// ---- Sub-etiqueta: AVISOS DESTACADOS / ÚLTIMOS AVISOS ----

function AdsSubLabel({ count, featured = false }: { count: number; featured?: boolean }) {
  return (
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
      <span className="w-1 h-4 bg-brand-600 rounded-full shrink-0" aria-hidden="true" />
      {featured ? 'Avisos Destacados' : 'Últimos Avisos'}
      <span className="text-gray-400 font-normal normal-case tracking-normal">({count})</span>
    </p>
  );
}

// ---- Helper: AdItem → product prop de ProductCard ----

function resolveJoin<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? (val[0] ?? null) : val;
}

function adToProduct(ad: AdItem): Product {
  const firstImage = ad.images?.[0];
  const imageUrl = typeof firstImage === 'string' ? firstImage : ((firstImage as AdImage)?.url ?? '');
  const cats  = resolveJoin(ad.categories);
  const subs  = resolveJoin(ad.subcategories);
  const users = resolveJoin(ad.users);
  return {
    id: ad.id,
    title: ad.title,
    slug: ad.slug,
    description: '',
    price: ad.price ?? undefined,
    currency: ad.currency,
    price_unit: ad.price_unit,
    location: [ad.city, ad.province].filter(Boolean).join(', '),
    province: ad.province,
    imageUrl,
    images: ad.images as Product['images'],
    sourceUrl: '',
    category: '',
    subcategory: subs?.display_name,
    isSponsored: false,
    ad_type: ad.ad_type as Product['ad_type'],
    attributes: ad.attributes,
    featured_expires_at: ad.featured_expires_at,
    category_slug: cats?.slug,
    user_id: ad.user_id,
    user_avatar_url: users?.avatar_url ?? undefined,
  };
}

// ---- Section: Grid de Avisos (featured_grid, ad_list) ----

function AdGridSection({ section }: SectionProps) {
  const { ads, loading, featuredFallback } = useAds(section);
  const featuredOnly = !!(section.query_filter?.featured_only);
  const columns = (dc(section).columns as number) ?? 4;

  const colClass = ({
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  } as Record<number, string>)[columns] ?? 'grid-cols-2 md:grid-cols-4';

  const limit = (section.query_filter?.limit as number) ?? 8;
  const bg    = sectionBg(section);
  const bord  = sectionBorder(section);

  if (loading) {
    return (
      <section className={`py-8 ${bg} border-t ${bord}`}>
        <div className="max-w-[1440px] mx-auto px-2 sm:px-4">
          <div className="h-7 bg-gray-200 rounded animate-pulse w-56 mb-2" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-80 mb-6" />
          <div className={`grid ${colClass} gap-2 sm:gap-3`}>
            {Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (ads.length === 0) return null;

  return (
    <section className={`py-8 ${bg} border-t ${bord}`}>
      <div className="max-w-[1440px] mx-auto px-2 sm:px-4">
        <SectionHeader section={section} />
        <AdsSubLabel count={ads.length} featured={featuredOnly && !featuredFallback} />
        <div className={`grid ${colClass} gap-2 sm:gap-4`}>
          {ads.map(ad => (
            <ProductCard
              key={ad.id}
              product={adToProduct(ad)}
              variant="featured"
              showLocation={!!(ad.city || ad.province)}
              onViewDetail={() => navigateTo(`/ad/${ad.slug || ad.id}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Section: Carrusel horizontal (category_carousel) ----

const CAROUSEL_GAP = 8; // gap-2 = 8px mobile
const CAROUSEL_EASING = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
const CAROUSEL_DURATION = 380; // ms

function CarouselSection({ section }: SectionProps) {
  const { ads, loading, featuredFallback } = useAds(section);
  const featuredOnly = !!(section.query_filter?.featured_only);
  const trackRef   = useRef<HTMLDivElement>(null);
  const wrapRef    = useRef<HTMLDivElement>(null);

  const [index,     setIndex]     = useState(0);
  const [animating, setAnimating] = useState(false);
  const [slideW,    setSlideW]    = useState(0);   // ancho de 1 card + gap en px
  const [visible,   setVisible]   = useState(4);   // cards visibles en pantalla

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const columns = (dc(section).columns as number) ?? 4;
  const limit   = (section.query_filter?.limit as number) ?? 12;
  const bg      = sectionBg(section);
  const bord    = sectionBorder(section);

  // Clases de ancho de card — gap-2 mobile (8px) → resta 4px por col; gap-3 sm (12px) → resta 6px
  const cardWidthClass = ({
    2: 'w-[calc(50%-4px)]',
    3: 'w-[calc(50%-4px)] sm:w-[calc(33.33%-6px)]',
    4: 'w-[calc(50%-4px)] sm:w-[calc(33.33%-6px)] lg:w-[calc(25%-6px)]',
    5: 'w-[calc(50%-4px)] sm:w-[calc(33.33%-6px)] lg:w-[calc(20%-7px)]',
    6: 'w-[calc(50%-4px)] sm:w-[calc(33.33%-6px)] lg:w-[calc(16.66%-7px)]',
  } as Record<number, string>)[columns] ?? 'w-[calc(50%-4px)] sm:w-[calc(25%-6px)]';

  // Medir ancho de card + visible count (re-mide en resize)
  const measure = useCallback(() => {
    const track = trackRef.current;
    const wrap  = wrapRef.current;
    if (!track || !wrap) return;
    const card = track.querySelector<HTMLElement>('[data-card]');
    if (!card) return;
    const w = card.offsetWidth + CAROUSEL_GAP;
    const vis = Math.max(1, Math.round(wrap.clientWidth / w));
    setSlideW(w);
    setVisible(vis);
  }, []);

  useEffect(() => {
    if (ads.length > 0) requestAnimationFrame(measure);
  }, [ads, measure]);

  useEffect(() => {
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const maxIndex = Math.max(0, ads.length - visible);

  const go = useCallback((dir: 1 | -1) => {
    if (animating) return;
    setIndex(i => Math.max(0, Math.min(i + dir, maxIndex)));
    setAnimating(true);
    setTimeout(() => setAnimating(false), CAROUSEL_DURATION + 20);
  }, [animating, maxIndex]);

  // Touch: swipe de 1 card, ignora scroll vertical
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 36 && Math.abs(dx) > dy * 1.5) {
      go(dx > 0 ? 1 : -1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const translateX = slideW > 0 ? -index * slideW : 0;

  // Botón de flecha
  const ArrowBtn = ({ dir }: { dir: 'left' | 'right' }) => {
    const disabled = dir === 'left' ? index === 0 : index >= maxIndex;
    return (
      <button
        onClick={() => go(dir === 'left' ? -1 : 1)}
        disabled={disabled || animating}
        aria-label={dir === 'left' ? 'Anterior' : 'Siguiente'}
        className="
          flex items-center justify-center w-10 h-10 rounded-full
          bg-brand-600 text-white
          shadow-[0_2px_8px_rgba(0,0,0,0.18)]
          hover:bg-brand-700 hover:shadow-[0_4px_12px_rgba(0,0,0,0.22)]
          active:scale-95
          transition-all duration-150
          disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none
        "
      >
        {dir === 'left'
          ? <ChevronLeft  className="w-5 h-5 stroke-[2.5]" />
          : <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        }
      </button>
    );
  };

  if (loading) {
    return (
      <section className={`py-8 ${bg} border-t ${bord}`}>
        <div className="max-w-[1440px] mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between mb-5">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-52" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-72" />
            </div>
            <div className="flex gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            </div>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
              <div key={i} className={`${cardWidthClass} flex-none bg-gray-100 rounded-xl h-52 animate-pulse`} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (ads.length === 0) return null;

  return (
    <section className={`py-8 ${bg} border-t ${bord}`}>
      <div className="max-w-[1440px] mx-auto px-2 sm:px-4">
        <SectionHeader
          section={section}
          rightSlot={
            <div className="flex gap-2">
              <ArrowBtn dir="left"  />
              <ArrowBtn dir="right" />
            </div>
          }
        />
        <AdsSubLabel count={ads.length} featured={featuredOnly && !featuredFallback} />

        {/* Contenedor con overflow hidden — el track se mueve con transform */}
        <div ref={wrapRef} className="overflow-hidden">
          <div
            ref={trackRef}
            className="flex"
            style={{
              gap: `${CAROUSEL_GAP}px`,
              transform: `translateX(${translateX}px)`,
              transition: `transform ${CAROUSEL_DURATION}ms ${CAROUSEL_EASING}`,
              willChange: 'transform',
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {ads.map((ad, idx) => (
              <div
                key={ad.id}
                data-card
                className={`${cardWidthClass} flex-none`}
                style={{
                  animation: `carousel-in 0.4s ${CAROUSEL_EASING} ${Math.min(idx, 5) * 55}ms both`,
                }}
              >
                <ProductCard
                  product={adToProduct(ad)}
                  variant="featured"
                  showLocation={!!(ad.city || ad.province)}
                  onViewDetail={() => navigateTo(`/ad/${ad.slug || ad.id}`)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes carousel-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

// ---- Section: Estadísticas ----

interface PlatformStats {
  ads_count: number;
  users_count: number;
  categories_count: number;
}

function StatsSection({ section }: SectionProps) {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    const load = async () => {
      const [{ count: ads_count }, { count: users_count }, { count: categories_count }] =
        await Promise.all([
          supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('categories').select('id', { count: 'exact', head: true }).eq('is_active', true),
        ]);
      setStats({ ads_count: ads_count ?? 0, users_count: users_count ?? 0, categories_count: categories_count ?? 0 });
    };
    void load();
  }, []);

  const bg   = sectionBg(section);
  const bord = sectionBorder(section);
  const subtitle = dc(section).subtitle as string | undefined;

  const items = [
    { label: 'Avisos publicados',   value: stats?.ads_count },
    { label: 'Usuarios registrados', value: stats?.users_count },
    { label: 'Categorías activas',  value: stats?.categories_count },
  ];

  return (
    <section className={`py-10 ${bg} border-t ${bord}`}>
      <div className="max-w-[1440px] mx-auto px-2 sm:px-4">
        <div className="flex items-start gap-2 mb-6">
          <BarChart2 className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
          <div>
            <h2 className={titleClass(section)}>{section.title}</h2>
            {subtitle && <p className={subtitleClass(section)}>{subtitle}</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          {items.map(item => (
            <div key={item.label} className="text-center">
              <p className={`text-3xl sm:text-4xl font-black tabular-nums ${TITLE_COLOR_MAP[dc(section).title_color as string ?? 'brand-600'] ?? 'text-brand-600'}`}>
                {item.value?.toLocaleString('es-AR') ?? '—'}
              </p>
              <p className={`text-sm mt-1 ${SUB_COLOR_MAP[dc(section).subtitle_color as string ?? 'gray-500'] ?? 'text-gray-600'}`}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Section: Cards CTA (cta_cards) ----

interface CardConfig {
  id: string;
  image_url: string;
  label: string;
  title: string;
  subtitle?: string;
  cta_label: string;
  filters: Record<string, string>;
}

function buildFilterUrl(filters: Record<string, string>): string {
  const params = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
  return `/search${params.length ? '?' + params.join('&') : ''}`;
}

function CtaCard({ card }: { card: CardConfig }) {
  return (
    <button
      type="button"
      onClick={() => navigateTo(buildFilterUrl(card.filters))}
      className="group text-left w-full rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-white"
    >
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        {card.image_url ? (
          <img
            src={getImageVariant(card.image_url, 'card')}
            alt={card.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-4 bg-white">
        {card.label && (
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
            {card.label}
          </p>
        )}
        <p className="font-bold text-gray-900 text-base leading-snug">{card.title}</p>
        {card.subtitle && (
          <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
        )}
        <div className="flex items-center gap-1.5 mt-3 text-sm font-medium text-brand-600 group-hover:gap-3 transition-all duration-200">
          <span>{card.cta_label || 'Ver todos'}</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
}

function CtaCardsSection({ section }: SectionProps) {
  const cards = ((dc(section).cards as CardConfig[]) ?? []).filter(c => c.title);
  const columns = (dc(section).columns as number) ?? 3;

  if (cards.length === 0) return null;

  const colClass = ({
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  } as Record<number, string>)[columns] ?? 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className={`py-8 ${sectionBg(section)} border-t ${sectionBorder(section)}`}>
      <div className="max-w-[1440px] mx-auto px-2 sm:px-4">
        <SectionHeader section={section} />
        <div className={`grid grid-cols-1 ${colClass} gap-4`}>
          {cards.map(card => <CtaCard key={card.id} card={card} />)}
        </div>
      </div>
    </section>
  );
}

// ---- Section: Categoría completa con índice taxonómico (category_section) ----

interface TaxLinkItem {
  slug: string;
  label: string;
  count: number;
  level: 2 | 3;
  parentSlug?: string; // solo en L3
}

const BANNER_DIMS: Record<string, { dw: number; dh: number; mw: number; mh: number }> = {
  hero_vip:             { dw: 1100, dh: 200, mw: 480, mh: 100 },
  category_carousel:    { dw: 650,  dh: 100, mw: 650, mh: 100 },
  results_intercalated: { dw: 650,  dh: 100, mw: 650, mh: 100 },
  results_below_filter: { dw: 280,  dh: 250, mw: 280, mh: 250 },
};

function CategorySectionRenderer({ section }: SectionProps) {
  const [featuredAds, setFeaturedAds] = useState<AdItem[]>([]);
  const [taxLinks, setTaxLinks] = useState<TaxLinkItem[]>([]);
  const [banners, setBanners] = useState<Record<string, any>[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const countdownEnabled = React.useContext(CountdownEnabledCtx);

  const categorySlug    = section.query_filter?.category_slug as string | undefined;
  const bannerPlacement = section.query_filter?.banner_placement as string | undefined;
  const featuredLimit   = (section.query_filter?.limit as number) ?? 10;
  const featuredOnly    = !!(section.query_filter?.featured_only);
  const columns         = (dc(section).columns as number) ?? 5;
  const showTaxIndex    = !!(dc(section).show_taxonomy_index);
  const showOnlyWithAds = !!(dc(section).show_only_with_ads);

  // Fetch banner activo para esta sección
  useEffect(() => {
    if (!bannerPlacement) return;
    supabase
      .from('banners_clean')
      .select('desktop_image_url, mobile_image_url, carousel_image_url, link_url, link_target, client_name, category')
      .eq('placement', bannerPlacement)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data?.length) return;
        const normalizedCat = categorySlug ? normalizeForComparison(categorySlug) : null;
        const matches = data.filter(b => {
          if (b.category === 'all') return true;
          if (!normalizedCat) return false;
          return normalizeForComparison(b.category) === normalizedCat;
        });
        if (matches.length) { setBanners(matches); setBannerIdx(0); }
      });
  }, [bannerPlacement, categorySlug]);

  // Autoplay carrusel de banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (!categorySlug) { setLoading(false); return; }

    const load = async () => {
      try {
        // 1. Resolver categoría
        const { data: cat } = await supabase
          .from('categories').select('id').eq('slug', categorySlug).single();
        if (!cat?.id) { setLoading(false); return; }

        // 2. Avisos destacados
        let adsQuery = supabase
          .from('ads')
          .select('id, title, slug, price, currency, price_unit, images, category_id, subcategory_id, province, city, ad_type, attributes, status, user_id, users(avatar_url), subcategories(display_name), categories(slug)')
          .eq('status', 'active')
          .eq('category_id', cat.id)
          .limit(featuredLimit);

        if (featuredOnly) {
          const { data: rpcData, error: rpcErr } = await supabase.rpc(
            'get_featured_for_homepage',
            { p_category_id: cat.id, p_limit: featuredLimit }
          );
          if (!rpcErr && rpcData?.length > 0) {
            // Hay destacados activos → filtrar solo esos
            adsQuery = adsQuery.in('id', rpcData.map((f: FeaturedRow) => f.ad_id));
          } else if (!rpcErr) {
            // Sin destacados activos → fallback a avisos regulares de la misma categoría
            // adsQuery ya tiene .eq('category_id', cat.id) — continúa sin filtro featured
          } else {
            // RPC falló → fallback directo a featured_ads table
            const { data: fIds } = await supabase
              .from('featured_ads').select('ad_id').eq('status', 'active').eq('placement', 'homepage');
            const ids = (fIds ?? []).map((f: FeaturedRow) => f.ad_id);
            if (ids.length > 0) adsQuery = adsQuery.in('id', ids);
            // Si tampoco hay en fallback → continúa sin filtro (muestra regulares)
          }
        }

        const { data: adsRaw } = await adsQuery.order('created_at', { ascending: false });
        const adsArr = (adsRaw ?? []) as unknown as AdItem[];

        // Enriquecer con expires_at si countdown habilitado
        if (countdownEnabled && adsArr.length > 0) {
          const adIds = adsArr.map(a => a.id);
          const { data: fa } = await supabase
            .from('featured_ads')
            .select('ad_id, expires_at')
            .in('ad_id', adIds)
            .eq('status', 'active');
          const expiresMap: Record<string, string> = {};
          (fa ?? []).forEach((f: FeaturedRow) => { if (f.expires_at) expiresMap[f.ad_id] = f.expires_at; });
          setFeaturedAds(adsArr.map(a => ({ ...a, featured_expires_at: expiresMap[a.id] })));
        } else {
          setFeaturedAds(adsArr);
        }

        // 3. Índice taxonómico
        if (showTaxIndex) {
          // L2 subcategorías
          const { data: l2s } = await supabase
            .from('subcategories')
            .select('id, slug, display_name')
            .eq('category_id', cat.id)
            .is('parent_id', null)
            .eq('is_active', true)
            .order('sort_order');

          if (l2s?.length) {
            const l2Ids = l2s.map((s) => s.id);

            // L3 subcategorías
            const { data: l3s } = await supabase
              .from('subcategories')
              .select('id, slug, display_name, parent_id')
              .in('parent_id', l2Ids)
              .eq('is_active', true)
              .order('sort_order');

            // Conteo de avisos activos agrupado por subcategory_id
            const { data: adSubs } = await supabase
              .from('ads')
              .select('subcategory_id')
              .eq('status', 'active')
              .eq('category_id', cat.id);

            const countMap = new Map<string, number>();
            for (const a of (adSubs ?? [])) {
              if (a.subcategory_id) {
                countMap.set(a.subcategory_id, (countMap.get(a.subcategory_id) ?? 0) + 1);
              }
            }

            // Construir lista plana: L2s con sus L3s intercalados
            const links: TaxLinkItem[] = [];
            for (const l2 of l2s) {
              const l3sOfL2 = (l3s ?? []).filter((l) => l.parent_id === l2.id);

              if (l3sOfL2.length > 0) {
                // L2 con hijos: entrada "todos" que incluye avisos directos en L2 + todos sus L3s
                const l2DirectCount = countMap.get(l2.id) ?? 0;
                const l3Total = l3sOfL2.reduce((sum: number, l3) => sum + (countMap.get(l3.id) ?? 0), 0);
                links.push({
                  slug: l2.slug,
                  label: l2.display_name,
                  count: l2DirectCount + l3Total,
                  level: 2,
                });
                // L3 hijos debajo
                for (const l3 of l3sOfL2) {
                  links.push({
                    slug: l3.slug,
                    label: l3.display_name,
                    count: countMap.get(l3.id) ?? 0,
                    level: 3,
                    parentSlug: l2.slug,
                  });
                }
              } else {
                // L2 sin hijos — mostrar directamente
                links.push({
                  slug: l2.slug,
                  label: l2.display_name,
                  count: countMap.get(l2.id) ?? 0,
                  level: 2,
                });
              }
            }

            setTaxLinks(links);
          }
        }
      } catch (e) {
        console.error('[CategorySection] Error:', e);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [section.id, countdownEnabled]);

  const colClass = ({
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  } as Record<number, string>)[columns] ?? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';

  const bg   = sectionBg(section);
  const bord = sectionBorder(section);
  const catSlug = categorySlug ?? '';

  const visibleLinks = showOnlyWithAds
    ? taxLinks.filter(l => l.count > 0)
    : taxLinks;

  function buildTaxUrl(link: TaxLinkItem): string {
    if (link.level === 3 && link.parentSlug) {
      return `/search?cat=${catSlug}&sub=${link.parentSlug}&subsub=${link.slug}`;
    }
    return `/search?cat=${catSlug}&sub=${link.slug}`;
  }

  if (loading) {
    return (
      <section className={`py-8 ${bg} border-t ${bord}`}>
        <div className="max-w-[1440px] mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="h-7 bg-gray-200 rounded animate-pulse w-56" />
            <div className="hidden md:block h-14 bg-gray-100 rounded-lg animate-pulse w-72" />
          </div>
          <div className={`grid ${colClass} gap-2 sm:gap-3`}>
            {Array.from({ length: Math.min(featuredLimit, 10) }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (featuredAds.length === 0 && visibleLinks.length === 0) return null;

  return (
    <section className={`py-8 ${bg} border-t ${bord}`}>
      <div className="max-w-[1440px] mx-auto px-2 sm:px-4">

        {/* Header: título + banner (real o sin nada si no hay) */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="flex items-center gap-3 shrink-0">
            <span className="w-1 h-7 bg-brand-600 rounded-full shrink-0" aria-hidden="true" />
            <span className="font-black text-2xl text-gray-900 leading-tight">{section.title}</span>
          </h2>
          {banners.length > 0 && (() => {
            const dims = BANNER_DIMS[bannerPlacement ?? ''];
            const b = banners[bannerIdx];
            const src = b.desktop_image_url || b.carousel_image_url || b.mobile_image_url;
            const bullets = banners.length > 1 && (
              <div className="flex gap-1 mt-[3px] justify-center">
                {banners.map((_, i) => (
                  <button key={i} onClick={() => setBannerIdx(i)} aria-label={`Banner ${i + 1}`}
                    className={`h-[3px] rounded-full transition-all duration-300 ${i === bannerIdx ? 'bg-brand-600 w-6' : 'bg-gray-300 w-4'}`}
                  />
                ))}
              </div>
            );
            const imgStyle = dims ? { aspectRatio: `${dims.dw}/${dims.dh}` } : undefined;
            const containerStyle = dims ? { maxWidth: `${dims.dw}px` } : { maxWidth: '680px' };
            const img = <img src={src} alt={b.client_name || section.title} className="w-full object-cover rounded-lg" style={imgStyle} loading="lazy" />;
            return (
              <div className="hidden md:block flex-1" style={containerStyle}>
                <div>
                  {b.link_url
                    ? <a href={b.link_url} target={b.link_target || '_blank'} rel="noopener noreferrer" className="block">{img}</a>
                    : img}
                  {bullets}
                </div>
              </div>
            );
          })()}
        </div>
        {/* Banner mobile — debajo del título */}
        {banners.length > 0 && (() => {
          const dims = BANNER_DIMS[bannerPlacement ?? ''];
          const b = banners[bannerIdx];
          const src = b.mobile_image_url || b.carousel_image_url || b.desktop_image_url;
          const bullets = banners.length > 1 && (
            <div className="flex gap-1 mt-[3px] justify-center">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)} aria-label={`Banner ${i + 1}`}
                  className={`h-[3px] rounded-full transition-all duration-300 ${i === bannerIdx ? 'bg-brand-600 w-6' : 'bg-gray-300 w-4'}`}
                />
              ))}
            </div>
          );
          const imgStyle = dims ? { aspectRatio: `${dims.mw}/${dims.mh}` } : undefined;
          const img = <img src={src} alt={b.client_name || ''} className="w-full object-cover rounded-lg" style={imgStyle} loading="lazy" />;
          return (
            <div className="md:hidden mb-3">
              {b.link_url
                ? <a href={b.link_url} target={b.link_target || '_blank'} rel="noopener noreferrer">{img}</a>
                : img}
              {bullets}
            </div>
          );
        })()}

        {/* Avisos */}
        {featuredAds.length > 0 && (
          <>
            <AdsSubLabel count={featuredAds.length} featured={featuredOnly} />
            <div className={`grid ${colClass} gap-2 sm:gap-4 mb-5`}>
              {featuredAds.map(ad => (
                <ProductCard
                  key={ad.id}
                  product={adToProduct(ad)}
                  variant="featured"
                  showLocation={!!(ad.city || ad.province)}
                  onViewDetail={() => navigateTo(`/ad/${ad.slug || ad.id}`)}
                />
              ))}
            </div>
          </>
        )}

        {/* Índice taxonómico */}
        {visibleLinks.length > 0 && (
          <div className="flex flex-wrap gap-y-1 text-sm text-gray-600 border-t border-gray-100 pt-4">
            {visibleLinks.map((link, i) => (
              <span key={`${link.slug}-${i}`} className="flex items-center">
                {i > 0 && <span className="text-gray-300 mx-1.5">·</span>}
                {link.count > 0 ? (
                  <button
                    type="button"
                    onClick={() => navigateTo(buildTaxUrl(link))}
                    className="hover:text-brand-600 hover:underline transition-colors"
                  >
                    {link.label}
                    <span className="text-gray-400 ml-0.5">({link.count})</span>
                  </button>
                ) : (
                  <span className="text-gray-400">
                    {link.label}<span className="ml-0.5">(0)</span>
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ---- Section: Banner (conectado a banners_clean) ----

function BannerSection({ section }: SectionProps) {
  const [banners, setBanners] = useState<Record<string, any>[]>([]);
  const [idx, setIdx]         = useState(0);
  const [loaded, setLoaded]   = useState(false);

  const placement = (section.query_filter?.banner_placement as string) ?? '';
  const bg   = sectionBg(section);
  const bord = sectionBorder(section);

  useEffect(() => {
    if (!placement) { setLoaded(true); return; }
    supabase
      .from('banners_clean')
      .select('*')
      .eq('placement', placement)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBanners(data ?? []);
        setLoaded(true);
      });
  }, [placement]);

  // Autoplay
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % banners.length), 4000);
    return () => clearInterval(t);
  }, [banners.length]);

  // Sin placement configurado → placeholder para admin
  if (!placement) {
    return (
      <section className={`py-4 ${bg} border-t ${bord}`}>
        <div className="max-w-[1440px] mx-auto px-2 sm:px-4">
          <div className="rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center py-8 gap-2 text-gray-400">
            <ImageIcon className="w-5 h-5" />
            <span className="text-sm">{section.title} — configurar placement en Constructor de Homepage</span>
          </div>
        </div>
      </section>
    );
  }

  if (!loaded || banners.length === 0) return null;

  const b = banners[idx];
  const dims = BANNER_DIMS[placement];
  const desktopSrc = (b.desktop_image_url || b.carousel_image_url || b.mobile_image_url) as string | undefined;
  const mobileSrc  = (b.mobile_image_url  || b.carousel_image_url || b.desktop_image_url) as string | undefined;
  if (!desktopSrc && !mobileSrc) return null;

  const imgStyleD = dims ? { aspectRatio: `${dims.dw}/${dims.dh}`, maxWidth: `${dims.dw}px` } : undefined;
  const imgStyleM = dims ? { aspectRatio: `${dims.mw}/${dims.mh}` } : undefined;

  const Bullets = () => banners.length > 1 ? (
    <div className="flex gap-1 mt-[3px] justify-center">
      {banners.map((_, i) => (
        <button key={i} onClick={() => setIdx(i)} aria-label={`Banner ${i + 1}`}
          className={`h-[3px] rounded-full transition-all duration-300 ${i === idx ? 'bg-brand-600 w-6' : 'bg-gray-300 w-4'}`}
        />
      ))}
    </div>
  ) : null;

  const ImgDesktop = desktopSrc ? (
    <img src={desktopSrc} alt={b.client_name || section.title}
      className="w-full object-cover rounded-xl hidden sm:block" style={imgStyleD} loading="lazy" />
  ) : null;
  const ImgMobile = mobileSrc ? (
    <img src={mobileSrc} alt={b.client_name || section.title}
      className="w-full object-cover rounded-xl sm:hidden" style={imgStyleM} loading="lazy" />
  ) : null;

  const linkUrl    = b.link_url as string | undefined;
  const linkTarget = (b.link_target as string) || '_blank';

  return (
    <section className={`py-4 ${bg} border-t ${bord}`}>
      <div className="max-w-[1440px] mx-auto px-2 sm:px-4">
        <div className="mx-auto" style={dims ? { maxWidth: `${dims.dw}px` } : undefined}>
          {linkUrl ? (
            <a href={linkUrl} target={linkTarget} rel="noopener noreferrer" className="block">
              {ImgDesktop}{ImgMobile}
            </a>
          ) : (
            <div>{ImgDesktop}{ImgMobile}</div>
          )}
          <Bullets />
        </div>
      </div>
    </section>
  );
}

// ---- Dispatcher ----

function SectionRenderer({ section }: SectionProps) {
  switch (section.type) {
    case 'featured_grid':
    case 'ad_list':
      return <AdGridSection section={section} />;
    case 'category_carousel':
      return <CarouselSection section={section} />;
    case 'stats':
      return <StatsSection section={section} />;
    case 'banner':
      return <BannerSection section={section} />;
    case 'cta_cards':
      return <CtaCardsSection section={section} />;
    case 'category_section':
      return <CategorySectionRenderer section={section} />;
    default:
      return null;
  }
}

// ---- Error boundary para secciones individuales ----

class SectionErrorBoundary extends React.Component<
  { children: React.ReactNode; sectionId: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; sectionId: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error(`[DynamicHomeSections] Sección ${this.props.sectionId} falló:`, error);
  }
  render() {
    if (this.state.hasError) return null; // sección en error → invisible, no rompe las demás
    return this.props.children;
  }
}

// ---- Skeleton de carga ----

function HomeSectionsSkeleton() {
  return (
    <section className="py-8 bg-white border-t border-gray-100">
      <div className="max-w-[1440px] mx-auto px-2 sm:px-4">
        <div className="h-7 bg-gray-200 rounded animate-pulse w-48 mb-2" />
        <div className="h-3 bg-gray-100 rounded animate-pulse w-24 mb-5" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-gray-100">
              <div className="aspect-[16/9] bg-gray-200 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-2.5 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-2.5 bg-gray-200 rounded animate-pulse" />
                <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Componente principal ----

export function DynamicHomeSections() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdownEnabled, setCountdownEnabled] = useState(true); // default ON; setting solo puede desactivarlo

  useEffect(() => {
    getHomeComposition()
      .then(setSections)
      .catch(e => console.error('[DynamicHomeSections] Error:', e))
      .finally(() => setLoading(false));

    // Cargar setting de countdown desde global_settings
    supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'card_countdown_enabled')
      .single()
      .then(({ data }) => {
        if (data) setCountdownEnabled(data.value !== false && data.value !== 'false');
      });
  }, []);

  if (loading) return <HomeSectionsSkeleton />;
  if (sections.length === 0) return null;

  return (
    <CountdownEnabledCtx.Provider value={countdownEnabled}>
      {sections.map(section => (
        <SectionErrorBoundary key={section.id} sectionId={section.id}>
          <SectionRenderer section={section} />
        </SectionErrorBoundary>
      ))}
    </CountdownEnabledCtx.Provider>
  );
}
