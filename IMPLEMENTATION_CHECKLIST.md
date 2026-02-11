# 🚀 IMPLEMENTACIÓN PASO A PASO - RURAL24 PERFORMANCE & SECURITY

**Fecha inicio:** ___________  
**Completado:** ___________

---

## 🔥 PRIORIDAD CRÍTICA (HOY - 1 hora)

### 1. Security Headers Backend ⏱️ 15 min

**Archivo:** `backend/next.config.js`

```bash
# Backup del archivo actual
cp backend/next.config.js backend/next.config.js.backup

# Reemplazar con versión mejorada
cp backend/next.config.IMPROVED.js backend/next.config.js
```

**Validar:**
```bash
# 1. Reiniciar backend
cd backend
npm run dev

# 2. Test headers
curl -I http://localhost:3001/api/health | grep -E 'X-Frame|X-Content|Cache'
```

**Checklist:**
- [ ] Archivo reemplazado
- [ ] Backend reiniciado sin errores
- [ ] Headers presentes en response
- [ ] Commit: `git commit -m "feat: Add security and cache headers"`

---

### 2. Activar CDN en Render ⏱️ 2 min

**Render Dashboard:**
1. Login: https://dashboard.render.com
2. Seleccionar: `rural24-1` (Static Site - Frontend)
3. Settings → Advanced
4. ☑️ **Enable CDN**
5. Save Changes

**Efecto:**
- Assets servidos desde CloudFlare CDN global
- Latencia -60% (América Latina)
- Sin costo adicional

**Checklist:**
- [ ] CDN activado en Render
- [ ] Deploy exitoso
- [ ] Test: Headers tienen `cf-cache-status` (CloudFlare)

---

### 3. Health Check Path ⏱️ 5 min

**Render Dashboard - Backend:**
1. Seleccionar: `rural24` (Web Service - Backend)
2. Settings → Health Check
3. **Health Check Path:** `/api/health`
4. Save

**Beneficio:** Render reinicia automáticamente si backend falla

**Checklist:**
- [ ] Health check configurado
- [ ] Status: "Healthy" en Dashboard

---

### 4. Optimizar Google Fonts ⏱️ 30 min

**Opción A: Reducir familias (rápido)**

```html
<!-- frontend/index.html - Reemplazar línea 15 -->
<!-- ANTES: 4 familias, 29 variantes -->
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&family=Open+Sans:wght@400;600;700;800&family=Raleway:wght@400;500;600;700;800;900&family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<!-- DESPUÉS: 1 familia, 3 variantes -->
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" rel="stylesheet">
```

**Opción B: Self-host (mejor performance)**

```bash
cd frontend
npm install @fontsource/lato
```

```typescript
// frontend/index.tsx - Agregar al inicio
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/lato/900.css';
```

```html
<!-- frontend/index.html - REMOVER línea 15 -->
<link href="https://fonts.googleapis.com/..." /> <!-- BORRAR -->
```

**Checklist:**
- [ ] Fuentes reducidas o self-hosted
- [ ] `npm run build` exitoso
- [ ] Visual testing (comprobar que se ven bien)
- [ ] Commit: `git commit -m "perf: Optimize fonts loading"`

---

## ⚡ PRIORIDAD ALTA (ESTA SEMANA - 6 horas)

### 5. Image Optimization (Cloudinary) ⏱️ 1 hora

**Archivos ya creados:**
- ✅ `frontend/src/utils/imageOptimizer.ts`
- ✅ `frontend/src/components/ProductCard.OPTIMIZED.example.tsx`

**Implementar:**

```bash
# 1. Abrir componente actual
code frontend/src/components/organisms/ProductCard/ProductCard.tsx
```

```typescript
// 2. Al inicio del archivo, agregar:
import { useOptimizedImage } from '../../../utils/imageOptimizer';

// 3. Dentro del componente, reemplazar:
// ANTES:
<img src={main_image_url} loading="lazy" alt={title} />

// DESPUÉS:
const { src, srcSet, sizes } = useOptimizedImage(main_image_url, 400);
<img 
  src={src} 
  srcSet={srcSet} 
  sizes={sizes} 
  loading="lazy" 
  alt={title} 
/>
```

**Archivos a modificar:**
- [ ] `ProductCard.tsx`
- [ ] `CategoryBannerCarousel.tsx`
- [ ] `CategoryBannerSlider.tsx`
- [ ] `BannersVipHero.tsx`
- [ ] `DynamicBanner.tsx`

**Validar:**
```bash
npm run dev
# Abrir DevTools → Network → Img
# URLs deben incluir: f_auto,q_auto,w_400
```

**Checklist:**
- [ ] Utility importado en componentes
- [ ] Imágenes muestran transformaciones Cloudinary
- [ ] Tamaño reducido en Network tab
- [ ] Commit: `git commit -m "perf: Add Cloudinary image optimization"`

---

### 6. Rate Limiting Global ⏱️ 1 hora

**Archivo ya creado:**
- ✅ `backend/middleware.ts`

**Implementar:**

