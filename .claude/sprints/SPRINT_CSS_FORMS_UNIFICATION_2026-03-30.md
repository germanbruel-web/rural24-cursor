# Sprint: Unificación CSS Formularios — 2026-03-30

## Estándar definido (tokens canónicos)

| Propiedad | Token |
|---|---|
| Font size inputs | `text-sm` |
| Padding inputs | `px-3 py-2` |
| Padding right select | `pr-8` |
| Border | `border border-gray-300` (1px) |
| Border radius | `rounded-sm` |
| Label weight | `font-medium` |
| Label margin | `mb-1` |
| Focus ring | `focus:ring-2 focus:ring-brand-500` |
| Checkbox size | `w-4 h-4` |
| Error color | `border-red-400 ring-red-400` |

---

## ✅ Completado en esta sesión

| Archivo | Cambios |
|---|---|
| `EditarAviso.tsx` | `rounded-lg→sm`, layout 2col 50/50, `pr-8` selects, `border-2→border`, `font-medium` |
| `DynamicFormV2Fields.tsx` | `inputCls` unificado, `labelCls` unificado, checkboxes `w-4 h-4 rounded-sm border` |
| `BackendDynamicField.tsx` | `DESIGN_SYSTEM` completo reescrito, `ring-primary→ring-brand` |
| `DynamicFormLoader.tsx` | `rounded-lg→sm` |
| `AutofillButton.tsx` | `rounded-lg→sm` |

---

## 🔴 Pendiente — Formularios usuario (PRIORIDAD ALTA)

### Wizard PublicarAviso — blocks
- `frontend/src/components/wizard/blocks/LocationBlock.tsx`
- `frontend/src/components/wizard/blocks/PriceBlock.tsx`
- `frontend/src/components/wizard/blocks/TitleDescriptionBlock.tsx`
- `frontend/src/components/wizard/blocks/ColorPickerBlock.tsx`

**Problema:** Wizard usa inputs con clases propias no unificadas. El usuario ve el wizard antes de ver EditarAviso → inconsistencia visual alta.

### Forms de búsqueda / filtros
- `frontend/src/components/FilterSidebar.tsx` — filtros de búsqueda con selects y checkboxes
- `frontend/src/components/filters/DynamicFilterPanel.tsx` — panel dinámico de filtros

### Auth forms
- `frontend/src/components/auth/LoginForm.tsx`
- `frontend/src/components/auth/RegisterForm.tsx`
- `frontend/src/components/auth/ResetPasswordForm.tsx`

### Dashboard / Profile
- `frontend/src/components/dashboard/ProfilePanel.tsx`
- `frontend/src/components/dashboard/EmpresaForm.tsx`

### Otros forms usuario
- `frontend/src/components/forms/BackendFormSection.tsx` — sistema legacy
- `frontend/src/components/contact/ContactModal.tsx`
- `frontend/src/components/SimpleImageUploader/SimpleImageUploader.tsx`

---

## 🟡 Pendiente — Forms Admin (PRIORIDAD MEDIA)

- `frontend/src/components/admin/QuickEditAdModal.tsx`
- `frontend/src/components/admin/CreateFeaturedModal.tsx`
- `frontend/src/components/admin/AllAdsTab.tsx` — filtros de búsqueda admin
- `frontend/src/components/admin/FormBuilderAdmin.tsx`
- `frontend/src/components/admin/form-builder/components/FieldEditor.tsx`
- `frontend/src/components/admin/TaxonomiaAdmin.tsx`
- `frontend/src/components/admin/CategoriasAdmin.tsx`
- `frontend/src/components/admin/UsersPanel.tsx`

---

## 🟢 Pendiente — Atoms (base del sistema)

Los atoms deberían ser la fuente de verdad. Si se unifican, todo el resto hereda.

- `frontend/src/components/atoms/Input/Input.tsx` — atom base input
- `frontend/src/components/atoms/Label/Label.tsx` — atom base label

**Recomendación:** Actualizar los atoms primero y luego reemplazar clases inline en componentes que ya usen `<Input />` y `<Label />` de atoms.

---

## Criterio de priorización

1. **Usuario ve primero** → Wizard (PublicarAviso) y Auth (Login/Register)
2. **Frecuencia de uso** → Filtros de búsqueda (todos los usuarios, en cada búsqueda)
3. **Admin interno** → Último, impacta solo superadmin

## Nota
`rounded-lg` aparece en ~150 archivos del frontend. Muchos son componentes de UI (cards, banners, modals de layout) donde `rounded-lg` es correcto y NO debe cambiarse. El cambio `rounded-sm` aplica **solo a inputs, selects, textareas y secciones de formulario**.
