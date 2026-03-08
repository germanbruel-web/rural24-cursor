# Sprint 4A — Option Lists: Listas de opciones reutilizables

> **Fecha:** 2026-03-07 19:19
> **Estado:** ✅ COMPLETADO
> **Rama:** `main`
> **Migration:** `supabase/migrations/20260308000001_sprint4a_option_lists.sql`

---

## Contexto y motivación

El sistema de formularios dinámicos (`form_fields_v2`) almacenaba las opciones de campos tipo `select` directamente como arrays `string[]` en cada campo. Esto generaba duplicación masiva: si 10 formularios tenían un campo "Raza bovina", cada uno guardaba sus propias 18 opciones, imposibilitando actualizar en un solo lugar.

**Solución:** Catálogos centralizados de valores (`option_lists`) referenciados por FK desde los campos de formulario.

---

## Arquitectura implementada

### Tablas nuevas

#### `public.option_lists`
Catálogo de listas reutilizables.

| Columna        | Tipo        | Descripción                                      |
|----------------|-------------|--------------------------------------------------|
| `id`           | uuid PK     | Generado automáticamente                        |
| `name`         | text UNIQUE | Slug identificador: `"razas-bovinas"`           |
| `display_name` | text        | Nombre visible: `"Razas Bovinas"`               |
| `scope`        | text        | `global` o `category`                           |
| `category_id`  | uuid FK     | Categoría asociada (si scope = category)        |
| `description`  | text        | Descripción opcional                            |
| `is_active`    | boolean     | Activa/inactiva                                 |

#### `public.option_list_items`
Ítems de cada lista.

| Columna      | Tipo    | Descripción                                       |
|--------------|---------|---------------------------------------------------|
| `id`         | uuid PK |                                                   |
| `list_id`    | uuid FK | Referencia a `option_lists` (CASCADE DELETE)     |
| `value`      | text    | Valor interno slug: `"aberdeen-angus"`           |
| `label`      | text    | Etiqueta visible: `"Aberdeen Angus"`             |
| `sort_order` | integer | Orden de aparición                               |
| `metadata`   | jsonb   | Datos extra opcionales (color, imagen, especie)  |
| `is_active`  | boolean | Activo/inactivo                                  |
| UNIQUE       |         | `(list_id, value)`                               |

**Índice:** `idx_option_list_items_list_order ON (list_id, sort_order)` para performance.

#### Columna nueva en `form_fields_v2`
```sql
option_list_id uuid REFERENCES public.option_lists(id) ON DELETE SET NULL
```
Aplicada condicionalmente (el ALTER solo se ejecuta si `form_fields_v2` existe en la DB).

### RLS
- **SELECT:** público (todos pueden leer)
- **INSERT / UPDATE / DELETE:** solo `superadmin` (verificado contra `public.profiles.role`)
- Las policies de escritura se crean condicionalmente si `public.profiles` existe (evita error en entornos sin schema base)

---

## Seed inicial (datos de ejemplo)

### 8 listas creadas
| Nombre slug         | Display name            | Scope    | Ítems |
|---------------------|-------------------------|----------|-------|
| `combustibles`      | Combustibles            | global   | 6     |
| `provincias-ar`     | Provincias de Argentina | global   | 24    |
| `razas-bovinas`     | Razas Bovinas           | category | 18    |
| `razas-equinas`     | Razas Equinas           | category | 8     |
| `razas-porcinas`    | Razas Porcinas          | category | 0*    |
| `razas-ovinas`      | Razas Ovinas            | category | 0*    |
| `sexo-animal`       | Sexo del Animal         | global   | 4     |
| `estado-general`    | Estado General          | global   | 5     |

> \* `razas-porcinas` y `razas-ovinas` se crearon sin ítems — se completarán cuando se construyan los formularios de hacienda menor.

Las listas ganaderas (`razas-*`) se asocian automáticamente a la categoría `ganaderia` si existe.

---

## Archivos creados / modificados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `supabase/migrations/20260308000001_sprint4a_option_lists.sql` | Migration SQL | Tablas, índices, RLS, seed |
| `frontend/src/services/v2/optionListsService.ts` | Service | CRUD completo + bulk import |
| `frontend/src/components/admin/OptionListsTab.tsx` | Component | UI admin para gestión de listas |
| `frontend/src/components/admin/FormManagerTab.tsx` | Component | UI admin para gestión de formularios |
| `frontend/src/components/admin/AttributesAdmin.tsx` | Modified | Tab nav: Atributos / Formularios / Listas |

