# Sprint: Deuda Técnica — TS Fixes + UI polish + Bugs críticos
**Fecha:** 2026-04-01
**Estado:** ✅ En progreso — completado al 99%

---

## TAREAS COMPLETADAS

### 1. AdDetail — Border-left verde en características
**Archivo:** `frontend/src/components/pages/ad-detail/AdFormSections.tsx`
- Agregado `border-l-2 border-brand-500 pl-3` a wrappers de campos escalares (default, range, textarea)
- Mismo tratamiento en fallback (sin form template) — `md:col-span-3 border-l-2 border-brand-500 pl-3`
- NO aplica a: checkbox_group/features/tags (ya tienen pills), checkbox boolean (ya tiene CheckCircle2)

### 2. Backend Search — Fix subcategorías L2/L3/L4
**Archivo:** `backend/app/api/ads/search/route.ts`

**Fix 1 — `subcategory` per-ad propio (no del filtro):**
- Agregado `subcatSelfNameMap` para nombre propio de cada ad
- `subcategory: ad.subcategory_id ? subcatSelfNameMap.get(ad.subcategory_id) : subcategoryName`

**Fix 2 — Resolución 3 niveles para L4:**
- Antes: solo subía 1 nivel → L4 mostraba L3 como subcategory_l2
- Ahora: 3 queries encadenados (L3→L2→L1 abuelo) resuelven correctamente hasta L4

**Fix 3 — Badges en resultados:**
- `frontend/src/components/SearchResultsPageMinimal.tsx` — eliminado `showBadges={false}` de ProductCard
- NOTA: el prop ya estaba marcado `@deprecated` en ProductCard, se ignora internamente

### 3. TypeScript Fixes — 10 archivos
| Archivo | Fix |
|---|---|
| `AuthContext.tsx` | `UserRole` importado de `'../types/v2'` → `'../types'` |
| `LoginForm.tsx` | Agregado `onClose?: () => void` a `LoginFormProps` |
| `RegisterForm.tsx` | Agregado `onClose?: () => void` + desestructurado en función |
| `ContactVendorButton.tsx` | snake_case → camelCase (`canSendMore`, `maxSent`, `currentSent`) + `adId` → `ad_id` |
| `ContactModal.tsx` | `'LIMIT_REACHED'` → `'SENDER_LIMIT_REACHED' \| 'RECEIVER_LIMIT_REACHED'` + imports no usados |
| `contactLimitsService.ts` | Cast tipado del RPC response (`unknown` → interfaz inline) |
| `contactService.ts` | Código de error `'LIMIT_REACHED'` → `'SENDER_LIMIT_REACHED'` |
| `HeroVIPBanner.tsx` | `banner.title` → `banner.client_name` (no existe `title` en `BannerClean`) |
| `CategoriasAdmin.tsx` | Type narrowing con `as any` para `category_id`/`subcategory_id` en union type |
| `DevModePanel.tsx` | `userRole` → `profile?.role`, `isLoading` → `loading`, imports no usados eliminados |

### 4. Bug crítico — UserFeaturedAdsBar crash en Detalle
**Error:** `TypeError: Cannot read properties of null (reading 'images')` en `UserFeaturedAdsBar.tsx:168`

**Root cause:**
- `featured_ads` table tiene registros que apuntan a ads eliminados
- `getFeaturedForDetail` hacía `.map(item => item.ad)` → Supabase devuelve `null` para joins rotos
- `ad.images?.[0]` explota cuando `ad` es `null`

**Archivos modificados:**
- `frontend/src/services/userFeaturedService.ts` — `.filter(Boolean)` después del `.map(item => item.ad)` en `getFeaturedForDetail`
- `frontend/src/components/sections/UserFeaturedAdsBar.tsx` — `.filter(Boolean)` defensivo en el render + `ad?.images?.[0]` + eliminado `showBadges={false}` deprecado

---

## PENDIENTE (próxima sesión)

### TS Errors restantes (~110 errores en 15 archivos)
Prioridad sugerida:

| Grupo | Archivos | Errores | Impacto |
|---|---|---|---|
| 🔴 Mock data stale | `frontend/constants.ts` | 18 | `approvalStatus` no existe en `Product` |
| 🟡 Servicio legacy | `catalogService.ts` | 14 | Legacy, no migrado a v2 |
| 🟡 Union types | `footerService.ts` | 11 | Discriminated union sin narrowing |
| 🟡 `unknown` types | `useCategoriesAdmin.ts` | 10 | `.toLowerCase()` en `unknown` |
| 🟠 Uploader firma | `DragDropUploader.tsx` | 9 | `uploadImage` recibe 2 args, espera 1 |
| 🟠 Componentes admin | `LocationsAdmin`, `CategoryIconsCMS`, `CancelFeaturedModal` | 10 | Props/tipos stale |
| 🟡 Secciones | `CategoryCarousel.tsx`, `sections/*` | 4 | `external_url` no en tipo `Ad` |

### Testing Roadmap (aprobado en sesión)
Ver resumen completo en memoria de sesión. Fase 1 = instalar Vitest.

### Moderación Imágenes (backlog)
Cloudinary + AWS Rekognition — bloqueado por billing.

---

## CONTEXTO TÉCNICO CLAVE

### ContactVendorButton y ContactModal
- Ambos están definidos pero **NO son usados en ningún lado** (dead code verificado)
- Los fixes de TS se aplicaron igual para mantener el código limpio
- Si se quieren usar en el futuro, revisar que `sendContactMessage` requiere `sender_user_id` obligatorio

### showBadges en ProductCard
- `showBadges` ya está marcado `@deprecated` internamente en ProductCard — es un prop ignorado
- Eliminado de: `SearchResultsPageMinimal.tsx`, `UserFeaturedAdsBar.tsx`
- El "habilitar badges" del plan era incorrecto — los badges ya estaban desactivados a nivel código interno

### UserFeaturedAdsBar — datos huérfanos en featured_ads
- El problema de base es que `featured_ads` tiene registros con `ad_id` de ads eliminados
- Fix aplicado: filtro en service + filtro defensivo en componente
- Solución DB (backlog): agregar FK con `ON DELETE CASCADE` en `featured_ads.ad_id → ads.id`
  o bien un cron que limpie featured_ads de ads no activos

### 406 error en users query (useAdData.ts)
- `supabase.from('users').select(...).eq('id', data.user_id).single()` retorna 406 si el usuario no existe
- No causa crash (Supabase JS v2 retorna `{ data: null, error: ... }`, no lanza excepción)
- Solo es ruido en consola — fix pendiente: cambiar `.single()` → `.maybeSingle()`
