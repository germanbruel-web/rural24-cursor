/**
 * POST /api/coupons/redeem
 * Canjear un cupón de créditos/membresía
 * ========================================
 * 
 * - Requiere autenticación (Bearer token)
 * - userId se extrae del JWT (NO del body)
 * - Invoca RPC `redeem_coupon` con service_role key
 * - Transacción atómica en DB (SECURITY DEFINER)
 * 
 * Body: { code: string }
 * Response: { success, credits_granted, new_balance, message } | { error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/auth/guard';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { z } from 'zod';

// ============================================================
// INPUT VALIDATION
// ============================================================

const RedeemCouponSchema = z.object({
  code: z
    .string()
    .min(1, 'El código del cupón es obligatorio')
    .max(50, 'El código no puede tener más de 50 caracteres')
    .transform((val) => val.toUpperCase().trim()),
});

// ============================================================
// HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      // 1. Parsear y validar input
      const body = await request.json();
      const parsed = RedeemCouponSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { code } = parsed.data;

      // 2. Invocar RPC atómica con service_role key
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('redeem_coupon', {
        p_user_id: user.id,
        p_code: code,
      });

      if (error) {
        console.error('[coupons/redeem] RPC error:', error.message);
        return NextResponse.json(
          { error: 'Error al procesar el canje del cupón' },
          { status: 500 }
        );
      }

      // 3. La RPC retorna JSON con { success, error?, credits_granted?, ... }
      const result = typeof data === 'string' ? JSON.parse(data) : data;

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'No se pudo canjear el cupón' },
          { status: 400 }
        );
      }

      // 4. Respuesta exitosa
      return NextResponse.json({
        success: true,
        credits_granted: result.credits_granted || 0,
        membership_granted: result.membership_granted || false,
        new_balance: result.new_balance || 0,
        message: result.message || '¡Cupón canjeado exitosamente!',
      });
    } catch (err) {
      console.error('[coupons/redeem] Unexpected error:', err);
      return NextResponse.json(
        { error: 'Error inesperado al canjear cupón' },
        { status: 500 }
      );
    }
  });
}
