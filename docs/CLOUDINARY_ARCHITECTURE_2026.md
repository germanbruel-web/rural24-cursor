# 🏗️ ARQUITECTURA DE IMÁGENES CON CLOUDINARY - ANÁLISIS COMPLETO

**Fecha:** 5 de Enero 2026  
**Arquitecto:** System Analysis  
**Objetivo:** Sistema robusto de imágenes con Cloudinary, anti-bots y validaciones

---

## 📊 1. DIAGNÓSTICO DEL ESTADO ACTUAL

### ✅ **LO QUE YA FUNCIONA:**

1. **Backend Cloudinary básico** (`/api/uploads/route.ts`):
   - ✅ Upload a Cloudinary configurado
   - ✅ Variables de entorno OK
   - ✅ Retorna URL + public_id
   - ⚠️ **FALTA:** Rate limiting, validaciones anti-bot, restricción de videos

2. **Frontend upload API** (`uploads.ts`):
   - ✅ Proxy al backend para uploads
   - ✅ Multi-upload implementado
   - ⚠️ **FALTA:** Validaciones del lado cliente, retry logic

3. **Image Optimizer** (`imageOptimizer.ts`):
   - ✅ Compresión client-side a 1MB
   - ✅ Multi-image compression (8 imágenes)
   - ✅ Thumbnail generation
   - **BUENO:** Reduce costos de Cloudinary

4. **Formulario PublicarAvisoV3**:
   - ✅ Usa `uploadsApi.uploadMultiple()`
   - ✅ Validación de 5MB por archivo
   - ⚠️ **PROBLEMA:** Permite 10 fotos (debería ser máx 5)

---

## 🎯 2. REQUERIMIENTOS DEL CLIENTE

| # | Requerimiento | Prioridad | Estado |
|---|--------------|-----------|--------|
| 1 | Testing upload Cloudinary | 🔴 ALTA | ⚠️ PARCIAL |
| 2 | Anti-bots / Anti-scrapers | 🔴 ALTA | ❌ FALTANTE |
| 3 | Bloquear videos, máx 5 imágenes | 🔴 ALTA | ❌ FALTANTE |

---

## 🏛️ 3. PROPUESTA DE ARQUITECTURA

### **ARQUITECTURA EN 3 CAPAS**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  - Validaciones client-side (tipos, tamaño, cantidad)      │
│  - Compresión con ImageOptimizer                            │
│  - Rate limiting visual (cooldown UI)                       │
└────────────────────┬────────────────────────────────────────┘
                     │ 
                     ▼ 
┌─────────────────────────────────────────────────────────────┐
│              BACKEND BFF (Next.js)                           │
│  - Rate Limiting (10 uploads / 5min por IP)                │
│  - Validación de tipos MIME (solo imágenes)                │
│  - Honeypot anti-bot                                        │
│  - Token temporal (HMAC signature)                          │
│  - Límite 5 imágenes por request                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 CLOUDINARY (CDN)                             │
│  - Upload preset con restricciones                          │
│  - Auto-optimización (f_auto, q_auto)                       │
│  - Transformaciones on-the-fly                              │
│  - Folders: rural24/ads, rural24/profiles, etc             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ 4. ESTRATEGIAS ANTI-BOT Y SEGURIDAD

### **4.1 RATE LIMITING (Capa Backend)**

**Implementación:** Memoria en Next.js con Map() + TTL

```typescript
// Límites por IP
{
  "192.168.1.1": {
    uploads: 8,
    lastReset: 1736000000000,
    blocked: false
  }
}
```

**Reglas:**
- 10 uploads / 5 minutos por IP
- 50 uploads / hora por IP
- Si supera → 429 Too Many Requests + cooldown 15 min

### **4.2 VALIDACIÓN DE TIPOS MIME**

**Backend verifica:**
```typescript
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic', // iOS photos
];

const BLOCKED_TYPES = [
  'video/*',      // Videos
  'application/*', // PDFs, ZIPs
  'audio/*',      // Audio
];
```

### **4.3 HONEYPOT FIELD (Anti-Bot Simple)**

**Frontend invisible field:**
```html
<input type="text" name="website" style="display:none" tabindex="-1" />
```

**Backend rechaza si está lleno:**
```typescript
if (formData.get('website')) {
  return 403; // Bot detectado
}
```

### **4.4 TOKEN TEMPORAL (HMAC)**

**Evita uploads directos a la API:**

```typescript
// Frontend solicita token
GET /api/uploads/token → { token: "abc123", expiresAt: 1736000300 }

// Upload requiere token válido
POST /api/uploads
Headers: X-Upload-Token: abc123
```

Token válido por 10 minutos.

---

## 🎨 5. DISEÑO UX/UI

### **5.1 FLUJO DE USUARIO**

```
[Usuario selecciona fotos] 
       ↓
[Validación client-side]
   ├─ ✅ Tipos válidos (jpg, png, webp)
   ├─ ✅ Máximo 5 imágenes
   ├─ ✅ Máximo 5MB cada una
   └─ ❌ Videos bloqueados
       ↓
[Compresión automática]
   └─ Reduce a 1MB c/u
       ↓
[Upload al backend]
   ├─ Rate limit check
   ├─ MIME validation
   └─ Honeypot check
       ↓
[Cloudinary upload]
       ↓
[✅ URLs retornadas]
```

### **5.2 ESTADOS Y FEEDBACK**

