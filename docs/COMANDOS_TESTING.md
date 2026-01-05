# 🚀 COMANDOS RÁPIDOS - TESTING FASE 1
**Fecha:** 5 de Enero 2026

---

## 🏃 Setup Rápido

```bash
# 1. Abrir proyecto
cd c:\Users\German\rural24

# 2. Abrir 2 terminales
```

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Debe mostrar:
```
[Nest] 12345  - 01/05/2026, 10:30:45 AM     LOG [NestApplication] Nest application successfully started
Server running on http://localhost:3000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Debe mostrar:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## 🧪 Tests Rápidos (5 minutos)

### Test 1: Foto Vertical ❌
```bash
# 1. Ir a: http://localhost:5173/#/publicar
# 2. Completar hasta "Fotos" (Paso 4)
# 3. Seleccionar foto vertical (portrait)

# ✅ DEBE MOSTRAR:
# "📱 FOTO VERTICAL: Gira tu celular HORIZONTALMENTE..."
```

### Test 2: Foto Horizontal ✅
```bash
# 1. Seleccionar foto horizontal (landscape)

# ✅ DEBE MOSTRAR:
# - Preview de la imagen
# - Barra de progreso
# - ✓ Success
```

### Test 3: Límite de 8 Fotos
```bash
# 1. Seleccionar 8 fotos horizontales
# 2. Intentar agregar una 9na

# ✅ DEBE MOSTRAR:
# "Ya tienes 8 fotos (máximo permitido)"
```

### Test 4: Retry (Conexión Lenta)
```bash
# 1. Abrir DevTools (F12)
# 2. Tab "Network"
# 3. Cambiar a "Slow 3G"
# 4. Subir 1 foto

# ✅ DEBE MOSTRAR EN CONSOLA:
# [DragDropUploader] 🔄 Intento 1/3...
# [DragDropUploader] ⏳ Esperando 2000ms...
# [DragDropUploader] 🔄 Intento 2/3...
# [DragDropUploader] ✅ Upload successful
```

---

## 📱 Test Mobile (10 minutos)

### Obtener IP Local
```bash
# Windows
ipconfig
# Buscar "IPv4 Address": 192.168.x.x

# Mac/Linux
ifconfig
# Buscar "inet": 192.168.x.x
```

### En el Celular
```bash
# Abrir Chrome/Safari
http://192.168.x.x:5173

# Ir a Publicar Aviso → Fotos
# Tomar foto en VERTICAL
# Debe rechazar con mensaje claro
# Girar celular y tomar en HORIZONTAL
# Debe aceptar y subir
```

---

## 🐛 Debugging

### Ver Logs del Frontend
```bash
# En navegador, abrir DevTools (F12)
# Tab "Console"
# Filtrar por "DragDropUploader"
```

Logs esperados:
```javascript
[DragDropUploader] 🔍 Validando 1 archivos...
[DragDropUploader] ✅ Archivo válido: { width: 1920, height: 1080 }
[DragDropUploader] 🚀 Starting upload...
[uploadsApi] 📤 Uploading...
[uploadsApi] ✅ Upload successful
```

### Ver Logs del Backend
```bash
# En terminal del backend, buscar:
[SUCCESS] Upload completed in 2157ms - URL: https://...
```

### Verificar Errores
```bash
# Si hay errores, buscar:
[ERROR] Upload failed...
[INVALID ASPECT] Ratio: 0.56:1
```

---

## 🔍 Inspeccionar Red

### En DevTools → Network
```bash
# Filtrar por "uploads"
# Click en request
# Ver:
# - Status: 200 (success) o 400 (error)
# - Response: { url: "...", path: "..." }
# - Headers: X-RateLimit-Remaining
```

### Simular Errores de Red
```bash
# Opción 1: DevTools → Network → Offline
# Opción 2: DevTools → Network → Slow 3G
# Opción 3: Desconectar WiFi durante upload
```

---

## 📊 Verificar Estado

### Frontend - Verificar Imports
```bash
# Buscar en: DragDropUploader.tsx
grep "validateImageBeforeUpload" frontend/src/components/DragDropUploader/DragDropUploader.tsx
```

Debe encontrar:
```typescript
import { validateImageBeforeUpload } from '../../utils/imageValidation';
```

### Backend - Verificar Mensajes
```bash
# Buscar en: backend/domain/images/service.ts
grep "GIRA TU CELULAR" backend/domain/images/service.ts
```

Debe encontrar:
```typescript
reason: '📱 Foto vertical detectada. GIRA TU CELULAR HORIZONTALMENTE...'
```

### Verificar Límite de 8
```bash
# Buscar en: PublicarAvisoV3.tsx
grep "maxFiles={8}" frontend/src/components/pages/PublicarAvisoV3.tsx
```

Debe encontrar:
```typescript
maxFiles={8}
```

---

## 🎯 Checklist Rápido (Copiar y pegar en ticket)

```markdown
## Testing Fase 1 - Checklist

