/**
 * DynamicHomeSections — CMS-A
 * Renderiza las secciones dinámicas de home_sections según su tipo y config.
 * Se monta en HomePage.tsx debajo de HowItWorksSection.
 */

import { useState, useEffect } from 'react';
import { BarChart2, Image as ImageIcon } from 'lucide-react';
import { getHomeComposition } from '@/services/v2/homeSectionsService';
import type { HomeSection } from '@/services/v2/homeSectionsService';
import { supabase } from '@/services/supabaseClient';
import { navigateTo } from '@/hooks/useNavigate';
import { ProductCard } from '../organisms/ProductCard';

// ---- Tipos de sección ----

interface SectionProps {
  section: HomeSection;
}

// ---- Section: Featured Grid / Ad List ----

interface AdItem {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  currency: string;
  images: string[];
  category_id: string;
  subcategory_id: string | null;
  location?: string;
  status: string;
}

function AdGridSection({ section }: SectionProps) {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);

  const columns = (section.display_config?.columns as number) ?? 4;
  const limit = (section.query_filter?.limit as number) ?? 8;
  const categorySlug = section.query_filter?.category_slug as string | undefined;
  const featuredOnly = !!(section.query_filter?.featured_only);

  useEffect(() => {
    const fetch = async () => {
      try {
        let query = supabase
          .from('ads')
          .select('id, title, slug, price, currency, images, category_id, subcategory_id, status')
          .eq('status', 'active')
          .limit(limit);

        if (categorySlug) {
          // Resolver category_id desde el slug
          const { data: cat } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categorySlug)
            .single();
          if (cat?.id) query = query.eq('category_id', cat.id);
        }

        if (featuredOnly) {
          // Filtrar por avisos con featured_ads activo
          const { data: featuredIds } = await supabase
            .from('featured_ads')
            .select('ad_id')
            .eq('status', 'active');
          const ids = (featuredIds ?? []).map((f: any) => f.ad_id);
          if (ids.length > 0) query = query.in('id', ids);
          else { setAds([]); setLoading(false); return; }
        }

        const { data } = await query.order('created_at', { ascending: false });
        setAds((data ?? []) as AdItem[]);
      } catch (e) {
        console.error('[DynamicHomeSections] Error cargando avisos:', e);
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, [section.id]);

  if (loading) {
    return (
      <section className="py-8 bg-white">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-6" />
          <div className={`grid grid-cols-2 md:grid-cols-${Math.min(columns, 4)} gap-3`}>
            {Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (ads.length === 0) return null;

  const colClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }[columns] ?? 'grid-cols-2 md:grid-cols-4';

  return (
    <section className="py-8 bg-white border-t border-gray-100">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4">
        <h2 className="text-xl font-bold text-gray-900 mb-5">{section.title}</h2>
        <div className={`grid ${colClass} gap-3 sm:gap-4`}>
          {ads.map(ad => (
            <ProductCard
              key={ad.id}
              product={{
                ...ad,
                category: '',
                location: '',
                imageUrl: ad.images?.[0] || '',
                sourceUrl: '',
                isSponsored: false,
              }}
              variant="featured"
              showLocation={false}
              onViewDetail={() => navigateTo(`/ad/${ad.slug || ad.id}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Section: Stats ----

interface PlatformStats {
  ads_count: number;
  users_count: number;
  categories_count: number;
}

function StatsSection({ section }: SectionProps) {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const [{ count: ads_count }, { count: users_count }, { count: categories_count }] =
        await Promise.all([
          supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('categories').select('id', { count: 'exact', head: true }).eq('is_active', true),
        ]);
      setStats({
        ads_count: ads_count ?? 0,
        users_count: users_count ?? 0,
        categories_count: categories_count ?? 0,
      });
    };
    void fetch();
  }, []);

  const items = [
    { label: 'Avisos publicados', value: stats?.ads_count },
    { label: 'Usuarios registrados', value: stats?.users_count },
    { label: 'Categorías activas', value: stats?.categories_count },
  ];

  return (
    <section className="py-10 bg-brand-50 border-t border-brand-100">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 className="w-5 h-5 text-brand-600" />
          <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          {items.map(item => (
            <div key={item.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-black text-brand-600 tabular-nums">
                {item.value?.toLocaleString('es-AR') ?? '—'}
              </p>
              <p className="text-sm text-gray-600 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Section: Banner (placeholder) ----

function BannerSection({ section }: SectionProps) {
  return (
    <section className="py-4 bg-white border-t border-gray-100">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4">
        <div className="rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center py-8 gap-2 text-gray-400">
          <ImageIcon className="w-5 h-5" />
          <span className="text-sm">{section.title} — banner dinámico (configurar en Gestión de Banners)</span>
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
    case 'category_carousel':
      return <AdGridSection section={section} />;
    case 'stats':
      return <StatsSection section={section} />;
    case 'banner':
      return <BannerSection section={section} />;
    default:
      return null;
  }
}

// ---- Componente principal ----

export function DynamicHomeSections() {
  const [sections, setSections] = useState<HomeSection[]>([]);

  useEffect(() => {
    getHomeComposition()
      .then(setSections)
      .catch(e => console.error('[DynamicHomeSections] Error:', e));
  }, []);

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map(section => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </>
  );
}
