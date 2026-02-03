/**
 * Dynamic Sitemap - Sitemap XML generado dinámicamente
 * Rural24 SEO-First Architecture
 * 
 * ESTRATEGIA SEO SIMPLIFICADA:
 * - Homepage: Prioridad máxima
 * - Avisos: SOLO los marcados con in_sitemap=true (premium/destacados o manual por admin)
 * - Categorías/Subcategorías: DESACTIVADAS por ahora
 * 
 * URL: /sitemap.xml
 */

import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// SUPABASE CLIENT
// ============================================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * SOLO avisos marcados para sitemap:
 * - in_sitemap = true (automático para premium, o manual por admin)
 * - Máximo 500 para performance
 */
async function getIndexableAds() {
  const { data } = await supabase
    .from('ads')
    .select('slug, short_id, updated_at, featured, is_premium')
    .eq('status', 'active')
    .eq('approval_status', 'approved')
    .eq('in_sitemap', true)
    .not('slug', 'is', null)
    .order('featured', { ascending: false })
    .order('is_premium', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500);
  
  return data || [];
}

// ============================================================
// SITEMAP GENERATION
// ============================================================
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://rural24.com';
  
  // Solo avisos indexables
  const ads = await getIndexableAds();
  
  // Homepage - Prioridad máxima
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];
  
  // Avisos premium/destacados
  const adPages: MetadataRoute.Sitemap = ads.map((ad: any) => ({
    url: `${baseUrl}/aviso/${ad.slug || ad.short_id}`,
    lastModified: ad.updated_at ? new Date(ad.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: ad.featured ? 0.8 : 0.6,
  }));
  
  return [
    ...staticPages,
    ...adPages,
  ];
}
