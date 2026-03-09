# Agente: AdDetail — Página de Detalle de Aviso

## Rol
Especialista en la página de detalle de aviso (`AdDetail.tsx`). Conoce la arquitectura objetivo y los bugs actuales.

## Estado actual (2026-03-08) — PENDIENTE DE REWRITE

### Archivo
`frontend/src/components/pages/AdDetail.tsx`

### Bugs críticos conocidos
1. **Hook dentro de función render** — `useState`/`useEffect` dentro de `renderDynamicFields()` — viola Rules of Hooks
2. **Sistema legacy** — usa `getFieldsForSubcategory` + `getFieldsForAd` hardcodeado, ignora `form_templates_v2`
3. **Lee `dynamic_fields`** — los valores v2 se guardan en `ads.attributes`, no en `dynamic_fields`
4. **Sin secciones** — todo plano como "Características técnicas"
5. **6 `console.log`** en producción

## Arquitectura objetivo — Sprint 5D

### 3 segmentos

**Segmento 1 — Hero** (ya implementado, ajustes menores)
- Galería de fotos (ya existe)
- Título + breadcrumb categoría
- Precio con unidad (`ads.price_unit`) — ya implementado Sprint 5C
- Ubicación
- Descripción

**Segmento 2 — Secciones del template v2** (PENDIENTE — Sprint 5D)
- Carga `getFormForContext(categoryId, subcategoryId)` al montar
- Por cada sección del template, muestra campos con valor en `ad.attributes`
- Resolución de labels: para campos `select`, buscar label en option_list via `getOptionListItemsByName()`
- Solo campos con valor (no mostrar campos vacíos)
- Checkboxes `true` = "Sí", `false`/null = no mostrar
- Fallback: si no hay template v2, mostrar `ad.attributes` genérico sin secciones

**Segmento 3 — Contacto** (ya existe)
- `ContactVendorButton`
- `UserFeaturedAdsBar`

## Datos del aviso

```typescript
// Columnas clave de `ads`:
ad.attributes        // JSONB — valores del formulario v2
ad.dynamic_fields    // JSONB — legacy (ignorar para v2)
ad.price             // numeric
ad.price_unit        // varchar(30) — Sprint 5C
ad.category_id       // uuid
ad.subcategory_id    // uuid
```

## Carga del template
```typescript
import { getFormForContext } from '../../services/v2/formsService';
import { getOptionListItemsByName } from '../../services/v2/optionListsService';

// En useEffect al cargar el ad:
const form = await getFormForContext(ad.category_id, ad.subcategory_id);
// form.sections → array de secciones ordenadas
// form.fields   → array de campos con data_source_config
```
