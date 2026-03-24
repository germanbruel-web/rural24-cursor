# Sprint: Media Refactor + Cloudinary Fix
> Fecha: 2026-03-24 | Estado: ✅ Completo

## Objetivo
Refactorización integral del sistema de media: estructura de carpetas Cloudinary, separación DEV/PROD, MediaInfo JSONB, eliminación de imágenes, y fixes derivados.

---

## Cambios realizados

### 1. `backend/lib/media-config.ts` (NUEVO)
Fuente de verdad para estructura de carpetas Cloudinary.
- `MEDIA_ENV`: lee `CLOUDINARY_ENV` env var (no `NODE_ENV` — ver bug abajo)
- `MEDIA_ROOTS`: `ugc`, `cms`, `app` (app sin prefijo de entorno)
- `MediaEntity`: `'ads' | 'users' | 'machinery' | 'properties'`
- `CMS_FOLDERS`, `APP_FOLDERS` con prefijo `app-*`

### 2. `backend/infrastructure/cloudinary.service.ts`
- `buildFolder(folder, entity?)`: resuelve ruta según tipo (app/cms/ugc)
- `buildPublicId(userId?)`: `{userId}_{ts36}_{rand}` — trazable por usuario
- `uploadToCloudinary`: acepta `entity` y `userId`
- `CloudinaryUploadResult`: incluye `public_id` y `version`

### 3. `backend/app/api/uploads/route.ts`
- Pasa `_user.id` a `uploadToCloudinary`
- Respuesta incluye `public_id`, `version`, `format`, `width`, `height`

### 4. `backend/app/api/uploads/delete/route.ts`
- Acepta `public_id` y `public_ids` (nuevo contrato MediaInfo)
- Mantiene backward compat con `url` y `urls` (MyAdsPanel)

### 5. `backend/types/schemas.ts`
- `AdImageSchema`: `path` opcional (legacy), agrega `public_id`, `version`, `format`, `width`, `height`

### 6. `frontend/src/services/api/uploads.ts`
- `MediaInfo` interface: `{ public_id, url, version, format, width, height, bytes }`
- `uploadImage()` retorna `MediaInfo` completo
- `deleteImage()` y `deleteMany()` — auth headers + envían `public_id`/`public_ids`

### 7. `frontend/src/components/SimpleImageUploader/SimpleImageUploader.tsx`
- `UploadedImage`: agrega `public_id`, `version`, `format`, `width`, `height`
- `removeImage()`: llama `uploadsApi.deleteImage(public_id)` fire-and-forget al eliminar imagen subida
- `addDefaultImage()`: rechaza URLs no-Cloudinary (previene leak Supabase Storage)

### 8. `frontend/src/components/atoms/Image/RuralImage.tsx` (NUEVO)
- Acepta `MediaInfo | string | null`
- Variantes: `full | thumbnail (200px) | card (400x300) | hero (1200px)`
- `buildCloudinaryUrl`: transforma on-the-fly con version para cache-busting
- Fallback SVG placeholder inline en error

### 9. `frontend/src/constants/defaultImages.ts`
- Reemplaza `via.placeholder.com` con SVG data URI inline (sin dependencias externas)

### 10. `frontend/src/components/admin/form-builder/components/CategoryTree.tsx`
- Fix: `cat.icon` en formato `url|#hexcolor` se renderizaba como texto crudo
- Ahora: si empieza con `http`, renderiza `<img src={url}>` parseando el `|`

---

## Bug crítico resuelto: DEV subía imágenes a `/prod/`

**Causa:** `MEDIA_ENV = NODE_ENV === 'production' ? 'prod' : 'dev'`
Render siempre deploya Next.js con `NODE_ENV=production`, tanto DEV como PROD.

**Fix:** Variable explícita `CLOUDINARY_ENV=dev|prod` en cada servicio Render.
- Local `.env.local`: `CLOUDINARY_ENV=dev`
- Render DEV: `CLOUDINARY_ENV=dev` (seteado manualmente en Render dashboard)
- Render PROD: `CLOUDINARY_ENV=prod` (seteado manualmente en Render dashboard)

---

## Estructura Cloudinary definitiva

```
rural24/
  app/
    icons/          ← íconos de categorías SVG (compartido, sin env prefix)
    logos/
  dev/
    ugc/
      ads/{YYYY}/{MM}/
      users/{YYYY}/{MM}/
    cms/
      banners/
      hero/
  prod/
    ugc/
      ads/{YYYY}/{MM}/
    cms/
      ...
```

**Filename UGC:** `{userId}_{timestamp_base36}_{rand}` (trazable por usuario)

---

## Formato MediaInfo (ads.images JSONB)

```json
{
  "url": "https://res.cloudinary.com/ruralcloudinary/image/upload/v.../...",
  "public_id": "rural24/dev/ugc/ads/2026/03/userId_ts_rand",
  "version": 1774356478,
  "format": "jpg",
  "width": 800,
  "height": 450,
  "sortOrder": 0,
  "isPrimary": true
}
```

Campo `path` mantenido como alias de `public_id` para backward compat con avisos existentes.

---

## Íconos de categorías

- Formato en DB: `url|#hexcolor` en `categories.icon`
- Helpers: `parseIcon(icon)` → `{ url, color }` | `buildIconValue(url, color)` → `url|color`
- Upload desde `#/categorias-admin` → folder `app-icons` → `rural24/app/icons/`
- Los íconos del 2026-03-23 se perdieron con el reset de Cloudinary del 2026-03-24
- **Re-subir pendiente:** 8 íconos SVG de categorías principales desde localhost

---

## Pendiente post-sprint

1. Re-subir 8 SVGs íconos de categorías desde `#/categorias-admin` localhost
2. Sync tabla `categories` → PROD vía sync panel
3. Aplicar migración `20260323000004` (provincias/localidades) en PROD
