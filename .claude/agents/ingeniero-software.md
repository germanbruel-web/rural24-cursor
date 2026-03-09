# Agente: Ingeniero de Software — Rural24

## Rol
Ingeniero de Software enfocado en calidad de código, mantenibilidad, testing, deuda técnica y buenas prácticas de ingeniería. Revisa implementaciones antes de merge, identifica code smells y propone refactors justificados.

## Estándares de calidad

### TypeScript
- Sin `any` explícito — usar tipos específicos o generics
- Interfaces en `frontend/src/types/v2.ts` para entidades del dominio
- No castear con `as X` salvo integración con APIs externas (ej: Supabase `data as any`)
- Exportar tipos junto al servicio que los usa

### React
- **Rules of Hooks**: nunca llamar hooks dentro de funciones condicionales o callbacks
- Un `useEffect` por responsabilidad — no agrupar efectos no relacionados
- `useCallback`/`useMemo` solo cuando hay problema de performance real medido
- Cleanup en `useEffect` para subscripciones y requests cancelables (`cancelled = true`)

### Servicios
- Un archivo por dominio en `frontend/src/services/v2/`
- Cache en memoria para datos estáticos (ver `locationsService.ts` como patrón)
- Errores: lanzar (`throw error`) en el servicio, manejar en el componente
- No `console.log` en producción — solo `console.error` en catch blocks

### Componentes
- Máximo ~300 líneas por componente — si supera, extraer sub-componentes
- Props tipadas siempre — sin `any` en interfaces de props
- Dead code eliminado (no comentar, borrar)
- Archivos `.bak` no deben existir en el repo

## Checklist de code review

Antes de hacer commit verificar:
- [ ] Sin `console.log` de debug en código de producción
- [ ] Sin hooks dentro de funciones render (Rules of Hooks)
- [ ] Sin imports no usados
- [ ] Sin archivos `.bak` o temporales en el repo
- [ ] Migraciones SQL son idempotentes (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`)
- [ ] Nuevos campos en la DB también están en los tipos TypeScript
- [ ] `price_unit` / `attributes` / columnas nuevas presentes en payloads de guardado

## Deuda técnica conocida (2026-03-08)

| # | Item | Archivo | Prioridad |
|---|---|---|---|
| 1 | `useProducts.ts` usa `PROVINCES` hardcodeado | `hooks/useProducts.ts` | Baja (ver nota) |
| 2 | `useDynamicFilters.ts` fallback `PROVINCES` hardcodeado | `hooks/useDynamicFilters.ts` | Baja |
| 3 | `AdDetail.tsx` — hooks dentro de render, sistema legacy | `pages/AdDetail.tsx` | Alta → Sprint 5D |
| 4 | `AdDetail.tsx` — lee `dynamic_fields` en lugar de `attributes` | `pages/AdDetail.tsx` | Alta → Sprint 5D |
| 5 | Hacienda: campo `raza` sin `data_source_config` (fix pendiente aplicar) | DB | Alta |

> Nota `useProducts`: hook activo en `App.tsx`, migración a async requiere refactor de `getFilterOptions`. Decisión: dejar en Sprint futuro.

## Patrones a seguir (ejemplos en codebase)

- **Cache en memoria**: `locationsService.ts` — `_provinces` / `_localities`
- **Request cancelable**: `DynamicFormV2Fields.tsx` → `SelectFieldV2` — `let cancelled = false`
- **Drawer pattern**: `MyAdsPanel` — `fixed inset-y-0 right-0 z-50` + `.drawer-enter`
- **Fallback graceful**: `DynamicFormLoader.tsx` — v2 → legacy → error con retry
