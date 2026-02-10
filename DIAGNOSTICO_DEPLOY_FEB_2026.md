# 🔍 DIAGNÓSTICO: Búsqueda funciona en localhost pero NO en Render

**Fecha:** 10 Febrero 2026  
**Arquitecto:** Fullstack Senior - React SPA + Next.js API + Supabase + Render

---

## 📊 1. DIAGNÓSTICO - CAUSA RAÍZ

### Problema Observado
- ✅ Localhost: `http://localhost:5173/#/search?cat=maquinarias-agricolas&sub=tractores` → Funciona perfecto
- ❌ Producción: `https://rural24-1.onrender.com/#/ search?q=tractor` → NO funciona

### Causa Raíz REAL (No síntomas)

**Variable de entorno faltante en build de producción:**

El frontend en producción NO tiene definida `VITE_API_URL`, por lo que usa el fallback hardcodeado `http://localhost:3001` que obviamente no existe en el navegador del usuario.

**Evidencia técnica:**

```typescript
// frontend/src/services/adsService.ts (línea 950)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
//                                                 ^^^^^^^^^^^^^^^^^^^^
//                                                 FALLBACK usado en producción
```

**Flujo del error:**
1. Usuario abre `https://rural24-1.onrender.com/#/search?q=tractor`
2. Frontend intenta hacer fetch a `http://localhost:3001/api/ads/search`
3. Browser bloquea: "No se puede conectar a localhost" (CORS error o network error)
4. No hay resultados, la página queda vacía

**Configuraciones verificadas:**
- ✅ Routing SPA: `_redirects` existe (`/*    /index.html   200`)
- ✅ Backend CORS: `Access-Control-Allow-Origin` configurado en `next.config.js`
- ✅ Backend funcional: Health check 200 OK, base de datos conectada
- ❌ Frontend env: `.env.production` NO existía

---

## 🛠️ 2. SOLUCIÓN PASO A PASO

### Paso 1: Crear `.env.production` en frontend

**Archivo:** `frontend/.env.production`

```env
# Backend API URL - Render Web Service
VITE_API_URL=https://rural24.onrender.com

# Supabase (public keys)
VITE_SUPABASE_URL=https://lmkuecdvxtenrikjomol.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=dosjgdcxr
VITE_CLOUDINARY_UPLOAD_PRESET=rural24_unsigned

# Feature Flags
VITE_USE_API_BACKEND=true
VITE_FALLBACK_TO_SUPABASE=true
VITE_DEBUG_API_CALLS=false

# Production mode
NODE_ENV=production
```

**¿Por qué funciona?**

Vite usa archivos `.env.[mode]` durante el build:
- `.env.local` → usado en `npm run dev` (localhost)
- `.env.production` → usado en `npm run build` (Render)

Variables con prefijo `VITE_` son inyectadas en el bundle en build time:
```javascript
import.meta.env.VITE_API_URL → "https://rural24.onrender.com"
```

### Paso 2: Verificar CORS en backend (Render)

**Archivo:** `backend/next.config.js` (ya configurado)

```javascript
async headers() {
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
  return [{
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
      // ...
    ],
  }];
}
```

**Configurar en Render Dashboard:**

1. Ve a: https://dashboard.render.com
2. Selecciona: `rural24-backend` (Web Service)
3. Settings → Environment Variables
4. Agregar/Verificar:
   ```
   FRONTEND_URL=https://rural24-1.onrender.com
   ```

### Paso 3: Commit y Push

```bash
git add frontend/.env.production scripts/diagnose-deploy.ps1
git commit -m "fix: Add production environment config for Render deploy

- Create .env.production with correct backend URL (https://rural24.onrender.com)
- Add diagnostic script to verify localhost and production config
- Fixes: Search not working in production (was using localhost fallback)

Root cause: VITE_API_URL not defined in production build, frontend was
calling http://localhost:3001 from user's browser causing network errors."

git push origin main
```

### Paso 4: Verificar Auto-Deploy en Render

1. Ve a: https://dashboard.render.com
2. Selecciona: `rural24-1` (Static Site - Frontend)
3. Verifica: "Auto-Deploy: Yes" en Settings
4. Espera el rebuild (~3-5 minutos)
5. Check en Events tab: Deploy status "Live"

---

## ✅ 3. CHECKLIST FINAL DE VALIDACIÓN

### En Localhost (Antes de push)

