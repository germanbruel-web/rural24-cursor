/**
 * POST /api/payments/mercadopago/preference
 * Crea una preferencia de pago en MercadoPago para destacar un aviso.
 * =====================================================================
 *
 * - Requiere autenticación (Bearer token)
 * - Valida tier y disponibilidad de slot
 * - Crea registro en `payments` (status: 'pending')
 * - Crea preference en MP y retorna init_point para redirigir al usuario
 *
 * Body:     { ad_id: string, tier: 'alta'|'media'|'baja', periods: 1|2 }
 * Response: { preference_id, init_point, payment_id } | { error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/auth/guard';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { z } from 'zod';

// ============================================================
// VALIDATION
// ============================================================

const PreferenceSchema = z.object({
  ad_id:       z.string().uuid('ad_id debe ser un UUID válido'),
  tier:        z.enum(['alta', 'media', 'baja']),
  periods:     z.union([z.literal(1), z.literal(2)]),
  coupon_code: z.string().min(1).max(50).optional(),
});

// ============================================================
// HELPERS
// ============================================================

interface TierOption {
  tier: string;
  label: string;
  price_ars: number;
  placements: string[];
  description: string;
}

async function getTierPrice(supabase: any, tier: string): Promise<number | null> {
  const { data } = await supabase
    .from('global_config')
    .select('value')
    .eq('key', 'tier_config')
    .single();

  if (!data?.value) return null;
  const config: TierOption[] = typeof data.value === 'string'
    ? JSON.parse(data.value)
    : data.value;

  return config.find((t) => t.tier === tier)?.price_ars ?? null;
}

// ============================================================
// HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      // 1. Parsear y validar input
      const body = await request.json();
      const parsed = PreferenceSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { ad_id, tier, periods, coupon_code } = parsed.data;
      const supabase = getSupabaseClient();

      // 2. Leer precio del tier desde global_config
      const pricePerPeriod = await getTierPrice(supabase, tier);
      if (!pricePerPeriod) {
        return NextResponse.json(
          { error: 'Tier no encontrado en configuración' },
          { status: 400 }
        );
      }
      const baseAmount = pricePerPeriod * periods;

      // 2b. Si hay cupón, validarlo y aplicar descuento
      let totalAmount   = baseAmount;
      let couponApplied = false;

      if (coupon_code) {
        const { data: couponData } = await supabase.rpc('validate_coupon_for_checkout', {
          p_code:       coupon_code.toUpperCase().trim(),
          p_tier:       tier,
          p_base_price: baseAmount,
        });

        const couponResult = typeof couponData === 'string' ? JSON.parse(couponData) : couponData;

        if (couponResult?.valid) {
          totalAmount   = couponResult.effective_price as number;
          couponApplied = true;
        }
        // Si el cupón no es válido, continuamos con precio completo (sin bloquear)
      }

      // 3. Verificar que el aviso existe y pertenece al usuario
      const { data: ad, error: adError } = await supabase
        .from('ads')
        .select('id, title, user_id')
        .eq('id', ad_id)
        .single();

      if (adError || !ad) {
        return NextResponse.json({ error: 'Aviso no encontrado' }, { status: 404 });
      }

      if (ad.user_id !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      // 4. Verificar disponibilidad de slot
      const { data: slotData } = await supabase.rpc('get_featured_slot_availability', {
        p_ad_id: ad_id,
        p_tier:  tier,
      });

      if (slotData && slotData.can_purchase === false) {
        return NextResponse.json(
          { error: 'No es posible destacar este aviso en este momento (límite de períodos alcanzado)' },
          { status: 409 }
        );
      }

      // 5. Crear registro en payments (status: 'pending')
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id:        user.id,
          payment_type:   'featured_ad',
          amount:         totalAmount,
          currency:       'ARS',
          status:         'pending',
          payment_method: 'mercadopago',
          description:    `Destacado ${tier.toUpperCase()} — ${ad.title} (${periods * 15} días)`,
          metadata: {
            ad_id,
            tier,
            periods,
            ad_title:     ad.title,
            coupon_code:  coupon_code ?? null,
            coupon_applied: couponApplied,
            base_amount:  baseAmount,
          },
        })
        .select('id')
        .single();

      if (paymentError || !payment) {
        console.error('[mp/preference] Error creando payment:', paymentError?.message);
        return NextResponse.json(
          { error: 'Error al registrar el pago' },
          { status: 500 }
        );
      }

      const paymentId = payment.id;

      // 6. Crear preferencia en MercadoPago (lazy init — no falla en CI)
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!accessToken) {
        // En CI / sin credenciales: devolver error controlado
        await supabase.from('payments').update({ status: 'cancelled' }).eq('id', paymentId);
        return NextResponse.json(
          { error: 'Pasarela de pago no configurada' },
          { status: 503 }
        );
      }

      const { MercadoPagoConfig, Preference } = await import('mercadopago');
      const mpClient = new MercadoPagoConfig({ accessToken });
      const preferenceClient = new Preference(mpClient);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const backendUrl  = process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001';
      const isProduction = process.env.NODE_ENV === 'production';

      const preference = await preferenceClient.create({
        body: {
          items: [
            {
              id:          ad_id,
              title:       `Destacado ${tier.toUpperCase()} — ${ad.title}`,
              description: `${periods} período(s) de 15 días en Rural24`,
              quantity:    1,
              unit_price:  totalAmount,
              currency_id: 'ARS',
            },
          ],
          payer: {
            email: user.email,
          },
          external_reference: paymentId,
          back_urls: {
            success: `${frontendUrl}/?mp_callback=success`,
            failure: `${frontendUrl}/?mp_callback=failure`,
            pending: `${frontendUrl}/?mp_callback=pending`,
          },
          auto_return: 'approved',
          notification_url: `${backendUrl}/api/payments/mercadopago/webhook`,
        },
      });

      // 7. Guardar preference_id en metadata del payment
      await supabase
        .from('payments')
        .update({
          metadata: {
            ad_id,
            tier,
            periods,
            ad_title:         ad.title,
            coupon_code:      coupon_code ?? null,
            coupon_applied:   couponApplied,
            base_amount:      baseAmount,
            mp_preference_id: preference.id,
          },
        })
        .eq('id', paymentId);

      // 8. Retornar init_point (sandbox o producción)
      const initPoint = isProduction
        ? preference.init_point
        : preference.sandbox_init_point;

      return NextResponse.json({
        preference_id: preference.id,
        init_point:    initPoint,
        payment_id:    paymentId,
      });
    } catch (err) {
      console.error('[mp/preference] Unexpected error:', err);
      return NextResponse.json(
        { error: 'Error inesperado al crear preferencia de pago' },
        { status: 500 }
      );
    }
  });
}
