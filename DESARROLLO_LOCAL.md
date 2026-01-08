# ===================================================
#   Rural24 - Guía Rápida de Desarrollo Local
# ===================================================

## 🚀 INICIO RÁPIDO (3 opciones)

### Opción 1: Script Windows (MÁS SIMPLE)
```cmd
# Doble click en:
START.cmd

# O desde terminal:
.\START.cmd
```
→ Abre una ventana con Backend + Frontend corriendo
→ Frontend: http://localhost:5173
→ Backend: http://localhost:3000

---

### Opción 2: Comando Directo
```powershell
npm run dev
```
→ Turbo ejecuta ambos servidores en paralelo

---

### Opción 3: Servidores Separados (para debugging)

**Terminal 1 - Backend:**
```powershell
cd backend-api
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

---

## 🧪 TESTING

### Test Backend (7 endpoints)
```powershell
cd backend-api
.\test-completo.ps1
```
→ Valida todos los endpoints del backend
→ Inicia servidor automáticamente
→ Ejecuta tests y muestra resultados

### Test Frontend + Backend (Integración)
1. Iniciar servidores: `npm run dev`
2. Abrir navegador: http://localhost:5173/#/api-test
3. Click "Run All Tests"
4. Verificar que todos pasen ✅

---

## 📁 ESTRUCTURA DEL PROYECTO

```
rural24/
├── START.cmd                    ← Doble click para iniciar todo
├── package.json                 ← Scripts de Turbo
├── backend-api/
│   ├── src/
│   │   ├── server.ts           ← Entry point backend
│   │   ├── routes/             ← Endpoints REST
│   │   ├── domain/             ← Lógica de negocio
│   │   └── infrastructure/     ← Supabase, Cloudinary
│   ├── .env.local              ← Variables de entorno backend
│   ├── test-completo.ps1       ← Test automatizado
│   └── package.json
└── frontend/
    ├── App.tsx                 ← App principal
    ├── src/
    │   ├── pages/
    │   │   └── APITest.tsx     ← Página de pruebas
    │   ├── services/
    │   │   ├── api/            ← Servicios HTTP (nuevo)
    │   │   └── catalogServiceV2.ts ← Service con feature flags
    │   ├── types/
    │   │   └── api-contracts.ts ← Contratos API documentados
    │   └── config/
    │       └── features.ts     ← Feature flags
    ├── .env.local              ← Variables de entorno frontend
    └── package.json
```

---

## 🔧 VARIABLES DE ENTORNO

### Backend (`.env.local` en `backend-api/`)
```env
SUPABASE_URL=https://lmkuecdvxtenrikjomol.supabase.co
SUPABASE_SERVICE_ROLE_KEY=***
CLOUDINARY_CLOUD_NAME=dosjgdcxr
CLOUDINARY_API_KEY=***
CLOUDINARY_API_SECRET=***
```

### Frontend (`.env.local` en `frontend/`)
```env
# Supabase (auth)
VITE_SUPABASE_URL=https://lmkuecdvxtenrikjomol.supabase.co
VITE_SUPABASE_KEY=***

# Backend API
VITE_API_URL=http://localhost:3000

# Feature Flags
VITE_USE_API_BACKEND=true
VITE_FALLBACK_TO_SUPABASE=true
VITE_DEBUG_API_CALLS=true
```

---

## 🎯 ENDPOINTS BACKEND

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/config/categories` | GET | Categorías + subcategorías |
| `/api/config/brands?subcategoryId=X` | GET | Marcas por subcategoría |
| `/api/config/models?brandId=X` | GET | Modelos por marca |
| `/api/config/form/:subcategoryId` | GET | Configuración formulario dinámico |
| `/api/ads` | GET | Lista de anuncios (filtros, paginación) |
| `/api/ads` | POST | Crear anuncio |
| `/api/uploads/signed-url` | POST | URL firmada Cloudinary |

**Estado:** ✅ 7/7 funcionando (100%)

---

## 🧩 FEATURE FLAGS

Controlan el comportamiento del frontend:

```typescript
// frontend/src/config/features.ts
VITE_USE_API_BACKEND=true          // Usar backend Fastify
VITE_FALLBACK_TO_SUPABASE=true     // Fallback a Supabase si falla
VITE_DEBUG_API_CALLS=true          // Logs detallados en consola
```

**Para cambiar:** Editar `frontend/.env.local` y recargar página

---

## 🐛 TROUBLESHOOTING

### Problema: Puerto 3000 ocupado
```powershell
# Matar procesos Node:
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# Reiniciar:
npm run dev
```

### Problema: Backend no responde
```powershell
# Verificar que está corriendo:
Get-NetTCPConnection -LocalPort 3000

# Test manual:
Invoke-RestMethod http://localhost:3000/api/health
```

### Problema: Frontend no carga datos
1. Abrir consola del navegador (F12)
2. Verificar feature flags:
   ```javascript
   localStorage.getItem('VITE_USE_API_BACKEND')
   ```
3. Verificar logs (si `VITE_DEBUG_API_CALLS=true`)

---

## 📊 ESTADO DEL PROYECTO

### Migración Backend: ✅ COMPLETADA
- Next.js 16 → Fastify 5
- 7/7 endpoints funcionando
- Performance: 5-200ms
- Arquitectura: Clean Architecture + DDD

### Integración Frontend: ✅ COMPLETADA
- Contratos API documentados
- Servicios actualizados
- Feature flags implementados
- Página de pruebas creada
- Adapters de datos funcionando

### Testing: ✅ VALIDADO
- Backend: 100% (7/7 tests passing)
- Frontend: Página interactiva funcional
- Integración: Endpoints conectados

---

## 📚 DOCUMENTACIÓN COMPLETA

- **Backend:** `backend-api/MIGRACION_COMPLETADA.md`
- **Frontend:** `FRONTEND_INTEGRATION_COMPLETE.md`
- **Ejecución:** `backend-api/EJECUCION.md`
- **Contratos API:** `frontend/src/types/api-contracts.ts`

---

## 🎓 PRÓXIMOS PASOS

### Desarrollo de Features
1. Migrar componentes existentes a `catalogServiceV2`
2. Implementar formulario dinámico usando `/api/config/form/:id`
3. Conectar listado de anuncios a `/api/ads`
4. Implementar upload de imágenes con signed URLs

### Optimizaciones
1. Cacheo de respuestas API (React Query)
2. Lazy loading de componentes pesados
3. Testing unitario con Vitest
4. CI/CD con GitHub Actions

---

**¿Dudas?** Revisa la documentación en los archivos `.md` del proyecto.

**¿Problemas?** Ejecuta `.\test-completo.ps1` para validar que todo funcione.
