/**
 * POST /api/coupons/validate-for-checkout
 * Valida un cupón para un tier específico. Lectura pura — NO redime el cupón.
 * ============================================================================
 *
 * - Requiere autenticación (Bearer token)
 * - Llama a RPC validate_coupon_for_checkout
 * - Retorna: { valid, discount_type, discount_percent, effective_price } | { error }
 *
 * Body:     { code: string, tier: 'alta'|'media'|'baja', base_price: number }
 * Response: { valid, discount_type, discount_percent, effective_price, coupon_name } | { error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/auth/guard';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { z } from 'zod';

const Schema = z.object({
  code:       z.string().min(1, 'Código requerido').max(50),
  tier:       z.enum(['alta', 'media', 'baja']),
  base_price: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const body   = await request.json();
      const parsed = Schema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { code, tier, base_price } = parsed.data;
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.rpc('validate_coupon_for_checkout', {
        p_code:       code.toUpperCase().trim(),
        p_tier:       tier,
        p_base_price: base_price,
      });

      if (error) {
        console.error('[coupons/validate-for-checkout] RPC error:', error.message);
        return NextResponse.json(
          { error: 'Error al validar el cupón' },
          { status: 500 }
        );
      }

      const result = typeof data === 'string' ? JSON.parse(data) : data;

      if (!result?.valid) {
        return NextResponse.json(
          { valid: false, error: result?.error ?? 'Cupón inválido' },
          { status: 200 }  // 200 para que el frontend muestre el mensaje, no un error HTTP
        );
      }

      return NextResponse.json({
        valid:            true,
        discount_type:    result.discount_type,
        discount_percent: result.discount_percent,
        effective_price:  result.effective_price,
        coupon_name:      result.coupon_name,
      });
    } catch (err) {
      console.error('[coupons/validate-for-checkout] Unexpected error:', err);
      return NextResponse.json(
        { error: 'Error inesperado al validar cupón' },
        { status: 500 }
      );
    }
  });
}
