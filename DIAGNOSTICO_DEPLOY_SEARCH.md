# 🔍 DIAGNÓSTICO: Búsqueda NO funciona en Producción

**Fecha:** 10 Febrero 2026  
**Arquitecto:** Fullstack Senior  
**Stack:** React SPA (Vite) + Next.js API + Supabase + Render

---

## 1. SÍNTOMAS

### ✅ Localhost (FUNCIONA)
```
http://localhost:5173/#/search?cat=maquinarias-agricolas&sub=tractores
→ Se cargan avisos correctamente
→ Filtros dinámicos funcionan
→ Backend responde en localhost:3001
```

### ❌ Producción (NO FUNCIONA)
```
https://rural24-1.onrender.com/#/search?q=tractor
→ NO se cargan avisos
→ Probablemente error de CORS o fetch fallido
→ Backend debería estar en rural24-backend.onrender.com
```

---

## 2. CAUSA RAÍZ IDENTIFICADA

### 🎯 **PROBLEMA CRÍTICO: Variables de entorno en Build Time**

Vite **embebe** las variables `VITE_*` en el bundle durante `npm run build`.

**En localhost:**
```env
# frontend/.env.local
VITE_API_URL=http://localhost:3001  ✅
```

**En Render (probablemente):**
```env
# ❌ FALTA configurar en Render Dashboard
VITE_API_URL=NO_DEFINIDA
```

**Resultado:**
El código compilado usa el **fallback hardcodeado**:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
//                                               ^^^^^^^^^^^^^^^^^^^^^^^^
//                                               ❌ Esto se usa en producción!
```

**Desde el navegador del usuario:**
```javascript
fetch('http://localhost:3001/api/ads/search?...')
// ❌ FALLA porque localhost:3001 no existe en la máquina del usuario
// ❌ Probablemente CORS error o ERR_CONNECTION_REFUSED
```

---

## 3. EVIDENCIA TÉCNICA

### 3.1 Servicios que usan VITE_API_URL

**Archivos afectados:**
```typescript
// adsService.ts (línea 950, 1036)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
await fetch(`${API_URL}/api/ads/search?${params.toString()}`);

// filtersService.ts (línea 5, 70)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
await fetch(`${API_URL}/api/config/filters?${searchParams.toString()}`);

// adminFeaturedService.ts (línea 16, 583)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
await fetch(`${API_URL}/api/admin/featured-ads/manual`, {...});

// adminUsersService.ts (línea 11, 41)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
await fetch(`${API_URL}/api/admin/verify-email`, {...});

// formConfigService.ts (línea 8, 39)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
await fetch(`${API_URL}/api/config/form/${subcategoryId}`);

// uploadService.ts (línea 34)
await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/uploads`, {...});

// usersService.ts (línea 4)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

**Impacto:** TODOS los requests al backend fallan en producción.

### 3.2 Configuración actual de Render

**Backend (rural24-backend):**
- ✅ URL: https://rural24-backend.onrender.com
- ✅ Health check funciona (probado en scripts)
- ✅ Variables de entorno configuradas correctamente

**Frontend (rural24 o rural24-1):**
- ❓ VITE_API_URL = **NO VERIFICADO** en Render Dashboard
- ❌ Si no está configurada → bundle usa localhost:3001
- ❌ Requests desde navegador del usuario fallan

### 3.3 Cómo funciona Vite Build

```bash
# Durante "npm run build" en Render:
vite build
↓
# Vite lee process.env en NODE (servidor de build)
# Reemplaza import.meta.env.VITE_API_URL con el valor literal
↓
# Bundle final (dist/assets/index-XXXX.js):
const API_URL = "https://rural24-backend.onrender.com"  ✅ Si VITE_API_URL está definida
const API_URL = "http://localhost:3001"                 ❌ Si NO está definida
```

**⚠️ IMPORTANTE:** Variables VITE_* NO son leídas en runtime. Son "baked" en el bundle.

---

## 4. SOLUCIÓN PASO A PASO

### 4.1 Verificar variables de entorno en Render (CRÍTICO)

1. Ve a https://dashboard.render.com
2. Selecciona tu **Static Site** (rural24 o rural24-1)
3. Click en **"Environment"** (menú lateral)
4. Verificar si existe `VITE_API_URL`

**Si NO existe:**
```bash
# Agregar variable:
Key:   VITE_API_URL
Value: https://rural24-backend.onrender.com
```

**Si existe pero está mal:**
```bash
# Debe ser EXACTAMENTE (sin trailing slash):
VITE_API_URL=https://rural24-backend.onrender.com
```

### 4.2 Agregar todas las variables VITE_* necesarias

```env
# En Render Dashboard → Environment → Add Environment Variable

