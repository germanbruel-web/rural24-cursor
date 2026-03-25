/**
 * POST /api/cron/process-email-queue
 *
 * Procesa la cola de emails pendientes.
 * Llamado por:
 *   1. Background worker en instrumentation.ts (cada 15 min, proceso del servidor)
 *   2. Manualmente desde el Sync Panel (debugging)
 *
 * Protección: X-Cron-Secret header (igual que featured-ads/cron).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { sendFeaturedActivatedEmail, sendWelcomeEmail } from '@/services/emailService';
import { logger } from '@/infrastructure/logger';

const CRON_SECRET  = process.env.CRON_SECRET;
const isProduction = process.env.NODE_ENV === 'production';

interface QueueItem {
  id:         string;
  type:       string;
  to_user_id: string;
  to_email:   string;
  to_name:    string;
  payload:    Record<string, any>;
  attempts:   number;
}

export async function POST(request: NextRequest) {
  // Auth
  const secret    = request.headers.get('x-cron-secret');
  const isLocal   = !isProduction && request.headers.get('host')?.includes('localhost');
  const validAuth = (CRON_SECRET && secret === CRON_SECRET) || isLocal;

  if (!validAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  const startedAt = Date.now();

  try {
    // 1. Obtener lote de emails pendientes (max 20 por ciclo)
    const { data: items, error: dequeueError } = await supabase
      .rpc('dequeue_emails', { p_limit: 20 });

    if (dequeueError) throw dequeueError;
    if (!items || items.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'Cola vacía' });
    }

    logger.info(`[EmailQueue] Procesando ${items.length} emails pendientes...`);

    let sent = 0;
    let failed = 0;

    // 2. Enviar cada email
    for (const item of items as QueueItem[]) {
      try {
        if (item.type === 'featured_activated') {
          await sendFeaturedActivatedEmail({
            to:        item.to_email,
            toName:    item.to_name,
            adTitle:   item.payload.ad_title  || 'Tu aviso',
            adSlug:    item.payload.ad_slug   || item.payload.ad_id,
            expiresAt: item.payload.expires_at,
          });
        } else if (item.type === 'welcome') {
          await sendWelcomeEmail({
            to:        item.to_email,
            toName:    item.to_name,
            firstName: item.payload.first_name || '',
          });
        }

        await supabase.rpc('mark_email_sent', { p_id: item.id });
        sent++;
      } catch (err: any) {
        logger.error(`[EmailQueue] Error procesando ${item.id}:`, err.message);
        await supabase.rpc('mark_email_failed', { p_id: item.id, p_error: err.message });
        failed++;
      }
    }

    const duration = Date.now() - startedAt;
    logger.info(`[EmailQueue] Completado en ${duration}ms — sent: ${sent}, failed: ${failed}`);

    return NextResponse.json({
      success: true,
      processed: items.length,
      sent,
      failed,
      duration_ms: duration,
    });

  } catch (error: any) {
    logger.error('[EmailQueue] Error general:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
