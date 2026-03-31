# Sprint: AdDetail MercadoLibre-Level — 2026-03-30

## Objetivo
Elevar AdDetail a nivel profesional de marketplace: seller card, badges, share, avisos similares.

## Problema raíz "Aviso no encontrado"
- RLS `ads_view_active_approved`: requiere `status='active'` AND `approval_status='approved'`
- Trigger MVP auto-aprueba todos los ads nuevos → siempre activos
- Causa real: slug en URL no matchea slug en DB, o sesión no iniciada al navegar directo
- Fix: DEV logging en `useAdData` muestra slug exacto + error de Supabase en consola

## Cambios implementados

### `frontend/src/components/pages/ad-detail/types.ts`
- Seller: `avatar_url?: string | null`
- Ad: `short_id`, `slug`, `price_negotiable`, `condition`, `year`, `views_count`

### `frontend/src/hooks/useAdData.ts`
- Seller query: incluye `avatar_url`
- Nueva: `loadSellerAdsCount()` → estado `sellerAdsCount`
- Nueva: `loadSimilarAds()` → estado `similarAds`, `loadingSimilar`
  - Prioriza misma subcategoría (hasta 6), completa con misma categoría
  - Excluye el aviso actual
- Removido: `sellerOtherAds`, `loadingOtherAds` (reemplazados por `similarAds`)
- DEV logging cuando query de slug falla

### `frontend/src/components/pages/AdDetail.tsx`
- `SellerAvatar`: avatar foto (si existe) o círculo con iniciales (brand-500)
- `PriceBadges`: currency, condition, price_negotiable, views_count — composable
- `renderSellerCard()`: avatar + nombre + "Miembro desde" + stats + verificado + contacto
- Share button: `navigator.share()` → fallback clipboard → toast "¡Enlace copiado!" (2s)
- "Precio a acordar" cuando `price_negotiable=true` y price=null
- Sección "Avisos similares" (>= 2 resultados para mostrar)
- Fix: `bg-blue-100 → bg-gray-100` para ARS (solo USD usa brand color)
- Fix: slug en canonical URL del schema.org (era siempre `ad.id`)
- DEV: muestra slug en "Aviso no encontrado" para debugging

### `frontend/src/components/pages/ad-detail/MobileStickyBar.tsx`
- Fix: `bg-blue-100 → bg-gray-100` para ARS

### `frontend/src/components/pages/ad-detail/AdFormSections.tsx`
- Fallback (sin form template): usa íconos Lucide via `FIELD_NAME_ICON_MAP`
- Arrays en atributos: se unen con `, `
- Título: "Características" (antes "Información adicional")

## Fuera de scope
- Mapa Google Maps
- Reviews/calificaciones
- Thumbnails horizontal mobile
- ML recommendations
