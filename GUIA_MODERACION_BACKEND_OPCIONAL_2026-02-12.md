# Guía: Moderación de Contenido Backend (Opcional)

**Fecha:** 12 Febrero 2026  
**Problema resuelto:** TensorFlow.js causaba 99+ errores y colapsaba el navegador  
**Solución implementada:** Validaciones básicas client-side (<1ms)  
**Esta guía:** Moderación AI backend opcional (Cloudinary)

---

## ✅ Estado Actual (MVP)

### Client-side
- ✅ Validación formato (JPEG, PNG, WebP)
- ✅ Validación tamaño (5MB max)
- ✅ Validación dimensiones (200px min, 4K max)
- ✅ Performance: <1ms por imagen
- ✅ 0 dependencias ML pesadas

### Backend
- ✅ Upload a Cloudinary funcionando
- ⚠️ Sin moderación AI (pendiente configurar)

---

## 🎯 Moderación Backend Opcional

### Opción 1: Cloudinary AI Moderation (Recomendado)

**¿Por qué Cloudinary?**
- Ya está integrado en el proyecto
- Moderación nativa sin código adicional
- Asíncrono: no bloquea uploads
- Precisión 95%+ (Google Vision AI)

**Costo:**
- $0.03 por imagen analizada
- $3 por 100 imágenes
- Gratis hasta 2,500 imágenes/mes

#### Paso 1: Activar Add-on

```bash
# Desde dashboard Cloudinary: https://cloudinary.com/console
# Settings > Add-ons > Moderation > Enable
#
# O via API:
curl -X POST "https://api.cloudinary.com/v1_1/ruralcloudinary/resources/image/upload" \
  -F "file=@image.jpg" \
  -F "upload_preset=rural24" \
  -F "moderation=aws_rek:explicit"
```

#### Paso 2: Configurar en Backend

**Archivo:** `backend/app/api/uploads/route.ts`

```typescript
// Configuración de upload con moderación
const uploadOptions = {
  folder: 'ads',
  use_filename: true,
  unique_filename: true,
  resource_type: 'image' as const,
  
  // ✨ ACTIVAR MODERACIÓN AI
  moderation: 'aws_rek:explicit', // AWS Rekognition (Google Vision también disponible)
  
  // Opciones de moderación
  notification_url: `${process.env.BACKEND_URL}/api/webhooks/cloudinary-moderation`,
};

const result = await cloudinary.uploader.upload(imageBuffer, uploadOptions);

// Resultado incluye moderación
console.log('Moderation status:', result.moderation);
// [
//   {
//     kind: 'aws_rek',
//     status: 'approved', // 'approved', 'rejected', 'pending'
//     response: { ModerationLabels: [...] }
//   }
// ]
```

#### Paso 3: Webhook para Moderación Asíncrona

**Archivo:** `backend/app/api/webhooks/cloudinary-moderation/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/database/prisma';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Cloudinary envía notificación cuando moderación completa
  const { public_id, moderation } = body;
  
  if (moderation[0].status === 'rejected') {
    // Marcar imagen como rechazada en BD
    await prisma.inmuebles_imagenes.updateMany({
      where: { cloudinary_path: public_id },
      data: { 
        is_active: false,
        moderation_status: 'rejected',
        moderation_reason: JSON.stringify(moderation[0].response)
      }
    });
    
    // Opcional: Notificar al usuario
    // await sendEmailNotification(...)
  }
  
  return NextResponse.json({ ok: true });
}
```

#### Paso 4: Flujo UX con Moderación Asíncrona

```typescript
// 1. Usuario sube imagen → validación client-side (inmediata)
// 2. Backend sube a Cloudinary → status 'pending'
// 3. Cloudinary analiza con AI → 200-500ms (asíncrono)
// 4. Webhook actualiza BD → status 'approved' o 'rejected'
// 5. Frontend polling o WebSocket para actualizar UI
```

---

## 🔄 Alternativa: Moderación Síncrona (Manual)

Si necesitas bloquear upload inmediatamente:

```typescript
// Esperar resultado de moderación antes de retornar
const result = await cloudinary.uploader.upload(imageBuffer, {
  ...uploadOptions,
  eager: [
    { moderation: 'aws_rek:explicit' }
  ]
});

// Chequear resultado inmediato
const moderationStatus = result.moderation[0].status;

if (moderationStatus === 'rejected') {
  // Eliminar imagen de Cloudinary
  await cloudinary.uploader.destroy(result.public_id);
  
  return NextResponse.json(
    { error: 'Imagen rechazada por moderación automática' },
    { status: 400 }
  );
}
```

**Trade-off:**
- ✅ Bloqueo inmediato de contenido inapropiado
- ❌ Upload 200-500ms más lento (mala UX)
- ❌ Mayor latencia percibida por usuario

---

## 🛡️ Capa 3: Sistema de Confianza + Reportes

### Confianza de Usuario

```typescript
// Esquema BD (ya existe en Supabase)
users {
  trust_score: number // 0-100
  is_verified: boolean
  uploads_count: number
  reports_received: number
}

// Lógica de moderación por confianza
const requiresPreModeration = (user: User) => {
  return (
    user.trust_score < 50 ||
    !user.is_verified ||
    user.uploads_count < 5
  );
};
```

### Sistema de Reportes

```typescript
// Usuarios pueden reportar contenido
POST /api/reports
{
  "resource_type": "ad_image",
  "resource_id": "uuid",
  "reason": "inappropriate_content",
  "description": "..."
}

// Auto-moderación por reportes
if (reports_count >= 3 && user.trust_score < 70) {
  // Ocultar contenido automáticamente
  await hideContent(resource_id);
  await notifyModerators();
}
```

---

## 📊 Decision Matrix: ¿Cuándo activar qué?

| Escenario | Client | Backend AI | Confianza | Costo |
|-----------|--------|------------|-----------|-------|
| **MVP (ahora)** | ✅ | ❌ | ⏸️ | $0 |
| **Early Growth** | ✅ | ✅ | ❌ | $10-30/mes |
| **Scale (>10k users)** | ✅ | ✅ | ✅ | $50-200/mes |

### Recomendación por fase:

**Fase 1 (0-1000 usuarios):**
- Validación client-side
- Moderación humana manual
- Sistema de reportes básico

**Fase 2 (1k-10k usuarios):**
- + Cloudinary Moderation (asíncrona)
- + Trust score básico
- + Auto-hide por reportes

**Fase 3 (10k+ usuarios):**
- + Moderación síncrona para nuevos users
- + ML adicional (ej: texto ofensivo)
- + Queue de moderación humana

---

## 🚀 Quick Start (Si decides implementar ahora)

1. **Activar en Cloudinary:**
   ```bash
   # Dashboard > Add-ons > Moderation > Enable AWS Rekognition
   ```

2. **Actualizar backend:**
   ```typescript
   // backend/app/api/uploads/route.ts
   + moderation: 'aws_rek:explicit'
   ```

3. **Probar:**
   ```bash
   # Upload test image
   curl -X POST http://localhost:3001/api/uploads \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@test.jpg"
   
   # Check moderation result
   # result.moderation[0].status === 'approved'
   ```

---

## 📝 Notas Finales

- **No es obligatorio para MVP**: La validación client-side es suficiente + reportes
- **Implementar cuando tengas tracción**: >100 usuarios activos/mes
- **Monitorear falsos positivos**: Cloudinary puede rechazar imágenes válidas (ej: arte)
- **Backup plan**: Siempre tener moderación humana como fallback

**Contacto Cloudinary Support**: support@cloudinary.com  
**Docs**: https://cloudinary.com/documentation/image_moderation_addon
