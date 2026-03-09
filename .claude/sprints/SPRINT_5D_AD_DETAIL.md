# Sprint 5D — AdDetail: Reescritura completa (3 segmentos)

> **Fecha:** 2026-03-09
> **Estado:** ✅ COMPLETADO
> **Archivo:** `frontend/src/components/pages/AdDetail.tsx`

---

## Objetivo

Reescribir `AdDetail.tsx` desde cero para:
1. Eliminar bugs/deuda técnica acumulada
2. Mostrar datos reales de `ads.attributes` (JSONB) via form_templates_v2
3. Soporte de `price_unit` (Sprint 5C)
4. Resolución correcta de labels para selects con option_lists

---

## Bugs eliminados

| Bug | Solución |
|---|---|
| 6 `console.log` de debug | Eliminados |
| `useState`/`useEffect` dentro de `renderDynamicFields()` | Movidos al componente raíz |
| Lee `ad.dynamic_fields` (legacy) | Reemplazado por `ad.attributes` (JSONB) |
| `operation_types` no cargado (select('*') sin join) | Cargado en paralelo con subcategorías |
| `(ad as any).price_unit` | Tipado correctamente en interface `Ad` |
| `(ad as any).category_id` en UserFeaturedAdsBar | Tipado correctamente en interface `Ad` |

---

## Arquitectura

### 3 segmentos de render

```
┌─────────────────────────────────────────────────┐
│  Segmento 1 — Hero                              │
│  Galería + Breadcrumb + Título + Precio+Unidad  │
│  Ubicación + Fecha + Descripción                │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  Segmento 2 — Secciones del template v2         │
│  getFormForContext(categoryId, subcategoryId)    │
│  → secciones en orden del template              │
│  → solo campos con valor en ad.attributes       │
│  → labels resueltos via option_list_items       │
│  Fallback: ad.attributes genérico si no hay v2  │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  Segmento 3 — Contacto + UserFeaturedAdsBar     │
└─────────────────────────────────────────────────┘
```

### State del componente

| State | Tipo | Propósito |
|---|---|---|
| `ad` | `Ad \| null` | Datos del aviso |
| `loading` | `boolean` | Spinner inicial |
| `currentImageIndex` | `number` | Galería |
| `form` | `CompleteFormV2 \| null` | Template v2 |
| `optionLabels` | `OptionLabels` | `{ option_list_id → { value → label } }` |

### Flujo de carga

1. `loadAd()` → carga `ads.*` + subcategoría + categoría + operation_type en paralelo
2. `loadFormAndLabels(ad)` (efecto sobre `ad.id`) → `getFormForContext` → batch-load option_list_items
3. Render: galería, hero, secciones v2, contacto

### Interface Ad (nueva)

```typescript
interface Ad {
  id, title, description, location
  price?: number
  price_unit?: string         // Sprint 5C
  phone, user_id
  category_id: string         // typed (no as any)
  subcategory_id?: string
  operation_type_id?: string
  attributes?: Record<string, any>  // JSONB — reemplaza dynamic_fields
  created_at
  categories, subcategories, operation_types  // loaded separately
  images?: NormalizedImage[]
}
```

---

## Resolución de labels

```
resolveFieldValue(field, value):
  1. checkbox → "Sí" / "No"
  2. field.options (static) → busca por value
  3. field.option_list_id → optionLabels[id][value]
  4. field_type=number + metadata.suffix → "250 HP"
  5. fallback → String(value)
```

---

## Dependencias de servicios

| Servicio | Función |
|---|---|
| `v2/formsService` | `getFormForContext(categoryId, subcategoryId)` |
| `v2/optionListsService` | `getOptionListItemsForSelect(listId)` |
| `utils/imageHelpers` | `normalizeImages` |
