# Sprint 3D.6 — Email al activar Destacado
> Fecha: 2026-03-25 | Estado: ✅ Completo

## Objetivo
Envío de email transaccional cuando un destacado pasa de `pending` → `active`, sin servicios de pago.

---

## Arquitectura final

```
featured_ads UPDATE (pending→active)
  ↓ DB trigger
email_queue INSERT
  ↓ background worker (instrumentation.ts, cada 15min)
POST /api/cron/process-email-queue
  ↓ dequeue_emails() RPC
Zoho Mail REST API (HTTPS)
  ↓ mark_email_sent()
email_queue status = 'sent'
```

## Stack de email
- **Proveedor**: Zoho Mail Forever Free (`info@rural24.com.ar`)
- **Protocolo**: REST API HTTPS (NO SMTP — Render Free bloquea puertos TCP 465/587)
- **Auth**: OAuth2 refresh_token (no expira)
- **Librería**: fetch() nativo — sin nodemailer en producción

## Archivos creados/modificados

| Archivo | Descripción |
|---|---|
| `supabase/migrations/20260324000001_email_queue.sql` | Tabla email_queue + trigger + RPCs |
| `backend/services/emailService.ts` | Zoho OAuth2 token refresh + template HTML + sendFeaturedActivatedEmail() |
| `backend/app/api/cron/process-email-queue/route.ts` | Endpoint que procesa la cola (max 20/ciclo) |
| `backend/workers/emailWorker.ts` | Background worker: setInterval 15min |
| `backend/instrumentation.ts` | Next.js hook: inicia emailWorker al arrancar servidor |

## Variables de entorno (Render DEV y PROD)

```
ZOHO_CLIENT_ID      = 1000.B44AISGBFLWUUB3RW2KQ0IJEC3SQCQ
ZOHO_CLIENT_SECRET  = b20eb7b02390e7f2d66d8dc5f31f5518e181598b6e
ZOHO_REFRESH_TOKEN  = 1000.3ac4bcf906e1b56c7aad19b72d0d9c5a.36e445d42e93320dc5c08b730e6cd5cc
ZOHO_ACCOUNT_ID     = 3481743000000008002
ZOHO_FROM_EMAIL     = info@rural24.com.ar
```

## RPCs en Supabase

- `dequeue_emails(p_limit)` — retorna lote de emails pendientes con datos de usuario y aviso
- `mark_email_sent(p_id)` — marca como sent + registra sent_at
- `mark_email_failed(p_id, p_error)` — incrementa attempts, registra error, retry hasta 3 intentos

## Template email

- Diseño Rural24 brand (verde #65a30d)
- Datos: nombre usuario, título aviso, fecha vencimiento formateada en español (es-AR)
- CTA "Ver mi aviso" → `rural24.com.ar/#/ad/{slug}`
- Remitente: `Rural24 <info@rural24.com.ar>`

## Proceso de desbloqueo (lecciones aprendidas)

1. **SMTP port 465** bloqueado por Render Free → Connection timeout
2. Intentamos nodemailer → reemplazado por Zoho REST API
3. Zoho Self-Client OAuth → refresh_token generado una vez, reutilizado indefinidamente
4. Background worker via `instrumentation.ts` (Next.js 15) — no requiere pg_net ni cron externo

## Test confirmado
Email recibido en `germanbruel@gmail.com` desde `info@rural24.com.ar` con diseño correcto.
