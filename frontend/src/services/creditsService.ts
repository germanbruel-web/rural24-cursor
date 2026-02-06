/**
 * creditsService.ts
 * Gestión de créditos y destacados
 * ====================================
 */

import { supabase } from './supabaseClient';

// ============================================
// TIPOS
// ============================================

export interface UserCredits {
  user_id: string;
  balance: number;
  monthly_allowance: number;
  last_monthly_reset: string | null;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'monthly_grant' | 'promo_grant' | 'spend' | 'refund';
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export interface FeaturedDuration {
  days: number;
  credits: number;
  label: string;
}

export interface CreditsConfig {
  credit_base_price: number;
  featured_durations: FeaturedDuration[];
  promo_signup_active: boolean;
  promo_signup_credits: number;
  promo_signup_expiry_days: number;
}

// ============================================
// CONFIGURACIÓN
// ============================================

/**
 * Obtener configuración completa de créditos
 */
export async function getCreditsConfig(): Promise<CreditsConfig> {
  try {
    const { data, error } = await supabase
      .from('global_config')
      .select('key, value, value_type')
      .in('category', ['credits', 'featured', 'promo']);

    if (error) throw error;

    const config: any = {};
    data?.forEach(row => {
      if (row.value_type === 'json') {
        config[row.key] = JSON.parse(row.value);
      } else if (row.value_type === 'integer') {
        config[row.key] = parseInt(row.value);
      } else if (row.value_type === 'boolean') {
        config[row.key] = row.value === 'true';
      } else if (row.value_type === 'decimal') {
        config[row.key] = parseFloat(row.value);
      } else {
        config[row.key] = row.value;
      }
    });

    return {
      credit_base_price: config.credit_base_price || 2500,
      featured_durations: config.featured_durations || [
        { days: 7, credits: 1, label: '1 semana' },
        { days: 14, credits: 2, label: '2 semanas' },
        { days: 21, credits: 3, label: '3 semanas' },
        { days: 28, credits: 4, label: '4 semanas' }
      ],
      promo_signup_active: config.promo_signup_active ?? true,
      promo_signup_credits: config.promo_signup_credits || 3,
      promo_signup_expiry_days: config.promo_signup_expiry_days || 30
    };
  } catch (error) {
    console.error('Error obteniendo config:', error);
    return {
      credit_base_price: 2500,
      featured_durations: [
        { days: 7, credits: 1, label: '1 semana' },
        { days: 14, credits: 2, label: '2 semanas' },
        { days: 21, credits: 3, label: '3 semanas' },
        { days: 28, credits: 4, label: '4 semanas' }
      ],
      promo_signup_active: true,
      promo_signup_credits: 3,
      promo_signup_expiry_days: 30
    };
  }
}

/**
 * Calcular precio dinámicamente
 * Créditos × Precio Base
 */
export async function calculateCreditPrice(credits: number): Promise<number> {
  const config = await getCreditsConfig();
  return credits * config.credit_base_price;
}

// ============================================
// BALANCE Y CRÉDITOS
// ============================================

/**
 * Obtener balance del usuario
 */
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error obteniendo créditos:', error);
      return null;
    }

    return data || {
      user_id: userId,
      balance: 0,
      monthly_allowance: 0,
      last_monthly_reset: null
    };
  } catch (error) {
    console.error('Error en getUserCredits:', error);
    return null;
  }
}

/**
 * Comprar créditos
 */
export async function purchaseCredits(
  userId: string,
  credits: number,
  paymentId: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('purchase_credits', {
      p_user_id: userId,
      p_credits: credits,
      p_payment_id: paymentId
    });

    if (error) {
      console.error('Error comprando créditos:', error);
      return { success: false, error: error.message };
    }

    return {
      success: data.success,
      newBalance: data.new_balance,
      error: data.error
    };
  } catch (error) {
    console.error('Error en purchaseCredits:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================
// DESTACADOS
// ============================================

/**
 * Destacar aviso usando créditos
 */
export async function activateFeaturedWithCredits(
  userId: string,
  adId: string,
  durationDays: number
): Promise<{
  success: boolean;
  featuredId?: string;
  newBalance?: number;
  error?: string;
  expiresAt?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('activate_featured_with_credits', {
      p_user_id: userId,
      p_ad_id: adId,
      p_duration_days: durationDays
    });

    if (error) {
      console.error('Error activando destacado:', error);
      return { success: false, error: error.message };
    }

    return {
      success: data.success,
      featuredId: data.featured_id,
      newBalance: data.new_balance,
      expiresAt: data.expires_at,
      error: data.error
    };
  } catch (error) {
    console.error('Error en activateFeaturedWithCredits:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Obtener destacados para página de resultados
 */
export async function getFeaturedAdsForResults(
  categoryId: string,
  subcategoryId?: string
): Promise<any[]> {
  try {
    const { data: featuredIds, error: rpcError } = await supabase.rpc(
      'get_featured_for_results_simple',
      {
        p_category_id: categoryId,
        p_subcategory_id: subcategoryId || null
      }
    );

    if (rpcError) {
      console.error('Error obteniendo destacados:', rpcError);
      return [];
    }

    if (!featuredIds || featuredIds.length === 0) {
      return [];
    }

    // Obtener avisos completos
    const adIds = featuredIds.map((f: any) => f.ad_id);
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select(
        `*,
        users!inner(id, full_name, email),
        categories!inner(id, name, display_name),
        subcategories(id, name, display_name)`
      )
      .in('id', adIds);

    if (adsError) {
      console.error('Error obteniendo avisos:', adsError);
      return [];
    }

    // Ordenar según FeaturedIds (FIFO)
    return adIds
      .map(id => ads?.find(ad => ad.id === id))
      .filter(Boolean);
  } catch (error) {
    console.error('Error en getFeaturedAdsForResults:', error);
    return [];
  }
}

/**
 * Cancelar destacado
 */
export async function cancelFeatured(
  adId: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let query = supabase
      .from('featured_ads')
      .update({ status: 'cancelled' })
      .eq('ad_id', adId)
      .eq('status', 'active');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error cancelando destacado:', error);
      return { success: false, error: 'Error al cancelar' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en cancelFeatured:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================
// TRANSACCIONES
// ============================================

/**
 * Obtener historial de transacciones
 */
export async function getCreditTransactions(
  userId: string,
  limit: number = 50
): Promise<CreditTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error obteniendo transacciones:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en getCreditTransactions:', error);
    return [];
  }
}

// ============================================
// PROMOCIONES E INICIALIZACIÓN
// ============================================

/**
 * Otorgar promo de bienvenida
 */
export async function grantSignupPromo(userId: string): Promise<{
  success: boolean;
  creditsGranted?: number;
  newBalance?: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('grant_signup_promo', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error otorgando promo:', error);
      return { success: false, error: error.message };
    }

    return {
      success: data.success,
      creditsGranted: data.credits_granted,
      newBalance: data.new_balance,
      error: data.error
    };
  } catch (error) {
    console.error('Error en grantSignupPromo:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Obtener planes de membresía
 */
export async function getMembershipPlans() {
  try {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo planes:', error);
    return [];
  }
}
