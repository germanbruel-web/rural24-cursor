# Sprint: Deuda Técnica — Logger, Styles DRY, Plan BFF
**Fecha:** 2026-03-22
**Estado:** Logger ✅ | Styles ✅ | BFF Migration: Plan documentado

---

## 1. Logger Condicional (urgente ✅)

### Problema
131 archivos con `console.log` activos en producción.
Casos críticos: `adsService.ts` exponía estructura de imágenes de cada aviso en cada render.
`session-manager.ts` backend exponía arquitectura interna de sesiones.

### Decisión
Crear logger wrapper que deshabilita `log/warn/debug` en producción.
`error` siempre se emite (necesario para monitoreo).

### Archivos creados
- `frontend/src/utils/logger.ts` — usa `import.meta.env.DEV` (Vite)
- `backend/lib/logger.ts` — usa `process.env.NODE_ENV !== 'production'` (Next.js)

### Archivos migrados (sesión actual)
- `frontend/src/services/adsService.ts` — 6 console.log → logger.debug (datos de avisos)
- `backend/infrastructure/session-manager.ts` — 9 console.log/warn → logger.*

### Archivos pendientes de migrar (backlog)
Los 131 archivos restantes siguen con `console.log` directo.
Estrategia: migrar incrementalmente por sesión o feature, priorizando hot paths:
- `frontend/src/contexts/CategoryContext.tsx`
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/services/categoriesService.ts`
- `frontend/src/hooks/useProducts.ts`

**Patrón de migración:**
```typescript
// Antes
import { supabase } from './supabaseClient';
// + console.log('...')

// Después
import { logger } from '../utils/logger';
// + logger.log('...')
```

---

## 2. Estilos Tailwind DRY (urgente ✅)

### Problema
Clases de input de formulario repetidas idénticas en 3+ wizard blocks:
```
'w-full px-4 py-3 text-base bg-white border-2 border-gray-300...'
```

### Decisión
Centralizar en `frontend/src/constants/styles.ts`.

### Archivos creados
- `frontend/src/constants/styles.ts` — `formStyles.input`, `inputError`, `label`, `help`, `errorText`

### Archivos actualizados
- `frontend/src/components/wizard/blocks/TitleDescriptionBlock.tsx`
- `frontend/src/components/wizard/blocks/PriceBlock.tsx`
- `frontend/src/components/wizard/blocks/LocationBlock.tsx`

### Extensión futura
Si se detectan más clases duplicadas (ej: en `DynamicFormV2Fields.tsx`), agregar a `styles.ts`:
```typescript
export const formStyles = {
  // ... existentes
  select: '...',
  textarea: '...',
}
```

---

## 3. Plan BFF Migration — Arquitectura PWA (pendiente implementación)

### Contexto
El análisis de deuda técnica detectó ~15+ archivos frontend accediendo Supabase directo.
El usuario solicitó migrar al BFF priorizando que "la PWA vuele".

### Decisión Arquitectónica Clave

**NO es correcto migrar todo a BFF para una PWA.**

| Patrón | Performance PWA | Seguridad | Recomendación |
|--------|-----------------|-----------|---------------|
| Supabase directo (anon key) | ⚡ 1 hop | RLS protege | OK para reads públicos |
| BFF Next.js | 🐢 2 hops (+50-150ms) | Capa extra | Solo para casos que lo requieren |

La anon key de Supabase es pública por diseño. La seguridad la garantizan las RLS policies.
Agregar BFF innecesariamente penaliza latencia, contradice el objetivo PWA.

### Lo que SÍ debe ir al BFF (criterio correcto)

| Operación | Motivo | Estado |
|-----------|--------|--------|
| Operaciones con `service_role` key | NUNCA exponer en frontend | Ya en BFF |
| Lógica de negocio compleja (precios, wallets) | Auditabilidad, atomicidad | Ya en BFF vía RPC |
| Validaciones que requieren datos privados | Seguridad real | Mixto |
| Endpoints de admin con bypass de RLS | Seguridad | Parcial |
| `usersService.ts` — DELETE admin | TODO explícito en código | **Pendiente** |
| Rate limiting / throttling | No puede hacerse en frontend | Ya en middleware |

### Lo que PUEDE quedarse en Supabase directo

| Archivo | Razón | Acción |
|---------|-------|--------|
| `bannersCleanService.ts` reads | Datos públicos, RLS abierta | Mantener + cache ✅ |
| `categoryPlaceholderCache.ts` | Datos públicos, se inicializa 1 vez | Mantener ✅ |
| `AuthContext.tsx` | Supabase Auth es el proveedor, no BFF | Mantener ✅ |
| `useMessages.ts` / Chat | Realtime requiere conexión WS directa | Mantener ✅ |
| `CategoryContext.tsx` | Read público, cacheable | Mantener o mover a CMS endpoint |

### Próxima acción concreta (cuando se decida implementar)

**Única migración de alto valor:** `usersService.ts` línea 286
```typescript
// TODO: Migrar a endpoint backend DELETE /api/admin/users/:userId
```
Este es el único acceso que viola seguridad real (admin deleting users sin BFF).

### Performance PWA — Recomendaciones reales
En lugar de agregar BFF hops, optimizar en esta dirección:
1. **Service Worker caching** — cachear GET de categorías, avisos recientes
2. **Stale-while-revalidate** — ya implementado en algunos servicios con Map cache
3. **Prefetch crítico** — categorías, config global al app init (ya en `App.tsx`)
4. **Image optimization** — Cloudinary transformaciones en URL (f_auto, q_auto)
5. **Code splitting** — lazy load de páginas admin (ya con React.lazy parcialmente)

---

## Deuda técnica backlog (post-sesión)

| Item | Prioridad | Effort |
|------|-----------|--------|
| Migrar 131 archivos restantes a `logger` | Media | Alto (incremental) |
| Migrar `usersService.ts` admin DELETE a BFF | Alta | Bajo |
| Tipar `AllAdsTab.tsx` (mayor concentración de `any`) | Media | Medio |
| Abstraer localStorage en `useBrowserStorage.ts` | Media | Bajo |
| CSP: remover `unsafe-inline` / `unsafe-eval` en prod | Alta | Medio |
| Email: implementar `contact/route.ts` TODO | Alta | Medio |
