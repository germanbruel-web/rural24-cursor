# 🧪 Guía de Pruebas - Sistema Unificado de Destacados

## ✅ Servidores Iniciados

- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173

---

## 📋 Cómo Probar

### Opción 1: Navegación Normal (Recomendado)

1. **Abre la consola del navegador** (F12 → Console)

2. **Navega por el sitio normalmente:**
   - Página de inicio (Homepage)
   - Resultados de búsqueda por categoría
   - Detalle de algún aviso

3. **Observa los logs en la consola:**
   ```
   [Featured Homepage] Total: 13 | Usuario: 3 | Admin: 10
   [Featured Results] Total: 9 | Usuario: 5 | Admin: 4
   ```

### Opción 2: Script de Prueba Manual

1. **Abre la consola del navegador** (F12 → Console)

2. **Copia y pega el contenido de:**
   ```
   test-featured-unificado.js
   ```

3. **Presiona Enter** - El script probará automáticamente:
   - Llamar a las funciones RPC
   - Mostrar distribución Usuario/Admin
   - Verificar priorización

---

## 🔍 Qué Verificar

### 1. Logs de Debugging ✅

Deberías ver en la consola:
```
[Featured Homepage] Total: 13 | Usuario: 3 | Admin: 10
```

**Interpretación:**
- `Total: 13` → Total de destacados retornados
- `Usuario: 3` → Destacados pagados por usuarios (prioridad 1)
- `Admin: 10` → Destacados manuales de SuperAdmin (prioridad 2)

### 2. Priorización ✅

Los destacados deben aparecer en este orden:
1. **Primero:** Usuarios que pagaron (1 por usuario, FIFO)
2. **Después:** SuperAdmin manual (para rellenar hasta límite)

### 3. Límites por Placement ✅

- **Homepage:** Máximo 10 destacados
- **Results:** Máximo 4 destacados
- **Detail:** Máximo 6 destacados

---

## 🎯 Panel Admin

### Activación Manual (SuperAdmin)

1. **Ve al panel admin:** http://localhost:5173/admin

2. **Ir a "Featured Ads" → "Manual Activation"**

3. **Activar un aviso manualmente:**
   - Buscar aviso
   - Seleccionar placement
   - Elegir duración
   - Click "Activar"

4. **Verificar en base de datos:**
   ```sql
   SELECT * FROM featured_ads WHERE is_manual = true ORDER BY created_at DESC LIMIT 5;
   ```

### Vista Grid

En el grid de featured ads, podrás ver:
- ❓ Columna `is_manual` (true/false)
- 👤 Columna `manual_activated_by` (ID del superadmin)
- 📧 `manual_activator_email` (email del admin que activó)

---

## 🐛 Debugging Avanzado

### Ver estado de una categoría específica

```javascript
const categoryId = 'TU_CATEGORIA_UUID';
const { data, error } = await supabase.rpc('get_featured_for_homepage', {
  p_category_id: categoryId,
  p_limit: 10
});

console.table(data.map(f => ({
  Priority: f.priority,
  IsManual: f.is_manual,
  FeaturedId: f.featured_id,
  AdId: f.ad_id
})));
```

### Verificar función de cleanup

```javascript
const { data, error } = await supabase.rpc('activate_pending_featured_ads');
console.log('Activados:', data);
```

---

## ✅ Checklist de Validación

- [ ] Frontend carga correctamente
- [ ] Backend responde en puerto 3001
- [ ] Logs de debugging aparecen en consola
- [ ] Destacados se muestran en homepage
- [ ] Priorización es correcta (usuarios primero)
- [ ] Panel admin permite activación manual
- [ ] `is_manual` se guarda correctamente

---

## 🔄 Reiniciar Servidores

Si necesitas reiniciar:

```powershell
# Detener procesos
.\cleanup-processes.ps1

# Iniciar de nuevo
cd backend
npm run dev

# En otra terminal
cd frontend
npm run dev
```

---

## 📞 Soporte

Si algo no funciona:
1. Verifica que la migración 048 se ejecutó correctamente
2. Revisa logs del backend en la terminal
3. Revisa logs del frontend en la consola del navegador
4. Verifica que `NODE_ENV` sea "development" para ver logs

**¡Todo listo para probar!** 🚀
