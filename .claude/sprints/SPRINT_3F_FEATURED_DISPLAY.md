# Sprint 3F — Display Logic: Conectar RPCs featured al frontend

> **Fecha:** 2026-03-09
> **Estado:** ✅ COMPLETADO
> **Objetivo:** Conectar el RPC `get_featured_for_detail` (placement='detail') al frontend y limpiar deuda técnica en AdDetailPage

---

## Diagnóstico

| Placement | RPC correcto | Antes | Después |
|---|---|---|---|
| Homepage | `get_featured_for_homepage` | ✅ correcto | ✅ sin cambios |
| Resultados | `get_featured_for_results` | ✅ correcto | ✅ sin cambios |
| **Detalle** | `get_featured_for_detail` | ❌ usaba `get_featured_for_results` | ✅ corregido |

---

## Cambios

### `UserFeaturedAdsBar.tsx`
- Agrega props `placement?: 'results' | 'detail'` (default: `'results'`) y `excludeAdId?: string`
- Si `placement === 'detail'` → llama `getFeaturedForDetail(categoryId, excludeAdId, 8)`
- Si `placement === 'results'` → llama `getFeaturedForResults(categoryId, 8, 0)` (comportamiento previo)
- Dep array del `useEffect` incluye `placement` y `excludeAdId`

### `AdDetail.tsx` (Sprint 5D — components/pages/)
- Pasa `placement="detail"` y `excludeAdId={ad.id}` a `UserFeaturedAdsBar`

### `AdDetailPage.tsx` (legacy — components/ — en producción)
- **Fix RPC:** `getFeaturedForResults` → `getFeaturedForDetail(categoryId, currentAdUuid, 5)`
- **Fix bug stale state:** `loadSellerOtherAds` recibe `categoryId` como parámetro (antes leía `ad?.category_id` del state, que podía ser stale)
- **Elimina 13 console.log de debug:**
  - Autocompletar formulario
  - AdId cambió / sessionStorage
  - loadAd iniciado + getAdById respondió
  - DEBUG imágenes (bloque completo con forEach)
  - Esquema dinámico V2 cargado
  - Avisos encontrados / transformados
  - Mensaje enviado exitosamente / estado guardado

---

## Flujo correcto post-sprint

```
Detalle de aviso
  └─ UserFeaturedAdsBar(placement="detail", excludeAdId=adId)
       └─ getFeaturedForDetail(categoryId, excludeAdId, limit)
            └─ featured_ads WHERE placement='detail' AND status='active'
                                  AND category_id=categoryId
                                  AND ad_id != excludeAdId
                                  (1 por usuario, FIFO)
```
