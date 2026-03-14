# Sprint 8A — Constructor Formularios + Taxonomía Maquinaria v2
> Fecha: 2026-03-14 | Commit: 7220257 | Estado: ✅ Completo en DEV

---

## RESUMEN EJECUTIVO

Sprint completo que construyó la infraestructura de formularios dinámicos por categoría con jerarquía de 3 niveles, y reemplazó el confuso `#/attributes-admin` con un nuevo **Constructor de Formularios** visual.

---

## 1. TAXONOMÍA — 3 NIVELES (DB)

### Migraciones aplicadas en DEV:
| Archivo | Contenido |
|---|---|
| `000002_subcategory_hierarchy.sql` | `parent_id uuid` en `subcategories` + RPC `search_subcategory_paths` |
| `000003_ads_locality_draft.sql` | `ads.locality_id` + `ads.draft_expires_at` |
| `000004_category_taxonomy_seed_v2.sql` | 8 categorías + 300+ subcategorías L2 (todas las categorías canónicas) |
| `000005_subcategory_level3_maquinaria.sql` | L3: Cosechadoras (10 tipos) + Tractores (8 tipos) |
| `000006_subcategory_level3_acoplados.sql` | L3: Acoplados (16 tipos) |
| `000007_cleanup_maquinaria_duplicates.sql` | Fusiona `maquinarias` (legacy Sprint3G) → `maquinaria-agricola` (nueva) |

### Estructura final Maquinaria Agrícola:
```
Maquinaria Agrícola (category, slug=maquinaria-agricola)
  └─ Cosechadoras (L2, slug=cosechadoras)
       └─ Agrícola de tracción doble (L3)
       └─ Agrícola de tracción simple (L3)
       └─ Agrícola otras (L3)
       └─ De aceitunas / algodón / cañas / forraje / Maní / papas / Otras
  └─ Tractores (L2, slug=tractores)
       └─ Articulado / Tracción doble / Tracción simple / Otros / Antiguo / Oruga / Viñatero / Otros
  └─ Acoplados (L2, slug=acoplados)
       └─ Balancín / Carretones / Cisterna / Fijos / Forestales / Forrajeros / Jaula / ...
  └─ ... 66 subcategorías L2 más (flat, sin hijos)
```

### Regla de unicidad L3:
- `name = slug` (ej: `'cosechadora-papas'`) — evita conflicto con constraint `(category_id, name)`
- `display_name` = texto legible (ej: `'De papas'`)

---

## 2. BACKEND BFF — Nuevos Endpoints

### `/api/config/locations`
- `GET ?type=provinces` → lista de provincias activas
- `GET ?type=localities&province_id=uuid` → localidades de una provincia
- Edge runtime, cache 24h

### `/api/config/categories/search`
- `GET ?q=query` → llama RPC `search_subcategory_paths`, devuelve breadcrumbs
- Retorna: `{ leaf_id, path, leaf_name, cat_name, cat_icon }`
- Edge runtime, cache 5min

### `/api/config/form/[subcategoryId]` (actualizado)
- Busca `parent_id` de la subcategoría
- Si L2 con hijos → retorna 400 "no es hoja"
- Retorna `category_path`, `is_leaf_node`, `current_step: 2`, `total_steps: 6`

### `/api/ads/route.ts` (actualizado)
- `sanitizeRichText(body.description)` antes de validación Zod
- Auto-setea `draft_expires_at = now() + 24h` si `status === 'draft'`

### `/api/ads/cron/cleanup-drafts` (nuevo)
- Busca ads con `status='draft' AND draft_expires_at < now()`
- Elimina imágenes de Cloudinary → soft-delete (`status='deleted'`)
- Protegido por `x-cron-secret`

### `backend/domain/shared/sanitize.ts` (nuevo)
- `sanitizeRichText()`: regex que elimina script/style/iframe/event handlers/javascript:href

### Schemas actualizados (`backend/types/schemas.ts`)
- `SubcategoryLeafSchema` con `parent_id: z.string().uuid()`
- `SubcategorySchema` con `parent_id nullable`, `is_leaf`, `has_children`, `children[]`
- `AdCreateSchema` con `locality_id`, `price_unit`, `draft_expires_at`

---

## 3. FRONTEND — Constructor de Formularios (`#/attributes-admin`)

### Archivo: `frontend/src/components/admin/FormBuilderAdmin.tsx`

**UX:**
- Panel izquierdo: árbol de categorías (3 niveles)
  - Cada categoría padre tiene entrada `🌐 Formulario global`
  - Separador "VARIANTES" antes de subcategorías
  - L2 con hijos se expanden para mostrar L3
- Panel derecho: editor de campos
  - Badge **Global** (verde) o **Variante** (púrpura)
  - Aviso informativo en variante: "Los campos globales se cargan primero"
  - Lista de campos con reorden (▲▼), editar, eliminar
  - Editor inline: etiqueta, tipo (9 opciones), ancho (Completo/Mitad/Tercio), obligatorio, texto ejemplo, texto ayuda, lista de opciones

