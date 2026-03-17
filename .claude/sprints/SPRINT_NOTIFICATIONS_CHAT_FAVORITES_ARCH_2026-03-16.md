# Arquitectura: Notificaciones + Chat + Favoritos
> Fecha: 2026-03-16 | Estado: PROPUESTA — pendiente aprobación usuario

---

## DIAGNÓSTICO ACTUAL

| Componente | Estado |
|---|---|
| `contact_messages` | ✅ Funcional (mensajes asíncronos vendedor↔comprador) |
| `contact_notifications` | ✅ Tabla existe, no conectada a UI general |
| `MessagesPanel.tsx` | ✅ Funcional pero UX limitada (no es chat real) |
| Favoritos | ⚠️ Solo UI stub en BottomNav — sin tabla DB ni funcionalidad |
| Notificaciones in-app | ❌ No existe campanita ni badge de no-leídos |
| Push notifications | ❌ No existe |

**Problema central:** El sistema actual de mensajes es "email interno" (un mensaje por aviso, sin threading real-time). El usuario quiere chat real + notificaciones integradas + favoritos por subcategoría.

---

## OPCIONES DE ARQUITECTURA

### OPCIÓN A — Supabase-Native Full (RECOMENDADA)
**Costo adicional: $0 | Complejidad: Media**

Usa exclusivamente lo que ya tenemos: Supabase (Realtime + Triggers + pg_cron).

#### Pilares:

**1. Tabla `notifications` (central)**
```sql
CREATE TABLE public.notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  type            text NOT NULL, -- ver tipos abajo
  title           text NOT NULL,
  body            text,
  is_read         boolean DEFAULT false,
  read_at         timestamptz,
  data            jsonb,         -- ad_id, conversation_id, etc
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
-- RLS: user solo ve sus propias notificaciones
```

**Tipos de notificación:**
- `destacado_activado` — Destacado activado en tu aviso
- `destacado_por_vencer` — Destacado vence en 24h
- `aviso_publicado` — Tu aviso fue publicado exitosamente
- `aviso_expirado` — Tu aviso expiró (draft 24h)
- `nuevo_contacto` — Alguien te contactó por un aviso
- `cupon_canjeado` — Cupón canjeado exitosamente
- `nuevo_aviso_favorito` — Nuevo aviso en subcategoría que seguís

**2. Tablas `conversations` + `messages` (reemplaza contact_messages)**
```sql
CREATE TABLE public.conversations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id               uuid REFERENCES ads(id) ON DELETE SET NULL,
  buyer_id            uuid REFERENCES users(id),
  seller_id           uuid REFERENCES users(id),
  last_message_at     timestamptz DEFAULT now(),
  buyer_unread_count  int DEFAULT 0,
  seller_unread_count int DEFAULT 0,
  status              text DEFAULT 'active', -- active | archived
  created_at          timestamptz DEFAULT now(),
  UNIQUE(ad_id, buyer_id)  -- 1 conversación por aviso por comprador
);

CREATE TABLE public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid REFERENCES users(id),
  content         text NOT NULL CHECK (length(content) >= 2),
  is_read         boolean DEFAULT false,
  read_at         timestamptz,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
```

**3. Tabla `user_favorites`**
```sql
CREATE TABLE public.user_favorites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  -- Favorito de aviso específico (bookmark)
  ad_id           uuid REFERENCES ads(id) ON DELETE CASCADE,
  -- Favorito de subcategoría (alerta de nuevos avisos)
  subcategory_id  uuid REFERENCES subcategories(id) ON DELETE CASCADE,
  notify_new_ads  boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  -- Solo uno puede estar activo por fila
  CONSTRAINT fav_type CHECK (
    (ad_id IS NOT NULL AND subcategory_id IS NULL) OR
    (ad_id IS NULL AND subcategory_id IS NOT NULL)
  ),
  UNIQUE(user_id, ad_id),
  UNIQUE(user_id, subcategory_id)
);
```