```bash
# 1. Ejecutar diagnostic script
.\scripts\diagnose-deploy.ps1

# Verificar:
✅ [OK] frontend\.env.production exists
✅ [OK] Backend is responding
✅ [OK] CORS headers present
✅ [OK] /api/ads/search is working
✅ [OK] _redirects file exists
```

### En Producción (Después de deploy)

1. **Backend Health Check:**
   ```bash
   curl https://rural24.onrender.com/api/health
   # Debe retornar: {"status":"healthy","database":true}
   ```

2. **Búsqueda por categoría:**
   ```
   https://rural24-1.onrender.com/#/search?cat=maquinarias-agricolas
   ```
   - ✅ Debe mostrar avisos de maquinarias
   - ✅ Sidebar con filtros dinámicos
   - ✅ Contadores correctos

3. **Búsqueda por subcategoría:**
   ```
   https://rural24-1.onrender.com/#/search?cat=maquinarias-agricolas&sub=tractores
   ```
   - ✅ Solo tractores
   - ✅ Filtro "Marca" aparece (atributo dinámico)
   - ✅ Paginación funciona

4. **Búsqueda inteligente:**
   ```
   https://rural24-1.onrender.com/#/search?q=tractor
   ```
   - ✅ Auto-detecta categoría "Maquinarias Agrícolas/Tractores"
   - ✅ Breadcrumb muestra la categoría detectada
   - ✅ Resultados relevantes

5. **Browser DevTools:**
   ```
   F12 → Network tab → Filter: search
   
   ✅ Request URL: https://rural24.onrender.com/api/ads/search?...
   ✅ Status: 200 OK
   ✅ Response: { "data": [...], "pagination": {...} }
   
   ❌ NO debe aparecer: localhost:3001
   ```

6. **Navigation:**
   - ✅ Browser back/forward sincronizado
- ✅ Refresh en URL directa funciona
   - ✅ No errores 404 en rutas

---

## 📐 4. ARQUITECTURA VALIDADA

```
┌─────────────────────────────────────┐
│  Frontend (React SPA)               │
│  https://rural24-1.onrender.com     │
│  ├─ .env.production                 │
│  │   VITE_API_URL=rural24.onrender  │
│  └─ public/_redirects               │
└─────────────────────────────────────┘
          │ fetch(VITE_API_URL + '/api/ads/search')
          ▼
┌─────────────────────────────────────┐
│  Backend (Next.js API)              │
│  https://rural24.onrender.com       │
│  ├─ next.config.js                  │
│  │   FRONTEND_URL=rural24-1.onrender│
│  └─ CORS: Allow origin              │
└─────────────────────────────────────┘
          │ SQL queries
          ▼
┌─────────────────────────────────────┐
│  Supabase PostgreSQL                │
│  lmkuecdvxtenrikjomol.supabase.co   │
└─────────────────────────────────────┘
```

---

## 🚨 5. ERRORES SILENCIOSOS RESUELTOS

### Error 1: Network error sin detalle
**Síntoma:** Búsqueda no retorna resultados, sin error visible  
**Causa:** Fetch a localhost desde navegador  
**Solución:** VITE_API_URL en .env.production

### Error 2: CORS error aleatorio
**Síntoma:** "CORS policy blocked" en producción  
**Causa:** Backend no reconoce origin del frontend  
**Solución:** FRONTEND_URL en backend Render env vars

### Error 3: Re-render no actualiza resultados
**Síntoma:** URL cambia pero contenido no  
**Causa:** Key prop faltante (YA RESUELTO en commit 2d86e05)  
**Solución:** `key={window.location.hash}` en SearchResultsPageMinimal

---

## 📝 6. NOTAS FINALES

### Variables de entorno - Jerarquía

**Orden de precedencia en Vite:**
1. `.env.[mode].local` (git-ignored, prioridad máxima)
2. `.env.[mode]` (commiteado, usado en CI/CD)
3. `.env.local` (git-ignored)
4. `.env` (commiteado, fallback general)

**Render usa:**
- Build command: `npm run build` → mode = `production`
- Lee: `.env.production` del repo
- Variables de Render Dashboard **NO inyectan** en frontend (solo backend)

### Testing en local con producción simulada

```bash
# Build como producción
cd frontend
npm run build

# Servir build localmente
npx serve -s dist -l 3000

# Abrir: http://localhost:3000
# Debe usar https://rural24.onrender.com (backend prod)
```

---

**Diagnóstico completado por:** Script `diagnose-deploy.ps1`  
**Configuración aplicada:** `.env.production`  
**Status final:** ✅ Listo para deploy en Render