---

## API del servicio (`optionListsService.ts`)

```typescript
// READ
getOptionLists(filters?)           // enriquecido con item_count + used_in_fields
getOptionListById(id)
getOptionListItems(listId)
getOptionListItemsForSelect(listId) // → { value, label }[]

// WRITE
createOptionList(input)            // auto-slug desde display_name
updateOptionList(id, input)
deleteOptionList(id)               // guard: lanza error si está en uso en campos

// ITEMS
addOptionListItem(listId, item)
updateOptionListItem(itemId, updates)
deleteOptionListItem(itemId)

// BULK
parseBulkText(text)                // "label" o "value|label" por línea
bulkUpsertItems(listId, items)     // upsert, retorna { inserted, updated }
replaceAllItems(listId, items)     // borra todo + re-inserta
```

---

## UI Admin — Acceso

Ruta: `#/attributes-admin` → tab **"Listas de Opciones"**

### OptionListsTab
- Tabla con display_name, scope badge (Global / Categoría), item_count, used_in_fields
- Crear / editar lista (modal)
- Ver ítems en drawer lateral derecho (animación `drawer-enter`)
  - Tab "Lista de ítems": agregar / editar inline / eliminar
  - Tab "Importar en masa": textarea + preview en tiempo real + modo Agregar o Reemplazar
- Eliminar lista (con advertencia si está en uso)

### FormManagerTab
- Lista de `form_templates_v2` con scope, categoría, cantidad de campos
- Crear formulario (modal) → empieza como `is_active: false`
- Duplicar formulario (copia completa: template + fields + options)
- Toggle activo/inactivo inline
- Eliminar con confirmación (advierte cantidad de campos afectados)

---

## Incidentes durante el sprint

### Error 1: `relation "public.form_fields_v2" does not exist`
La tabla existe en servicios TypeScript pero nunca fue migrada a la DB de forma rastreable.
**Fix:** ALTER envuelto en `DO $$ BEGIN IF EXISTS(...) THEN ... END IF; END $$`

### Error 2: `relation "public.profiles" does not exist`
Las policies de escritura referenciaban `profiles` pero en el entorno de ejecución la tabla no estaba visible.
**Fix:** Todo el bloque de policies de superadmin envuelto en `DO $$` condicional sobre `information_schema.tables`.

---

## Próximos pasos — Sprint 4B

> Fecha planificada: **2026-03-07** (continúa hoy o próxima sesión)

### Objetivo: Form Manager — Edición de campos de formulario

| # | Tarea | Prioridad |
|---|-------|-----------|
| 4B.1 | **FieldsEditor**: drawer/panel para editar campos de un `form_template_v2` | Alta |
| 4B.2 | Tipos de campo soportados: `text`, `number`, `select`, `multiselect`, `boolean`, `date`, `textarea` | Alta |
| 4B.3 | Vincular campo `type=select` a una `option_list` (selector de lista existente) | Alta |
| 4B.4 | Drag & drop para reordenar campos (`sort_order`) — usar `@dnd-kit` o CSS nativo | Media |
| 4B.5 | Campo `is_required` + `placeholder` + `help_text` editables | Media |
| 4B.6 | Preview del formulario renderizado (readonly) dentro del editor | Baja |
| 4B.7 | Conectar `get_form_for_context()` RPC al frontend de publicación de avisos | Alta |

### Deuda pendiente relacionada

- Completar ítems de `razas-porcinas` y `razas-ovinas`
- Asociar formularios existentes en `form_templates_v2` a sus categorías correctas
- Decidir qué hacer con `dynamic_attributes` (freeze o migrar a `form_templates_v2`)
- Sprint 3F (Display Logic): conectar `get_featured_homepage/results/detail()` al frontend

---

## Decisiones de diseño registradas

1. **Extender `form_templates_v2` en lugar de construir nuevo** — lo que está en producción y funciona no se reemplaza; se construye sobre ello.
2. **Option Lists como FK, no como arrays embebidos** — single source of truth para catálogos de valores.
3. **`dynamic_attributes` se congela** — es la UI admin legacy, no conectada al runtime. No se elimina aún.
4. **Seed mutable** — los datos de ejemplo se pueden borrar y regenerar desde el admin UI sin volver a correr SQL.
