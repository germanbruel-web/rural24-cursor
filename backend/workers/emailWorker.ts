/**
 * Email Worker — Rural24
 *
 * Background worker que procesa la email_queue cada 2 minutos.
 * Se inicia desde instrumentation.ts al arrancar el servidor.
 *
 * Patrón: fire-and-forget con globalThis guard para evitar múltiples instancias
 * en hot-reload de desarrollo.
 */

import { logger } from '@/infrastructure/logger';

const INTERVAL_MS   = 2 * 60 * 1000; // 2 minutos
const WORKER_FLAG   = '_rural24EmailWorkerStarted';
const BACKEND_URL   = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const CRON_SECRET   = process.env.CRON_SECRET;

async function processQueue(): Promise<void> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/cron/process-email-queue`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'x-cron-secret': CRON_SECRET || '',
      },
    });

    if (!res.ok) {
      logger.warn(`[EmailWorker] Respuesta no-OK: ${res.status}`);
      return;
    }

    const data = await res.json();

    // Solo loguear si hubo actividad
    if (data.processed > 0) {
      logger.info(`[EmailWorker] Ciclo completado — sent: ${data.sent}, failed: ${data.failed}`);
    }
  } catch (error: any) {
    // No lanzar — el worker no debe romper el servidor
    logger.error('[EmailWorker] Error en ciclo:', error.message);
  }
}

export function startEmailWorker(): void {
  // Guard: evitar múltiples instancias en hot-reload
  if ((globalThis as any)[WORKER_FLAG]) return;
  (globalThis as any)[WORKER_FLAG] = true;

  logger.info(`[EmailWorker] Iniciado — ciclo cada ${INTERVAL_MS / 60000} min`);

  // Primer ciclo: esperar 30 seg para que el servidor termine de arrancar
  setTimeout(() => {
    processQueue();
    setInterval(processQueue, INTERVAL_MS);
  }, 30_000);
}
