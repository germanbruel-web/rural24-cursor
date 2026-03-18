# Sprint: Sistema de Límite de Contacto por Aviso
> Fecha: 2026-03-18 | Estado: ✅ Implementado en DEV

## Problema
El formulario de contacto permitía spam ilimitado al mismo vendedor por el mismo aviso.
No había feedback claro sobre el estado de la conversación.

## Arquitectura — 3 capas

```
localStorage (inmediato) → RPC get_ad_contact_status (fuente de verdad) → thread.is_reply (unlock)
```

## 5 Estados del formulario

| Estado | Condición | UX |
|---|---|---|
| `available` | nunca contactó | form normal |
| `sending` | enviando | spinner + disabled |
| `pending` | envió, sin respuesta | chip amber + botón "Ver en Mensajes" |
| `replied` | vendedor respondió | chip verde + botón "Continuar conversación" |
| `blocked` | límite global alcanzado | mensaje de error |

## DB — Migración 20260318000001

### Trigger `trg_set_thread_id`
- BEFORE INSERT en `contact_messages`
- Si `is_reply = false` y `thread_id IS NULL` → `thread_id = id` (self-ref)
- Backfill de mensajes existentes

### RPC `get_ad_contact_status(p_user_id, p_ad_id)`
- Busca mensaje raíz del user para ese ad
- Si no existe → `{ status: 'available' }`
- Si existe y tiene reply del vendedor → `{ status: 'replied', replied_at }`
- Si existe sin reply → `{ status: 'pending', sent_at }`

## Archivos creados/modificados

| Archivo | Tipo |
|---|---|
| `supabase/migrations/20260318000001_contact_thread_and_status_rpc.sql` | Migración DB |
| `frontend/src/services/adContactStatusService.ts` | Service + cache localStorage |
| `frontend/src/hooks/useAdContactStatus.ts` | Hook React |
| `frontend/src/components/pages/AdDetail.tsx` | Integración UI |

## Cache localStorage
- Key: `r24_contact_{userId}_{adId}`
- Respuesta inmediata sin network en revisitas
- Se sincroniza con servidor en cada mount (puede haber reply nueva)
- Unlock: cuando servidor retorna `replied`, actualiza cache automáticamente

## Pendiente
- [ ] Aplicar migración a PROD (confirmar con usuario)
- [ ] Inbox: botón de reply en mensajes recibidos (para que vendor pueda responder y desbloquear)
- [ ] Notificación push/email cuando el vendedor responde
