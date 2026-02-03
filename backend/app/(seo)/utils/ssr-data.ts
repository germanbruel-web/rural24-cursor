/**
 * SSR Utilities - Funciones compartidas para páginas SSR
 * Rural24 SEO-First Architecture
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

export function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

// ============================================================
// DATA FETCHERS
// ============================================================

export async function getCategories() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      display_name,
      slug,
      description,
      icon,
      sort_order,
      is_active
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('[SSR] Error fetching categories:', error);
    return [];
  }
  return data || [];
}

export async function getCategoryBySlug(slug: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      display_name,
      slug,
      description,
      icon
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  
  if (error) return null;
  return data;
}

export async function getSubcategoriesByCategorySlug(categorySlug: string) {
  const supabase = getSupabase();
  
  // Primero obtener la categoría
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return [];
  
  const { data, error } = await supabase
    .from('subcategories')
    .select(`
      id,
      name,
      display_name,
      slug,
      description,
      category_id,
      icon
    `)
    .eq('category_id', category.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('[SSR] Error fetching subcategories:', error);
    return [];
  }
  return data || [];
}

export async function getSubcategoryBySlug(categorySlug: string, subcategorySlug: string) {
  const supabase = getSupabase();
  
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return null;
  
  const { data, error } = await supabase
    .from('subcategories')
    .select(`
      id,
      name,
      display_name,
      slug,
      description,
      category_id,
      icon
    `)
    .eq('category_id', category.id)
    .eq('slug', subcategorySlug)
    .eq('is_active', true)
    .single();
  
  if (error) return null;
  return { ...data, category };
}

export async function getAdsBySubcategory(subcategoryId: string, limit = 20) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('ads')
    .select(`
      id,
      title,
      slug,
      short_id,
      description,
      price,
      currency,
      province,
      location,
      images,
      image_urls,
      featured,
      created_at,
      attributes
    `)
    .eq('subcategory_id', subcategoryId)
    .eq('status', 'active')
    .eq('approval_status', 'approved')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('[SSR] Error fetching ads:', error);
    return [];
  }
  return data || [];
}

export async function getAdsByCategory(categoryId: string, limit = 20) {
  const supabase = getSupabase();
  
  // Primero obtener todas las subcategorías de esta categoría
  const { data: subcats } = await supabase
    .from('subcategories')
    .select('id')
    .eq('category_id', categoryId)
    .eq('is_active', true);
  
  if (!subcats || subcats.length === 0) return [];
  
  const subcatIds = subcats.map(s => s.id);
  
  const { data, error } = await supabase
    .from('ads')
    .select(`
      id,
      title,
      slug,
      short_id,
      description,
      price,
      currency,
      province,
      location,
      images,
      image_urls,
      featured,
      created_at,
      attributes,
      subcategory_id
    `)
    .in('subcategory_id', subcatIds)
    .eq('status', 'active')
    .eq('approval_status', 'approved')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('[SSR] Error fetching ads by category:', error);
    return [];
  }
  return data || [];
}

export async function getAdBySlug(slug: string) {
  const supabase = getSupabase();
  
  // El slug puede ser "titulo-slug-shortId" o solo "shortId"
  // Extraer el short_id del final
  const parts = slug.split('-');
  const shortId = parts[parts.length - 1];
  
  const { data, error } = await supabase
    .from('ads')
    .select(`
      id,
      title,
      slug,
      short_id,
      description,
      price,
      currency,
      price_negotiable,
      province,
      location,
      images,
      image_urls,
      featured,
      created_at,
      updated_at,
      attributes,
      category_id,
      subcategory_id,
      user_id,
      contact_phone,
      contact_email,
      views_count
    `)
    .or(`short_id.eq.${shortId},slug.eq.${slug}`)
    .eq('status', 'active')
    .eq('approval_status', 'approved')
    .single();
  
  if (error) {
    console.error('[SSR] Error fetching ad:', error);
    return null;
  }
  
  // Obtener info de categoría y subcategoría
  if (data) {
    const { data: category } = await supabase
      .from('categories')
      .select('id, name, display_name, slug')
      .eq('id', data.category_id)
      .single();
    
    const { data: subcategory } = await supabase
      .from('subcategories')
      .select('id, name, display_name, slug')
      .eq('id', data.subcategory_id)
      .single();
    
    return { ...data, category, subcategory };
  }
  
  return null;
}

export async function getFeaturedAds(limit = 8) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('ads')
    .select(`
      id,
      title,
      slug,
      short_id,
      description,
      price,
      currency,
      province,
      location,
      images,
      image_urls,
      featured,
      created_at,
      attributes
    `)
    .eq('status', 'active')
    .eq('approval_status', 'approved')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('[SSR] Error fetching featured ads:', error);
    return [];
  }
  return data || [];
}

export async function getRecentAds(limit = 12) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('ads')
    .select(`
      id,
      title,
      slug,
      short_id,
      description,
      price,
      currency,
      province,
      location,
      images,
      image_urls,
      featured,
      created_at,
      attributes
    `)
    .eq('status', 'active')
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('[SSR] Error fetching recent ads:', error);
    return [];
  }
  return data || [];
}

export async function getAdsCount(filters?: { categorySlug?: string; subcategorySlug?: string }) {
  const supabase = getSupabase();
  
  let query = supabase
    .from('ads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('approval_status', 'approved');
  
  // Aplicar filtros si existen
  if (filters?.categorySlug) {
    const category = await getCategoryBySlug(filters.categorySlug);
    if (category) {
      const { data: subcats } = await supabase
        .from('subcategories')
        .select('id')
        .eq('category_id', category.id);
      if (subcats && subcats.length > 0) {
        query = query.in('subcategory_id', subcats.map(s => s.id));
      }
    }
  }
  
  if (filters?.subcategorySlug) {
    const { data: subcat } = await supabase
      .from('subcategories')
      .select('id')
      .eq('slug', filters.subcategorySlug)
      .single();
    if (subcat) {
      query = query.eq('subcategory_id', subcat.id);
    }
  }
  
  const { count, error } = await query;
  
  if (error) return 0;
  return count || 0;
}

// ============================================================
// HELPERS
// ============================================================

export function formatPrice(price: number | null, currency: string = 'ARS'): string {
  if (!price) return 'Consultar';
  
  if (currency === 'USD') {
    return `USD ${price.toLocaleString('en-US')}`;
  }
  return `$${price.toLocaleString('es-AR')}`;
}

export function getImageUrl(ad: any): string {
  // Prioridad: images[0].url > images[0] > image_urls[0] > placeholder
  if (ad.images && ad.images.length > 0) {
    const first = ad.images[0];
    if (typeof first === 'string') return first;
    if (first?.url) return first.url;
  }
  if (ad.image_urls && ad.image_urls.length > 0) {
    return ad.image_urls[0];
  }
  return '/images/placeholder-ad.jpg';
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function getAdUrl(ad: any): string {
  // Construir URL SEO-friendly: /aviso/[slug-shortId]
  const slug = ad.slug || ad.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '';
  return `/aviso/${slug}-${ad.short_id}`;
}
