/**
 * Servicio de Avisos Destacados
 * Gestiona avisos marcados para homepage por superadmin
 * 
 * NUEVO: Usa la tabla featured_ads_queue como fuente de verdad
 */

import { supabase } from './supabaseClient';
import type { Ad } from '../../types';
import { getCategoryCarouselBanners } from './bannersCleanService';

const isDev = import.meta.env.DEV;

// ========== API NUEVA: featured_ads_queue ==========

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface FeaturedQueueItem {
  id: string;
  ad_id: string;
  activated_at: string;
  expires_at: string | null;
  status: 'active' | 'inactive' | 'expired' | 'restored';
  reason: string | null;
  restored_from: string | null;
  ads?: {
    id: string;
    title: string;
    slug: string;
    images: string[];
    category_id: string;
    subcategory_id: string;
    price: number;
    currency: string;
  };
  _fallback?: boolean;
}

/**
 * Obtiene la cola de destacados activos (siempre 10, rellenando con el último si faltan)
 */
export async function getFeaturedQueue(): Promise<FeaturedQueueItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/featured-ads`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data || [];
  } catch (err: any) {
    console.error('❌ Error obteniendo cola de destacados:', err);
    return [];
  }
}

/**
 * Obtiene el historial de destacados (para auditoría/restauración)
 */
export async function getFeaturedHistory(): Promise<FeaturedQueueItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/featured-ads/history`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data || [];
  } catch (err: any) {
    console.error('❌ Error obteniendo historial de destacados:', err);
    return [];
  }
}

/**
 * Activa un aviso como destacado (cola nueva)
 */
export async function activateFeaturedAd(
  ad_id: string,
  expires_at?: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/featured-ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ad_id, expires_at, reason }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Desactiva un aviso destacado (cola nueva)
 */
