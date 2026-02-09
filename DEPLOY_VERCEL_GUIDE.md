# 🚀 Guía de Deploy en Vercel - Rural24

**Fecha:** 9 de Febrero 2026  
**Status:** ✅ Listo para producción

---

## ✅ Pre-requisitos completados

- ✅ Frontend build exitoso (Vite)
- ✅ Backend build exitoso (Next.js 16)
- ✅ Prisma configurado para producción
- ✅ CORS dinámico implementado
- ✅ TypeScript sin errores
- ✅ Configs de Vercel creadas
- ✅ Templates de env vars documentados

---

## 📦 Arquitectura de Deploy

```
┌─────────────────────────────────────┐
│  PROYECTO 1: Backend (Next.js 16)  │
│  URL: rural24-backend.vercel.app    │
│  Root: /backend                     │
└─────────────────────────────────────┘
              ▲
              │ API calls
              │
┌─────────────────────────────────────┐
│  PROYECTO 2: Frontend (Vite SPA)   │
│  URL: rural24-frontend.vercel.app   │
│  Root: /frontend                    │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Supabase PostgreSQL + Auth         │
│  lmkuecdvxtenrikjomol.supabase.co   │
└─────────────────────────────────────┘
```

---

## 🔧 PASO 1: Deploy del Backend (PRIMERO)

### 1.1 Crear proyecto en Vercel

1. Ve a https://vercel.com
2. Click "Add New" → "Project"
3. Importar `germanbruel-web/rural24`
4. **Framework Preset:** Next.js
5. **Root Directory:** `backend`
6. **Build Command:** `cd .. && npm install && npm run build --workspace=backend`
7. **Output Directory:** `.next`

### 1.2 Variables de entorno (Backend)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://lmkuecdvxtenrikjomol.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[obtener_de_supabase]
SUPABASE_SERVICE_ROLE_KEY=[obtener_de_supabase]

# Database (Supabase Connection Pooler)
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres

# Cloudflare R2 (opcional - si vas a usar)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=rural24-images

# CORS
FRONTEND_URL=https://rural24-frontend.vercel.app

# Environment
NODE_ENV=production
```

**Dónde obtener las keys:**
- Supabase Dashboard → Settings → API
- `ANON_KEY` = anon public
- `SERVICE_ROLE_KEY` = service_role (secret)
- `DATABASE_URL` = Settings → Database → Connection String (Pooler mode)

### 1.3 Deploy

Click "Deploy" y esperar ~2 minutos.

**Copiar la URL del backend** (ej: `https://rural24-backend.vercel.app`)

---

## 🎨 PASO 2: Deploy del Frontend (DESPUÉS)

### 2.1 Crear proyecto en Vercel

1. "Add New" → "Project"
2. Importar mismo repo `germanbruel-web/rural24`
3. **Framework Preset:** Vite
4. **Root Directory:** `frontend`
5. **Build Command:** `cd .. && npm install && npm run build --workspace=frontend`
6. **Output Directory:** `dist`

### 2.2 Variables de entorno (Frontend)

```env
# Supabase
VITE_SUPABASE_URL=https://lmkuecdvxtenrikjomol.supabase.co
VITE_SUPABASE_KEY=[mismo_anon_key_del_backend]

# Backend API (USAR LA URL DEL BACKEND DEPLOYADO)
VITE_API_URL=https://rural24-backend.vercel.app

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=dosjgdcxr
VITE_CLOUDINARY_UPLOAD_PRESET=rural24_unsigned

# Feature Flags
VITE_USE_API_BACKEND=true
VITE_FALLBACK_TO_SUPABASE=false
VITE_DEBUG_API_CALLS=false
VITE_SHOW_MIGRATION_BANNER=false
```

### 2.3 Deploy

Click "Deploy" y esperar ~1 minuto.

---

## 🔄 PASO 3: Actualizar CORS del Backend

**IMPORTANTE:** Después del primer deploy del frontend:

1. Ve al proyecto Backend en Vercel
2. Settings → Environment Variables
3. Editar `FRONTEND_URL` con la URL real del frontend:
   ```
   FRONTEND_URL=https://tu-proyecto-frontend.vercel.app
   ```
4. Redeploy el backend (Deployments → ⋯ → Redeploy)

---

## 🧪 PASO 4: Verificación

### Backend API:
```bash
curl https://rural24-backend.vercel.app/api/health
# Debe responder: {"status":"ok"}
```

### Frontend:
- Abrir `https://tu-frontend.vercel.app`
- Verificar que cargue la homepage
- Verificar que se vean avisos destacados
- Abrir DevTools (F12) → Console → No debe haber errores CORS

---

## 🐛 Troubleshooting

### Error: "Module not found @prisma/client"
- Verificar que `DATABASE_URL` esté configurada
- Verificar que el build command incluya `npm install` desde la raíz

### Error: CORS
- Verificar que `FRONTEND_URL` en backend coincida exactamente con la URL del frontend
- NO incluir trailing slash: ✅ `.../app` ❌ `.../app/`

### Error: "Cannot connect to Supabase"
- Verificar que las keys sean correctas
- En frontend usar `VITE_SUPABASE_KEY` (anon key pública)
- En backend usar `SUPABASE_SERVICE_ROLE_KEY` (secret key)

### Error: API 404
- Verificar que `VITE_API_URL` en frontend apunte al backend correcto
- Probar manualmente: `curl https://backend-url/api/health`

---

## 📊 Monitoreo Post-Deploy

1. **Logs:** Vercel Dashboard → Deployments → View Function Logs
2. **Analytics:** Vercel Analytics (gratis)
3. **Supabase:** Dashboard → Database → Table Editor
4. **Errores:** Vercel Dashboard → cada proyecto muestra errores en tiempo real

---

## 🎯 Próximos pasos (opcional)

### Dominio Custom:
1. Vercel → Settings → Domains
2. Agregar `rural24.com` (frontend)
3. Agregar `api.rural24.com` (backend)
4. Actualizar DNS según instrucciones de Vercel

### CI/CD Automático:
- Ya está configurado: cada push a `main` redeploya automáticamente

### Seguridad:
- Configurar rate limiting en Vercel (Pro plan)
- Agregar Helmet.js headers
- Configurar Content Security Policy

---

## ✅ Checklist Final

- [ ] Backend deployado y respondiendo en `/api/health`
- [ ] Frontend deployado y carga correctamente
- [ ] No hay errores CORS en consola
- [ ] Los avisos se muestran correctamente
- [ ] Sistema de featured ads funciona
- [ ] Panel admin accesible
- [ ] Forms de publicar aviso funcionan
- [ ] Búsqueda y filtros operativos

---

**¿Problemas?** Revisá los logs en Vercel Dashboard o la consola del navegador (F12).