**Jerarquía de formularios:**
- `form_templates_v2` con `category_id=X, subcategory_id=NULL` = **Global** (aplica a TODA la categoría)
- `form_templates_v2` con `subcategory_id=Y` = **Variante** (campos adicionales de esa sub)
- En el wizard de alta: se carga Global primero, luego Variante on top

**Sin palabras en inglés** — "Placeholder" → "Texto de ejemplo", "Full/Half/Third" → "Completo/Mitad/Tercio"

---

## 4. ESTADO PENDIENTE (próxima sesión)

### A. Integración wizard PublicarAviso — Step 1 (PRIORIDAD ALTA)
**Problema actual:** El Step 1 solo muestra 2 niveles (Categoría → L2). No navega L3.
**Lo que falta:**
- Detectar si L2 tiene hijos (`has_children`) → mostrar flecha y expandir L3
- Solo las hojas (L2 sin hijos, o L3) habilitan el botón SIGUIENTE
- El `DynamicFormLoader` en Step 2 debe cargar: Global de la categoría PRIMERO + Variante de la subcategoría hoja DESPUÉS

**Archivo:** `frontend/src/components/pages/PublicarAviso.tsx` líneas 1100-1200

**Estado actual del Step 1 (línea 1156):**
```tsx
// Muestra subcategorías FLAT — no tiene lógica de L3
{subcategories.map((sub) => {
  // sub es cualquier L2, incluso si tiene hijos
  // Click directo va a Step 2 sin verificar si es hoja
})}
```

**Lo que hay que cambiar:**
1. Cargar subcategorías con `parent_id` (la API ya lo devuelve)
2. Separar L2 con hijos vs L2 hoja
3. L2 con hijos → click expande L3 (inline, sin cambiar step)
4. L3 → click selecciona y avanza a Step 2
5. `selectedSubcategory` debe guardar el ID de la HOJA real

### B. DynamicFormLoader — carga Global + Variante
**Archivo:** `frontend/src/components/forms/DynamicFormLoader.tsx`
**Cambio:** Debe llamar `getFormForContext(categoryId)` para el global Y `getFormForContext(categoryId, subcategoryId)` para la variante. Combinar campos en orden: globales primero, variantes después.

### C. Gestión de listas de opciones en FormBuilderAdmin
**Pendiente:** El FormBuilderAdmin muestra listas de opciones al seleccionar tipo `select`/`autocomplete` pero NO permite crear/editar las listas desde la misma pantalla.
**Lo que falta:** Un panel o drawer para ver/editar los ítems de cada `option_list` vinculada a un campo.

### D. Migraciones a PROD
Las migraciones 000001→000007 están en DEV. Cuando el usuario confirme:
```bash
node .claude/scripts/db-run-migrations.mjs prod 20260314
```

---

## 5. ARCHIVOS LEGACY (pendiente eliminar)

| Archivo | Motivo | Riesgo |
|---|---|---|
| `frontend/src/components/admin/AttributesAdmin.tsx` | Reemplazado por FormBuilderAdmin | Solo exportado en index.ts, no usado en App.tsx |
| `frontend/src/components/admin/FormManagerTab.tsx` | Solo usado por AttributesAdmin | Bajo |
| `frontend/src/components/admin/FieldsEditorDrawer.tsx` | Solo usado por FormManagerTab | Bajo |
| `frontend/src/components/admin/GroupsAdmin.tsx` | Solo usado por AttributesAdmin | Bajo |
| `frontend/src/components/admin/ImportTemplateModal.tsx` | Solo usado por AttributesAdmin | Bajo |
| `frontend/src/components/admin/FormPreview.tsx` | Solo usado por AttributesAdmin | Bajo |
| `frontend/src/services/v2/attributesService.ts` | ⚠️ **AdDetailPage.tsx lo importa** | NO BORRAR aún |
| `frontend/src/services/v2/groupsService.ts` | Solo usado por AttributesAdmin | Bajo |
| `frontend/src/services/v2/templatesService.ts` | Usado por AttributesAdmin + ImportTemplateModal | Bajo |

---

## 6. ESTADO DEL SISTEMA (2026-03-14)

### DB DEV ✅
- Migraciones 000001→000007 aplicadas
- Categorías: 8 activas (maquinaria-agricola, repuestos, hacienda, insumos, equipamiento, inmobiliaria-rural, empleos, servicios)
- Subcategorías Maquinaria: 69 L2 + 34 L3 (cosechadoras+tractores+acoplados)
- Categoría legacy `maquinarias` desactivada

### DB PROD ⚠️
- Solo tiene migraciones hasta Sprint 7B
- Pendiente aplicar 000001→000007 (confirmar con usuario)

### GitHub
- Branch `main` = commit `7220257` (Sprint 8A completo)
- Render DEV deployando automáticamente

### Formularios (form_templates_v2)
- `maquinaria_maquinarias`, `maquinaria_servicios`, `maquinaria_empresas` → migrados a `maquinaria-agricola` como globales
- Pendiente crear formularios globales para las otras 7 categorías
