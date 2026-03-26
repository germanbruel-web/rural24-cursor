# Sprint UX Fixes + Media — 2026-03-26

## Bugs resueltos

### 1. Servicios/Empleos — upload 401 + "Debe incluir al menos una imagen"
**Archivos:**
- `frontend/src/components/wizard/blocks/AvatarUploadBlock.tsx`
  - Fix: usar `Authorization: Bearer {token}` en lugar de `credentials: 'include'`
  - Añadir honeypot field `website: ''`
- `frontend/src/components/pages/publicar-aviso/hooks/useAdSubmit.ts`
  - Fix: omitir campo `images` del payload cuando el array está vacío
  - `...(finalImages.length > 0 ? { images: finalImages } : {})`
- `backend/domain/ads/service.ts`
  - Eliminado bloque hardcodeado `if (!data.images || data.images.length === 0)` que rechazaba servicios sin imágenes

### 2. AvatarUploadBlock — precarga avatar del perfil
- `frontend/src/components/pages/PublicarAviso.tsx`
  - `useEffect` para setear `avatarUrl` desde `profile.avatar_url` si no hay avatar en wizard

### 3. Avatar no aparecía en ProductCard para servicios/empleos
- `frontend/src/components/sections/DynamicHomeSections.tsx`
  - Ambas queries Supabase actualizadas: `user_id, users(avatar_url)` en SELECT
  - Añadido helper `resolveJoin<T>()` (Supabase retorna arrays en FK joins, no objetos)
  - `adToProduct()` usa `resolveJoin` para `categories`, `subcategories`, `users`

### 4. EmpleoModal no abría desde carruseles de homepage
- **Root cause**: Supabase JS v2 retorna FK joins como arrays en runtime
- `ad.categories?.slug` sobre `[{slug:'empleos'}]` → `undefined`
- Fix: `resolveJoin(ad.categories as any)?.slug` → `'empleos'`

### 5. Cloudinary convertía a PNG
- `backend/infrastructure/cloudinary.service.ts`
- Eliminado `fetch_format: 'auto'` del `transformation` array
- Antes: `{ quality: 'auto:good', fetch_format: 'auto' }` → re-encodeaba al formato "óptimo"
- Ahora: `{ quality: 'auto:good' }` → respeta formato original del archivo subido

### 6. Banner VIP Hero — fondo gris visible detrás de imágenes transparentes
- `frontend/src/components/banners/BannersVipHero.tsx`
- Eliminado `bg-gray-100` del track del carrusel (línea 83)
- Imágenes con fondo transparente ahora muestran el overlay del hero detrás

## Features añadidas

### 7. GlobalSearchBar — rediseño pill
- `frontend/src/components/GlobalSearchBar.tsx`
- Input: `rounded-full`, fondo blanco, `shadow-sm hover:shadow`
- Botón "Buscar": sólido `bg-brand-600`, `rounded-full` — antes era borde gris
- Dropdown: `rounded-2xl`

### 8. HeroWithCarousel — scroll indicator animado
- `frontend/src/components/HeroWithCarousel.tsx`
- SVG mouse wheel + dot animado CSS (`@keyframes scrollDot`)
- Solo desktop (`hidden md:flex`), posición `absolute bottom-7 left-1/2`
- Loop 1.8s ease-in-out, fade + translateY

## Patrones técnicos aprendidos
- `resolveJoin<T>()`: helper para manejar Supabase FK joins que pueden ser array u objeto
- Cloudinary `fetch_format: 'auto'` en `transformation` = conversión de formato al subir (NO confundir con delivery URL transforms)
- `withAuth` en BFF acepta solo `Authorization: Bearer` — NO cookies/credentials
