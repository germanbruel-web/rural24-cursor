/**
 * Next.js Instrumentation — Rural24 Backend
 * Se ejecuta UNA VEZ cuando el servidor arranca (Render, local).
 *
 * Inicia el worker de email queue: revisa y envía emails pendientes
 * cada 15 minutos mientras el servidor esté activo.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Solo en runtime Node.js (no en Edge)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { startEmailWorker } = await import('./workers/emailWorker');
  startEmailWorker();
}
