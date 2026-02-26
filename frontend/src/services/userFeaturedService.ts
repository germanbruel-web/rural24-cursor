/**
 * userFeaturedService.ts
 * Servicio para gestión de avisos destacados POR USUARIO
 * 
 * Diferente de featuredAdsService.ts que es para administración por superadmin.
 * Este servicio permite a usuarios:
 * - Comprar créditos
 * - Destacar sus propios avisos
 * - Programar fechas de inicio
 * - Ver disponibilidad de slots
 */

import { supabase } from './supabaseClient';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================================================
// TIPOS
// ============================================================================

export type FeaturedPlacement = 'homepage' | 'results' | 'detail';
export type FeaturedStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export interface UserFeaturedCredits {
  id: string;
  user_id: string;
  balance: number;
  credits_available: number; // Alias de balance para compatibilidad
  created_at: string;
  updated_at: string;
}

export interface UserFeaturedAd {
  id: string;
  ad_id: string;
  user_id: string;
  placement: FeaturedPlacement;
  category_id: string;
  scheduled_start: string;
  actual_start: string | null;
  expires_at: string | null;
  duration_days: number;
  status: FeaturedStatus;
  priority: number;
  credit_consumed: boolean;
  created_at: string;
  // Datos del aviso (JOIN)
  ad?: {
    id: string;
    title: string;
    price: number;
    currency: string;
    images: any[];
    slug: string;
  };
  // Datos de categoría (JOIN)
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface SlotAvailability {
  category_id: string;
  category_name: string;
  category_slug: string;
  placement: FeaturedPlacement;
  max_slots: number;
  active_count: number;
  pending_count: number;
  available_slots: number;
}

export interface AvailabilityCheck {
  is_available: boolean;
  slots_total: number;
  slots_used: number;
  slots_available: number;
  next_available_date: string | null;
}

export interface MonthlyAvailabilityDay {
  day: number;
  is_available: boolean;
  slots_total: number;
  slots_used: number;
  slots_available: number;
}

export interface CreateFeaturedResult {
  success: boolean;
  featured_id: string | null;
  error_message: string | null;
}

// ============================================================================
// CRÉDITOS DEL USUARIO
// ============================================================================

/**
 * Obtener créditos del usuario actual
 */
export async function getUserCredits(): Promise<{ data: UserFeaturedCredits | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('No autenticado') };
    }

    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Si no existe, devolver créditos en 0
      if (error.code === 'PGRST116') {
        return {
          data: {
            id: '',
            user_id: user.id,
            balance: 0,
            credits_available: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null
        };
      }
      return { data: null, error };
    }

    return {
      data: {
        ...data,
        credits_available: data.balance ?? 0
      },
      error: null
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Agregar créditos a un usuario (solo admin)
 */
export async function addCreditsToUser(
  userId: string, 
  amount: number
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Intentar con upsert
    const { data: existing } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase
        .from('user_credits')
        .update({ balance: (existing.balance || 0) + amount })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('user_credits')
        .insert({ user_id: userId, balance: amount });
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// ============================================================================
// VERIFICACIÓN DE DISPONIBILIDAD
// ============================================================================

/**
 * Verificar disponibilidad de slots para una fecha
 */
export async function checkAvailability(
  placement: FeaturedPlacement,
  categoryId: string,
  startDate: string,
  durationDays: number = 30
): Promise<{ data: AvailabilityCheck | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc('check_featured_availability', {
      p_placement: placement,
      p_category_id: categoryId,
      p_start_date: startDate,
      p_duration_days: durationDays
    });

    if (error) {
      console.error('Error checking availability:', error);
      return { data: null, error };
    }

    // La función devuelve un array con un solo elemento
    const result = Array.isArray(data) ? data[0] : data;
    
    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Obtener disponibilidad mensual para calendario
 */
export async function getMonthlyAvailability(
  placement: FeaturedPlacement,
  categoryId: string,
  year: number,
  month: number
): Promise<{ data: MonthlyAvailabilityDay[]; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc('get_featured_month_availability', {
      p_placement: placement,
      p_category_id: categoryId,
      p_year: year,
      p_month: month
    });

    if (error) {
      console.error('Error getting monthly availability:', error);
      return { data: [], error };
    }

    return { data: (data || []) as MonthlyAvailabilityDay[], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener vista general de disponibilidad de slots
 */
export async function getSlotsAvailability(): Promise<{ data: SlotAvailability[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('featured_slots_availability')
      .select('*')
      .order('category_name');

    if (error) {
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// ============================================================================
// GESTIÓN DE DESTACADOS
// ============================================================================

/**
 * Crear un aviso destacado
 */
export async function createUserFeaturedAd(
  adId: string,
  placement: FeaturedPlacement,
  scheduledStart: string
): Promise<{ data: CreateFeaturedResult | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { 
        data: { success: false, featured_id: null, error_message: 'No autenticado' }, 
        error: null 
      };
    }

    const { data, error } = await supabase.rpc('create_featured_ad', {
      p_ad_id: adId,
      p_user_id: user.id,
      p_placement: placement,
      p_scheduled_start: scheduledStart
    });

    if (error) {
      console.error('Error creating featured ad:', error);
      return { data: null, error };
    }

    // La función devuelve un array con un solo elemento
    const result = Array.isArray(data) ? data[0] : data;
    
    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Cancelar un destacado pendiente (devuelve el crédito)
 */
export async function cancelUserFeaturedAd(
  featuredId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { success: false, error: new Error('No autenticado') };
    }

    const response = await fetch(`${API_URL}/api/featured-ads/${featuredId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const result = await response.json();
    if (!response.ok || !result?.success) {
      return {
        success: false,
        error: new Error(result?.error || 'Error al cancelar destacado pendiente'),
      };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Cancelar un destacado ACTIVO (NO devuelve créditos)
 * Usado cuando el usuario quiere quitar su aviso de destacados.
 */
export async function cancelActiveFeaturedAd(
  featuredId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { success: false, error: new Error('No autenticado') };
    }

    const response = await fetch(`${API_URL}/api/featured-ads/${featuredId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const result = await response.json();
    if (!response.ok || !result?.success) {
      return {
        success: false,
        error: new Error(result?.error || 'Error al cancelar destacado activo'),
      };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Obtener mis destacados (pendientes y activos)
 */
export async function getMyFeaturedAds(): Promise<{ data: UserFeaturedAd[]; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: [], error: new Error('No autenticado') };
    }

    const { data, error } = await supabase
      .from('featured_ads')
      .select(`
        *,
        ad:ads(id, title, price, currency, images, slug),
        category:categories(id, name, slug)
      `)
      .eq('user_id', user.id)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener historial completo de destacados del usuario
 */
export async function getMyFeaturedHistory(): Promise<{ data: UserFeaturedAd[]; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: [], error: new Error('No autenticado') };
    }

    const { data, error } = await supabase
      .from('featured_ads')
      .select(`
        *,
        ad:ads(id, title, price, currency, images, slug),
        category:categories(id, name, slug)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// ============================================================================
// OBTENER DESTACADOS PARA MOSTRAR (PÚBLICO)
// ============================================================================

/**
 * Obtener destacados para Homepage por categoría
 */
export async function getFeaturedForHomepage(
  categoryId: string,
  limit: number = 10
): Promise<{ data: any[]; error: Error | null }> {
  try {
    // Usar función RPC para obtener IDs únicos por usuario
    const { data: featuredIds, error: rpcError } = await supabase.rpc(
      'get_featured_for_homepage',
      { p_category_id: categoryId, p_limit: limit }
    );

    if (rpcError) {
      console.error('Error getting featured for homepage:', rpcError);
      // Fallback: query directo
      return getFeaturedFallback('homepage', categoryId, limit);
    }

    if (!featuredIds || featuredIds.length === 0) {
      return { data: [], error: null };
    }

    // Debug: Log origen de destacados (opcional - comentar en producción)
    if (process.env.NODE_ENV === 'development') {
      const userPaid = featuredIds.filter((f: any) => !f.is_manual).length;
      const adminManual = featuredIds.filter((f: any) => f.is_manual).length;
      console.log(`[Featured Homepage] Total: ${featuredIds.length} | Usuario: ${userPaid} | Admin: ${adminManual}`);
    }

    // Obtener los avisos completos
    const adIds = featuredIds.map((f: any) => f.ad_id);
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*, categories(name, slug)')
      .in('id', adIds);

    if (adsError) {
      return { data: [], error: adsError };
    }

    // Mantener el orden FIFO
    const orderedAds = adIds
      .map((id: string) => ads?.find(ad => ad.id === id))
      .filter(Boolean);

    return { data: orderedAds, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener destacados para página de Resultados
 */
export async function getFeaturedForResults(
  categoryId: string,
  limit: number = 4,
  offset: number = 0
): Promise<{ data: any[]; error: Error | null }> {
  try {
    // Usar función RPC
    const { data: featuredIds, error: rpcError } = await supabase.rpc(
      'get_featured_for_results',
      { p_category_id: categoryId, p_limit: limit, p_offset: offset }
    );

    if (rpcError) {
      console.error('Error getting featured for results:', rpcError);
      return getFeaturedFallback('results', categoryId, limit);
    }

    if (!featuredIds || featuredIds.length === 0) {
      return { data: [], error: null };
    }

    // Debug: Log origen de destacados (opcional - comentar en producción)
    if (process.env.NODE_ENV === 'development') {
      const userPaid = featuredIds.filter((f: any) => !f.is_manual).length;
      const adminManual = featuredIds.filter((f: any) => f.is_manual).length;
      console.log(`[Featured Results] Total: ${featuredIds.length} | Usuario: ${userPaid} | Admin: ${adminManual}`);
    }

    // Obtener los avisos completos
    const adIds = featuredIds.map((f: any) => f.ad_id);
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*, categories(name, slug), user:users(id, full_name, display_name)')
      .in('id', adIds);

    if (adsError) {
      return { data: [], error: adsError };
    }

    // Mantener orden
    const orderedAds = adIds
      .map((id: string) => ads?.find(ad => ad.id === id))
      .filter(Boolean);

    return { data: orderedAds, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener destacados relacionados para página de Detalle
 */
export async function getFeaturedForDetail(
  categoryId: string,
  excludeAdId: string,
  limit: number = 6
): Promise<{ data: any[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('featured_ads')
      .select(`
        ad_id,
        user_id,
        ad:ads(*, categories(name, slug))
      `)
      .eq('placement', 'detail')
      .eq('category_id', categoryId)
      .eq('status', 'active')
      .neq('ad_id', excludeAdId)
      .order('created_at', { ascending: true })
      .limit(limit * 2);

    if (error) {
      return { data: [], error };
    }

    // Filtrar 1 por usuario
    const seenUsers = new Set<string>();
    const uniqueAds = (data || [])
      .filter(item => {
        if (seenUsers.has(item.user_id)) return false;
        seenUsers.add(item.user_id);
        return true;
      })
      .slice(0, limit)
      .map(item => item.ad);

    return { data: uniqueAds, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Fallback genérico para queries de destacados
 */
async function getFeaturedFallback(
  placement: FeaturedPlacement,
  categoryId: string,
  limit: number
): Promise<{ data: any[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('featured_ads')
      .select(`
        ad_id,
        user_id,
        created_at,
        ad:ads(*, categories(name, slug))
      `)
      .eq('placement', placement)
      .eq('category_id', categoryId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error };
    }

    // Filtrar 1 por usuario y aplicar limit
    const seenUsers = new Set<string>();
    const uniqueAds = (data || [])
      .filter(item => {
        if (seenUsers.has(item.user_id)) return false;
        seenUsers.add(item.user_id);
        return true;
      })
      .slice(0, limit)
      .map(item => item.ad);

    return { data: uniqueAds, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Obtener configuración de destacados
 */
export async function getFeaturedSettings(): Promise<{
  slotsHomepage: number;
  slotsResults: number;
  slotsDetail: number;
  durationDays: number;
  creditPrice: number;
}> {
  try {
    const { data } = await supabase
      .from('global_settings')
      .select('key, value')
      .in('key', [
        'featured_slots_homepage',
        'featured_slots_results', 
        'featured_slots_detail',
        'featured_duration_days',
        'featured_credit_price'
      ]);

    const settings: Record<string, number> = {};
    (data || []).forEach(item => {
      settings[item.key] = parseInt(item.value) || 0;
    });

    return {
      slotsHomepage: settings.featured_slots_homepage || 10,
      slotsResults: settings.featured_slots_results || 4,
      slotsDetail: settings.featured_slots_detail || 6,
      durationDays: settings.featured_duration_days || 15,
      creditPrice: settings.featured_credit_price || 2500,
    };
  } catch (error) {
    console.error('Error getting featured settings:', error);
    return {
      slotsHomepage: 10,
      slotsResults: 4,
      slotsDetail: 6,
      durationDays: 15,
      creditPrice: 2500,
    };
  }
}

/**
 * Verificar si un aviso puede ser destacado
 */
export async function canAdBeFeatured(
  adId: string
): Promise<{ canFeature: boolean; reason: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { canFeature: false, reason: 'Debes iniciar sesión' };
    }

    // Verificar que el aviso existe y pertenece al usuario
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('id, user_id, status, category_id')
      .eq('id', adId)
      .single();

    if (adError || !ad) {
      return { canFeature: false, reason: 'Aviso no encontrado' };
    }

    if (ad.user_id !== user.id) {
      return { canFeature: false, reason: 'No sos el dueño de este aviso' };
    }

    if (ad.status !== 'active') {
      return { canFeature: false, reason: 'El aviso debe estar activo' };
    }

    // Verificar créditos
    const { data: credits } = await getUserCredits();
    if (!credits || credits.credits_available <= 0) {
      return { canFeature: false, reason: 'No tenés créditos disponibles' };
    }

    // Verificar si ya está destacado
    const { data: existing } = await supabase
      .from('featured_ads')
      .select('id, placement')
      .eq('ad_id', adId)
      .in('status', ['pending', 'active'])
      .limit(1);

    if (existing && existing.length > 0) {
      return { canFeature: false, reason: `Este aviso ya está destacado en ${existing[0].placement}` };
    }

    return { canFeature: true, reason: null };
  } catch (error) {
    return { canFeature: false, reason: 'Error verificando el aviso' };
  }
}

/**
 * Obtener categorías principales para selector
 */
export async function getMainCategories(): Promise<{ data: { id: string; name: string; slug: string }[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('name');

    if (error) {
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// ============================================================================
// PROMOCIONES
// ============================================================================

export interface PromoStatus {
  promo_active: boolean;
  can_claim: boolean;
  already_claimed: boolean;
  credits_available: number;
  promo_message: string;
  promo_end_date: string | null;
}

/**
 * Verificar estado de promoción para el usuario actual
 */
export async function checkPromoStatus(): Promise<{ data: PromoStatus | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('No autenticado') };
    }

    const { data, error } = await supabase.rpc('check_promo_status', {
      p_user_id: user.id
    });

    if (error) {
      console.error('Error checking promo status:', error);
      return { data: null, error };
    }

    // La función devuelve un array con un solo elemento
    const result = Array.isArray(data) ? data[0] : data;
    
    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Reclamar créditos promocionales
 */
export async function claimPromoCredits(): Promise<{ 
  success: boolean; 
  credits_granted: number; 
  message: string; 
  error: Error | null 
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, credits_granted: 0, message: 'No autenticado', error: new Error('No autenticado') };
    }

    const { data, error } = await supabase.rpc('claim_promo_credits', {
      p_user_id: user.id
    });

    if (error) {
      console.error('Error claiming promo credits:', error);
      return { success: false, credits_granted: 0, message: error.message, error };
    }

    // La función devuelve un array con un solo elemento
    const result = Array.isArray(data) ? data[0] : data;
    
    return { 
      success: result?.success || false, 
      credits_granted: result?.credits_granted || 0,
      message: result?.message || 'Error desconocido',
      error: null 
    };
  } catch (error) {
    return { success: false, credits_granted: 0, message: (error as Error).message, error: error as Error };
  }
}

// ============================================================================
// EXPORT AGRUPADO
// ============================================================================

export const userFeaturedService = {
  // Créditos
  getUserCredits,
  addCreditsToUser,
  
  // Disponibilidad
  checkAvailability,
  getSlotsAvailability,
  
  // Gestión
  createUserFeaturedAd,
  cancelUserFeaturedAd,
  getMyFeaturedAds,
  getMyFeaturedHistory,
  canAdBeFeatured,
  
  // Públicos
  getFeaturedForHomepage,
  getFeaturedForResults,
  getFeaturedForDetail,
  
  // Promociones
  checkPromoStatus,
  claimPromoCredits,
  
  // Config
  getFeaturedSettings,
  getMainCategories,
};