# Backend API
VITE_API_URL=https://rural24-backend.onrender.com

# Supabase (público - safe)
VITE_SUPABASE_URL=https://lmkuecdvxtenrikjomol.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxta3VlY2R2eHRlbnJpa2pvbW9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTI4NTYsImV4cCI6MjA3ODYyODg1Nn0.j9A2jCOFsoFckDOMGFb8xE4eM5IkHqcN-CCBs4VOENE

# Cloudinary (público)
VITE_CLOUDINARY_CLOUD_NAME=dosjgdcxr
VITE_CLOUDINARY_UPLOAD_PRESET=rural24_unsigned

# Feature flags (opcional)
VITE_USE_API_BACKEND=true
VITE_FALLBACK_TO_SUPABASE=false
```

### 4.3 Forzar rebuild (OBLIGATORIO después de cambiar vars)

```bash
# Opción A: Desde Render Dashboard
Manual Deploy → "Deploy latest commit"

# Opción B: Desde Git (trigger auto-deploy)
git commit --allow-empty -m "chore: Trigger rebuild with VITE_API_URL"
git push origin main
```

**⚠️ Esperar 2-3 minutos** hasta que termine el build.

### 4.4 Verificar CORS en Backend

**Backend debe permitir el frontend:**
```env
# En Render Dashboard → Backend Service → Environment

