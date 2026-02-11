# 🚀 Deploy: Sistema Unificado de Destacados
**Fecha:** 11 de Febrero 2026  
**Commit:** `feat: Sistema unificado de destacados - Usuarios y SuperAdmin`

---

## ✅ Pre-Deploy Checklist

- [x] ✅ Código pusheado a GitHub
- [x] ✅ Migración 048 incluida en `/database/migrations/`
- [x] ✅ Servicios frontend actualizados
- [x] ✅ Tipos TypeScript actualizados
- [ ] ⏳ Ejecutar migración 048 en Supabase
- [ ] ⏳ Verificar en producción
- [ ] ⏳ Deploy en Render

---

## 📋 PASO 1: Ejecutar Migración en Supabase (CRÍTICO)

### Opción A: SQL Editor

1. **Ve a:** https://supabase.com/dashboard/project/lmkuecdvxtenrikjomol/sql/new

2. **Copia y pega:** Contenido de `database/migrations/048_unify_featured_system_FINAL.sql`

3. **Ejecuta** y verifica:
   ```sql
   -- Debe mostrar: NOTICE: Columna is_manual agregada a featured_ads
   -- Y: NOTICE: ✅ Migración 048: Sistema Unificado completado
   ```

4. **Verificación:**
   ```sql
   -- Ver columna agregada
   SELECT column_name, data_type, column_default
   FROM information_schema.columns 
   WHERE table_name = 'featured_ads' AND column_name = 'is_manual';
   
   -- Ver funciones actualizadas
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name LIKE 'get_featured_for_%';
   ```

### Opción B: CLI (Alternativo)

```bash
# Conectar a Supabase
supabase link --project-ref lmkuecdvxtenrikjomol

# Ejecutar migración
supabase db push
```

---

## 🔧 PASO 2: Deploy en Render

### 2.1 Backend (Automático)

Render detectará el push y desplegará automáticamente:

1. **Dashboard:** https://dashboard.render.com/web/srv-cujr7mtds78s73c26vb0
2. **Esperar build ~3-5 min**
3. **Verificar logs:** Que no haya errores

**URL Backend:** https://rural24-backend.onrender.com

### 2.2 Frontend (Automático)

1. **Dashboard:** https://dashboard.render.com (tu static site)
2. **Esperar build ~2-3 min**
3. **Verificar:** Que compile sin errores

**URL Frontend:** https://rural24.onrender.com

---

## ✅ PASO 3: Verificación Post-Deploy

### 3.1 Verificar Migración en Producción

```sql
-- Ejecutar en Supabase SQL Editor (Producción)
SELECT 
  placement,
  CASE WHEN is_manual THEN 'SuperAdmin' ELSE 'Usuario Pago' END as origen,
  status,
  COUNT(*) as cantidad
FROM featured_ads
GROUP BY placement, is_manual, status
ORDER BY placement, is_manual, status;
```

**Resultado esperado:**
| placement | origen       | status | cantidad |
|-----------|--------------|--------|----------|
| detail    | Usuario Pago | active | 3        |
| homepage  | Usuario Pago | active | 3        |
| homepage  | SuperAdmin   | active | 10       |
| results   | Usuario Pago | active | 5        |
| results   | SuperAdmin   | active | 4        |

### 3.2 Probar Funciones RPC

```sql
-- Probar con una categoría real
SELECT * FROM get_featured_for_homepage(
  '550e8400-e29b-41d4-a716-446655440000'::UUID, -- Reemplazar con ID real
  10
);
```

Debe retornar:
- Columna `is_manual` (boolean)
- Columna `priority` (1 o 2)
- Usuarios primero (priority=1), luego SuperAdmin (priority=2)

### 3.3 Verificar Frontend

1. **Abrir:** https://rural24.onrender.com
2. **Consola del navegador (F12):**
   - NO deberías ver logs de debugging (solo en development)
3. **Verificar destacados:**
   - Deben aparecer en homepage
   - Deben aparecer en resultados de búsqueda
   - Priorización correcta (usuarios antes que admin)

### 3.4 Panel Admin

1. **Login como SuperAdmin:** https://rural24.onrender.com/admin
2. **Ir a Featured Ads → Manual Activation**
3. **Activar un aviso manualmente**
4. **Verificar que `is_manual = true` en base de datos**

---

## 🐛 Troubleshooting

### Error: "función get_featured_for_homepage no existe"
**Causa:** Migración 048 no se ejecutó  
**Solución:** Ejecutar SQL en Supabase (Paso 1)

### Error: "columna is_manual no existe"
**Causa:** Migración 048 parcialmente ejecutada  
**Solución:** Ejecutar manualmente:
```sql
ALTER TABLE featured_ads ADD COLUMN is_manual BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX idx_featured_ads_is_manual ON featured_ads(is_manual) WHERE is_manual = true;
```

### Featured ads no aparecen
**Verificar:**
1. Estado en BD: `SELECT * FROM featured_ads WHERE status = 'active'`
2. Fechas de expiración: `SELECT * FROM featured_ads WHERE expires_at < NOW()`
3. Ejecutar cleanup: `SELECT * FROM activate_pending_featured_ads()`

### Build falla en Render
**Verificar:**
1. Logs del build en Render
2. Que todas las dependencias estén en package.json
3. Variables de entorno configuradas

---

## 📊 Métricas a Monitorear

Después del deploy, revisar:

### Supabase Dashboard
- Query performance de `get_featured_for_*`
- Uso de índice `idx_featured_ads_is_manual`

### Render Dashboard
- Response time del backend
- Error rate
- Build duration

---

## 🔄 Rollback (Si es necesario)

Si algo sale mal:

### 1. Rollback Git
```bash
git revert HEAD
git push origin main
```

### 2. Rollback Migración
```sql
-- SOLO SI ES CRÍTICO
ALTER TABLE featured_ads DROP COLUMN IF EXISTS is_manual;
DROP INDEX IF EXISTS idx_featured_ads_is_manual;

-- Restaurar funciones anteriores (desde backup)
-- VER: database/migrations/047_*.sql
```

### 3. Render Deploy Manual
En Render Dashboard:
- Ir al servicio
- "Manual Deploy" → Seleccionar commit anterior

---

## ✅ Confirmación Final

Después del deploy, confirmar:

- [ ] ✅ Migración 048 ejecutada sin errores
- [ ] ✅ Backend desplegado correctamente
- [ ] ✅ Frontend desplegado correctamente
- [ ] ✅ Destacados se muestran en producción
- [ ] ✅ Panel admin funciona (activación manual)
- [ ] ✅ Sin errores en logs de Render
- [ ] ✅ Sin errores en Supabase logs

---

## 📞 Contacto

**Documentación adicional:**
- [RESUMEN_SISTEMA_UNIFICADO_FEATURED.md](RESUMEN_SISTEMA_UNIFICADO_FEATURED.md) - Arquitectura técnica
- [GUIA_PRUEBAS_FEATURED.md](GUIA_PRUEBAS_FEATURED.md) - Testing local
- [DEPLOY_RENDER_GUIDE.md](DEPLOY_RENDER_GUIDE.md) - Guía completa de deploy

---

## 🎯 Siguiente Deploy

Para futuros deploys del sistema de destacados:
1. Seguir este mismo proceso
2. Siempre ejecutar migraciones antes del deploy
3. Verificar funciones RPC actualizadas
4. Monitorear logs post-deploy

**¡Deploy listo!** 🚀
