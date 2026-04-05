# Sprint S1 — Bugs Críticos Cards & Destacados
**Fecha:** 2026-04-05
**Estado:** ✅ Completado
**Parte del roadmap:** serialized-cooking-honey.md (S1 de 8)

---

## Diagnóstico previo a cambios

Antes de editar, se verificó el estado real de cada issue del plan:

| Issue | Estado real | Acción |
|---|---|---|
| Memory leak `setInterval` DynamicHomeSections líneas 852, 1189 | ✅ Ya tenía `return () => clearInterval()` | Sin cambio |
| URL con `undefined` en SearchResultsPageMinimal línea 167 | ✅ Guard `if (slug && subsub)` ya existía | Sin cambio |
| Price inputs sin `onChange` SearchResultsPageMinimal líneas 579-591 | ❌ Confirmado roto | Aplicado |
| Ads inactivos en destacados (featured_ads.status vs ads.status) | ❌ Confirmado | Aplicado |

**2 de 4 issues ya estaban resueltos en código anterior.**

---

## Cambios aplicados

### 1. `frontend/src/services/userFeaturedService.ts`

**Problema:** `getFeaturedForDetail()` y `getFeaturedFallback()` filtraban `featured_ads.status = 'active'` (el registro de destacado), pero no verificaban que el `ad` asociado también estuviera activo. Un aviso en `draft` o `inactive` podía aparecer en el carrusel de destacados.

**Fix — `getFeaturedForDetail` (línea 578):**
```ts
// Antes
.filter(Boolean);

// Después
.filter(Boolean)
.filter((ad: any) => ad?.status === 'active');
```

**Fix — `getFeaturedFallback` (línea 621):**
```ts
// Antes
.filter(Boolean);

// Después
.filter(Boolean)
.filter((ad: any) => ad?.status === 'active');
```

**Por qué no se agrega al WHERE de Supabase:** El campo `status` pertenece a la tabla `ads` que viene como foreign join. Supabase JS v2 no permite filtrar por campos de tablas relacionadas en `.eq()` — el filtro solo aplica a la tabla principal. El post-filtro en JS es la corrección correcta.

---

### 2. `frontend/src/components/SearchResultsPageMinimal.tsx`

**Problema:** Dos `<input type="number">` con `defaultValue` pero sin `onChange`. El usuario podía escribir un precio, pero no pasaba nada — el filtro nunca se aplicaba. Comportamiento silencioso e incorrecto.

**Fix:** Reemplazar los inputs por texto informativo hasta que S5 implemente el filtro con debounce real.

```tsx
// Antes: dos <input> decorativos sin handler
<input type="number" placeholder="Mín" defaultValue={urlFilters.priceMin} />
<input type="number" placeholder="Máx" defaultValue={urlFilters.priceMax} />

// Después: texto informativo honesto
<p className="text-xs text-gray-500">
  Rango disponible: ${min} — ${max}
</p>
<p className="text-[11px] text-gray-400">Filtro por precio próximamente</p>
```

**Por qué no se implementa el filtro ahora:** S5 incluye debounce, actualización de URL, y re-fetch. Ese cambio toca `searchAdsFromBackend()` y el hook de URL params. Hacerlo en S1 rompería el alcance del sprint.

---

## Archivos modificados
- `frontend/src/services/userFeaturedService.ts` — 2 líneas agregadas (una por función)
- `frontend/src/components/SearchResultsPageMinimal.tsx` — inputs reemplazados por texto

## Próximo sprint
**S1 no tiene dependencias bloqueantes hacia S2/S3/S4.**
S2 requiere: insertar 14 keys SQL en `global_settings` + crear `useGlobalSetting<T>` hook.
S4 (error boundaries) también es independiente y puede arrancarse en paralelo con S2.
