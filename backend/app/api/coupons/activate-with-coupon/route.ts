/**
 * POST /api/coupons/activate-with-coupon
 * Activa un destacado usando un cupón de descuento total (discount_type='full').
 * Para cupones con descuento parcial, el flujo pasa por MercadoPago.
 * ============================================================================
 *
 * - Requiere autenticación (Bearer token)
 * - Llama a RPC activate_featured_with_coupon (RPC es idempotente por user+coupon)
 * - Retorna: { success, featured_id } | { error }
 *
 * Body:     { ad_id: string, tier: 'alta'|'media'|'baja', coupon_code: string }
 * Response: { success, featured_id } | { error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/auth/guard';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { z } from 'zod';

const Schema = z.object({
  ad_id:       z.string().uuid('ad_id debe ser un UUID válido'),
  tier:        z.enum(['alta', 'media', 'baja']),
  coupon_code: z.string().min(1).max(50),
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body   = await request.json();
      const parsed = Schema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { ad_id, tier, coupon_code } = parsed.data;
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.rpc('activate_featured_with_coupon', {
        p_user_id:     user.id,
        p_ad_id:       ad_id,
        p_tier:        tier,
        p_coupon_code: coupon_code.toUpperCase().trim(),
        p_payment_id:  null,
      });

      if (error) {
        console.error('[coupons/activate-with-coupon] RPC error:', error.message);
        return NextResponse.json(
          { error: 'Error al activar el destacado' },
          { status: 500 }
        );
      }

      const result = typeof data === 'string' ? JSON.parse(data) : data;

      if (!result?.success) {
        return NextResponse.json(
          { error: result?.error ?? 'No se pudo activar el destacado' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success:    true,
        featured_id: result.featured_id,
        price_ars:  result.price_ars,
      });
    } catch (err) {
      console.error('[coupons/activate-with-coupon] Unexpected error:', err);
      return NextResponse.json(
        { error: 'Error inesperado al activar' },
        { status: 500 }
      );
    }
  });
}