#### Realtime (Supabase nativo):
```typescript
// Frontend: subscribe a notificaciones propias
supabase
  .channel('my-notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => updateBadge(payload.new))
  .subscribe()

// Frontend: subscribe a mensajes de conversación activa
supabase
  .channel('conversation-123')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${convId}`
  }, (payload) => appendMessage(payload.new))
  .subscribe()
```

**Límite free tier Supabase Realtime:** 200 conexiones concurrentes — suficiente para la fase actual.

#### Triggers DB (generan notificaciones automáticamente):
```sql
-- Trigger: nuevo mensaje → notificación al receptor
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar notificación al receptor
  INSERT INTO notifications(user_id, type, title, body, data)
  SELECT
    CASE WHEN NEW.sender_id = c.buyer_id THEN c.seller_id ELSE c.buyer_id END,
    'nuevo_contacto',
    'Nuevo mensaje',
    left(NEW.content, 100),
    jsonb_build_object('conversation_id', NEW.conversation_id, 'ad_id', c.ad_id)
  FROM conversations c WHERE c.id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- Trigger: nuevo aviso publicado → notificar usuarios con favorito en subcategoría
CREATE OR REPLACE FUNCTION notify_subcategory_followers()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    INSERT INTO notifications(user_id, type, title, body, data)
    SELECT
      uf.user_id,
      'nuevo_aviso_favorito',
      'Nuevo aviso en ' || s.display_name,
      'Se publicó "' || left(NEW.title, 60) || '"',
      jsonb_build_object('ad_id', NEW.id, 'subcategory_id', NEW.subcategory_id)
    FROM user_favorites uf
    JOIN subcategories s ON s.id = uf.subcategory_id
    WHERE uf.subcategory_id = NEW.subcategory_id
      AND uf.notify_new_ads = true
      AND uf.user_id != NEW.user_id;  -- no notificar al propio publicador
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_subcategory_followers
  AFTER INSERT OR UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION notify_subcategory_followers();
```

#### pg_cron (notificaciones programadas):
```sql
-- Verificar destacados por vencer (diario a las 9am)
SELECT cron.schedule('check-featured-expiry', '0 9 * * *', $$
  INSERT INTO notifications(user_id, type, title, body, data)
  SELECT
    a.user_id, 'destacado_por_vencer',
    '¡Tu destacado vence mañana!',
    'El aviso "' || left(a.title, 50) || '" pierde el destacado en 24h.',
    jsonb_build_object('ad_id', a.id)
  FROM featured_ads fa
  JOIN ads a ON a.id = fa.ad_id
  WHERE fa.expires_at BETWEEN now() AND now() + interval '25 hours'
    AND fa.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.data->>'ad_id' = fa.ad_id::text
        AND n.type = 'destacado_por_vencer'
        AND n.created_at > now() - interval '24 hours'
    );
