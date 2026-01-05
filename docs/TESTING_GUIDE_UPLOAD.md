# 🧪 GUÍA DE TESTING - MEJORAS DE UPLOAD
**Fecha:** 5 de Enero 2026  
**Fase:** Fase 1 - Quick Wins  
**Tiempo estimado:** 30-45 minutos  

---

## 🎯 OBJETIVO

Verificar que las 4 mejoras implementadas funcionan correctamente:
1. ✅ Límite unificado a 8 fotos
2. ✅ Mensajes de error accionables
3. ✅ Validación preventiva
4. ✅ Retry automático

---

## 🚀 SETUP INICIAL

### 1. Levantar el Sistema
```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Debe estar corriendo en http://localhost:3000

# Terminal 2 - Frontend
cd frontend
npm run dev
# Debe estar corriendo en http://localhost:5173
```

### 2. Preparar Imágenes de Prueba

Crea una carpeta `test-images/` con estos archivos:

```
test-images/
  ├── horizontal-16x9.jpg    (1920x1080 - DEBE PASAR)
  ├── horizontal-4x3.jpg     (1600x1200 - DEBE PASAR)
  ├── vertical-9x16.jpg      (1080x1920 - DEBE FALLAR)
  ├── cuadrada-1x1.jpg       (1000x1000 - DEBE FALLAR)
  ├── panoramica.jpg         (3000x1000 - DEBE FALLAR)
  ├── muy-grande.jpg         (>10MB - DEBE FALLAR)
  ├── formato.gif            (GIF - DEBE FALLAR)
  └── validas/
      ├── foto1.jpg  (horizontal)
      ├── foto2.jpg  (horizontal)
      ├── foto3.jpg  (horizontal)
      ├── ...
      └── foto10.jpg (horizontal)
```

**💡 Tip:** Si no tienes estas imágenes, usa:
- **Vertical:** Toma foto con tu celular en modo retrato
- **Horizontal:** Gira el celular y toma en modo paisaje
- **Muy grande:** Cualquier foto >10MB de tu cámara

---

## ✅ TEST 1: LÍMITE DE 8 FOTOS

### Objetivo
Verificar que el sistema permite hasta 8 fotos (no 5)

### Pasos
1. Ir a **Publicar Aviso** (`/#/publicar`)
2. Completar pasos hasta llegar a "Fotos" (Paso 4)
3. Observar el texto descriptivo

**✅ ESPERADO:**
```
"Las fotos ayudan a vender más rápido. Máximo 8 fotos horizontales (16:9 o 4:3)"
```

4. Seleccionar 8 fotos horizontales válidas
5. Verificar que todas se agregan

**✅ ESPERADO:**
- Se muestran las 8 fotos en grid
- Drop zone muestra: "Agregar más fotos (8/8)"
- Drop zone está deshabilitada (gris)

6. Intentar agregar una 9na foto

**✅ ESPERADO:**
```
Notificación: "Ya tienes 8 fotos (máximo permitido)"
```

### ❌ Si falla
- Revisar `PublicarAvisoV3.tsx` línea 1100: `maxFiles={8}`
- Verificar que DragDropUploader recibe el prop correctamente

---

## ✅ TEST 2: VALIDACIÓN PREVENTIVA (FOTO VERTICAL)

### Objetivo
Verificar que fotos verticales se rechazan ANTES de subir

### Pasos
1. En **Publicar Aviso** → Paso "Fotos"
2. Seleccionar `vertical-9x16.jpg` (1080x1920)

**✅ ESPERADO (Inmediato, <1 segundo):**
```
Notificación ERROR (roja):
"vertical-9x16.jpg: 📱 FOTO VERTICAL: Gira tu celular HORIZONTALMENTE 
y vuelve a tomar la foto"
```

3. Verificar que la foto NO se agregó a la lista
4. Verificar en DevTools Console:

```javascript
[DragDropUploader] 🔍 Validando 1 archivos...
[DragDropUploader] ❌ Validación fallida: {
  file: "vertical-9x16.jpg",
  reason: "📱 FOTO VERTICAL...",
  dimensions: { width: 1080, height: 1920, aspectRatio: 0.56 }
}
[DragDropUploader] ⚠️ Ningún archivo pasó la validación
```

