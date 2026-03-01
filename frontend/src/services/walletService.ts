/**
 * walletService.ts
 * Gestión del saldo ARS para publicidad
 * =====================================
 * Reemplaza creditsService.ts en toda operación de saldo.
 *
 * Tabla canónica: user_wallets (virtual_balance en ARS)
 * Ledger:         wallet_transactions
 * NO usa: user_credits, user_featured_credits, credit_transactions
 */

import { supabase } from './supabaseClient';

// ============================================================
// TIPOS
// ============================================================

export interface WalletBalance {
  user_id: string;
  virtual_balance: number;   // ARS para publicidad (cupones/promos)
  real_balance: number;      // ARS post-MercadoPago (Fase 3)
  currency: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  bucket: 'virtual' | 'real';
  tx_type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  source: 'coupon' | 'mercadopago' | 'featured_spend' | 'admin_adjustment' | 'promo';
  description: string;
  created_at: string;
}

export interface CouponValidation {
  valid: boolean;
  arsAmount?: number;
  description?: string;
  error?: string;
}

export interface FeaturedDuration {
  days: number;
  price_ars: number;
  label: string;
}

// ============================================================
// WALLET BALANCE
// ============================================================

/**
 * Obtener saldo ARS del usuario desde user_wallets.
 * Retorna { virtual_balance: 0 } si no existe aún el registro.
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance | null> {
  try {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('user_id, virtual_balance, real_balance, currency')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error obteniendo wallet:', error);
      return null;
    }

    return data ?? {
      user_id: userId,
      virtual_balance: 0,
      real_balance: 0,
      currency: 'ARS',
    };
  } catch (err) {
    console.error('Error en getWalletBalance:', err);
    return null;
  }
}

// ============================================================
// TRANSACCIONES
// ============================================================

/**
 * Historial de movimientos desde wallet_transactions (ledger).
 */
export async function getWalletTransactions(
  userId: string,
  limit = 10
): Promise<WalletTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error obteniendo transacciones:', error);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.error('Error en getWalletTransactions:', err);
    return [];
  }
}

// ============================================================
// CUPONES
// ============================================================

/**
 * Preview de cupón — lectura informativa (read-only).
 * Lee coupons.ars_amount.
 * NO valida cupo ni redenciones por usuario (eso hace el RPC).
 */
export async function validateCoupon(code: string): Promise<CouponValidation> {
  try {
    const upperCode = code.toUpperCase().trim();
    if (!upperCode) {
      return { valid: false, error: 'Ingresá un código de cupón' };
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('code, name, description, ars_amount, expires_at, is_active')
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

    if (!coupon.ars_amount || coupon.ars_amount <= 0) {
      return { valid: false, error: 'Cupón inválido' };
    }

    return {
      valid: true,
      arsAmount: Number(coupon.ars_amount),
      description: coupon.description || coupon.name,
    };
  } catch (err) {
    console.error('Error validando cupón:', err);
    return { valid: false, error: 'Error al validar cupón' };
  }
}

/**
 * Canjear cupón — invoca POST /api/coupons/redeem.
 * El RPC acredita coupons.ars_amount en user_wallets.virtual_balance.
 * El frontend NUNCA escribe en wallet directamente.
 */
export async function redeemCoupon(code: string): Promise<{
  success: boolean;
  arsCredited?: number;
  newBalance?: number;
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { success: false, error: 'Debés estar autenticado para canjear cupones' };
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
      return { success: false, error: data.error || 'Error al canjear el cupón' };
    }

    return {
      success: true,
      arsCredited: data.ars_credited ?? 0,
      newBalance: data.new_balance ?? 0,
    };
  } catch (err) {
    console.error('Error en redeemCoupon:', err);
    return { success: false, error: 'Error inesperado al canjear cupón' };
  }
}

// ============================================================
// FEATURED — usar saldo ARS
// ============================================================

/**
 * Destacar aviso usando saldo ARS de user_wallets.
 * Invoca RPC activate_featured_with_credits (actualizado en migration).
 */
export async function activateFeaturedWithBalance(
  userId: string,
  adId: string,
  durationDays: number
): Promise<{
  success: boolean;
  featuredId?: string;
  newBalance?: number;
  expiresAt?: string;
  priceArs?: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('activate_featured_with_credits', {
      p_user_id:      userId,
      p_ad_id:        adId,
      p_duration_days: durationDays,
    });

    if (error) {
      console.error('Error activando destacado:', error);
      return { success: false, error: error.message };
    }

    return {
      success:    data.success,
      featuredId: data.featured_id,
      newBalance: data.new_balance,
      expiresAt:  data.expires_at,
      priceArs:   data.price_ars,
      error:      data.error,
    };
  } catch (err) {
    console.error('Error en activateFeaturedWithBalance:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Obtener opciones de duración con precios en ARS.
 */
export async function getFeaturedDurations(): Promise<FeaturedDuration[]> {
  const fallback: FeaturedDuration[] = [
    { days: 7,  price_ars: 2500,  label: '1 semana' },
    { days: 14, price_ars: 5000,  label: '2 semanas' },
    { days: 21, price_ars: 7500,  label: '3 semanas' },
    { days: 28, price_ars: 10000, label: '4 semanas' },
  ];

  try {
    const { data, error } = await supabase
      .from('global_config')
      .select('value')
      .eq('key', 'featured_durations')
      .single();

    if (error || !data) return fallback;

    const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Formatear importe en ARS para mostrar en UI.
 * Ejemplo: 50000 → "$50.000"
 */
export function formatARS(amount: number): string {
  return '$' + new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
