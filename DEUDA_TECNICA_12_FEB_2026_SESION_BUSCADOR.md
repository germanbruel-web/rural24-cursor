# Deuda Técnica - Sesión 12 Feb 2026 (Buscador Global)

## Estado: Push exitoso a GitHub ✅
- Commit: `dae474f` en `main`
- 45 archivos, 6821 insertions, 1263 deletions

---

## 🔴 URGENTE - Verificar en Producción

### 1. Frontend NO arrancaba localmente
- El servidor frontend tenía errores de compilación que se corrigieron
- **Verificar que Render deployó correctamente** tras el push
- URL producción: verificar que carga sin errores en consola

### 2. Backend caído (port 3001)
- Al momento del push, el backend local no estaba corriendo en puerto 3001
- Solo frontend en 5173 estaba activo
- **Acción**: Reiniciar ambos servidores al volver: `npm run dev` en backend/ y frontend/

---

## 🟡 PENDIENTE - Buscador Global

### 3. Testear flujo completo del buscador
- [ ] Escribir en GlobalSearchBar → ver sugerencias desde BD
- [ ] Verificar que sugerencias muestran subcategorías y atributos reales
- [ ] Probar navegación por teclado (↑↓, Enter, Esc)
- [ ] Verificar historial de búsquedas en localStorage
- [ ] Probar en mobile (responsive)

### 4. Analytics de búsqueda
- [ ] Verificar que `searchAnalytics.ts` envía batches a `/api/analytics/search`
- [ ] Confirmar que tabla `search_analytics` en Supabase recibe datos
- [ ] Verificar materialized view `popular_searches` funciona
- [ ] Probar endpoint `/api/search/popular` devuelve datos

### 5. SEO del buscador
- [ ] Verificar que `HelmetProvider` en App.tsx no rompe nada
- [ ] Confirmar JSON-LD structured data aparece en `<head>` (inspeccionar HTML)
- [ ] Verificar meta tags dinámicos en SearchPage cuando hay query
- [ ] Test con Google Rich Results Test tool

---

## 🟡 PENDIENTE - Componentes Deprecados

### 6. Componentes marcados @deprecated (remover Marzo 2026)
- `frontend/src/components/SearchBar.tsx` → reemplazado por GlobalSearchBar
- `frontend/src/components/header/SmartSearchBar.tsx` → reemplazado por GlobalSearchBar
- `frontend/src/components/AdvancedSearchBar.tsx` → reemplazado por GlobalSearchBar
- **NO BORRAR AÚN** - Dejar hasta confirmar que GlobalSearchBar funciona 100% en producción

---

## 🟡 PENDIENTE - Header

### 7. Dos Headers coexisten
- `Header.tsx` (src/components/) - Header simple con GlobalSearchBar ✅
- `HeaderNew.tsx` (src/components/header/) - Header rediseñado con TopNav, UserMenu ✅
- **Decisión pendiente**: ¿Cuál usar como principal? ¿Unificar?
- Ver documento: `DEUDA_TECNICA_HEADER_2026-02-12.md`

### 8. AppHeader.tsx
- Verificar cuál Header se usa realmente en producción (`AppHeader` decide)
- Confirmar que `onSearch` llega correctamente desde AppHeader → Header/HeaderNew → GlobalSearchBar

---

## 🟡 PENDIENTE - Video Hero

### 9. YouTube video background en HeroWithCarousel
- Video ID: `mD_EWwLVuNs`
- [ ] Verificar que no afecta performance (LCP/CLS)
- [ ] Verificar que fallback (imagen) funciona si YouTube está bloqueado
- [ ] Considerar autoplay en mobile (iOS lo bloquea)

---

## 🔵 MEJORAS FUTURAS

### 10. Buscador - mejoras v2
- [ ] Trending searches en tiempo real (desde popular_searches view)
- [ ] Filtros rápidos prearmados (por provincia, categoría)
- [ ] Autocompletado de ubicaciones
- [ ] Search analytics dashboard en admin panel

### 11. Performance
- [ ] Lazy load del GlobalSearchBar dropdown (solo cuando se abre)
- [ ] Service Worker cache para sugerencias frecuentes
- [ ] Prefetch de sugerencias populares en idle time

### 12. Admin Panel
- [ ] Panel de analytics de búsquedas (queries más buscadas, sin resultados, etc.)
- [ ] SuperAdminFeaturedPanel - verificar fixes funcionan
- [ ] AllAdsTab - verificar que no hay duplicados de funciones

---

## 📁 Archivos clave creados esta sesión

```
frontend/src/components/GlobalSearchBar.tsx      ← Buscador principal
frontend/src/components/SearchSEO.tsx            ← SEO structured data
frontend/src/hooks/useSearchSuggestions.ts        ← Hook sugerencias API
frontend/src/services/searchAnalytics.ts          ← Analytics client
backend/app/api/analytics/search/route.ts         ← API analytics
backend/app/api/search/popular/route.ts           ← API popular queries
database/20260212_search_analytics_table.sql      ← Migration SQL (ya ejecutada)
frontend/src/components/header/HeaderNew.tsx       ← Header rediseñado
frontend/src/components/header/TopNav.tsx          ← Barra superior
frontend/src/components/header/UserMenu.tsx        ← Menu usuario
frontend/src/components/header/SmartSearchBar.tsx  ← DEPRECATED
```

## 📁 Archivos modificados esta sesión

```
frontend/App.tsx                    ← +HelmetProvider
frontend/src/pages/HomePage.tsx     ← +SearchSEO
frontend/src/pages/SearchPage.tsx   ← +SearchSEO con query dinámica
frontend/src/components/Header.tsx  ← Reescrito con GlobalSearchBar
frontend/src/components/index.ts    ← +exports GlobalSearchBar
frontend/src/hooks/index.ts         ← +export useSearchSuggestions
frontend/src/components/HeroWithCarousel.tsx ← +YouTube video bg
```

---

## ⚠️ NOTAS IMPORTANTES
- **react-helmet-async** instalado con `--legacy-peer-deps` (React 19 compat)
- La tabla `search_analytics` ya fue creada en Supabase con RLS habilitado
- El materialized view `popular_searches` necesita REFRESH periódico (cron o trigger)
- NO hay cron automático configurado para refresh del materialized view
