# Sprint CHAT-B + UX Desktop/Mobile
> Fecha: 2026-03-18 | Estado: ✅ Completo

---

## Objetivos

1. **Notificación al vendedor** — in-app cuando llega un nuevo mensaje
2. **Enmascarado de datos sensibles** — teléfonos, emails, URLs, plataformas externas
3. **BottomNav mobile** — rediseño completo: 80px, 5 tabs, efectos activo/hover
4. **Desktop header** — Campanita reemplaza Favoritos, Chat abre overlay inline
5. **Fixes AdDetail** — `setContactMessage` dead reference + `ContactVendorButton` obsoleto

---

## DB — Migración `20260318000003_chat_b_notifications_masking.sql`

### Columna nueva
- `chat_messages.was_masked boolean DEFAULT false` — indica si el mensaje fue modificado por el filtro

### Trigger BEFORE INSERT — `trg_mask_chat_content`
Enmascara antes de guardar:
- Emails: `[dato de contacto ocultado]`
- Teléfonos AR/Latam (prefijos +54, 011, 15): `[dato de contacto ocultado]`
- URLs (http/https): `[enlace externo ocultado]`
- Plataformas (whatsapp, telegram, instagram, mercadolibre, etc.): `[plataforma externa]`

### Trigger AFTER INSERT — `trg_notify_chat_message`
- Inserta en `notifications` (tipo `nuevo_mensaje_chat`) cuando `unread_prev = 0`
- Solo notifica en la "primera acumulación" — no spamea si ya hay mensajes sin leer
- Incluye `data: { channel_id, ad_id, ad_title, sender_id }` para deep-link futuro

---

## Frontend — Cambios

### ChatWindow.tsx
- Detección client-side de contenido sensible en `onChange`
- Banner amarillo amber: "Tu mensaje contiene datos de contacto que serán ocultados automáticamente."
- `sensitiveWarning` se resetea al enviar
- Regex patterns: email, teléfono AR, URL, plataformas

### chatService.ts
- `ChatMessage.was_masked: boolean` agregado al tipo

### notificationsService.ts
- `nuevo_mensaje_chat` agregado a `getNotificationMeta` (ícono 💬, color brand-600)

---

## BottomNav.tsx — Rediseño Mobile

**Antes:** h-64px, 4 tabs (Mis Avisos, Favoritos, Publicar, Mensajes + bell flotante)
**Después:** h-80px + safe-area, 5 tabs:
```
[Mis Avisos] [Favoritos] [◉ PUBLICAR] [Chat] [Alertas]
```

**Efectos de iconos:**
- Activo: `text-brand-600` + `bg-brand-50` pill redondeada + `scale-105`
- Hover: `text-brand-400` + `bg-brand-50/60`
- Inactivo: `text-gray-400`
- strokeWidth: 2.2 activo / 1.6 inactivo

**Tab Alertas:** NotificationsPanel se abre hacia arriba (absolute bottom-full), badge rojo, polling 30s + Realtime
**Tab Chat:** badge verde brand-600 con conteo de no-leídos
**FAB Publicar:** -mt-8 desde centro de barra, w-62px, ring-4 ring-white, shadow-xl

---

## Desktop Header — UserMenu.tsx

**Antes:** `[Heart → my-ads] [MessageSquare → inbox]` + Bell standalone en HeaderNew
**Después:** `[NotificationBell] [MessageSquare → ChatList popup]`

- Heart eliminado (Favoritos sigue en sidebar dashboard)
- NotificationBell migrada de HeaderNew a UserMenu (posición izquierda de los botones rápidos)
- Click en MessageSquare abre `<ChatList>` como dropdown panel (380×520px max), no navega al dashboard
- Cierra al hacer click fuera

---

## Fixes AdDetail

- Eliminado `setContactMessage(...)` (dead ref a estado que ya no existe)
- Eliminado import `ContactVendorButton` — componente obsoleto (sistema contact_messages)
- CTA mobile reemplazado: `<ContactVendorButton>` → `{renderSidebarContactForm()}`

---

## Dead code eliminado

- `frontend/src/hooks/useAdContactStatus.ts`
- `frontend/src/services/adContactStatusService.ts`
- `supabase/migrations/20260318000001_contact_thread_and_status_rpc.sql`

---

## Commits

- `567ca90` feat(chat-b): notificaciones al vendedor + enmascarado de datos sensibles
- `d6eeb76` fix: eliminar setContactMessage muerto + reemplazar ContactVendorButton
- `1e95233` refactor(BottomNav): 4 tabs → deprecated
- `d4fa89e` fix(BottomNav): 80px + safe-area, 5 tabs
- `167cbfe` style(BottomNav): iconos activos brand-600 + pill + scale
- `dedd218` feat(desktop): campanita en lugar de Favoritos, Chat abre overlay inline

---

## Estado final

| Feature | Estado |
|---|---|
| Notificación al vendedor | ✅ DB trigger + in-app |
| Enmascarado datos sensibles | ✅ DB trigger + UI warning |
| BottomNav 80px 5 tabs | ✅ |
| Desktop Chat overlay | ✅ |
| Desktop Bell en header | ✅ |
| Dead code eliminado | ✅ |
| Migración PROD 000003 | ✅ |
