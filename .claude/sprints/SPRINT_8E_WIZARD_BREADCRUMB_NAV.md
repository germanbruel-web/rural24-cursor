# Sprint 8E — Breadcrumb Wizard: Navegación contextual Desktop & Mobile
> Fecha: 2026-03-14 | UX/Design sprint

## Problema

El wizard de PublicarAviso carecía de contexto visual durante el proceso de publicación:

1. **Breadcrumb incompleto**: Solo mostraba `Categoría > SubcategoríaHoja` (omitía el L2 intermedio cuando se seleccionaba un L3). Ej: "Maquinaria Agrícola > Balancín" en vez de "Maquinaria Agrícola > Acoplados > Balancín".
2. **Breadcrumb no persistía**: Solo aparecía en Step 2 (DynamicFieldsBlock), desaparecía en Steps 3-6.
3. **Título fijo**: Siempre "Nuevo Aviso" sin contexto del paso actual.
4. **Sin descripción en paso mobile**: Solo mostraba label del paso, sin la descripción de `WizardStep.description`.
5. **Volver roto**: El botón usaba `window.history.back()` en lugar de `goBack()` del wizard.
6. **Desktop sin breadcrumb**: El stepper no mostraba el path de categoría seleccionada.

## Decisión de arquitectura

### Breadcrumb derivado, sin hardcode

```tsx
// Detecta L3 via parent_id, construye path dinámicamente
const selectedSubFull = subcategories.find(s => s.id === selectedSubcategory);
const l2Sub = selectedSubFull?.parent_id
  ? subcategories.find(s => s.id === selectedSubFull.parent_id)
  : null;
const breadcrumbSegments: string[] = [
  categories.find(c => c.id === selectedCategory)?.display_name,
  l2Sub?.display_name,      // presente solo si hay L3 seleccionado
  selectedSubFull?.display_name,
].filter(Boolean) as string[];
```

Funciona para 1 segmento (solo categoría), 2 (L2 hoja) y 3 (L3 hoja). Sin condicionales por nivel.

### Componente WizardBreadcrumb (helper inline)

```tsx
function WizardBreadcrumb({ segments, onChangeCat }) {
  if (segments.length === 0) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {segments.map((seg, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
          <span className={`text-xs ${i === segments.length - 1 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
            {seg}
          </span>
        </Fragment>
      ))}
      {onChangeCat && <button ...>Cambiar</button>}
    </div>
  );
}
```

Botón "Cambiar" se inyecta como prop — solo aparece en steps > 1.

## Cambios implementados

### `frontend/src/components/pages/PublicarAviso.tsx`

1. **Breadcrumb derivado**: `breadcrumbSegments[]` calculado antes del render
2. **Helper WizardBreadcrumb**: Inline dentro del componente, sin archivo adicional
3. **Mobile sticky header** — nueva estructura 4 filas:
   - Row 1: `[← Volver]  Título dinámico  [AutoSave/EDIT]`
   - Row 2: Breadcrumb path (visible cuando hay categoría seleccionada)
   - Row 3: `Step label — Step description  X/N`
   - Row 4: Progress bar
4. **Título dinámico**:
   - Step 1: "¿Qué querés publicar?"
   - Steps 2+: "Armado del Aviso"
   - Edit mode: "Editar Aviso"
5. **Fix Volver**: `currentStep > 1 ? goBack() : window.history.back()`
6. **Desktop header**: Breadcrumb row debajo del stepper (separado con `border-t`, solo steps 2+)

### `frontend/src/components/wizard/blocks/DynamicFieldsBlock.tsx`

- Eliminada pastilla verde con breadcrumb redundante (lines 23-44 originales)
- Limpiados imports no usados: `Tag`, `ChevronRight`, `Building2`
- Limpiados props no usados: `categoryDisplayName`, `selectedPageType`, `onChangeCategory`
- Componente queda como wrapper mínimo de `DynamicFormLoader`

## Layout final Mobile

```
┌─────────────────────────────────────────────┐
│ [← Volver]  Armado del Aviso  [AutoSave]    │
│ Maquinaria > Acoplados > Balancín [Cambiar] │  ← solo si hay selección
│ Características — Detalles técnicos   2/6   │
│ ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  33% │
└─────────────────────────────────────────────┘
```

## Layout final Desktop

```
┌──────────────────────────────────────────────────┐
│ Armado del Aviso                  [AutoSave][Nuevo]│
│                                                   │
│ [Tag]────[Settings]────[MapPin]────[Camera]────…  │  ← Stepper
│                                                   │
│ Maquinaria > Acoplados > Balancín  [Cambiar]      │  ← solo steps 2+
└──────────────────────────────────────────────────┘
```

## Edge cases cubiertos

| Caso | Resultado |
|---|---|
| Step 1 sin categoría seleccionada | Sin breadcrumb, título "¿Qué querés publicar?" |
| Step 1 con categoría expandida | Breadcrumb muestra solo la categoría |
| L2 hoja (ej. Hacienda > Bovinos) | Breadcrumb 2 segmentos |
| L3 (ej. Maquinaria > Acoplados > Balancín) | Breadcrumb 3 segmentos |
| Edit mode | Título "Editar Aviso", badge EDIT en lugar de AutoSave |
| Click Cambiar | `onChangeCategory()` → resetea a step 1 |