FRONTEND_URL=https://rural24-1.onrender.com
# O si cambiaste el nombre:
FRONTEND_URL=https://rural24.onrender.com
```

**Verificar en código backend:**
```typescript
// backend/next.config.js o middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173', // Dev
];
```

### 4.5 Verificar _redirects para SPA routing

**Archivo: `frontend/public/_redirects`**
```bash
/*    /index.html   200
```

✅ Ya existe (commit 2d86e05).

---

## 5. CHECKLIST DE VALIDACIÓN

### 5.1 Pre-Deploy (Local)

```bash
# 1. Verificar que todas las variables están en .env.local
cat frontend/.env.local | grep VITE_

# 2. Build local con variables de producción
cd frontend
VITE_API_URL=https://rural24-backend.onrender.com npm run build

# 3. Inspeccionar bundle (debe tener URL de producción)
grep -r "rural24-backend.onrender.com" dist/assets/*.js
# ✅ Debe encontrar matches

# 4. Preview del build
npm run preview
# Navegar a http://localhost:4173/#/search?q=tractor
# Verificar en DevTools Network que llama al backend correcto
```

### 5.2 Post-Deploy (Producción)

**A. Verificar variables se aplicaron:**
```bash
# Ver logs del build en Render Dashboard
# Buscar en logs:
"Building with environment variables..."
"VITE_API_URL is set"
```

**B. Test manual desde navegador:**
```javascript
// Abrir DevTools Console en https://rural24-1.onrender.com

// Ver qué URL está usando:
console.log(import.meta.env.VITE_API_URL);
// ✅ Debe mostrar: https://rural24-backend.onrender.com
// ❌ Si muestra undefined → variables NO se aplicaron

// Hacer fetch directo:
fetch('https://rural24-backend.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log);
// ✅ Debe devolver: {status: "ok", ...}
```

**C. Test de búsqueda:**
```
1. Ir a: https://rural24-1.onrender.com/#/search?q=tractor
2. Abrir DevTools Network tab
3. Buscar request a: https://rural24-backend.onrender.com/api/ads/search?...
4. Verificar:
   ✅ Status 200
   ✅ Response tiene "data": [...]
   ✅ NO hay errores CORS
```

**D. Test con script PowerShell (desde tu máquina):**
```powershell
# Modificar test-search.ps1 para producción:
$BACKEND_URL = "https://rural24-backend.onrender.com"
.\scripts\test-search.ps1

# O directamente:
Invoke-RestMethod -Uri "https://rural24-backend.onrender.com/api/ads/search?search=tractor&status=active&approval_status=approved" | ConvertTo-Json
```

---

## 6. ERRORES COMUNES Y SOLUCIONES

### Error 1: "Failed to fetch" en DevTools

**Causa:** VITE_API_URL no está definida, frontend llama a localhost:3001

**Solución:**
1. Agregar VITE_API_URL en Render Dashboard
2. Rebuild (Manual Deploy)

---

### Error 2: CORS policy error

**Causa:** Backend no permite el dominio del frontend

**Solución:**
```bash
# Backend → Environment
FRONTEND_URL=https://rural24-1.onrender.com

# Verificar en backend código que FRONTEND_URL se usa correctamente
```

---

### Error 3: "import.meta.env.VITE_API_URL is undefined" en console

**Causa:** Variables no aplicadas durante build

**Solución:**
1. Verificar que nombre es exactamente `VITE_API_URL` (case-sensitive)
2. Rebuild después de agregar variable

---

### Error 4: Build funciona pero búsqueda devuelve array vacío

**Causa:** Parámetros de búsqueda incorrectos o backend no responde

**Debug:**
```javascript
// En DevTools Console de producción:
const url = 'https://rural24-backend.onrender.com/api/ads/search?search=tractor&status=active&approval_status=approved';
const res = await fetch(url);
const data = await res.json();
console.log(data);
// Verificar: data.pagination.total > 0
```

---

### Error 5: Servicios FREE de Render están dormidos (Cold Start)

**Síntoma:** Primera búsqueda tarda 30-60 segundos

**Causa:** Render FREE tier duerme los servicios después de 15 min de inactividad

**Solución:**
1. Esperar 30-60 segundos en la primera búsqueda
2. Upgrade a plan Paid ($7/mes) para eliminar sleep
3. O implementar "keep-alive ping" cada 10 minutos

---

## 7. COMANDO RÁPIDO PARA VERIFICAR

**Desde tu máquina (PowerShell):**
```powershell
# Verificar backend está activo
Invoke-RestMethod -Uri "https://rural24-backend.onrender.com/api/health"

# Verificar búsqueda funciona
Invoke-RestMethod -Uri "https://rural24-backend.onrender.com/api/ads/search?search=tractor&status=active&approval_status=approved&limit=5" | ConvertTo-Json -Depth 5

# Verificar frontend puede hacer el request (simular CORS)
$headers = @{
    "Origin" = "https://rural24-1.onrender.com"
    "Referer" = "https://rural24-1.onrender.com/"
}
Invoke-RestMethod -Uri "https://rural24-backend.onrender.com/api/ads/search?search=tractor&status=active&approval_status=approved" -Headers $headers
```

---

## 8. PRÓXIMOS PASOS

1. ✅ **Verificar VITE_API_URL en Render Dashboard**
2. ✅ **Agregar todas las variables VITE_***
3. ✅ **Rebuild del frontend**
4. ✅ **Verificar CORS en backend (FRONTEND_URL)**
5. ✅ **Test manual en navegador**
6. ✅ **Test con script desde tu máquina**

---

## 9. DOCUMENTACIÓN ADICIONAL

**Variables Vite en Build Time:**
https://vitejs.dev/guide/env-and-mode.html

**Render Environment Variables:**
https://render.com/docs/environment-variables

**SPA Routing con Render Static Site:**
https://render.com/docs/deploy-create-react-app#using-client-side-routing

---

**Estado:** 🔴 PENDIENTE DE VALIDACIÓN  
**Siguiente acción:** Configurar VITE_API_URL en Render Dashboard

