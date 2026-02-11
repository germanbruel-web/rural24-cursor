# 🚀 INSTRUCCIONES: Ejecutar Sistema de Créditos
**Fecha:** 11 de Febrero de 2026  
**Objetivo:** Activar sistema de créditos y anuncios destacados en producción  

---

## ✅ ESTADO ACTUAL

**Commit aplicado:** `095bdd1`  
**Deployed:** Render auto-deploy en progreso (5-10 min)  
**Fix aplicado:** ✅ Autenticación Bearer en panel de usuarios

---

## 🔥 PASO CRÍTICO: Ejecutar Migración de Créditos

### **Opción A: Supabase Dashboard (RECOMENDADO)**

1. **Ir a Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/[TU_PROJECT_ID]
   ```

2. **Abrir SQL Editor**
   ```
   Sidebar → SQL Editor → New Query
   ```

3. **Backup preventivo (opcional pero recomendado)**
   ```sql
   -- Ejecutar PRIMERO para backup
   CREATE TABLE IF NOT EXISTS subscription_plans_backup_20260211 AS
   SELECT * FROM subscription_plans;
   
   -- Verificar backup creado
   SELECT COUNT(*) FROM subscription_plans_backup_20260211;
   ```

4. **Copiar migración completa**
   - Abrir archivo local: `database/migrations/044_credits_system_ADAPTED.sql`
   - Copiar TODO el contenido (607 líneas)
   - Pegar en SQL Editor de Supabase

5. **Ejecutar migración**
   ```
   Click: "Run" (Ctrl+Enter)
   Esperar: 10-20 segundos
   ```

6. **Verificar resultado**
   ```sql
   -- 1. Verificar tablas creadas
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('global_config', 'user_credits', 'credit_transactions', 'featured_ads');
   -- Debe retornar 4 filas
   
   -- 2. Verificar configuración inicial
   SELECT key, value, category 
   FROM global_config 
   WHERE category IN ('credits', 'featured', 'promo')
   ORDER BY category, key;
   -- Debe retornar 5 filas
   
   -- 3. Verificar columnas en subscription_plans
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'subscription_plans' 
   AND column_name IN ('slug', 'monthly_free_credits', 'monthly_credits_expire_days');
   -- Debe retornar 3 filas
   
   -- 4. Verificar funciones RPC creadas
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND (routine_name LIKE '%credit%' OR routine_name LIKE '%featured%')
   ORDER BY routine_name;
   -- Debe retornar ~10 funciones
   ```

---

### **Opción B: psql CLI (si tienes configurado)**

```powershell
# 1. Obtener DATABASE_URL de Render Environment Variables
$env:DATABASE_URL = "postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"

# 2. Backup preventivo
psql $env:DATABASE_URL -c "CREATE TABLE subscription_plans_backup_20260211 AS SELECT * FROM subscription_plans;"

# 3. Ejecutar migración
psql $env:DATABASE_URL -f database/migrations/044_credits_system_ADAPTED.sql

# 4. Verificar
psql $env:DATABASE_URL -c "SELECT COUNT(*) FROM global_config WHERE category IN ('credits', 'featured', 'promo');"
# Debe retornar: count = 5
```

---

## 🧪 PRUEBAS DESPUÉS DE MIGRACIÓN

### **Prueba 1: Panel de Usuarios (SuperAdmin)**

1. Ir a: https://rural24-1.onrender.com/#/dashboard
2. Login como superadmin
3. Ir a: **Dashboard → Admin → Usuarios**
4. **DEBE cargar lista de usuarios SIN error**
5. Verificar conteo de avisos por usuario
6. Probar cambiar rol de un usuario de prueba

**Resultado esperado:**
```
✅ Lista de usuarios carga correctamente
✅ Muestra: email, nombre, rol, avisos, fecha registro
✅ Cambiar rol funciona sin errores
```

---

### **Prueba 2: Sistema de Créditos (Usuario)**

1. Login como usuario regular (no superadmin)
2. Ir a: **Dashboard → Mis avisos**
3. Si tienes un anuncio, click "Destacar"
4. **DEBE abrir modal de créditos**
5. Verificar muestra: "0 créditos disponibles"
6. Verificar opciones: 7/14/21/28 días con precios

**Resultado esperado:**
```
✅ Modal de créditos se abre
✅ Muestra balance actual (0 créditos para nuevo usuario)
✅ Muestra 4 duraciones con créditos requeridos
✅ Botón "Comprar créditos" visible (amarillo)
```

---

### **Prueba 3: Otorgar créditos de prueba**

Ejecutar en Supabase SQL Editor:

```sql
-- 1. Obtener tu user_id
SELECT id, email FROM users WHERE email = 'tu_email@example.com';
-- Copiar el UUID de id

-- 2. Otorgar 10 créditos de prueba
INSERT INTO user_credits (user_id, balance)
VALUES ('TU_USER_ID_AQUI', 10)
ON CONFLICT (user_id) 
DO UPDATE SET balance = user_credits.balance + 10;

-- 3. Registrar transacción
INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
VALUES (
  'TU_USER_ID_AQUI',
  'promo_grant',
  10,
  10,
  'Créditos de prueba manual'
);

