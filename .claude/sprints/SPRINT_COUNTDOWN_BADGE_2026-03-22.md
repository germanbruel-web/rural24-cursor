# Sprint: Countdown Badge en Tarjetas de Destacados
**Fecha:** 2026-03-22
**Estado:** ✅ Completo
**Rama:** main

---

## Objetivo
Mostrar una cuenta regresiva sutil en la esquina superior izquierda de `ProductCard` cuando un aviso destacado está próximo a vencer (≤48h). El toggle se activa/desactiva desde `#/global-settings` → sección "Funciones Cards".

---

## Implementación

### Archivos modificados
| Archivo | Cambio |
|---|---|
| `frontend/types.ts` | `featured_expires_at?: string` en `Product` |
| `frontend/src/components/sections/DynamicHomeSections.tsx` | `CountdownEnabledCtx`, enrichment de ads con `featured_expires_at`, fetch setting |
| `frontend/src/components/organisms/ProductCard/ProductCard.tsx` | `CountdownBadge` component + layout badges top-left |
| `frontend/src/components/admin/GlobalSettingsPanel.tsx` | Categoría `cards` + help texts |
| `supabase/migrations/20260322000001_global_config_card_countdown.sql` | Inserta settings en `global_settings` |

### Arquitectura de datos
- **Fuente de vencimiento:** `featured_ads.expires_at` (TIMESTAMPTZ)
- **Toggle global:** `global_settings.key = 'card_countdown_enabled'` (boolean, default true)
- **Umbral config:** `global_settings.key = 'card_countdown_threshold_hours'` (number, default 48)
- La tabla correcta es `global_settings` (jsonb, con display_name/is_public), NO `global_config`

### Flujo
1. `DynamicHomeSections` monta → fetch `card_countdown_enabled` de `global_settings`
2. Si enabled: `useAds` y `CategorySectionRenderer` hacen query secundaria a `featured_ads` tras cargar ads
3. Mapa `ad_id → expires_at` enriquece cada `AdItem` con `featured_expires_at`
4. `adToProduct()` pasa `featured_expires_at` al `Product`
5. `ProductCard` recibe `product.featured_expires_at`, monta `CountdownBadge`
6. Badge usa `useEffect` + `setInterval(1000ms)` para actualizar en tiempo real
7. Muestra solo si diff ≤ 48h y > 0; desaparece al vencer

### Badge visual
- Posición: `absolute top-2 left-2 flex flex-col gap-1`
- Stacking: countdown arriba → "Servicio" badge debajo (si ad_type='company')
- Estilo: `text-[9px] font-mono font-semibold text-white bg-black/60 backdrop-blur-sm rounded`
- Formato: `"23h 4m 18s"`

---

## Migraciones aplicadas
- DEV: `20260322000001` ✅
- PROD: pendiente (confirmar con usuario)

---

## Admin
- `#/global-settings` → tab "Configuración" → sección "Funciones Cards"
- Keys: `card_countdown_enabled` (boolean) + `card_countdown_threshold_hours` (number)