```bash
# Verificar que el archivo existe
cat backend/middleware.ts

# Si existe, está listo para usar automáticamente
# Next.js detecta middleware.ts en la raíz de backend/
```

**Configurar límites (opcional):**

```typescript
// backend/infrastructure/rate-limiter.ts - Ajustar líneas 17-19
private readonly LIMIT_PER_WINDOW = 120; // requests por ventana
private readonly WINDOW_MS = 1 * 60 * 1000; // 1 minuto
private readonly BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 min bloqueo
```

**Validar:**
```bash
cd backend
npm run dev

# Test: Hacer 130 requests rápidas
for i in {1..130}; do curl http://localhost:3001/api/health; done

# Debería retornar 429 después de 120
```

**Checklist:**
- [ ] middleware.ts en backend/ (raíz)
- [ ] Backend reiniciado
- [ ] Rate limit funciona (429 después de límite)
- [ ] Commit: `git commit -m "feat: Add global rate limiting"`

---

### 7. Keep-Alive Cron (prevenir cold starts) ⏱️ 10 min

**Render Dashboard:**
1. Dashboard → **Cron Jobs** (menú lateral)
2. **+ New Cron Job**
3. Configurar:
   ```
   Name: backend-keepalive
   Command: curl https://rural24.onrender.com/api/health
   Schedule: */10 * * * *
   ```
4. Create Cron Job

**Explicación schedule:**
- `*/10 * * * *` = cada 10 minutos
- Mantiene backend "caliente"
- Evita cold starts de 8-15 segundos

**Checklist:**
- [ ] Cron job creado
- [ ] Status: "Running"
- [ ] Backend no entra en sleep

---

### 8. Route-based Code Splitting ⏱️ 3-4 horas

**⚠️ Este es el cambio más grande - reservar tiempo**

