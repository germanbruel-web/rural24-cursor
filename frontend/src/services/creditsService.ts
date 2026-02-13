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

// ============================================
// PERIODO DE FACTURACIÓN
// ============================================

/**
 * Calcular días restantes en el periodo de facturación del usuario
 * El periodo es de 30 días desde la última recarga mensual o el registro
 */
export async function getDaysRemainingInBillingPeriod(userId: string): Promise<number> {
  try {
    // Obtener créditos del usuario para verificar last_monthly_reset
    const credits = await getUserCredits(userId);
    
    if (!credits) {
      // Si no tiene registro, asumir que tiene 30 días
      return 30;
    }

    // Determinar la fecha de inicio del periodo
    let periodStartDate: Date;
    
    if (credits.last_monthly_reset) {
      periodStartDate = new Date(credits.last_monthly_reset);
    } else {
      // Si nunca tuvo reset, buscar fecha de registro del usuario
      const { data: userData, error } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (error || !userData) {
        console.error('Error obteniendo fecha de usuario:', error);
        return 30; // Default a 30 días
      }

      periodStartDate = new Date(userData.created_at);
    }

    // Calcular fecha de fin del periodo (30 días después del inicio)
    const periodEndDate = new Date(periodStartDate);
    periodEndDate.setDate(periodEndDate.getDate() + 30);

    // Calcular días restantes
    const now = new Date();
    const daysRemaining = Math.ceil((periodEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Retornar al menos 1 día si el periodo ya expiró (será renovado pronto)
    return Math.max(1, daysRemaining);
  } catch (error) {
    console.error('Error en getDaysRemainingInBillingPeriod:', error);
    return 30; // Default en caso de error
  }
}

// ============================================
// CUPONES (lee desde tabla `coupons` en Supabase)
// ============================================

export interface CouponValidation {
  valid: boolean;
  credits?: number;
  description?: string;
  error?: string;
  couponId?: string;
}

/**
 * Validar un cupón contra la base de datos
 */
export async function validateCoupon(code: string): Promise<CouponValidation> {
  try {
    const upperCode = code.toUpperCase().trim();
    if (!upperCode) {
      return { valid: false, error: 'Ingresa un código de cupón' };
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('id, code, name, description, credits_amount, max_redemptions, current_redemptions, expires_at, is_active')
      .eq('code', upperCode)
      .single();

    if (error || !coupon) {
      return { valid: false, error: 'Cupón inválido o no encontrado' };
    }

    if (!coupon.is_active) {
      return { valid: false, error: 'Este cupón está desactivado' };
    }

    if (new Date(coupon.expires_at) < new Date()) {
      return { valid: false, error: 'Este cupón ha expirado' };
    }

    if (coupon.current_redemptions >= coupon.max_redemptions) {
      return { valid: false, error: 'Este cupón ya alcanzó el máximo de canjes' };
    }

    return {
      valid: true,
      credits: coupon.credits_amount,
      description: coupon.description || coupon.name,
      couponId: coupon.id,
    };
  } catch (error) {
    console.error('Error validando cupón:', error);
    return { valid: false, error: 'Error al validar cupón' };
  }
}

/**
 * Canjear cupón de créditos (DB-backed)
 */
export async function redeemCoupon(
  userId: string,
  code: string
): Promise<{
  success: boolean;
  creditsGranted?: number;
  newBalance?: number;
  error?: string;
}> {
  try {
    const validation = await validateCoupon(code);
    
    if (!validation.valid || !validation.couponId) {
      return { success: false, error: validation.error || 'Cupón inválido' };
    }

    // Verificar si el usuario ya canjeó este cupón
    const { data: existingRedemption } = await supabase
      .from('coupon_redemptions')
      .select('id')
      .eq('coupon_id', validation.couponId)
      .eq('user_id', userId)
      .limit(1);

    if (existingRedemption && existingRedemption.length > 0) {
      return { success: false, error: 'Ya canjeaste este cupón' };
    }

    const creditsToGrant = validation.credits || 0;

    // Obtener balance actual
    const currentCredits = await getUserCredits(userId);
    const currentBalance = currentCredits?.balance || 0;
    const newBalance = currentBalance + creditsToGrant;

    // Actualizar balance del usuario
    const { error: updateError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        balance: newBalance,
        monthly_allowance: currentCredits?.monthly_allowance || 0,
        last_monthly_reset: currentCredits?.last_monthly_reset || null,
      });

    if (updateError) {
      console.error('Error actualizando balance:', updateError);
      return { success: false, error: 'Error al otorgar créditos' };
    }

    // Registrar en coupon_redemptions
    await supabase
      .from('coupon_redemptions')
      .insert({
        coupon_id: validation.couponId,
        user_id: userId,
        credits_granted: creditsToGrant,
      });

    // Incrementar current_redemptions en el cupón
    await supabase.rpc('increment_coupon_redemptions', { coupon_uuid: validation.couponId })
      .then(({ error }) => {
        // Si no existe la función RPC, hacer update manual
        if (error) {
          supabase
            .from('coupons')
            .update({ current_redemptions: (currentCredits as any)?.current_redemptions + 1 || 1 })
            .eq('id', validation.couponId);
        }
      });

    // Registrar transacción de créditos
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'promo_grant',
        amount: creditsToGrant,
        balance_after: newBalance,
        description: `Cupón canjeado: ${code.toUpperCase()} - ${validation.description}`,
        promo_code: code.toUpperCase(),
      });

    return {
      success: true,
      creditsGranted: creditsToGrant,
      newBalance,
    };
  } catch (error) {
    console.error('Error en redeemCoupon:', error);
    return { success: false, error: 'Error inesperado al canjear cupón' };
  }
}
