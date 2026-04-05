---
# Sprint S4 — Error Boundaries 3 Niveles
**Fecha:** 2026-04-05
**Estado:** ✅ Completado
**Commit:** e1423f5
**Parte del roadmap:** serialized-cooking-honey.md (S4 de 8)

---

## Cambios

### Nuevo: `frontend/src/components/common/CardErrorBoundary.tsx`
Boundary lightweight para loops de cards.
- En error retorna `null` — la card desaparece silenciosamente
- Log en DEV via `console.error`
- Sin UI de error (invisible al usuario)

### `UserFeaturedAdsBar.tsx`
- Cada `ProductCard` del carrusel envuelto en `<CardErrorBoundary key={ad.id}>`
- `key` movido del `<div>` al boundary — comportamiento idéntico

### `SearchResultsPageMinimal.tsx`
- Cada `ProductCard` del grid de resultados envuelto en `<CardErrorBoundary>`
- `React.Fragment key={product.id}` conservado como wrapper externo (banner intercalado)

### `AdDetail.tsx`
- `<AdFormSections>` envuelto en `<PageErrorBoundary pageName="secciones del aviso">`
- Si las secciones dinámicas crashean (form template inválido, etc.) → pantalla de error con retry, sin tirar toda la página

### `DynamicHomeSections.tsx`
- `SectionErrorBoundary.render()`: cambiado de `return null` silencioso a:
  ```tsx
  <div className="py-2 text-center text-xs text-gray-300 select-none">
    Sección no disponible
  </div>
  ```

---

## 3 Niveles implementados

| Nivel | Componente | UI en error | Donde aplica |
|---|---|---|---|
| Card | `CardErrorBoundary` | `null` (invisible) | `UserFeaturedAdsBar`, `SearchResultsPageMinimal` |
| Sección | `SectionErrorBoundary` | Placeholder texto gris | `DynamicHomeSections` |
| Página | `PageErrorBoundary` | Pantalla con retry + home | `AdDetail` (AdFormSections) |

---

## Cómo verificar
1. DevTools > Sources: lanzar `throw new Error("test")` dentro de un ProductCard manualmente
2. Esa card desaparece, las demás siguen mostrando
3. Si se lanza en `AdFormSections` → aparece la pantalla de error con botón retry

## Próximo sprint
- **S3**: `adaptAdToProduct()` canónica — 3 sitios inline → un adaptador (depende de S2 ✅)