**Paso 1: Crear carpeta pages/**

```bash
mkdir frontend/src/pages

# Mover componentes de página:
# HomePage.tsx (extraer de App.tsx)
# SearchPage.tsx (extraer de App.tsx)
# AdDetailPage.tsx (ya existe)
```

**Paso 2: Refactor App.tsx**

```typescript
// frontend/App.tsx
import { lazy, Suspense } from 'react';

// Lazy load pages
const HomePage = lazy(() => import('./src/pages/HomePage'));
const SearchPage = lazy(() => import('./src/pages/SearchPage'));
const AdDetailPage = lazy(() => import('./src/pages/AdDetailPage'));

// Wrapper con Suspense
const LazyRoute = ({ Component }: { Component: React.ComponentType }) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

// En el render:
{currentPage === 'home' && <LazyRoute Component={HomePage} />}
{currentPage === 'search' && <LazyRoute Component={SearchPage} />}
```

**Paso 3: Crear páginas individuales**

Ver: `frontend/src/components/ProductCard.OPTIMIZED.example.tsx` como referencia

**Validar:**
```bash
npm run build

# Ver chunks generados
ls -lh frontend/dist/assets/*.js

# Debe haber chunks separados por ruta
```

**Checklist:**
- [ ] Carpeta pages/ creada
- [ ] HomePage.tsx extraído
- [ ] SearchPage.tsx extraído
- [ ] App.tsx usa lazy()
- [ ] Build genera chunks separados
- [ ] Testing manual (navegar entre páginas)
- [ ] Bundle principal < 200KB
- [ ] Commit: `git commit -m "perf: Implement route-based code splitting"`

---

## 📈 PRIORIDAD MEDIA (PRÓXIMAS 2 SEMANAS)

### 9. Content Security Policy ⏱️ 2 horas

**Estado:** Ya incluido en `backend/middleware.ts` (modo report-only)

**Acción:**
1. Deploy a staging/producción
2. Monitorear errores en DevTools Console por 3-5 días
3. Si no hay errores, cambiar a enforcing mode:

```typescript
// backend/middleware.ts - línea ~80
// ANTES:
response.headers.set('Content-Security-Policy-Report-Only', csp);

// DESPUÉS:
response.headers.set('Content-Security-Policy', csp);
```

**Checklist:**
- [ ] CSP en report-only deployado
- [ ] 3-5 días de monitoreo sin errores
- [ ] Cambiar a enforcing mode
- [ ] Commit: `git commit -m "security: Enforce CSP headers"`

---

### 10. Staging Environment ⏱️ 1 hora

**Render Dashboard:**
1. **Static Sites** → Duplicate `rural24-1`
2. Configurar:
   ```
   Name: rural24-staging
   Branch: develop
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```
3. Crear `.env.staging` en repo:
   ```bash
   VITE_API_URL=https://rural24-staging-api.onrender.com
   VITE_DEBUG_API_CALLS=true
   ```

**Workflow:**
```bash
# Desarrollo
git checkout develop
git push origin develop
# Auto-deploy a rural24-staging.onrender.com

# Testing OK → Merge a main
git checkout main
git merge develop
git push origin main
# Auto-deploy a rural24-1.onrender.com (producción)
```

**Checklist:**
- [ ] Servicio staging creado
- [ ] Branch develop configurado
- [ ] .env.staging en repo
- [ ] Workflow probado

---

### 11. Database Connection Pooling ⏱️ 30 min

**Opción A: PgBouncer (Supabase - GRATIS)**

```bash
# Render Dashboard → rural24 (Backend) → Environment
# Modificar DATABASE_URL:

# ANTES:
DATABASE_URL=postgresql://...supabase.co:5432/postgres

# DESPUÉS (agregar :6543 y pgbouncer=true):
DATABASE_URL=postgresql://...supabase.co:6543/postgres?pgbouncer=true
```

**Opción B: Prisma Settings**

```typescript
// backend/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pooling
  connectionLimit = 5
  poolTimeout = 60
}
```

**Checklist:**
- [ ] Connection string con pgbouncer
- [ ] Prisma config actualizado
- [ ] Deploy sin errores de conexión

---

### 12. Performance Monitoring ⏱️ 30 min

**Ejecutar audit script:**

```bash
# Análisis local
.\scripts\performance-audit.ps1

# Análisis producción
.\scripts\performance-audit.ps1 -Production
```

**Instalar Lighthouse CI (opcional):**

```bash
npm install -g lighthouse

# Generar report
lighthouse https://rural24-1.onrender.com --view
```

**Checklist:**
- [ ] Script ejecutado localmente
- [ ] Script ejecutado en producción
- [ ] Lighthouse score > 90
- [ ] Métricas documentadas (screenshot)

---

## 🎯 VALIDACIÓN FINAL

### Pre-Deploy Checklist

```bash
# Backend
- [ ] Security headers configurados
- [ ] Rate limiting activo
- [ ] Health check endpoint funcionando
- [ ] Tests pasando (si existen)

# Frontend
- [ ] Bundle size < 300KB total
- [ ] Imágenes optimizadas
- [ ] Fuentes optimizadas
- [ ] Code splitting implementado

# Render
- [ ] CDN activado (frontend)
- [ ] Health check path configurado (backend)
- [ ] Keep-alive cron creado
- [ ] Variables de entorno correctas
```

### Post-Deploy Validation

```bash
# 1. Backend Health
curl https://rural24.onrender.com/api/health
# Debe retornar: {"status":"healthy","database":"connected"}

# 2. Security Headers
curl -I https://rural24.onrender.com/api/health | grep X-Frame-Options
# Debe mostrar: X-Frame-Options: DENY

# 3. Frontend Assets
curl -I https://rural24-1.onrender.com
# Debe mostrar: cf-cache-status (CloudFlare CDN)

# 4. Búsqueda funciona
# Abrir: https://rural24-1.onrender.com/#/search?cat=maquinarias-agricolas
# DevTools → Network → Img
# URLs deben tener: f_auto,q_auto
```

---

## 📊 MÉTRICAS - ANTES/DESPUÉS

### Performance

| Métrica | Antes | Target | Actual | ✅ |
|---------|-------|--------|--------|---|
| LCP | 2.1s | 1.2s | ___ | [ ] |
| FCP | 1.4s | 0.8s | ___ | [ ] |
| Bundle size | 600KB | 180KB | ___ | [ ] |
| Lighthouse | 72 | 95+ | ___ | [ ] |

### Security

| Header | Presente | ✅ |
|--------|----------|---|
| X-Frame-Options | [ ] | [ ] |
| X-Content-Type-Options | [ ] | [ ] |
| CSP | [ ] | [ ] |
| HSTS | [ ] | [ ] |

### Costs

| Recurso | Antes | Después | Ahorro |
|---------|-------|---------|--------|
| Frontend bandwidth | 21GB/mes | ___GB/mes | ___% |
| Backend cold starts | 50/día | 0/día | 100% |

---

## 🆘 TROUBLESHOOTING

### "Bundle size no reduce después de code splitting"

```bash
# Verificar que lazy() está funcionando
cd frontend
npm run build
npx vite-bundle-visualizer

# Debe mostrar chunks separados por ruta
```

### "Imágenes no muestran transformaciones Cloudinary"

```typescript
// Verificar que la URL incluye cloudinary.com
console.log(image_url);

// Debe ser: https://res.cloudinary.com/...
// NO: /images/... (local)
```

### "Rate limiting bloquea requests legítimos"

```typescript
// Aumentar límite en backend/infrastructure/rate-limiter.ts
private readonly LIMIT_PER_WINDOW = 120; // Aumentar a 240
```

### "Backend sigue teniendo cold starts"

```bash
# Verificar cron job está corriendo
# Render Dashboard → Cron Jobs → backend-keepalive
# Status debe ser: "Running"
```

---

## 📞 SOPORTE

¿Trabado en algún paso? Pregúntame y te guío específicamente.

**Archivos de referencia:**
- Auditoría completa: `AUDITORIA_DEVOPS_RENDER_2026.md`
- Config mejorado: `backend/next.config.IMPROVED.js`
- Image optimizer: `frontend/src/utils/imageOptimizer.ts`
- Middleware: `backend/middleware.ts`

---

**Started:** ___________  
**Completed:** ___________  
**Total time:** ___________ hours
