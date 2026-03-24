# Sprint Icons + Wizard UX + Sync Fixes — 2026-03-23

## Objetivos completados

### 1. Iconos en CategoriasAdmin — rediseño completo
- **SVG upload** via file picker (botón "Upload") → Cloudinary `rural24/app/icons/`
- **Color picker** con 7 swatches (verde brand, gris, azul, rojo, amarillo, violeta, negro)
- Encoding: `url|#hexcolor` en campo `categories.icon` (sin migración DB)
- Helpers: `parseIcon()`, `buildIconValue()`, `hexToFilter()`
- Icon slot: vacío = borde punteado + ícono Upload; lleno = SVG con filter CSS + overlay hover (Palette, Upload, X)
- Archivo: `frontend/src/components/admin/CategoriasAdmin.tsx`

### 2. Iconos en TaxonomiaAdmin — rediseño completo
- Misma UX que CategoriasAdmin (SVG upload + color picker)
- **Fix delete categoría**: eliminaba ads pero NO subcategories/category_types → FK bloqueaba delete
  - Cascade correcto: ads → category_types → subcategories → categories
- Botón Trash2 (hover-visible, rojo) para eliminar categorías
- Archivo: `frontend/src/components/admin/TaxonomiaAdmin.tsx`

### 3. Fix SVG Upload (Cloudinary)
- Error: "Upload failed" — Cloudinary rechazaba SVG
- Fix: agregar `'svg'` a `allowed_formats` en `backend/infrastructure/cloudinary.service.ts`
- Carpeta compartida `app-icons` → `rural24/app/icons/` (sin prefijo env, compartida DEV+PROD)

### 4. Iconos en wizard PublicarAviso
- **Fix íconos rotos**: `MobileRow` y Miller columns usaban `cat.icon` directo como src → pasaba `url|#hexcolor` completo
- Fix: usar `parseIcon()` para extraer URL + aplicar CSS filter
- Íconos en `WizardBreadcrumb`: prop `categoryIcon`, renderiza `w-9 h-9` a la izquierda del texto
- Archivo: `frontend/src/components/pages/PublicarAviso.tsx`

### 5. Scale-up wizard "simular APP MOBILE"
- Mobile: `py-5 px-5`, íconos `w-8 h-8`, texto `text-lg`, chevrons `w-6 h-6`
- Desktop: `py-5 px-6`, íconos `w-8 h-8`, texto `text-lg`, max-height columnas `680px`, headers `text-sm py-3`
- Ancho formulario: `max-w-4xl` → `max-w-6xl`

### 6. Seed provincias/localidades PROD
- PROD tenía `provinces` y `localities` vacías (migración marcada pero no ejecutada)
- Nueva migración: `supabase/migrations/20260323000004_seed_provinces_localities_prod.sql`
- 24 provincias + ~270 localidades, todos con `ON CONFLICT DO NOTHING` (idempotente)

### 7. CONFIG_TABLES sync — agregar Taxonomía + Form Builder
- Agregado `'categories'` a `CONFIG_TABLES` en `backend/app/api/admin/sync/status/route.ts`
- Ya existían: `form_templates_v2`, `form_fields_v2`, `wizard_configs`
- Array final: `['categories', 'global_settings', 'global_config', 'home_sections', 'cms_hero_images', 'hero_images', 'banners_clean', 'form_templates_v2', 'form_fields_v2', 'wizard_configs']`

### 8. Fix git-push 500 — "Validation Failed" cuando main==prod
- GitHub API rechazaba crear PR cuando no hay commits diff
- Fix: verificar `GET /repos/{REPO}/compare/prod...main` antes de intentar crear PR
- Si `ahead_by === 0` → retorna `{ success: true, alreadyInSync: true }` sin tocar GitHub
- Frontend `handleCreatePR` actualizado para manejar `alreadyInSync`
- Archivos: `backend/app/api/admin/sync/git-push/route.ts`, `frontend/src/components/admin/SyncPanel.tsx`

## Pendiente para mañana

1. **Backend restart** — para que el fix de `allowed_formats: ['svg']` tome efecto en PROD
2. **Re-subir SVGs** — después del restart, volver a subir íconos de categorías
3. **Sync `categories` → PROD** — tabla categories actualizada en DEV con íconos, necesita clonarse
4. **Aplicar migración `20260323000004`** en PROD (provincias/localidades)
5. **Colores íconos → brand-600** — user pidió "Iconos cambialos a Verde Rural24 brand-600"
   - Default color en icon picker: `#84cc16` (brand-500) → cambiar a brand-600 (`#65a30d`)
   - O bien: actualizar DB directamente con UPDATE categories SET icon = replace(icon, color, '#65a30d')
6. **`#/attributes-admin` vacío en PROD** — mencionado pero no investigado

## Helpers de íconos (patrón establecido)
```typescript
// Parsear icon field
function parseIcon(icon: string | null | undefined): { url: string; color: string } {
  if (!icon || !icon.startsWith('http')) return { url: '', color: '#84cc16' };
  const [url, color] = icon.split('|');
  return { url, color: color ?? '#84cc16' };
}

// Construir icon field
function buildIconValue(url: string, color: string): string {
  return `${url}|${color}`;
}

// CSS filter por color hex
const FILTER_MAP: Record<string, string> = {
  '#84cc16': 'invert(71%) sepia(68%) saturate(500%) hue-rotate(50deg) brightness(95%) contrast(92%)',
  '#6b7280': 'invert(44%) sepia(8%) saturate(400%) hue-rotate(180deg) brightness(95%) contrast(90%)',
  '#3b82f6': 'invert(44%) sepia(80%) saturate(500%) hue-rotate(200deg) brightness(100%) contrast(95%)',
  '#ef4444': 'invert(33%) sepia(90%) saturate(600%) hue-rotate(340deg) brightness(100%) contrast(90%)',
  '#eab308': 'invert(80%) sepia(60%) saturate(500%) hue-rotate(15deg) brightness(100%) contrast(90%)',
  '#a855f7': 'invert(44%) sepia(60%) saturate(500%) hue-rotate(260deg) brightness(90%) contrast(95%)',
  '#111827': 'invert(5%) sepia(10%) saturate(500%) hue-rotate(180deg) brightness(30%) contrast(100%)',
};
function hexToFilter(hex: string): string {
  return FILTER_MAP[hex] ?? FILTER_MAP['#84cc16'];
}
```
