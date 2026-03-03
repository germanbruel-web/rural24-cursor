/**
 * POST /api/payments/mercadopago/webhook
 * Recibe notificaciones IPN de MercadoPago y activa el aviso destacado.
 * =====================================================================
 *
 * - Sin autenticación (llamado por MP, no por el usuario)
 * - Idempotente: verifica que el payment_id no haya sido procesado ya
 * - Siempre retorna 200 para evitar reintentos de MP en errores lógicos
 * - Activa el featured_ad via RPC activate_featured_paid
 *
 * MP envía: POST ?id=<mp_payment_id>&type=payment
 *   o body: { action: 'payment.created', data: { id: '<mp_payment_id>' } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';

// ============================================================
// HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryType = searchParams.get('type');
    const queryId   = searchParams.get('id');

    // MP también puede enviar el evento en el body
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // body vacío es ok (MP a veces envía sin body en el ping inicial)
    }

    const eventType   = queryType || body?.type || body?.action?.split('.')?.[0];
    const mpPaymentId = queryId   || body?.data?.id;

    // Ignorar eventos que no son de pago (ej: test, merchant_order, etc.)
    if (eventType !== 'payment' || !mpPaymentId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      // Sin credenciales configuradas — loguear y salir (no reintentar)
      console.warn('[mp/webhook] MERCADOPAGO_ACCESS_TOKEN no configurado');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 1. Obtener el pago desde la API de MercadoPago para verificar su estado
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${mpPaymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!mpResponse.ok) {
      console.error('[mp/webhook] Error fetching MP payment:', mpPaymentId, mpResponse.status);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const mpPayment = await mpResponse.json();

    // 2. Solo procesar pagos aprobados
    if (mpPayment.status !== 'approved') {
      return NextResponse.json({ received: true, status: mpPayment.status }, { status: 200 });
    }

    // 3. external_reference = nuestro payment UUID
    const internalPaymentId = mpPayment.external_reference;
    if (!internalPaymentId) {
      console.error('[mp/webhook] external_reference vacío en MP payment:', mpPaymentId);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const supabase = getSupabaseClient();

    // 4. Buscar el registro interno de pago
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, user_id, amount, status, metadata')
      .eq('id', internalPaymentId)
      .single();

    if (paymentError || !payment) {
      console.error('[mp/webhook] Payment no encontrado:', internalPaymentId);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 5. Idempotencia: ya procesado
    if (payment.status === 'completed') {
      return NextResponse.json({ received: true, message: 'already_processed' }, { status: 200 });
    }

    // 6. Validar monto (seguridad anti-tamper)
    const mpAmount = mpPayment.transaction_amount;
    if (Math.abs(mpAmount - payment.amount) > 1) {
      console.error('[mp/webhook] Monto no coincide:', { mpAmount, expected: payment.amount });
      await supabase
        .from('payments')
        .update({ status: 'failed', admin_notes: `Monto MP (${mpAmount}) ≠ esperado (${payment.amount})` })
        .eq('id', internalPaymentId);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 7. Extraer datos del aviso desde metadata del payment
    const metadata = payment.metadata as {
      ad_id: string;
      tier: string;
      periods: number;
    };

    if (!metadata?.ad_id || !metadata?.tier || !metadata?.periods) {
      console.error('[mp/webhook] Metadata inválida en payment:', internalPaymentId);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 8. Activar el featured_ad via RPC (idempotente internamente)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('activate_featured_paid', {
      p_user_id:    payment.user_id,
      p_ad_id:      metadata.ad_id,
      p_tier:       metadata.tier,
      p_periods:    metadata.periods,
      p_payment_id: internalPaymentId,
    });

    if (rpcError) {
      console.error('[mp/webhook] RPC activate_featured_paid error:', rpcError.message);
      // No marcar como failed — MP reintentará y el RPC es idempotente
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const result = typeof rpcResult === 'string' ? JSON.parse(rpcResult) : rpcResult;

    if (!result?.success) {
      console.error('[mp/webhook] RPC retornó error:', result?.error);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 9. Marcar payment como completado
    await supabase
      .from('payments')
      .update({
        status:      'completed',
        external_id: String(mpPaymentId),
        completed_at: new Date().toISOString(),
      })
      .eq('id', internalPaymentId);

    console.info('[mp/webhook] Destacado activado:', {
      payment_id:  internalPaymentId,
      featured_id: result.featured_id,
      user_id:     payment.user_id,
      tier:        metadata.tier,
    });

    return NextResponse.json({ received: true, featured_id: result.featured_id }, { status: 200 });
  } catch (err) {
    console.error('[mp/webhook] Unexpected error:', err);
    // Siempre 200 para que MP no reintente indefinidamente
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
