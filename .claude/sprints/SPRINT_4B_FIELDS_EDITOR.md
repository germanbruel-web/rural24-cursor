# Sprint 4B — Fields Editor: Editor de campos de formulario

> **Fecha:** 2026-03-08 08:30
> **Estado:** ✅ COMPLETADO
> **Rama:** `main`
> **Sin SQL nuevo** — tablas ya existían en DB (form_fields_v2, form_field_options_v2)

---

## Objetivo

Construir la UI de administración para editar los campos internos de cada `form_template_v2`.
Sprint 4A creó las listas de opciones. Sprint 4B cierra el ciclo permitiendo gestionar visualmente
los campos de formulario que usan esas listas.

---

## Archivos creados / modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `frontend/src/services/v2/formFieldsService.ts` | Nuevo service | CRUD completo de campos y opciones estáticas |
| `frontend/src/components/admin/FieldsEditorDrawer.tsx` | Nuevo componente | Drawer editor de campos (Sprint 4B principal) |
| `frontend/src/components/admin/FormManagerTab.tsx` | Modificado | Botón "X campos" → abre FieldsEditorDrawer |
| `frontend/src/types/v2.ts` | Modificado | `option_list_id?: string | null` en `FormFieldV2` |

---

## Arquitectura

### `formFieldsService.ts`

```typescript
getFormFields(templateId)          // Carga campos ordenados por display_order
createFormField(templateId, field, displayOrder)  // Auto-slug field_name desde label
updateFormField(fieldId, updates)
deleteFormField(fieldId)           // Elimina opciones estáticas primero
moveFieldUp(fieldId, fields)       // Intercambia display_order con campo anterior
moveFieldDown(fieldId, fields)     // Intercambia display_order con campo siguiente

// Opciones estáticas (form_field_options_v2)
getFieldOptions(fieldId)
addFieldOption(fieldId, value, label, order)  // Auto-slugifica option_value
updateFieldOption(optionId, updates)
deleteFieldOption(optionId)
```

### `FieldsEditorDrawer.tsx` — Sub-componentes

| Componente | Función |
|---|---|
| `FieldsEditorDrawer` | Contenedor principal + drawer layout |
| `FieldCard` | Card colapsada por campo: ↑↓ + tipo + label + actions |
| `FieldEditForm` | Formulario inline expandible (accordion) dentro de la card |
| `AddFieldForm` | Formulario para crear nuevo campo (top del drawer) |
| `StaticOptionsManager` | Gestión de `form_field_options_v2` para campos sin option_list |

### Tipos de campo soportados

| Tipo | Icono | Opciones requeridas |
|---|---|---|
| text | Type | No |
| number | Hash | No |
| textarea | AlignLeft | No |
| select | List | Sí (option_list o estáticas) |
| autocomplete | Zap | Sí (option_list o estáticas) |
| checkbox | CheckSquare | No |
| range | Sliders | No |
| tags | Tag | No |
| features | Star | No |

### Flujo de opciones para select/autocomplete

```
Campo tipo select/autocomplete
  ├── Opción A: Vincular a option_list (FK → option_lists.id)
  │   └── Dropdown de listas activas del sistema
  └── Opción B: Opciones estáticas manuales
      └── StaticOptionsManager → form_field_options_v2
```

---

## UX / Patrones aplicados

- **Drawer derecho**: `w-[95vw] sm:w-[640px]`, `.drawer-enter` (slideInRight 0.25s)
- **Cards expandibles**: click en lápiz → formulario inline debajo (accordion)
- **Reordenamiento**: botones ↑↓ (intercambia `display_order` en DB)
- **Colores**: 100% brand-* y grays — sin amber, blue, hex hardcoded
- **Destructivos**: `window.confirm()` antes de eliminar campo u opción
- **field_name**: auto-generado desde label al crear, readonly después (es la key de DB)

---

## Integración con FormManagerTab

- Columna "Campos" convertida en botón clicable: `Settings2 icon + "N campos"`
- Click → abre `FieldsEditorDrawer` con el template seleccionado
- `onFieldsChanged` callback → recarga la tabla (actualiza contadores)
- Un drawer a la vez (estado `editingFields: FormTemplateV2 | null`)

---

## Próximos pasos — Sprint 4C

| # | Tarea | Prioridad |
|---|---|---|
| 4C.1 | Conectar `get_form_for_context()` RPC al formulario de publicación de avisos | Alta |
| 4C.2 | Drag & drop para reordenar campos (`@dnd-kit`) | Media |
| 4C.3 | Editor de secciones del formulario (`form_templates_v2.sections` JSONB) | Media |
| 4C.4 | Validaciones avanzadas por campo (min/max para number, pattern para text) | Baja |
| 4C.5 | Preview renderizado del formulario dentro del drawer | Baja |

---

## Decisiones registradas

1. **Sin SQL nuevo** — todas las tablas necesarias ya existían. Solo se agregó `option_list_id` al tipo TypeScript.
2. **field_name es inmutable** — se auto-genera del label al crear y no se puede cambiar (es clave de DB y de la lógica de `prepareFormDataForSubmit`).
3. **Reordenamiento con ↑↓** — no drag & drop aún. Pragmático para Sprint 4B. Drag (`@dnd-kit`) queda para 4C.
4. **Opciones: list vinculada vs estáticas** — el campo `option_list_id` tiene prioridad. Si está seteado, se ignoran las `form_field_options_v2`.
