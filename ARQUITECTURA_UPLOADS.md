# 🏗️ Arquitectura de Uploads - RURAL24

## 📊 Respuestas a Preguntas Clave

### 1️⃣ ¿Frontend hace upload directo a Cloudinary?
**NO.** El flujo es:

```
Frontend (localhost:5173)
    ↓ FormData con file
POST http://localhost:3000/api/uploads
    ↓ Validación + Rate Limit
Backend Next.js (BFF)
    ↓ Sharp → Aspect Ratio Check
    ↓ Cloudinary SDK
Cloudinary API (ruralcloudinary)
    ↓ Retorna URL pública
https://res.cloudinary.com/ruralcloudinary/...
```

**Arquitectura:** Backend-First (BFF Pattern)

---

### 2️⃣ ¿Next.js debe intervenir en uploads?
**SÍ, ES OBLIGATORIO.** Razones:

#### 🔒 Seguridad
- Credenciales `CLOUDINARY_API_SECRET` **NUNCA** expuestas al frontend
- Honeypot anti-bot (campo `website` invisible)
- CORS estricto (solo puerto 5173)

#### 🛡️ Protecciones Server-Side
1. **Rate Limiting**: 10 uploads/5min por IP (in-memory)
2. **MIME Validation**: Solo `image/jpeg|png|webp|heic`
3. **Aspect Ratio**: Sharp analiza dimensiones (1.2:1 a 2.5:1)
4. **Tamaño**: Cloudinary limitado a 10MB

#### 📝 Auditoría
```typescript
console.log('[SUCCESS] Upload completed in 2157ms - URL: ...');
console.warn('[RATE LIMIT] IP: ::1 - Too many requests');
console.error('[INVALID ASPECT] Ratio: 1.19:1');
```

---

### 3️⃣ ¿Supabase guarda paths correctamente?
**SÍ.** Estructura de datos:

#### Schema en PostgreSQL
```sql
CREATE TABLE ads (
  id UUID PRIMARY KEY,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- images: [{ url: string, path: string }]
);
```

#### Formato almacenado
```json
{
  "images": [
    {
      "url": "https://res.cloudinary.com/ruralcloudinary/image/upload/v1234567890/rural24/ads/abc123.jpg",
      "path": "rural24/ads/abc123"
    },
    {
      "url": "https://res.cloudinary.com/ruralcloudinary/image/upload/v1234567890/rural24/ads/def456.jpg",
      "path": "rural24/ads/def456"
    }
  ]
}
```

#### Flujo de guardado
```typescript
// 1. Frontend sube a backend
const result = await uploadsApi.uploadImage(file, 'ads');
// { url: "...", path: "rural24/ads/abc123" }

// 2. Frontend acumula en estado
const uploadedImages = [{ url: result.url, path: result.path }];

// 3. Backend guarda en Supabase
const { data: ad } = await supabase
  .from('ads')
  .insert({
    images: uploadedImages, // JSONB auto-serializa
    // ...otros campos
  });
```

**Validación Zod:**
```typescript
export const AdImageSchema = z.object({
  url: z.string().url(),      // Valida formato URL
  path: z.string(),           // Path en Cloudinary
});

export const AdCreateSchema = z.object({
  images: z.array(AdImageSchema)
    .min(1, 'Al menos 1 imagen')
    .optional(),
});
```

---

### 4️⃣ Puertos Fijos (Configuración Estricta)

#### ✅ CONFIGURACIÓN ACTUAL

| Servicio | Puerto | Config | Comportamiento |
|----------|--------|--------|----------------|
| **Frontend Vite** | `5173` | `strictPort: true` | Falla si ocupado |
| **Backend Next.js** | `3000` | `next dev -p 3000` | Siempre 3000 |
| **CORS** | - | `localhost:5173` | Solo puerto fijo |

#### Archivos modificados

**`frontend/vite.config.ts`**
```typescript
export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 5173,
      strictPort: true, // ⚠️ FALLA SI PUERTO OCUPADO
      host: '0.0.0.0',
    },
  };
});
```

