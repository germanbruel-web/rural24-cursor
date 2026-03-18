# Sprint Chat P2P — Sistema de Mensajería
> Fecha: 2026-03-18 | Estado: ✅ Implementado — migración pendiente aplicar a DEV

---

## Objetivo

Reemplazar el sistema de contacto por formulario (`contact_messages`) con un sistema de chat P2P completo con tiempo real, historial persistente, badges de no leídos y límite de plan para usuarios Free.

El sistema de contacto anterior (localStorage cache `r24_contact_{userId}_{adId}`) fue reemplazado por un canal persistente en DB.

---

## DB — Migración `20260318000002_chat_system.sql`

### Tablas nuevas

**`chat_channels`**
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| ad_id | uuid FK ads | ON DELETE CASCADE |
| buyer_id | uuid FK users | ON DELETE CASCADE |
| seller_id | uuid FK users | ON DELETE CASCADE |
| created_at | timestamptz | |
| last_message_at | timestamptz | Actualizado por trigger |
| last_message_preview | text | Últimos 80 chars, por trigger |
| buyer_unread | int | Contador, reset por RPC mark_channel_read |
| seller_unread | int | Ídem para seller |
| status | varchar(20) | 'active' | 'archived' | 'blocked' |

Constraints:
- `UNIQUE (ad_id, buyer_id)` — un comprador = un canal por aviso
- `CHECK (buyer_id <> seller_id)` — no self-chat

**`chat_messages`**
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| channel_id | uuid FK | ON DELETE CASCADE |
| sender_id | uuid FK users | |
| message | text | CHECK char_length >= 1 |
| is_read | boolean | DEFAULT false |
| created_at | timestamptz | |

### Trigger

`trg_update_channel_on_message` — AFTER INSERT on `chat_messages`:
- Actualiza `last_message_at` y `last_message_preview`
- Incrementa `buyer_unread` o `seller_unread` del participante que NO envió el mensaje

### RPCs

| Función | Descripción |
|---|---|
| `get_or_create_chat_channel(p_ad_id, p_buyer_id, p_seller_id)` | Retorna canal existente o crea uno nuevo. Plan FREE: máx 3 canales activos como buyer. Lanza excepción `PLAN_LIMIT_REACHED` si supera límite. |
| `mark_channel_read(p_channel_id)` | Marca mensajes como leídos + resetea contador del canal para `auth.uid()` |
| `get_user_chat_unread_count()` | SUM de buyer_unread/seller_unread para `auth.uid()` |

### RLS

- `chat_channels`: solo buyer_id o seller_id ven/modifican sus canales
- `chat_messages`: solo participantes del canal (via JOIN a chat_channels)
- Superadmin: acceso total a ambas tablas

---

## Frontend — Archivos creados

### Servicios
**`frontend/src/services/chatService.ts`**
- `getOrCreateChannel(adId, sellerId)` → llama RPC, parsea error `PLAN_LIMIT_REACHED`
- `getMyChannels()` → JOIN ads + users (buyer/seller), ORDER BY last_message_at DESC
- `getChannelMessages(channelId)` → ORDER BY created_at ASC
- `sendMessage(channelId, message)` → INSERT chat_messages
- `markChannelRead(channelId)` → llama RPC
- `getTotalUnreadCount()` → llama RPC

### Hooks
**`frontend/src/hooks/useMessages.ts`**
- Carga mensajes al montar + llama `markChannelRead`
- Realtime: `postgres_changes INSERT on chat_messages WHERE channel_id=eq.{id}`
- Deduplicación optimista: match por sender+contenido dentro de ventana 3s
- `send(text)`: inserta mensaje optimista (opacidad 0.7 + "· enviando"), revierte en error

**`frontend/src/hooks/useChatBadge.ts`**
- Retorna total unread para userId
- Realtime: escucha UPDATE en chat_channels + INSERT en chat_messages
- Re-fetch `getTotalUnreadCount()` en cualquier cambio

### Componentes
**`frontend/src/components/chat/ChatWindow.tsx`**
- Props: `channel, currentUserId, onClose`
- Mobile: `fixed inset-0 z-50` (pantalla completa)
- Desktop: `lg:inset-auto lg:bottom-0 lg:right-4 lg:w-[380px] lg:h-[560px] lg:rounded-t-2xl`
- Agrupa mensajes por día con separadores
- Mensajes propios: `bg-brand-600 text-white`, mensajes del otro: `bg-white border`
- Enter para enviar (sin Shift), auto-scroll al fondo en nuevos mensajes

**`frontend/src/components/chat/ChatList.tsx`**
- Lista canales ordenados por `last_message_at`
- Miniatura del aviso, nombre del otro usuario, preview del último mensaje, badge unread
- Filtro de búsqueda visible cuando hay más de 4 canales
- Abre `ChatWindow` como overlay al hacer click

**`frontend/src/components/chat/NewChatModal.tsx`**
- Mensaje pre-llenado: `"Hola, me interesa. ¿Está disponible?"`
- Llama `getOrCreateChannel` → si `PLAN_LIMIT_REACHED` → dispara `onPlanLimit()`
- En éxito: llama `sendMessage` luego `onSuccess(channel)`

