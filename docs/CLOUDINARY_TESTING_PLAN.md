# 🧪 PLAN DE TESTING - CLOUDINARY CON ANTI-BOT

## ✅ TESTING MANUAL - PASO A PASO

### **TEST 1: Upload Normal (Happy Path)**

1. Ir a http://localhost:5174/#/publicar-v3
2. Completar categoría y subcategoría
3. En el paso de Fotos:
   - Seleccionar 3 imágenes JPG (< 5MB cada una)
   - Verificar que muestre previews
4. Continuar y publicar aviso

**Resultado esperado:**
- ✅ Las 3 fotos se suben a Cloudinary
- ✅ URLs comienzan con `https://res.cloudinary.com/dosjgdcxr/...`
- ✅ Las imágenes se ven en el aviso publicado

---

### **TEST 2: Límite de 5 Fotos**

1. Intentar agregar 6 fotos a la vez

**Resultado esperado:**
- ✅ Solo acepta las primeras 5
- ✅ Muestra warning: "Solo puedes agregar 1 foto(s) más (máx 5 total)"

2. Ya con 5 fotos, intentar agregar más

**Resultado esperado:**
- ✅ Rechaza con mensaje: "Ya tienes 5 fotos (máximo permitido)"

---

### **TEST 3: Bloquear Videos**

1. Intentar subir un archivo `.mp4` o `.mov`

**Resultado esperado:**
- ✅ Rechazado client-side
- ✅ Mensaje: "❌ [nombre] no es una imagen. Solo se permiten fotos."

2. Intentar subir `.avi`, `.mkv`, `.wmv`

**Resultado esperado:**
- ✅ Todos bloqueados con mensaje claro

---

### **TEST 4: Formatos de Imagen Válidos**

1. Subir `.jpg` → ✅ Aceptado
2. Subir `.png` → ✅ Aceptado
3. Subir `.webp` → ✅ Aceptado
4. Subir `.heic` (iPhone) → ✅ Aceptado
5. Subir `.gif` → ❌ Rechazado (no está en whitelist)
6. Subir `.bmp` → ❌ Rechazado

---

### **TEST 5: Límite de Tamaño**

1. Subir una imagen de 2MB → ✅ OK
2. Subir una imagen de 6MB → ❌ Rechazado
   - Mensaje: "[nombre] es muy grande (máx 5MB)"

---

### **TEST 6: Rate Limiting**

**Setup:** Abrir DevTools → Network

1. Publicar aviso con 5 fotos → OK
2. Inmediatamente publicar otro aviso con 5 fotos → OK (total 10)
3. Publicar tercer aviso con 1 foto → **BLOQUEADO**

**Resultado esperado:**
- ✅ Error 429 "Too many requests"
- ✅ Mensaje: "Límite excedido. Bloqueado por 15 minutos"
- ✅ Header `X-RateLimit-Remaining: 0`

4. Esperar 5 minutos → Rate limit se resetea
5. Publicar nuevo aviso → ✅ OK

---

### **TEST 7: Honeypot Anti-Bot**

**Simular Bot (requiere dev tools):**

1. Abrir DevTools → Console
2. Ejecutar script que llena el campo honeypot:

```javascript
const formData = new FormData();
formData.append('file', new File(['test'], 'test.jpg', {type: 'image/jpeg'}));
formData.append('folder', 'ads');
formData.append('website', 'http://spam-bot.com'); // ← Honeypot

fetch('http://localhost:3000/api/uploads', {
  method: 'POST',
  body: formData
}).then(r => r.json()).then(console.log);
```

**Resultado esperado:**
- ✅ Error 400 "Invalid request"
- ✅ No revela que es honeypot (seguridad por obscuridad)

---

### **TEST 8: Validación MIME Estricta**

**Intentar burlar validación client-side:**

1. Renombrar `video.mp4` a `fake.jpg`
2. Intentar subir

**Resultado esperado:**
- ❌ Backend rechaza porque MIME type es `video/mp4`
- ✅ Error: "Tipo de archivo no permitido: video/mp4"

---

### **TEST 9: Multiple Uploads Simultáneos**

1. Abrir 3 pestañas del navegador
2. En cada una, publicar aviso con 3 fotos al mismo tiempo

**Resultado esperado:**
- ✅ Primera pestaña: OK
- ✅ Segunda pestaña: OK (si total < 10)
- ⚠️ Tercera pestaña: Puede fallar si supera rate limit

---

### **TEST 10: Edición de Aviso con Imágenes**

1. Publicar aviso con 3 fotos
2. Editar aviso:
   - Eliminar 1 foto existente
   - Agregar 2 fotos nuevas (total 4)

**Resultado esperado:**
- ✅ Fotos existentes se mantienen
- ✅ Foto eliminada no aparece
- ✅ Nuevas fotos se suben correctamente

---

## 🔧 TESTING AUTOMATIZADO (Futuro)

### **Unit Tests:**
```typescript
// rate-limiter.test.ts
describe('RateLimiter', () => {
  it('should allow 10 uploads in 5 minutes', () => {});
  it('should block after 10 uploads', () => {});
  it('should reset after 5 minutes', () => {});
  it('should handle cleanup', () => {});
});
```

### **Integration Tests:**
```typescript
// uploads.test.ts
describe('POST /api/uploads', () => {
  it('should upload valid image', () => {});
  it('should reject video file', () => {});
  it('should reject if honeypot filled', () => {});
  it('should return 429 after rate limit', () => {});
});
```

---

## 📊 MONITOREO EN PRODUCCIÓN

### **Métricas a Observar:**

1. **Cloudinary Dashboard:**
   - Storage usado (GB)
   - Transformations / mes
   - Bandwidth consumido
   - Credits restantes

2. **Backend Logs:**
   - Uploads exitosos vs fallidos
   - Rate limit hits / hora
   - Bots detectados (honeypot)
   - Tipos MIME bloqueados

3. **User Metrics:**
   - % de usuarios que suben exactamente 5 fotos
   - % que intentan subir videos
   - Tiempo promedio de upload

---

## ✅ CHECKLIST PRE-DEPLOYMENT

- [ ] Variables de entorno en producción:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- [ ] Upload preset configurado en Cloudinary
- [ ] Rate limiting configurado (valores finales)
- [ ] Logs estructurados para monitoreo
- [ ] Alertas configuradas (>100 rate limits/hora)
- [ ] Documentación actualizada
- [ ] Testing manual completado
- [ ] Rollback plan documentado

---

## 🚨 TROUBLESHOOTING

### **Problema:** "Upload failed" genérico
**Solución:** Verificar logs del backend, revisar Cloudinary Dashboard

### **Problema:** Rate limit muy agresivo
**Solución:** Ajustar `LIMIT_PER_WINDOW` en `rate-limiter.ts`

### **Problema:** Usuarios legítimos bloqueados
**Solución:** Implementar whitelist de IPs confiables

### **Problema:** Cloudinary credits se agotan
**Solución:** 
1. Verificar compresión client-side funciona
2. Revisar si hay bots haciendo uploads masivos
3. Considerar plan superior de Cloudinary

---

**Próximo paso:** Ejecutar tests 1-10 manualmente y documentar resultados.