**`backend/package.json`**
```json
{
  "scripts": {
    "dev": "next dev -p 3000"  // ✅ Puerto explícito
  }
}
```

**`backend/next.config.js`**
```javascript
async headers() {
  return [{
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: 'http://localhost:5173' } // ✅ Solo 5173
    ],
  }];
}
```

---

## 🚀 Comandos de Inicio

```powershell
# Terminal 1: Backend
cd C:\Users\German\rural24\backend
npm run dev
# ✅ Ready at http://localhost:3000

# Terminal 2: Frontend
cd C:\Users\German\rural24\frontend
npm run dev
# ✅ Ready at http://localhost:5173
# ⚠️ Si falla → puerto ocupado → matar proceso
```

### Resolver puerto ocupado
```powershell
# Ver qué proceso usa puerto 5173
Get-NetTCPConnection -LocalPort 5173 | ForEach-Object {
  Stop-Process -Id $_.OwningProcess -Force
}

# Reintentar
npm run dev
```

---

## 🔍 Verificación de Arquitectura

### Test 1: Upload exitoso
```bash
curl http://localhost:3000/api/uploads \
  -X POST \
  -F "file=@tractor.jpg" \
  -F "folder=ads" \
  -F "website="

# ✅ Respuesta esperada
{
  "url": "https://res.cloudinary.com/ruralcloudinary/image/upload/v1234567890/rural24/ads/abc123.jpg",
  "path": "rural24/ads/abc123"
}
```

### Test 2: CORS (debe fallar desde otro puerto)
```bash
# Desde puerto 5174 → debe dar error CORS
curl http://localhost:3000/api/uploads \
  -H "Origin: http://localhost:5174" \
  -X POST

# ❌ Error esperado: CORS policy
```

### Test 3: Rate Limiting
```bash
# 11º request en menos de 5 minutos
curl http://localhost:3000/api/uploads ...

# ❌ Respuesta esperada
{
  "error": "Too many requests",
  "message": "Has alcanzado el límite de 10 uploads. Espera 5 minutos.",
  "resetAt": "2026-01-05T16:05:00.000Z"
}
```

### Test 4: Aspect Ratio inválido
```bash
# Imagen vertical 1080x1920
curl http://localhost:3000/api/uploads \
  -F "file=@foto_vertical.jpg"

# ❌ Respuesta esperada
{
  "error": "Invalid image",
  "message": "Solo se aceptan fotos horizontales (16:9, 4:3). Gira tu dispositivo o recorta la imagen."
}
```

---

## 📦 Dependencias Críticas

```json
{
  "backend": {
    "cloudinary": "^2.8.0",    // SDK oficial
    "sharp": "^0.34.5",         // Análisis de imágenes
    "next": "^16.1.1",          // Server + API Routes
    "zod": "^3.24.1"            // Validación schemas
  },
  "frontend": {
    "vite": "^6.4.1",           // Dev server con HMR
    "@vitejs/plugin-react": "^5.0.0"
  }
}
```

---

## 🔐 Variables de Entorno

**`backend/.env.local`**
```env
# Cloudinary (CRITICAL)
CLOUDINARY_CLOUD_NAME=ruralcloudinary
CLOUDINARY_API_KEY=944456953949168
CLOUDINARY_API_SECRET=************    # NUNCA commitear

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://******.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG******
SUPABASE_SERVICE_KEY=eyJhbG******      # Solo backend
```

**`frontend/.env.local`** (NO EXISTE - innecesario)
- Frontend usa variables públicas de Supabase
- API URL hardcoded: `http://localhost:3000` en desarrollo

---

## 🎯 Próximos Pasos

1. ✅ **Verificar que ambos servicios inician correctamente**
2. ✅ **Probar upload de imagen horizontal desde frontend**
3. ⏳ **Probar validación anti-fraude** (título con teléfono)
4. ⏳ **Publicar anuncio completo end-to-end**
5. ⏳ **Verificar imagen se visualiza en detalle del anuncio**

---

## 📚 Referencias

- [Cloudinary Upload API](https://cloudinary.com/documentation/image_upload_api_reference)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/api-resize)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Vite Server Options](https://vite.dev/config/server-options.html)