### Test Variantes

**A. Foto muy cuadrada (1000x1000):**
```
ESPERADO: "⚠️ Foto muy cuadrada (1.00:1). Tomá la foto mostrando 
más del producto en horizontal"
```

**B. Foto muy panorámica (3000x1000):**
```
ESPERADO: "⚠️ Foto muy panorámica (3.00:1). Usá formato 16:9 o 4:3"
```

**C. Archivo muy grande (>10MB):**
```
ESPERADO: "📁 Archivo muy grande (12.5MB). Máximo: 10MB"
```

**D. Formato inválido (.gif):**
```
ESPERADO: "❌ Formato image/gif no permitido. Usá JPG, PNG, WebP o HEIC"
```

### ❌ Si falla
- Verificar que existe `frontend/src/utils/imageValidation.ts`
- Revisar import en `DragDropUploader.tsx`
- Verificar logs en consola del navegador

---

## ✅ TEST 3: VALIDACIÓN FUNCIONANDO (FOTO HORIZONTAL)

### Objetivo
Verificar que fotos válidas pasan la validación y se suben

### Pasos
1. Seleccionar `horizontal-16x9.jpg` (1920x1080)

**✅ ESPERADO:**
```javascript
// En consola:
[DragDropUploader] 🔍 Validando 1 archivos...
[DragDropUploader] ✅ Archivo válido: {
  file: "horizontal-16x9.jpg",
  dimensions: { width: 1920, height: 1080, aspectRatio: 1.77 }
}
[DragDropUploader] ✅ 1/1 archivos válidos
[DragDropUploader] 🚀 Starting upload of 1 files...
```

2. Observar la foto agregándose a la lista
3. Ver barra de progreso
4. Verificar éxito final

**✅ ESPERADO:**
- Preview de la imagen visible
- Badge "📌 Portada" en primera imagen
- Estado: Success (check verde)

---

## ✅ TEST 4: RETRY AUTOMÁTICO (CONEXIÓN INESTABLE)

### Objetivo
Verificar que el sistema reintenta automáticamente en errores de red

### Setup: Simular Conexión Lenta
**Opción A - DevTools (Recomendado):**
1. Abrir DevTools (F12)
2. Tab "Network"
3. Cambiar throttling a "Slow 3G"

**Opción B - Desconectar WiFi:**
1. Durante el upload, desconectar WiFi
2. Reconectar después de 2 segundos

### Pasos
1. Con "Slow 3G" activado, seleccionar una foto horizontal válida
2. Observar logs en consola

**✅ ESPERADO:**
```javascript
[DragDropUploader] 📤 Uploading file 1/1: foto.jpg
[uploadsApi] 🚀 uploadImage called
// ... intento 1 falla ...
[DragDropUploader] ❌ Error en intento 1/3: {
  message: "Failed to fetch",
  isNetworkError: true,
  willRetry: true
}
[DragDropUploader] ⏳ Esperando 2000ms antes de reintentar...
// Notificación: "🔄 Reintentando foto.jpg... (1/3)"

[DragDropUploader] 🔄 Intento 2/3 para foto.jpg
// ... intento 2 exitoso ...
[DragDropUploader] ✅ Upload successful: { attempt: 2 }
```

**Notificación final:**
```
✅ foto.jpg subido exitosamente (después de 2 intentos)
```

### Test Variantes

**A. Rate Limit (429):**
Para probar, subir >10 fotos en 5 minutos

**✅ ESPERADO:**
```javascript
error.status === 429
[DragDropUploader] ⏳ Esperando 2000ms antes de reintentar...
// Reintenta automáticamente
```

**B. 3 Intentos Fallidos:**
Desconectar WiFi completamente

**✅ ESPERADO:**
```
Notificación ERROR:
"🔌 Error de conexión subiendo foto.jpg. Intentamos 3 veces sin éxito."
```

### ❌ Si falla
- Verificar que `uploadFilesSequentially` tiene el loop de retry
- Revisar que `maxRetries = 3` y `baseDelay = 2000`
- Verificar lógica de `isNetworkError`

---

## ✅ TEST 5: MENSAJES MEJORADOS EN BACKEND

