import { supabase } from '@/services/supabaseClient';
import type { BannerClean, BannerPlacement, CreateBannerCleanInput, UpdateBannerCleanInput } from '@/types';

// ============================================
// CONFIGURACIÓN
// ============================================

const DEBUG = import.meta.env.DEV; // Solo logs en desarrollo
const CACHE_TTL_MS = 60 * 1000; // 60 segundos de caché

// ============================================
// UTILIDADES
// ============================================

/**
 * Normaliza texto para comparación flexible de categorías.
 * Convierte a minúsculas, elimina espacios/guiones/underscores y acentos.
 * 
 * @example
 * normalizeForComparison("MAQUINARIAS AGRÍCOLAS") // "maquinariasagricolas"
 * normalizeForComparison("maquinarias-agricolas") // "maquinariasagricolas"
 */
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')                    // Separa acentos (é → e + ´)
    .replace(/[\u0300-\u036f]/g, '')     // Elimina diacríticos
    .replace(/[\s_-]+/g, '');            // Elimina espacios, guiones, underscores
}

/**
 * Verifica si un banner está dentro de su período de validez.
 */
function isWithinDateRange(banner: BannerClean, now: Date): boolean {
  if (banner.starts_at && new Date(banner.starts_at) > now) return false;
  if (banner.expires_at && new Date(banner.expires_at) < now) return false;
  return true;
}

/**
 * Verifica si un banner aplica a una categoría específica.
 * Los banners con category='all' aplican a todas las categorías.
 */
function matchesCategory(banner: BannerClean, normalizedCategory: string | null): boolean {
  // 'all' aplica siempre
  if (banner.category === 'all') return true;
  
  // Sin categoría específica: solo mostrar banners 'all'
  if (!normalizedCategory) return false;
  
  // Comparar normalizado
  return normalizeForComparison(banner.category) === normalizedCategory;
}

// ============================================
// CACHÉ EN MEMORIA (por placement)
// ============================================

interface CacheEntry {
  data: BannerClean[];
  timestamp: number;
}

const bannerCache = new Map<BannerPlacement, CacheEntry>();

function getCachedBanners(placement: BannerPlacement): BannerClean[] | null {
  const entry = bannerCache.get(placement);
  if (!entry) return null;
  
  const isExpired = Date.now() - entry.timestamp > CACHE_TTL_MS;
  if (isExpired) {
    bannerCache.delete(placement);
    return null;
  }
  
  return entry.data;
}

function setCachedBanners(placement: BannerPlacement, data: BannerClean[]): void {
  bannerCache.set(placement, { data, timestamp: Date.now() });
}

function invalidateCache(placement?: BannerPlacement): void {
  if (placement) {
    bannerCache.delete(placement);
  } else {
    bannerCache.clear();
  }
}

// ============================================
// QUERY BASE (con caché)
// ============================================

async function fetchBannersByPlacement(placement: BannerPlacement): Promise<BannerClean[]> {
  // Intentar caché primero
  const cached = getCachedBanners(placement);
  if (cached) {
    if (DEBUG) console.log(`[Banners] Cache HIT for ${placement}`);
    return cached;
  }
  
  if (DEBUG) console.log(`[Banners] Cache MISS for ${placement}, fetching...`);
  
  const { data, error } = await supabase
    .from('banners_clean')
    .select('*')
    .eq('placement', placement)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error(`[Banners] Query error for ${placement}:`, error);
    return [];
  }
  
  const banners = data || [];
  setCachedBanners(placement, banners);
  return banners;
}

// ============================================
// FILTRO COMÚN (DRY)
// ============================================

interface FilterOptions {
  category?: string;
  limit?: number;
  randomize?: boolean;
}

function filterBanners(
  banners: BannerClean[], 
  options: FilterOptions = {}
): BannerClean[] {
  const { category, limit, randomize } = options;
  const now = new Date();
  const normalizedCategory = category ? normalizeForComparison(category) : null;
  
  let filtered = banners.filter(banner => 
    isWithinDateRange(banner, now) && 
    matchesCategory(banner, normalizedCategory)
  );
  
  if (DEBUG && category) {
    console.log(`[Banners] Filter: ${banners.length} → ${filtered.length} (category: ${category})`);
  }
  
  // Randomizar si se solicita
  if (randomize && filtered.length > 1) {
    filtered = [...filtered].sort(() => Math.random() - 0.5);
  }
  
  // Limitar resultados
  if (limit && filtered.length > limit) {
    filtered = filtered.slice(0, limit);
  }
  
  return filtered;
}

// ============================================
// API PÚBLICA - LECTURA
// ============================================

export async function getHeroVIPBanners(category?: string): Promise<BannerClean[]> {
  try {
    const banners = await fetchBannersByPlacement('hero_vip');
    
    // Si no hay categoría, devolver TODOS los banners activos (para random inicial)
    if (!category) {
      const now = new Date();
      return banners.filter(b => isWithinDateRange(b, now));
    }
    
    return filterBanners(banners, { category });
  } catch (error) {
    console.error('[getHeroVIPBanners] Error:', error);
    return [];
  }
}

