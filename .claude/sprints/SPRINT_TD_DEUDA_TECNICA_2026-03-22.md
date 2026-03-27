# Sprint: Deuda Técnica — Roadmap Completo
**Fecha inicio:** 2026-03-22
**Tipo:** Mantenimiento / Infraestructura
**Contexto previo:** `SPRINT_TECH_DEBT_LOGGER_STYLES_BFF_2026-03-22.md`

---

## Estado General

| Part | Nombre | Estado | Prioridad | Effort |
|------|--------|--------|-----------|--------|
| TD-1 | Logger condicional (frontend + backend) | ✅ Completo | Urgente | Bajo |
| TD-2 | Styles DRY — formStyles constants | ✅ Completo | Urgente | Bajo |
| TD-3 | Logger: migrar hot paths restantes | ✅ Completo | Media | Medio |
| TD-4 | Admin DELETE users → endpoint BFF | ✅ Completo | Alta | Bajo |
| TD-5 | TypeScript: eliminar `any` críticos | ✅ Completo 2026-03-27 | Media | Medio |
| TD-6 | localStorage abstraction (`useBrowserStorage`) | ✅ Completo | Media | Bajo |
| TD-7 | CSP hardening — unsafe-inline/eval | ✅ Completo (ya estaba) | Alta | Medio |
| TD-8 | Service Worker + PWA caching strategy | ✅ Completo | Alta | Alto |
| TD-9 | Email: implementar contact/route.ts | ✅ Completo (ya estaba) | Alta | Medio |

---

## TD-3 — Logger: migrar hot paths restantes

**Archivos críticos por orden de impacto en producción:**

### Contextos (se inicializan en cada mount de App)
- `frontend/src/contexts/CategoryContext.tsx`
- `frontend/src/contexts/AuthContext.tsx`

### Hooks (se ejecutan en cada render de listas de avisos)
- `frontend/src/hooks/useProducts.ts`
- `frontend/src/hooks/useAdData.ts`
- `frontend/src/hooks/useRealtimeCategories.ts`

### Servicios (llamados en hot paths de búsqueda)
- `frontend/src/services/categoriesService.ts`
- `frontend/src/services/getProducts.ts`
- `frontend/src/services/catalogService.ts`
- `frontend/src/services/searchAnalytics.ts`

### Patrón de migración
```typescript
import { logger } from '../utils/logger'; // ajustar path relativo
// console.log → logger.log
// console.warn → logger.warn
// console.error → logger.error (siempre visible)
```

---

## TD-4 — Admin DELETE users → BFF

**Problema:** `frontend/src/services/usersService.ts` línea ~286 elimina usuarios
llamando directo a Supabase `admin.deleteUser()` — requiere `service_role` key
que NO debe estar en frontend bajo ningún concepto.

**Solución:**
1. Crear `backend/app/api/admin/users/[id]/route.ts` (DELETE)
2. Validar que caller tiene rol `superadmin` vía Supabase Auth
3. Actualizar `usersService.ts` para llamar a `/api/admin/users/:id`

**Scope acotado:** 1 endpoint, 1 función.

---

## TD-5 — TypeScript: eliminar `any` críticos

**Archivos con mayor concentración:**

| Archivo | Instancias | Plan |
|---------|-----------|------|
| `AllAdsTab.tsx` | 6+ | Definir tipos `EnrichedAd`, `FeaturedMap` |
| `BulkImportModal.tsx` | 3 | Tipar `ImportRow` |
| `CategoriasAdmin.tsx` | 4 | Usar tipos existentes de `types.ts` |
| `session-manager.ts` | 2 | `[key: string]: unknown` en `SessionData` |

**No incluye:** `as any` en guards de objetos desconocidos de Supabase — esos
son aceptables hasta tener tipos generados (`supabase gen types`).

---

## TD-6 — localStorage abstraction

**Problema:** 6 componentes acceden directo sin versionado ni validación.

**Solución:** `frontend/src/hooks/useBrowserStorage.ts`
```typescript
// API objetivo
const [value, setValue] = useBrowserStorage<T>('key', defaultValue);
// Con: JSON parse/stringify seguro, versionado opcional, TTL opcional
```

**Puntos de migración:**
- `LoginForm.tsx` → `last_login_shown`
- `SmartSearchBar.tsx` → `search_history`
- `RegisterBanner.tsx` → `register-banner-dismissed`
- `MyAdsPanel.tsx` → `sessionStorage` featured checkout
- `FeaturedAdModal.tsx` → `sessionStorage` mp_payment_id

---

## TD-7 — CSP hardening

**Problema:** `backend/middleware.ts` tiene TODOs explícitos:
```
// TODO: Remover después de migrar scripts inline
'unsafe-inline'
// TODO: Necesario para Vite en dev, remover en prod
'unsafe-eval'
```

**Plan:**
1. Auditar qué scripts inline existen en prod (candidates: Google Analytics, MercadoPago SDK)
2. Reemplazar scripts inline por archivos externos o `nonce`-based CSP
3. Separar CSP dev vs prod en middleware

---

## TD-8 — Service Worker + PWA caching

**Objetivo:** que la PWA "vuele" con datos offline-first.

**Estrategia de caching por tipo de dato:**

| Dato | Estrategia | TTL |
|------|-----------|-----|
| Categorías | Cache-first | 1h |
| Avisos de homepage | Stale-while-revalidate | 60s |
| Imágenes Cloudinary | Cache-first (immutable URLs) | 7d |
| Config global | Cache-first | 30min |
| Búsquedas | Network-first (resultados frescos) | — |
| Auth session | Network-only | — |

**Archivos a crear:**
- `frontend/public/sw.js` (Service Worker)
- `frontend/src/utils/swRegister.ts` (registro en App.tsx)
- `frontend/public/manifest.json` (si no existe)

**Nota:** Este es el ítem de mayor impacto de performance real para la PWA.
Más efectivo que cualquier migración BFF.

---

## TD-9 — Email: contact/route.ts

**Problema:** `backend/app/api/contact/route.ts` tiene TODO explícito:
```typescript
// TODO: integrar sistema de email
```
Los mensajes de contacto se guardan en DB pero NO se envía email al vendedor.

**Opciones de implementación:**
- Resend (recomendado — API simple, tier free generoso, buen DX)
- SendGrid
- Supabase Edge Functions + pg_cron (ya tenemos pg_cron instalado)

**Scope:** 1 template transaccional "Nuevo mensaje de contacto" → vendedor.

---

## Orden de ejecución sugerido

```
TD-4 (seguridad, 30min) →
TD-6 (useBrowserStorage, 1h) →
TD-3 (logger hot paths, 1h) →
TD-7 (CSP, 2h) →
TD-8 (Service Worker, 4h) ← mayor impacto PWA
TD-9 (Email, 2h)
TD-5 (TypeScript any, sesiones separadas)
```
