# Sprint: AdDetail — Atributos con Layout, Iconos y Diseño Profesional
> Fecha: 2026-03-30 | Estado: En progreso

## Problema

La página de detalle de avisos no muestra correctamente las características/atributos de cada aviso:
- Los campos no tienen íconos (aunque `form_fields_v2.icon` existe en la DB)
- El grid de columnas no espejea el formulario de alta (full/half/third → 6 cols virtuales)
- Tipos de campo `features`, `tags`, `range` no tenían renderizado en modo display
- `checkbox` booleanos mostraban como `Sí/No` en lugar de solo mostrar cuando true
- ICON_MAP solo tenía 10 íconos, insuficiente para todos los campos del sistema

## Root Cause Confirmado

- Datos: `ads.attributes` JSONB ✅ — correcto, el wizard guarda en `attributes`
- `dynamic_fields` está siempre vacío `{}` — columna legacy sin uso
- `AdFormSections.tsx` leía `ad.attributes` ✅ — correcto
- El problema era 100% visual/renderizado, no de datos

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/components/pages/ad-detail/utils.ts` | Expand ICON_MAP 10→35+, agregar getFieldWidthClass(), eliminar getSectionCols/gridColsClass/fieldSpanClass |
| `frontend/src/components/pages/ad-detail/AdFormSections.tsx` | Reescritura completa: field icons, 6-col grid, todos los field_types, TextareaDisplay component |

## Decisiones de Arquitectura

### Grid Layout — 6 columnas virtuales (espejea DynamicFormV2Fields.tsx)
```
full  → md:col-span-6  (fila completa)
half  → md:col-span-3  (mitad, default)
third → md:col-span-2  (tercio)
```

### Field Icons
- `FieldLabel` component extrae el ícono de `field.icon` → ICON_MAP lookup
- Normalización: `name.toLowerCase()` y `name.replace(/[_\s]/g, '-').toLowerCase()`
- Si no existe ícono → label muestra sin ícono (no rompe UI)

### Separación checkboxes (espejea wizard)
- Non-checkboxes: `grid-cols-1 md:grid-cols-6`
- Checkboxes: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (bajo el grid principal)

### TextareaDisplay como componente
- Necesita `useState` → debe ser componente React, no función
- Trunca a 200 chars con "Ver más / Ver menos"

### resolveFieldValue — mejora fallback
- Antes: `optionLabels[id][val] ?? strValue`
- Ahora: `optionLabels[id][val] ?? humanizeSlug(strValue)` → slugs se humanizan

### visible_when — NO aplicar en display mode
- El wizard oculta campos con `visible_when` basado en valores de otros campos
- En display: si un valor fue guardado, se muestra sin importar `visible_when`

## Field Types Soportados

| Type | Display |
|------|---------|
| text | label + valor humanizado |
| number | label + valor + suffix de metadata |
| select / autocomplete / radio | label + label del option resuelto |
| textarea | label + texto truncado con expand/collapse |
| checkbox | Solo cuando true → pill con CheckCircle2 |
| checkbox_group | label + pills badges brand-50 |
| features / tags | Igual que checkbox_group (pills) |
| range | label + "min – max suffix" |

## Verificación

1. Abrir cualquier aviso con atributos → secciones deben mostrar con íconos
2. Campo full → ocupa todo el ancho
3. Campos half → 2 por fila en desktop
4. Campos third → 3 por fila en desktop
5. Checkbox verdadero → pill con ✓
6. Checkbox falso → NO aparece
7. Textarea largo → truncado con "Ver más"

## Fuera de Scope

- Cambios a useAdData.ts (datos correctos)
- Cambios a AdDetail.tsx principal
- Migración de dynamic_fields (columna legacy, vacía)
- visible_when en modo display (decidido: no aplicar)
