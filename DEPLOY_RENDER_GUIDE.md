# 🚀 Guía de Deploy en Render - Rural24

**Fecha:** 10 de Febrero 2026  
**Status:** ✅ Producción

---

## 📦 Arquitectura de Deploy en Render

```
┌─────────────────────────────────────┐
│  Backend (Next.js 16)               │
│  Web Service (Node)                 │
│  URL: rural24-backend.onrender.com  │
│  Root: /backend                     │
│  Port: $PORT (dinámico)             │
└─────────────────────────────────────┘
              ▲
              │ API calls
              │
┌─────────────────────────────────────┐
│  Frontend (React + Vite)            │
│  Static Site                        │
│  URL: rural24.onrender.com          │
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

### 1.1 Crear Web Service en Render

1. Ve a https://dashboard.render.com
2. Click **"New"** → **"Web Service"**
3. Conectar repositorio: `germanbruel-web/rural24`
4. Configuración:

```yaml
Name: rural24-backend
Region: Oregon (US West) o la más cercana
Branch: main (o rural24-deploy)
Root Directory: backend
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

### 1.2 Variables de entorno (Backend)

En **Environment Variables**, agregar:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://lmkuecdvxtenrikjomol.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[obtener_de_supabase]
SUPABASE_SERVICE_ROLE_KEY=[obtener_de_supabase_secret]

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# CORS - URL del frontend
FRONTEND_URL=https://rural24.onrender.com

# Environment
NODE_ENV=production

# Auto-approve ads (opcional, default false en producción)
AUTO_APPROVE_ADS=false

# Cron secret (para featured ads automation)
CRON_SECRET=tu_secret_aleatorio_seguro
```

**⚠️ IMPORTANTE**: Render asigna `PORT` automáticamente, NO agregarlo manualmente.

### 1.3 Plan y Deploy

- **Plan:** Free (con sleep después de 15min inactividad) o Paid ($7/mes)
- Click **"Create Web Service"**
- Esperar build ~3-5 minutos

**Copiar la URL del backend** (ej: `https://rural24-backend.onrender.com`)

---

## 🎨 PASO 2: Deploy del Frontend (DESPUÉS)

### 2.1 Crear Static Site en Render

1. **"New"** → **"Static Site"**
2. Repositorio: `germanbruel-web/rural24`
3. Configuración:

```yaml
Name: rural24
Region: Oregon (US West) 
Branch: main (o rural24-deploy)
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

### 2.2 Variables de entorno (Frontend)

```env
VITE_API_URL=https://rural24-backend.onrender.com
```

### 2.3 Deploy

- Click **"Create Static Site"**
- Esperar build ~2-3 minutos

---

## 🔄 PASO 3: Actualizar CORS en Backend

1. Ve al dashboard del **Backend Service**
2. **Environment** → Editar `FRONTEND_URL`
3. Cambiar a: `https://rural24.onrender.com` (tu URL real del frontend)
4. **Manual Deploy** para aplicar cambios

---

## ✅ PASO 4: Verificación Post-Deploy

### Backend Health Check

```bash
curl https://rural24-backend.onrender.com/api/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-02-10T..."
}
```

### Frontend

- Abrir `https://rural24.onrender.com`
- Verificar que carga sin errores de CORS
- Probar búsqueda y navegación

### CORS Test

En consola del navegador (DevTools):
```javascript
fetch('https://rural24-backend.onrender.com/api/config/categories')
  .then(r => r.json())
  .then(console.log)
```

Si devuelve categorías → CORS OK ✅

---

## 🔥 Troubleshooting Común

### 1. Error CORS

**Síntoma:** "Access-Control-Allow-Origin" error  
**Causa:** `FRONTEND_URL` mal configurada en backend  
**Fix:** Verificar que `FRONTEND_URL` en backend = URL exacta del frontend

### 2. Backend responde 503

**Síntoma:** Backend tarda mucho o falla  
**Causa:** Free tier en "sleep", tarda ~30s en despertar  
**Fix:** Usar paid plan ($7/mes) o implementar keep-alive ping

### 3. Frontend muestra localhost:3001

**Síntoma:** Requests van a localhost  
**Causa:** `VITE_API_URL` no está set  
**Fix:** Agregar variable en Render frontend dashboard

### 4. Build falla

**Backend:**
- Verificar que `backend/package.json` tiene `"start": "next start --port $PORT"`
- Verificar Node version compatible (18+)

**Frontend:**
- Verificar que `dist/` se genera correctamente
- Si falla, revisar logs en Render dashboard

---

## 🔄 Auto-Deploy

Render hace **auto-deploy** cuando pusheas a la branch configurada:

```bash
git push origin main
# Render detecta el push y rebuilds automáticamente
```

Para deshabilitar auto-deploy: Dashboard → Settings → Auto-Deploy = OFF

---

## 📊 Monitoreo

### Logs en tiempo real
- Dashboard → Service → **Logs** tab
- Ver requests, errores, performance

### Métricas
- Dashboard → Service → **Metrics** tab
- CPU, Memory, Response time

### Alertas
- Settings → **Notifications**
- Email cuando el servicio está down

---

## 💰 Costos Estimados

| Servicio | Plan | Costo |
|----------|------|-------|
| Backend Web Service | Free (con sleep) | $0 |
| Backend Web Service | Starter | $7/mes |
| Frontend Static Site | Gratis | $0 |
| **Total mínimo** | | **$0-7/mes** |

**Recomendación:** Free para testing, Starter para producción real.

---

## 🔐 Seguridad Post-Deploy

- ✅ Todas las rutas `/api/admin/*` protegidas con auth
- ✅ CORS configurado dinámicamente
- ✅ Service role key SOLO en backend (no expuesta)
- ✅ Avisos en estado `pending` por defecto
- ⚠️ Rate limiting: Pendiente (Fase 2)
- ⚠️ Monitoring: Considerar Sentry (Fase 2)

---

## 📞 Soporte

**Render Docs:** https://render.com/docs  
**Status:** https://status.render.com  
**Support:** Dashboard → Help → Chat

---

**Última actualización:** 10 Febrero 2026