**`frontend/src/components/chat/PlanLimitModal.tsx`**
- Se muestra cuando usuario FREE supera 3 canales activos
- CTA "Ver planes Premium" → `navigateTo('/subscription')`

### VerticalThumbnailCarousel (galería AdDetail)
**`frontend/src/components/molecules/VerticalThumbnailCarousel/VerticalThumbnailCarousel.tsx`**
- Props: `images[], currentIndex, onSelect, thumbSize=100, maxVisible=4`
- Flechas ChevronUp/ChevronDown (deshabilitadas en extremos)
- Auto-scroll del offset cuando `currentIndex` sale de la ventana visible
- Retorna null si hay ≤1 imagen

---

## Frontend — Archivos modificados

### `frontend/src/components/pages/AdDetail.tsx`
**Eliminado:**
- `sendContactMessage`, `useAdContactStatus`, `getUserContactLimits`
- Estados: `senderInfo`, `contactMessage`, `contactLoading`, `contactError`, `contactLimits`, `contactSuccess`
- `handleContactSubmit` completo + todos los estados del formulario de contacto

**Agregado:**
- Imports: `getOrCreateChannel`, `ChatChannel`, `NewChatModal`, `PlanLimitModal`, `ChatWindow`
- Estados: `chatChannel`, `showNewChatModal`, `showPlanLimit`, `chatLoading`
- `loadCurrentUser`: simplificado — solo `setCurrentUser` + `setUserCheckDone`
- `handleContactar()`: check auth → guard self-contact → `getOrCreateChannel` → isNew? `showNewChatModal` : abre ChatWindow directo
- `renderSidebarContactForm()`: 3 estados — no logueado / canal abierto / disponible para contactar
- Galería: `aspect-[4/3]`, thumbnails verticales (`hidden lg:flex self-stretch bg-gray-100 rounded-lg p-2`), flechas en main image solo `lg:hidden`
- Thumbnails: `thumbSize={120}`, `maxVisible={4}`
- Containers B/C: fuera del grid 2 columnas, `mt-4`
- Seller ads: `limit(5)`, grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`
- Botón contacto: ícono `MessageCircle` + label "Chat"

### `frontend/src/components/sections/UserFeaturedAdsBar.tsx`
- `CARDS_PER_PAGE = 5`, `LOAD_BATCH = 10`, `MAX_ADS = 30`
- Carga 30 avisos al montar
- `visibleCount` incremental: 10 → 20 → 30
- Botón "Cargar más" cuando `visibleCount < min(allAds.length, MAX_ADS)`
- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`

### `frontend/src/components/BottomNav.tsx`
- Agregado: `useChatBadge` hook + `supabase` import
- `userId` via `supabase.auth.getUser()` al montar
- Badge verde con conteo en tab Mensajes cuando `chatUnread > 0`
- **Eliminado**: tab Profile completo (ícono User + "Mi Perfil")
- `NotificationBell` movida desde tab Profile a tab Mensajes (absolute -top-3 right-1)

### `frontend/App.tsx`
- Import lazy: `ChatList`
- Inbox route: reemplaza `<MessagesPanel />` con `<ChatList currentUserId={profile.id} />`
- Eliminado: estado `showContacto` + JSX `<ContactoDrawer />` (componente nunca existió — dead code pre-existente)

---

## Flujo UX

```
Visitante ve aviso
    ↓
[Contactar vendedor]
    ↓
¿Está logueado?
  No → navigateTo('/login')
  Sí → ¿Es el mismo usuario?
         Sí → toast "No podés contactarte a vos mismo"
         No  → getOrCreateChannel()
                  ↓
               ¿Canal existe?
                 Sí → abre ChatWindow directamente
                 No  → ¿Plan FREE con 3 canales activos?
                          Sí → PlanLimitModal → "Ver planes Premium"
                          No  → NewChatModal (mensaje pre-llenado)
                                   ↓
                               Confirma → crea canal + envía mensaje → ChatWindow
```

---

## Decisiones de diseño

1. **UNIQUE(ad_id, buyer_id)**: un comprador tiene exactamente un canal por aviso. Si cierra y vuelve, retoma la conversación existente.

2. **Sin `contact_messages`**: el sistema P2P es nuevo y paralelo. La tabla `contact_messages` no se elimina (datos históricos) pero no se usa en flujos nuevos.

3. **Límite FREE server-side**: validado en RPC `get_or_create_chat_channel`, no en frontend, para prevenir bypass.

4. **Optimistic UI**: el mensaje aparece inmediatamente antes del ACK de DB. Si falla, se revierte. La deduplicación evita duplicados cuando llega el evento Realtime.

5. **ChatWindow flotante desktop**: bottom-right, 380×560px, igual a WhatsApp Web / Messenger. En mobile es full-screen para mejor UX táctil.

6. **NotificationBell en Mensajes tab**: las notificaciones y mensajes están conceptualmente vinculados; simplifica la barra con 4 tabs en lugar de 5.

---

## Pendiente

- [ ] Aplicar migración `20260318000002` a DEV: `node scripts/db-run-migrations.mjs dev 20260318000002`
- [ ] Aplicar migración a PROD (requiere confirmación explícita del usuario)
- [ ] Migración `20260317000006` (eliminar `default_ad_image` genérico) a PROD — también pendiente