-- 4. Verificar
SELECT * FROM user_credits WHERE user_id = 'TU_USER_ID_AQUI';
```

**Luego en el frontend:**
1. Refrescar Dashboard
2. Ver balance actualizado: "10 créditos disponibles"
3. Click "Destacar" en un anuncio
4. Seleccionar "7 días (1 crédito)"
5. Click "Destacar ahora"
6. **DEBE ejecutar exitosamente**

**Resultado esperado:**
```
✅ Balance actualiza: 10 → 9 créditos
✅ Anuncio muestra badge "Destacado"
✅ Toast de éxito: "Anuncio destacado por 7 días"
✅ En búsqueda, anuncio aparece PRIMERO
```

---

### **Prueba 4: Panel Config SuperAdmin (Beta)**

1. Login como superadmin
2. Ir a: **Dashboard → Admin → Configuración Créditos**
3. Ver precio base actual: $2500
4. Ver duraciones disponibles
5. Ver config de promo signup

**Resultado esperado:**
```
✅ Panel carga sin errores
✅ Muestra configuración de global_config
✅ Formulario editable (BETA - pendiente implementar guardado)
```

---

## 🐛 TROUBLESHOOTING

### **Error: "relation 'global_config' does not exist"**
**Solución:** La migración no se ejecutó. Volver a ejecutar paso de migración.

### **Error: "column 'monthly_free_credits' does not exist"**
**Solución:** Migración parcial. Ejecutar completa nuevamente (es safe, usa IF NOT EXISTS).

### **Error: "function activate_featured_with_credits does not exist"**
**Solución:** Funciones RPC no creadas. Ejecutar migración completa.

### **Panel de usuarios sigue sin cargar**
**Posibles causas:**
1. Render no terminó deploy → Esperar 5 min más
2. Cache del navegador → Hard refresh (Ctrl+Shift+R)
3. Token expirado → Logout + Login nuevamente
4. Backend caído → Verificar Render Dashboard logs

**Verificar backend:**
```
https://rural24.onrender.com/api/health
Debe retornar: 200 OK
```

---

## 📊 MONITOREO POST-DEPLOY

### **Dashboard Render**

1. Ir a: https://dashboard.render.com/
2. Seleccionar servicio: `rural24` (backend)
3. Ver logs en tiempo real:
   ```
   Click: "Logs" tab
   Buscar: "📥 Cargando usuarios desde API backend"
   Buscar: "✅ X usuarios cargados"
   ```

4. Verificar sin errores de autenticación:
   ```
   ❌ NO debe aparecer: "No autenticado"
   ❌ NO debe aparecer: "Bearer token required"
   ```

### **Supabase Dashboard**

1. Ir a: Database → Tables
2. Verificar tablas creadas:
   - `global_config` ✅
   - `user_credits` ✅
   - `credit_transactions` ✅
   - `featured_ads` ✅

3. Ver datos iniciales:
   ```sql
   SELECT * FROM global_config LIMIT 10;
   -- Debe mostrar configuración de créditos
   ```

---

## ✅ CHECKLIST FINAL

Marcar después de completar cada paso:

- [ ] **1. Backup de subscription_plans ejecutado**
- [ ] **2. Migración 044_credits_system_ADAPTED.sql ejecutada**
- [ ] **3. Verificación SQL: 4 tablas + 5 configs + 3 columnas + 10 funciones**
- [ ] **4. Render deploy completado (verde en dashboard)**
- [ ] **5. Panel de usuarios carga correctamente**
- [ ] **6. Modal de créditos se abre en "Destacar"**
- [ ] **7. Créditos de prueba otorgados y verificados**
- [ ] **8. Anuncio destacado exitosamente (prueba E2E)**
- [ ] **9. Badge "Destacado" visible en búsqueda**
- [ ] **10. No hay errores en Render logs**

---

## 🎯 PRÓXIMOS PASOS (Después de validación)

1. **Integración Mercado Pago**
   - Crear cuenta Mercado Pago
   - Configurar API keys en Render env vars
   - Implementar webhook de notificaciones

2. **Panel de Configuración**
   - Implementar guardado de global_config
   - Validaciones de formulario
   - Histórico de cambios de config

3. **Emails automáticos**
   - Email: "¡Tu anuncio está destacado!"
   - Email: "Tu anuncio destacado expira en 2 días"
   - Email: "Recibiste 3 créditos de bienvenida"

4. **Dashboard de estadísticas**
   - Total créditos comprados (revenue)
   - Anuncios destacados activos
   - Conversión signup → compra

---

## 📞 SOPORTE

**Si tienes errores durante la migración:**

1. Revisar logs de Supabase SQL Editor
2. Verificar mensajes de error específicos
3. Consultar documento: `DIAGNOSTICO_SISTEMA_11_FEB_2026.md`
4. Rollback si es necesario:
   ```sql
   -- Solo si hay problemas críticos
   DROP TABLE IF EXISTS featured_ads CASCADE;
   DROP TABLE IF EXISTS credit_transactions CASCADE;
   DROP TABLE IF EXISTS user_credits CASCADE;
   DROP TABLE IF EXISTS global_config CASCADE;
   
   -- Restaurar backup
   DROP TABLE subscription_plans;
   ALTER TABLE subscription_plans_backup_20260211 RENAME TO subscription_plans;
   ```

---

**Última actualización:** 11 de Febrero de 2026, 15:30 ART  
**Estado:** ✅ Fix de autenticación deployed - Pendiente ejecutar migración SQL  
**Deploy commit:** `095bdd1`