### Objetivo
Verificar que el backend también devuelve mensajes claros

### Pasos
1. **Forzar error en backend:** Desactivar temporalmente la validación del frontend
   
   En `DragDropUploader.tsx`, comentar la validación:
   ```typescript
   // const validation = await validateImageBeforeUpload(file);
   // if (!validation.valid) { ... }
   ```

2. Seleccionar foto vertical (1080x1920)
3. La foto se subirá y el backend la rechazará

**✅ ESPERADO:**
```javascript
// Response del backend (status 400):
{
  error: "📱 Foto vertical detectada. GIRA TU CELULAR HORIZONTALMENTE...",
  ratio: "0.56",
  dimensions: { width: 1080, height: 1920 }
}

// Notificación en UI:
"📱 foto.jpg: 📱 Foto vertical detectada. GIRA TU CELULAR..."
```

4. **Restaurar validación del frontend** (descomentar)

### ❌ Si falla
- Verificar `backend/domain/images/service.ts` función `validateImageAspectRatio`
- Revisar que los mensajes tienen emojis y son claros

---

## ✅ TEST 6: MODO EDICIÓN (Conservar Imágenes)

### Objetivo
Verificar que en modo edición se conservan las imágenes anteriores

### Pasos
1. Crear un aviso con 3 fotos
2. Publicarlo
3. Ir a "Mis Avisos" y hacer click en "Editar"
4. Verificar que las 3 fotos aparecen en el uploader
5. Agregar 2 fotos nuevas (deben ser válidas)
6. Una de las fotos nuevas falla por red (simular con Slow 3G)
7. Guardar cambios

**✅ ESPERADO:**
```javascript
finalImages = [
  ...existingImages (3 fotos),
  ...newImages.filter(success) (1 foto exitosa)
]
// Total: 4 fotos
// Las 3 originales NO se pierden
```

### ❌ Si falla
- Revisar `PublicarAvisoV3.tsx` método `handleSubmit`
- Verificar lógica de `existingImages` vs `newImages`

---

## ✅ TEST 7: EXPERIENCIA MOBILE (CRÍTICO)

### Objetivo
Probar en dispositivo real (Android o iOS)

### Setup
1. Obtener IP local del servidor:
   ```bash
   # En Windows
   ipconfig
   # Buscar "IPv4 Address" (ej: 192.168.1.100)
   ```

2. En el celular, abrir:
   ```
   http://192.168.1.100:5173
   ```

### Pasos - Android
1. Ir a Publicar Aviso → Fotos
2. Click en drop zone → Abre opciones de Android
3. Seleccionar "Cámara"
4. **SIN GIRAR EL CELULAR**, tomar foto en vertical
5. Confirmar

**✅ ESPERADO:**
```
Notificación inmediata:
"📱 FOTO VERTICAL: Gira tu celular HORIZONTALMENTE..."
```

6. Volver a la cámara
7. **GIRAR EL CELULAR** horizontalmente
8. Tomar foto en modo paisaje
9. Confirmar

**✅ ESPERADO:**
- Foto se acepta
- Se muestra preview
- Upload exitoso

### Pasos - iOS (Safari)
Similar a Android, pero:
- Safari puede rotar la foto automáticamente (EXIF)
- Verificar que la validación funciona igual

---

## 📊 CHECKLIST COMPLETO

### Validación Preventiva
- [ ] Rechaza foto vertical (9:16)
- [ ] Rechaza foto cuadrada (1:1)
- [ ] Rechaza foto muy panorámica (>2.5:1)
- [ ] Rechaza archivo >10MB
- [ ] Rechaza formato .gif
- [ ] Acepta foto 16:9
- [ ] Acepta foto 4:3
- [ ] Mensajes son claros y accionables

### Retry Automático
- [ ] Reintenta en error de red (Failed to fetch)
- [ ] Reintenta en timeout
- [ ] Reintenta en rate limit (429)
- [ ] No reintenta en error de validación
- [ ] Delay progresivo: 2s, 4s, 6s
- [ ] Notifica intentos en curso
- [ ] Notifica éxito después de retry
- [ ] Notifica fallo después de 3 intentos

