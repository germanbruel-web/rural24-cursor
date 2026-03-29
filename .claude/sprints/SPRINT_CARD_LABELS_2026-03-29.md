# Sprint: Card Labels Config-Driven
**Fecha:** 2026-03-29
**Estado:** ✅ Completo

---

## Problema

Los cards de ProductCard mostraban la subcategoría L3 (hoja) como label principal,
que era demasiado específica y sin contexto:
- "Agrícolas · akron · t566 · 1945" (L3 = "Agrícolas", parent = "Cosechadoras")
- "De tracción doble · ..." (L3, parent = "Tractores")

## Decisión de producto: fórmulas por categoría

| Categoría (slug) | Label en card |
|---|---|
| `maquinaria-agricola` | Subcategoria · Marca · Modelo · Año |
| `hacienda` | Subcategoria · Raza · Edad |
| `insumos` | Subcategoria · Marca |
| `inmobiliaria-rural` | Subcategoria · Tipo de operación |
| `servicios` | Subcategoria · Tipo de búsqueda |
| `equipamiento` | Subcategoria · Marca |
| `repuestos` | Subcategoria (solo) |
| `empleos` | Subcategoria · Tipo de búsqueda |

**Regla L2/L3:**
- La "Subcategoria" en el card es SIEMPRE L2 (tipo de máquina, tipo de animal, etc.)
- L3 NO se muestra en el card — sirve para SEO y filtros en resultados
- Ejemplo: "Tractores · John Deere · 8320 · 2019" (no "De tracción doble")

## Arquitectura implementada

### 1. subcategory_l2 — campo nuevo en Product

Resuelto mediante **batch query de 2 pasos** en `DynamicHomeSections`:
1. `SELECT id, display_name, parent_id FROM subcategories WHERE id IN (subcategory_ids)`
2. `SELECT id, display_name FROM subcategories WHERE id IN (parent_ids)`
→ Construye `subcatL2Map: { subcategory_id → L2_display_name }`

El campo `subcategory_l2` es L2 si el ad está en L3, o igual a `subcategory` si está en L2.

**Nota:** El self-join PostgREST `subcategories!parent_id(display_name)` NO funcionó
(retornaba null). Se descartó en favor del batch query.

### 2. CATEGORY_CARD_LABEL — config en useProductImage.ts

```typescript
const CATEGORY_CARD_LABEL: Record<string, Array<string[]>> = {
  'maquinaria-agricola': [
    ['marca', 'marcas', 'brand'],
    ['modelo', 'model'],
    ['ano', 'año', 'year'],
  ],
  'hacienda': [
    ['raza', 'especie_y_raza', 'razabovinos', 'razaovinos', 'razaequinos', ...],
    ['edad', 'edad_meses'],
  ],
  // ... resto de categorías
};
```

Cada grupo es una lista de fallback keys — se usa el primer atributo encontrado en attrs.

### 3. Algoritmo getProductLabel

```
1. subcatLabel = product.subcategory_l2 || product.subcategory  (L2 universal)
2. catSlug = product.category_slug
3. Si catSlug en CATEGORY_CARD_LABEL → aplicar grupos de atributos en orden
4. Si no → fallback genérico marca · modelo · año
```

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `frontend/types.ts` | Agrega `subcategory_l2?: string` a Product |
| `frontend/src/components/sections/DynamicHomeSections.tsx` | Batch query subcatL2Map; adToProduct popula subcategory_l2 |
| `frontend/src/hooks/useProductImage.ts` | Reemplaza SUBCATEGORY_PRIORITY_ATTRIBUTES por CATEGORY_CARD_LABEL |
| `backend/app/api/ads/search/route.ts` | Batch-resolve subcategory_l2 per-ad en search response |
| `frontend/src/services/adsService.ts` | transformAdToProduct pasa subcategory_l2 |

## Keys de atributos confirmadas en form_fields_v2

| Categoría | Campo | Key en attrs |
|---|---|---|
| maquinaria-agricola | Marca | `marca`, `marcas` |
| maquinaria-agricola | Modelo | `modelo` |
| maquinaria-agricola | Año | `ano` |
| hacienda | Raza | `raza`, `especie_y_raza` |
| hacienda | Edad | `edad`, `edad_meses` |
| insumos | Marca | `marca` |
| inmobiliaria-rural | Tipo operación | `tipo_de_operacion` |
| servicios | Tipo búsqueda | `tipo_de_busqueda` |
| empleos | Tipo búsqueda | `necesidad` |

## Commits

- `2087dc8` feat(card): mostrar L2 en card de Maquinaria Agrícola (self-join attempt)
- `19f85f6` fix(card): reemplazar self-join roto por batch query
- `bc4945a` feat(card): config-driven labels por categoría (este sprint final)

## Próximos pasos / Backlog

- [ ] Verificar visualmente cada categoría con ads reales en DEV
- [ ] Hacienda: evaluar si `edad` en badge (overlay imagen) es redundante con label
- [ ] Considerar si Repuestos necesita mostrar Marca también (tiene `marca` en DB)
- [ ] `inmobiliaria-rural`: confirmar que `tipo_de_operacion` tiene valores legibles (ej: "Venta", "Alquiler")
- [ ] Aplicar migración `20260329000001_fix_featured_placement` a PROD cuando esté listo