| Estado | UI | Mensaje |
|--------|-----|---------|
| **Idle** | Input habilitado | "Selecciona hasta 5 fotos" |
| **Validating** | Spinner | "Verificando imágenes..." |
| **Compressing** | Progress bar | "Optimizando (3/5)..." |
| **Uploading** | Upload icon animado | "Subiendo a la nube..." |
| **Success** | Checkmark verde | "✅ 5 fotos subidas" |
| **Error** | X roja | "❌ Videos no permitidos" |
| **Rate Limited** | Cooldown timer | "⏳ Espera 4:32 min" |

### **5.3 EDGE CASES**

| Caso | Comportamiento |
|------|----------------|
| Usuario sube 10 fotos | Frontend toma solo primeras 5 + warning |
| Sube video MP4 | Rechazado client-side con mensaje claro |
| Sube 5 imágenes de 10MB | Comprimidas a 1MB c/u automáticamente |
| Intenta subir 20 veces | Rate limit → cooldown 15 min |
| Conexión lenta | Retry automático 3 veces con backoff |
| Cloudinary caído | Fallback a Supabase Storage (opcional) |

---

## 📐 6. MODELO DE DATOS

### **6.1 Upload Metadata (ads table)**

```sql
CREATE TABLE ads (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  images TEXT[], -- Array de URLs de Cloudinary
  cloudinary_ids TEXT[], -- Public IDs para delete
  image_count SMALLINT DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

### **6.2 Rate Limit Store (en memoria)**

```typescript
interface RateLimitEntry {
  ip: string;
  uploads: number;
  lastReset: number;
  blocked: boolean;
  blockUntil?: number;
}

// Map con TTL de 1 hora
const rateLimitStore = new Map<string, RateLimitEntry>();
```

---

## 🚀 7. PLAN DE IMPLEMENTACIÓN

### **FASE 1: VALIDACIONES Y LÍMITES** ✅
1. ✅ Actualizar handlePhotoChange: máx 5 fotos
2. ✅ Validar tipos MIME client-side
3. ✅ Bloquear videos con mensaje claro

### **FASE 2: BACKEND ANTI-BOT** 🔄
4. ⏳ Rate limiting en /api/uploads
5. ⏳ Honeypot field en formulario
6. ⏳ Token temporal HMAC

### **FASE 3: TESTING CLOUDINARY** ⏳
7. ⏳ Testing upload a Cloudinary
8. ⏳ Verificar URLs y transformaciones
9. ⏳ Testing rate limiting

---

## ⚙️ 8. CONFIGURACIÓN CLOUDINARY

### **8.1 Upload Presets**

```json
{
  "name": "rural24_unsigned",
  "unsigned": false, // Requiere signature
  "folder": "rural24/ads",
  "allowed_formats": ["jpg", "png", "webp", "heic"],
  "max_file_size": 5242880, // 5MB
  "auto_tagging": 0.7,
  "categorization": "google_tagging",
  "transformation": {
    "quality": "auto:good",
    "fetch_format": "auto",
    "width": 1920,
    "crop": "limit"
  }
}
```

### **8.2 Transformaciones URL**

```
# Original
https://res.cloudinary.com/dosjgdcxr/image/upload/v1234567890/rural24/ads/abc123.jpg

# Thumbnail 400px
.../c_fill,w_400,h_400,q_auto,f_auto/rural24/ads/abc123.jpg

# Responsive
.../w_auto,c_scale,dpr_auto,f_auto,q_auto/rural24/ads/abc123.jpg
```

---

## 📊 9. MÉTRICAS Y MONITOREO

### **Métricas Críticas:**
- Uploads totales / día
- Rate limit hits / hora
- Bots detectados (honeypot)
- Tiempo promedio de upload
- Cloudinary credits consumidos

### **Alertas:**
- ⚠️ > 100 rate limits / hora → Posible ataque
- ⚠️ > 50 honeypot hits / hora → Bots activos
- ⚠️ Cloudinary credits > 80% → Upgrade plan

---

## ✅ 10. CHECKLIST FINAL

- [ ] Frontend: Máximo 5 imágenes
- [ ] Frontend: Bloquear videos
- [ ] Frontend: Honeypot field invisible
- [ ] Backend: Rate limiting por IP
- [ ] Backend: Validación MIME estricta
- [ ] Backend: Token temporal opcional
- [ ] Testing: Upload 5 JPG → OK
- [ ] Testing: Upload 1 MP4 → Rechazado
- [ ] Testing: 15 uploads rápidos → Rate limited
- [ ] Cloudinary: Preset configurado
- [ ] Docs: Guía de uso para equipo

---

## 🎯 DECISIONES ARQUITECTÓNICAS CLAVE

### **¿Por qué no Cloudinary Upload Widget?**
- ❌ Expone cloud_name públicamente
- ❌ Difícil integrar rate limiting
- ✅ Backend proxy da control total

### **¿Por qué rate limiting en memoria vs Redis?**
- ✅ Simple para MVP (< 1000 usuarios)
- ✅ Sin infraestructura extra
- 🔄 Migrar a Redis si escala

### **¿Por qué comprimir client-side?**
- ✅ Reduce costos Cloudinary
- ✅ Uploads más rápidos
- ✅ Mejor UX en móviles

---

**Próximos pasos:** Implementar Fase 1 y 2, testear con casos reales.