### Límite de Fotos
- [ ] Texto dice "Máximo 8 fotos"
- [ ] Permite subir 8 fotos
- [ ] Rechaza la 9na foto
- [ ] Drop zone se deshabilita al llegar a 8

### Mensajes de Error
- [ ] Backend devuelve mensaje claro para vertical
- [ ] Backend devuelve mensaje claro para cuadrada
- [ ] Backend devuelve mensaje claro para panorámica
- [ ] Mensajes tienen emojis
- [ ] Mensajes están en español
- [ ] Mensajes dicen QUÉ hacer, no solo qué está mal

### Mobile
- [ ] Funciona en Android Chrome
- [ ] Funciona en iOS Safari
- [ ] Cámara se abre correctamente
- [ ] Validación funciona en mobile
- [ ] Retry funciona en 3G
- [ ] UI responsive (no se rompe)

### Modo Edición
- [ ] Carga imágenes existentes
- [ ] Permite agregar nuevas
- [ ] Conserva existentes si falla una nueva
- [ ] Permite reordenar
- [ ] Permite eliminar

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### 1. "validateImageBeforeUpload is not defined"
**Causa:** No se importó la función  
**Solución:**
```typescript
import { validateImageBeforeUpload } from '../../utils/imageValidation';
```

### 2. "Failed to fetch" en todos los uploads
**Causa:** Backend no está corriendo  
**Solución:**
```bash
cd backend
npm run dev
# Verificar que dice "Server running on port 3000"
```

### 3. Retry no funciona
**Causa:** Lógica de `isNetworkError` incorrecta  
**Solución:** Revisar que incluye:
```typescript
error.message?.includes('Failed to fetch') ||
error.message?.includes('Network') ||
error.status === 429
```

### 4. Validación pasa pero backend rechaza
**Causa:** Desincronización entre límites frontend/backend  
**Solución:** 
- Frontend: aspect ratio 1.2-2.5
- Backend: aspect ratio 1.2-2.5
- Verificar que ambos usan los mismos valores

### 5. Mobile: cámara no se abre
**Causa:** Permisos del navegador  
**Solución:**
- Android: Verificar permisos de Chrome
- iOS: Safari necesita HTTPS o localhost

---

## 📸 CAPTURAS ESPERADAS

### Validación Preventiva - Foto Vertical
```
┌──────────────────────────────────────────┐
│  ❌ Error                                 │
│                                           │
│  foto-vertical.jpg: 📱 FOTO VERTICAL:    │
│  Gira tu celular HORIZONTALMENTE y       │
│  vuelve a tomar la foto                  │
│                                           │
│  [Cerrar]                                │
└──────────────────────────────────────────┘
```

### Retry en Progreso
```
┌──────────────────────────────────────────┐
│  🔄 Reintentando foto.jpg... (2/3)       │
└──────────────────────────────────────────┘
```

### Éxito con Retry
```
┌──────────────────────────────────────────┐
│  ✅ foto.jpg subido exitosamente         │
│     (después de 2 intentos)              │
└──────────────────────────────────────────┘
```

### Límite Alcanzado
```
┌──────────────────────────────────────────┐
│  ⚠️ Ya tienes 8 fotos (máximo permitido) │
└──────────────────────────────────────────┘
```

---

## ✅ CRITERIOS DE ACEPTACIÓN

### Para considerar la Fase 1 como EXITOSA:
- [ ] ✅ Todos los tests pasan
- [ ] ✅ No hay errores en consola del navegador
- [ ] ✅ No hay errores en logs del backend
- [ ] ✅ Mobile funciona correctamente (real device)
- [ ] ✅ Retry funciona en 3G simulado
- [ ] ✅ Mensajes son claros y en español
- [ ] ✅ Usuario puede completar un aviso exitosamente

### Señales de que algo está mal:
- ❌ Fotos verticales pasan la validación
- ❌ No hay retry en errores de red
- ❌ Mensajes técnicos ("ratio 0.56:1")
- ❌ UI dice "5 fotos" pero backend acepta 8
- ❌ Errors en consola

---

**Tiempo estimado de testing:** 30-45 minutos  
**Última actualización:** 5 de Enero 2026  
**Versión:** 1.0