export async function getCategoryCarouselBanners(category: string): Promise<BannerClean[]> {
  try {
    const banners = await fetchBannersByPlacement('category_carousel');
    return filterBanners(banners, { category, limit: 4 });
  } catch (error) {
    console.error('[getCategoryCarouselBanners] Error:', error);
    return [];
  }
}

export async function getBelowFilterBanner(category?: string): Promise<BannerClean | null> {
  try {
    const banners = await fetchBannersByPlacement('results_below_filter');
    const filtered = filterBanners(banners, { category, limit: 1 });
    return filtered[0] || null;
  } catch (error) {
    console.error('[getBelowFilterBanner] Error:', error);
    return null;
  }
}

export async function getIntercalatedBanner(category?: string): Promise<BannerClean | null> {
  try {
    const banners = await fetchBannersByPlacement('results_intercalated');
    const filtered = filterBanners(banners, { category, randomize: true, limit: 1 });
    
    if (DEBUG && filtered[0]) {
      console.log(`[Banners] Intercalated selected: ${filtered[0].client_name}`);
    }
    
    return filtered[0] || null;
  } catch (error) {
    console.error('[getIntercalatedBanner] Error:', error);
    return null;
  }
}

// ====================================
// API PÚBLICA - ADMIN (sin caché)
// ====================================

export async function getAllBannersClean(): Promise<BannerClean[]> {
  try {
    const { data, error } = await supabase
      .from('banners_clean')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[getAllBannersClean] Error:', error);
    throw error;
  }
}

// ====================================
// API PÚBLICA - CRUD (invalidan caché)
// ====================================

export async function createBannerClean(input: CreateBannerCleanInput): Promise<BannerClean> {
  try {
    // Validaciones según placement
    if (input.placement === 'hero_vip') {
      if (!input.desktop_image_url || !input.mobile_image_url) {
        throw new Error('Hero VIP requiere desktop_image_url y mobile_image_url');
      }
    } else if (input.placement === 'category_carousel') {
      if (!input.carousel_image_url) {
        throw new Error('Category Carousel requiere carousel_image_url');
      }
    } else if (input.placement === 'results_intercalated' || input.placement === 'results_below_filter') {
      if (!input.desktop_image_url) {
        throw new Error(`${input.placement} requiere desktop_image_url`);
      }
    }

    if (!input.client_name?.trim()) {
      throw new Error('client_name es requerido');
    }

    const insertData: Record<string, unknown> = {
      placement: input.placement,
      category: input.category,
      client_name: input.client_name.trim(),
      is_active: input.is_active ?? true
    };

    if (input.link_url) insertData.link_url = input.link_url;
    if (input.desktop_image_url) insertData.desktop_image_url = input.desktop_image_url;
    if (input.mobile_image_url) insertData.mobile_image_url = input.mobile_image_url;
    if (input.carousel_image_url) insertData.carousel_image_url = input.carousel_image_url;
    if (input.starts_at) insertData.starts_at = input.starts_at;
    if (input.expires_at) insertData.expires_at = input.expires_at;

    const { data, error } = await supabase
      .from('banners_clean')
      .insert([insertData])
      .select('*')
      .single();

    if (error) throw error;
    
    // Invalidar caché del placement afectado
    invalidateCache(input.placement);
    
    return data;
  } catch (error) {
    console.error('[createBannerClean] Error:', error);
    throw error;
  }
}

export async function updateBannerClean(
  id: string,
  input: UpdateBannerCleanInput
): Promise<BannerClean> {
  try {
    const { data, error } = await supabase
      .from('banners_clean')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Invalidar toda la caché (puede cambiar placement)
    invalidateCache();
    
    return data;
  } catch (error) {
    console.error('[updateBannerClean] Error:', error);
    throw error;
  }
}

export async function deleteBannerClean(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('banners_clean')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Invalidar toda la caché
    invalidateCache();
  } catch (error) {
    console.error('[deleteBannerClean] Error:', error);
    throw error;
  }
}

export async function toggleBannerCleanActive(id: string, isActive: boolean): Promise<BannerClean> {
  try {
    const { data, error } = await supabase
      .from('banners_clean')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Invalidar toda la caché
    invalidateCache();
    
    return data;
  } catch (error) {
    console.error('[toggleBannerCleanActive] Error:', error);
    throw error;
  }
}

// ====================================
// API PÚBLICA - TRACKING
// ====================================

export async function incrementBannerImpression(id: string): Promise<void> {
  try {
    await supabase.rpc('increment_banner_impression', { banner_id: id });
  } catch (error) {
    // Silenciar errores de tracking para no afectar UX
    if (DEBUG) console.error('[incrementBannerImpression] Error:', error);
  }
}

export async function incrementBannerClick(id: string): Promise<void> {
  try {
    await supabase.rpc('increment_banner_click', { banner_id: id });
  } catch (error) {
    if (DEBUG) console.error('[incrementBannerClick] Error:', error);
  }
}