### Setup
- [ ] Backend corriendo en :3000
- [ ] Frontend corriendo en :5173
- [ ] No hay errores en consola

### Validación Preventiva
- [ ] Rechaza foto vertical
- [ ] Acepta foto horizontal
- [ ] Mensaje claro y accionable

### Retry
- [ ] Reintenta en Slow 3G
- [ ] Notifica intentos
- [ ] Éxito después de retry

### Límite
- [ ] Acepta 8 fotos
- [ ] Rechaza la 9na

### Mobile
- [ ] Android: Funciona
- [ ] iOS: Funciona
- [ ] Cámara se abre OK

### Resultado
- [ ] ✅ TODO OK - Listo para deploy
- [ ] ⚠️ Issues menores - Ver comentarios
- [ ] ❌ Problemas críticos - No deployar
```

---

## 🆘 Problemas Comunes

### "Cannot find module 'imageValidation'"
```bash
# Verificar que existe el archivo
ls frontend/src/utils/imageValidation.ts

# Si no existe, crearlo desde:
# docs/FASE_1_IMPLEMENTADA.md
```

### Backend no arranca
```bash
# Verificar puerto 3000 libre
netstat -ano | findstr :3000

# Si está ocupado, matar proceso
taskkill /PID <PID> /F

# Reintentar
cd backend
npm run dev
```

### "Failed to fetch" en todos los uploads
```bash
# Verificar que backend está corriendo
curl http://localhost:3000/health
# Debe responder: {"status":"ok"}

# Si no responde, revisar logs del backend
```

### Validación no funciona
```bash
# Limpiar cache del navegador
# Chrome: Ctrl+Shift+Delete → "Cached images and files"
# O abrir en modo incógnito: Ctrl+Shift+N
```

---

## 📝 Reportar Issues

### Template
```markdown
**Entorno:**
- OS: Windows 11
- Browser: Chrome 120
- Device: Desktop / Mobile

**Pasos para reproducir:**
1. Ir a /publicar
2. Seleccionar foto vertical
3. ...

**Esperado:**
Mensaje "Gira tu celular..."

**Actual:**
No rechaza la foto

**Logs:**
[pegar logs de consola]

**Screenshots:**
[adjuntar capturas]
```

---

## 🎉 Todo OK? Deploy!

```bash
# 1. Commit cambios
git add .
git commit -m "feat: FASE 1 - Mejoras de upload (validación preventiva + retry)"

# 2. Push
git push origin feature/upload-improvements-fase1

# 3. Merge a main (después de review)
git checkout main
git merge feature/upload-improvements-fase1

# 4. Deploy (según tu proceso)
# Vercel: Auto-deploy desde main
# O manual: npm run deploy
```

---

**Última actualización:** 5 de Enero 2026  
**Para más info:** Ver [TESTING_GUIDE_UPLOAD.md](./TESTING_GUIDE_UPLOAD.md)