export async function deactivateFeaturedAd(
  ad_id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/featured-ads?ad_id=${ad_id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Restaura un aviso destacado desde el historial
 */
export async function restoreFeaturedAd(
  queue_id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/featured-ads/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queue_id }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ========== LÓGICA DE REFRESCO AUTOMÁTICO ==========

type FeaturedQueueListener = (data: FeaturedQueueItem[]) => void;
let featuredQueueListeners: FeaturedQueueListener[] = [];
let featuredQueuePollingInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Suscribirse a cambios en la cola de destacados (polling cada 30s)
 */
export function subscribeFeaturedQueue(listener: FeaturedQueueListener): () => void {
  featuredQueueListeners.push(listener);
  // Si es el primer listener, iniciar polling
  if (featuredQueueListeners.length === 1) {
    startFeaturedQueuePolling();
  }
  // Devuelve función para desuscribirse
  return () => {
    featuredQueueListeners = featuredQueueListeners.filter(l => l !== listener);
    if (featuredQueueListeners.length === 0) {
      stopFeaturedQueuePolling();
    }
  };
}

async function pollFeaturedQueue() {
  const data = await getFeaturedQueue();
  featuredQueueListeners.forEach(listener => listener(data));
}

function startFeaturedQueuePolling() {
  pollFeaturedQueue(); // Ejecutar inmediatamente
  featuredQueuePollingInterval = setInterval(pollFeaturedQueue, 30000); // Cada 30s
}

function stopFeaturedQueuePolling() {
  if (featuredQueuePollingInterval) {
    clearInterval(featuredQueuePollingInterval);
    featuredQueuePollingInterval = null;
  }
}

// ========== LEGACY: Lógica de flags (deprecada) ==========

export interface FeaturedAdsByCategory {
  category_id: string;
  category_name: string;
  category_slug: string;
  banners: Array<{
    id: string;
    image_url: string;
    link_url?: string;
    title: string;
  }>;
  subcategories: Array<{ 
    id: string; 
    name: string; 
    slug: string; 
    ads_count: number;
    icon?: string;
  }>;
  ads: Ad[];
  total_featured: number;
}

/**
 * Obtiene avisos destacados agrupados por categoría principal
 * @param limit Número máximo de avisos por categoría (default: 12)
 * @param preloadedCategories Categorías precargadas desde CategoryContext (evita query duplicado)
 */
export async function getFeaturedAdsByCategories(
  limit: number = 12,
  preloadedCategories?: Array<{ id: string; name: string; display_name: string; icon?: string; slug: string }>
): Promise<FeaturedAdsByCategory[]> {
  try {
    isDev && console.log('🔍 getFeaturedAdsByCategories - START');
    
    // 1. Usar categorías precargadas o hacer query
    let categories = preloadedCategories || null;
    
    if (!categories) {
      const { data, error: catError } = await supabase
        .from('categories')
        .select('id, name, display_name, icon, slug')
        .eq('is_active', true)
        .order('sort_order');
      isDev && console.log('📦 Categories fetched:', { count: data?.length, error: catError });
      if (catError) throw catError;
      categories = data;
    } else {
      isDev && console.log('📦 Categories from context:', categories.length);
    }

    if (!categories || categories.length === 0) return [];

    // 2. Por cada categoría, obtener avisos destacados, subcategorías y banner
    const results = await Promise.all(
      categories.map(async (cat) => {
        // 2a. Avisos destacados con orden manual
        // Primero obtenemos todos y luego filtramos expirados en JS
        const { data: rawAds, error: adsError } = await supabase
          .from('ads')
          .select('*')
          .eq('featured', true)
          .eq('category_id', cat.id)
          .eq('status', 'active')
          .order('featured_order', { ascending: true })
          .limit(limit + 5); // Traer más por si hay expirados

        // Filtrar expirados en JavaScript (más confiable)
        const now = new Date();
        const ads = (rawAds || []).filter(ad => {
          if (!ad.featured_until) return true;
          return new Date(ad.featured_until) > now;
        }).slice(0, limit);

        isDev && console.log(`📋 Ads for ${cat.name}:`, { raw: rawAds?.length, filtered: ads.length });

        if (adsError) {
          console.error(`❌ Error fetching ads for ${cat.name}:`, adsError);
        }

        // 2b. Obtener subcategorías con contadores de avisos activos
        const { data: subcategories, error: subError } = await supabase
          .from('subcategories')
          .select('id, name, display_name, icon, sort_order, slug')
          .eq('category_id', cat.id)
          .eq('is_active', true)
          .order('sort_order');

        if (subError) {
          console.error(`❌ Error fetching subcategories for ${cat.name}:`, subError);
        }

        const subcategoryMap = new Map(
          (subcategories || []).map(s => [s.id, s.display_name || s.name])
        );

        // Enriquecer ads con subcategoría, brand, model y atributos combinados
        const enrichedAds = (ads || []).map(ad => {
          // Combinar attributes legacy + dynamic_fields
          const combinedAttrs = {
            ...(ad.attributes || {}),
            ...(ad.dynamic_fields || {})
          };
          
          // Extraer brand y model de los joins o de dynamic_fields
          const brandName = ad.brands?.name || combinedAttrs.marca || null;
          const modelName = ad.models?.name || combinedAttrs.modelo || null;
          
          return {
            ...ad,
            subcategory: subcategoryMap.get(ad.subcategory_id) || null,
            brand: brandName,
            model: modelName,
            attributes: combinedAttrs,
            // Limpiar objetos de join
            brands: undefined,
            models: undefined
          };
        });

        // 2b-bis. Contar avisos activos por subcategoría (BATCHED: 1 query instead of N)
        const subcatIds = (subcategories || []).map(s => s.id);
        let countMap = new Map<string, number>();
        
        if (subcatIds.length > 0) {
          const { data: adCounts, error: countError } = await supabase
            .from('ads')
            .select('subcategory_id')
            .in('subcategory_id', subcatIds)
            .eq('status', 'active');
          
          if (countError) {
            console.error(`❌ Error batch counting ads for ${cat.name}:`, countError);
          } else {
            (adCounts || []).forEach(row => {
              countMap.set(row.subcategory_id, (countMap.get(row.subcategory_id) || 0) + 1);
            });
          }
        }
        
        const subcategoriesWithCounts = (subcategories || []).map(sub => ({
          id: sub.id,
          name: sub.display_name || sub.name,
          slug: sub.slug || sub.name,
          ads_count: countMap.get(sub.id) || 0,
          icon: sub.icon
        }));

        // 2c. Obtener banners carousel (usa caché de bannersCleanService - 1 query total)
        const catDisplayName = cat.display_name || cat.name;
        const carouselBanners = await getCategoryCarouselBanners(catDisplayName);
        isDev && console.log(`📢 Banners carousel para ${catDisplayName}:`, carouselBanners.length);

        const banners = carouselBanners.map(b => ({
          id: b.id,
          image_url: b.carousel_image_url || '',
          link_url: b.link_url,
          title: b.client_name
        }));

        const normalizedSlug = cat.slug || cat.name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        
        return {
          category_id: cat.id,
          category_name: cat.display_name || cat.name,
          category_slug: normalizedSlug,
          banners: banners,
          subcategories: subcategoriesWithCounts,
          ads: enrichedAds,
          total_featured: enrichedAds.length
        };
      })
    );

    const allResults = results;
    isDev && console.log('✅ Featured results:', { categories: allResults.length, withAds: results.filter(r => r.ads.length > 0).length });

    // 3. Devolver TODAS las categorías (incluso sin avisos) para scroll y SEO
    return allResults;
    
  } catch (error) {
    console.error('❌ Error in getFeaturedAdsByCategories:', error);
    return [];
  }
}

/**
 * Marca/desmarca un aviso como destacado (solo superadmin)
 */
export async function toggleFeaturedAd(
  adId: string,
  featured: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('ads')
      .update({ 
        featured: featured
        // featured_order y featured_at se gestionan automáticamente por trigger
      })
      .eq('id', adId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error toggling featured ad:', error);
    return { 
      success: false, 
      error: error.message || 'Error al actualizar aviso' 
    };
  }
}

/**
 * Reordena avisos destacados de una categoría (drag & drop)
 */
export async function reorderFeaturedAds(
  categoryId: string,
  orderedAdIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates = orderedAdIds.map((adId, index) => ({
      id: adId,
      featured_order: index + 1
    }));

    const { error } = await supabase
      .from('ads')
      .upsert(
        updates.map(u => ({ 
          id: u.id, 
          featured_order: u.featured_order 
        })),
        { onConflict: 'id' }
      );

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error reordering featured ads:', error);
    return { 
      success: false, 
      error: error.message || 'Error al reordenar avisos' 
    };
  }
}

/**
 * Obtiene todos los avisos destacados (para panel admin)
 */
export async function getAllFeaturedAds(): Promise<Ad[]> {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select(`
        *,
        category:category_id (name),
        seller:user_id (full_name, email)
      `)
      .eq('featured', true)
      .order('category_id')
      .order('featured_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all featured ads:', error);
    return [];
  }
}
