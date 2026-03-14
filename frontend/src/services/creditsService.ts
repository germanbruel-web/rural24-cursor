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
 * @deprecated Sistema legacy de créditos. Usar walletService.ts (ARS).
 * Retorna vacío sin consultar DB.
 */
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  return {
    user_id: userId,
    balance: 0,
    monthly_allowance: 0,
    last_monthly_reset: null,
  };
}

/**
 * @deprecated Sistema legacy. Compra de créditos deshabilitada.
 */
export async function purchaseCredits(
  _userId: string,
  _credits: number,
  _paymentId: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  return { success: false, error: 'Sistema de créditos legacy deshabilitado' };
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
  subcategoryId?: string,
  limit: number = 4
): Promise<any[]> {
  try {
    // Usar función RPC que retorna ads completos
    const { data, error } = await supabase.rpc(
      'get_featured_for_results',
      {
        p_category_id: categoryId,
        p_limit: limit,
        p_offset: 0
      }
    );

    if (error) {
      console.error('Error obteniendo destacados:', error);
      return [];
    }

    // La función ya retorna ads completos con relaciones
    let results = data || [];

    // Filtrar por subcategoría si se especifica
    if (subcategoryId && results.length > 0) {
      results = results.filter((ad: any) => ad.subcategory_id === subcategoryId);
    }

    return results;
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
 * @deprecated Sistema legacy. Usar walletService.getWalletTransactions() para historial ARS.
 */
export async function getCreditTransactions(
  _userId: string,
  _limit: number = 50
): Promise<CreditTransaction[]> {
  return [];
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
      .from('subscription_plans')
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

// ============================================
// PERIODO DE FACTURACIÓN
// ============================================

/**
 * @deprecated Sistema legacy. Retorna valor fijo sin consultar DB.
 */
export async function getDaysRemainingInBillingPeriod(_userId: string): Promise<number> {
  return 30;
}

// ============================================
// CUPONES
// ============================================

export interface CouponValidation {
  valid: boolean;
  /** ARS a acreditar (null si solo es membresía) */
  arsAmount?: number | null;
  /** Nombre del plan a otorgar (null si no da membresía) */
  membershipPlanName?: string | null;
  /** Duración en días de la membresía */
  membershipDays?: number;
  description?: string;
  error?: string;
  /** @deprecated usar arsAmount */
  credits?: number;
}

/**
 * Preview read-only de cupón antes de canjear.
 * NO valida límites reales ni canjes por usuario — eso lo hace el RPC.
 */
export async function validateCoupon(code: string): Promise<CouponValidation> {
  try {
    const upperCode = code.toUpperCase().trim();
    if (!upperCode) {
      return { valid: false, error: 'Ingresá un código de cupón' };
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select(`
        code, name, description,
        ars_amount, gives_membership, membership_duration_days,
        membership_plan_ids, membership_id,
        expires_at, is_active, max_redemptions, current_redemptions
      `)
      .eq('code', upperCode)
      .single();

    if (error || !coupon) {
      return { valid: false, error: 'Cupón inválido o no encontrado' };
    }

    if (!coupon.is_active) {
      return { valid: false, error: 'Este cupón está desactivado' };
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { valid: false, error: 'Este cupón ha expirado' };
    }

    if (coupon.max_redemptions != null && coupon.current_redemptions >= coupon.max_redemptions) {
      return { valid: false, error: 'Este cupón ya fue agotado' };
    }

    // Resolver nombre del plan si da membresía
    let membershipPlanName: string | null = null;
    if (coupon.gives_membership) {
      const planId = coupon.membership_plan_ids?.[0] ?? coupon.membership_id;
      if (planId) {
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('display_name')
          .eq('id', planId)
          .single();
        membershipPlanName = plan?.display_name ?? 'Premium';
      } else {
        membershipPlanName = 'Premium';
      }
    }

    return {
      valid: true,
      arsAmount: coupon.ars_amount ?? null,
      credits: coupon.ars_amount ?? 0, // compat
      membershipPlanName,
      membershipDays: coupon.membership_duration_days ?? 365,
      description: coupon.description || coupon.name,
    };
  } catch (err) {
    console.error('Error validando cupón:', err);
    return { valid: false, error: 'Error al validar cupón' };
  }
}

/**
 * Canjear cupón — invoca POST /api/coupons/redeem.
 * Toda la lógica transaccional (validación real, atomicidad, escrituras)
 * se ejecuta en backend vía RPC `redeem_coupon` con service_role key.
 * El frontend NUNCA modifica balance ni escribe redemptions directamente.
 */
export async function redeemCoupon(
  code: string
): Promise<{
  success: boolean;
  creditsGranted?: number;
  newBalance?: number;
  membershipGranted?: boolean;
  planDisplayName?: string;
  message?: string;
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { success: false, error: 'Debes estar autenticado para canjear cupones' };
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/coupons/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ code: code.toUpperCase().trim() }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Error al canjear el cupón',
      };
    }

    return {
      success: true,
      creditsGranted: data.ars_credited || 0,
      newBalance: data.new_balance || 0,
      membershipGranted: data.membership_granted ?? false,
      planDisplayName: data.plan_display_name ?? '',
      message: data.message ?? '',
    };
  } catch (error) {
    console.error('Error en redeemCoupon:', error);
    return { success: false, error: 'Error inesperado al canjear cupón' };
  }
}