$$);
```

#### UI Components necesarios:
- `NotificationBell.tsx` — icono campanita + badge no-leídos (Header)
- `NotificationsPanel.tsx` — drawer lateral, lista de notificaciones
- `ChatPanel.tsx` — reemplaza MessagesPanel, threads reales
- `FavoritesPanel.tsx` — avisos guardados + subcategorías seguidas
- `FavoriteButton.tsx` — botón corazón en AdCard/AdDetail

---

### OPCIÓN B — Polling Simple (Sin Realtime)
**Costo adicional: $0 | Complejidad: Baja**

Mismas tablas que Opción A, pero sin websockets.
El frontend hace polling cada 30 segundos con React Query.

```typescript
// Polling con React Query
useQuery({
  queryKey: ['notifications-count'],
  queryFn: () => supabase.from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('is_read', false),
  refetchInterval: 30_000,  // cada 30 segundos
})
```

**Pros:** Más simple, sin límite de conexiones Realtime, menor complejidad.
**Contras:** Latencia de hasta 30s para nuevos mensajes (no es "chat" real).
**Ideal para:** Notificaciones de sistema (campanita). No ideal para chat.

---

### OPCIÓN C — Híbrida (RECOMENDADA como evolución)
**Costo adicional: $0 | Complejidad: Media-Alta**

- **Notificaciones de sistema (a, b, d):** Polling 30s (Opción B) — no necesitan ser instantáneas
- **Chat / mensajes nuevos (c):** Supabase Realtime — necesita ser instantáneo
- **Favoritos:** Trigger DB → notificaciones (sin realtime extra)
- **Email:** Supabase Edge Function + Resend free tier (3.000 emails/mes)

**División de responsabilidades:**
| Evento | Mecanismo |
|---|---|
| Nuevo mensaje en chat | Realtime (instantáneo) |
| Destacado por vencer | Polling 30s + pg_cron (diario) |
| Aviso publicado/expirado | Polling 30s |
| Cupón canjeado | Insert síncronoó en RPC |
| Nuevo aviso en favorito | Trigger DB + polling 30s |

---

### OPCIÓN D — PWA Push Notifications (Más avanzada)
**Costo adicional: $0 | Complejidad: Alta**

Agrega Web Push API (sin terceros) sobre Opción A.
- Service Worker registrado en el browser
- Push incluso cuando la app está cerrada
- iOS Safari: soporte desde iOS 16.4 (limitado)
- Android Chrome: soporte completo

**No recomendada para esta etapa** — complejidad alta, beneficio marginal vs Opción C.

---

## RECOMENDACIÓN FINAL

### Implementar en 2 fases:

**Fase 1 (Sprint actual):** OPCIÓN B parcial + infraestructura base
- Crear tablas: `notifications`, `user_favorites`
- Implementar `NotificationBell` con polling 30s
- Implementar `FavoritesPanel` (avisos guardados + seguir subcategoría)
- Botón corazón en AdCard y AdDetail
- Triggers DB para: nuevo_contacto, nuevo_aviso_favorito
- RPC para: aviso_publicado, cupon_canjeado, destacado_activado

**Fase 2 (Sprint siguiente):** Evolución a chat real
- Crear tablas: `conversations`, `messages`
- Migrar contact_messages → nuevo sistema (mantener backward compat)
- `ChatPanel.tsx` con Supabase Realtime
- Reemplazar MessagesPanel gradualmente

---

## MODELO DE DATOS FINAL (Fase 1)

```
notifications          user_favorites
───────────────        ──────────────────
id (PK)                id (PK)
user_id → users        user_id → users
type                   ad_id? → ads
title                  subcategory_id? → subcategories
body                   notify_new_ads (bool)
is_read                created_at
read_at
data (jsonb)
created_at
```

## ARCHIVOS A CREAR (Fase 1)

```
supabase/migrations/
  20260316000001_notifications_favorites.sql

frontend/src/
  components/
    notifications/
      NotificationBell.tsx     ← campanita + badge
      NotificationsPanel.tsx   ← drawer lista
    favorites/
      FavoritesPanel.tsx       ← panel favoritos
      FavoriteButton.tsx       ← corazón en cards
  services/
    notificationsService.ts
    favoritesService.ts
```

## CAMBIOS EN COMPONENTES EXISTENTES
- `Header.tsx` / `TopNav.tsx` — agregar `<NotificationBell />`
- `BottomNav.tsx` — corregir tab Favoritos → `/favorites`
- `AdCard.tsx` — agregar `<FavoriteButton adId={...} />`
- `AdDetailPage.tsx` — agregar `<FavoriteButton />`
- `App.tsx` — agregar ruta `#/favorites` → `<FavoritesPanel />`
- `redeem_coupon` RPC — ya inserta en tabla, agregar insert en `notifications`
- `activate_featured_paid` RPC — agregar insert en `notifications`
