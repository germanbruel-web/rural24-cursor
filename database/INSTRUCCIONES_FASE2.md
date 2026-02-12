# FASE 2: SuperAdmin Sin Créditos - Instrucciones de Aplicación

**Fecha:** 12 Febrero 2026  
**Archivo SQL:** `20260212_superadmin_featured_sin_creditos.sql`

---

## 🎯 Objetivo

Permitir que SuperAdmin destaque avisos **sin consumir créditos ni afectar facturación**.

---

## 📋 Cambios Implementados

### 1. `create_featured_ad()` - **MODIFICADA**

**Lógica agregada:**
```sql
-- 0. Verifica si user_id tiene role = 'superadmin'
-- 2. Si es SuperAdmin → SKIP validación de créditos
-- 7. Si es SuperAdmin → NO consume crédito (credit_consumed = FALSE)
-- 8. Mensaje personalizado: "SuperAdmin: Aviso programado sin consumir créditos"
```

**Beneficios:**
- ✅ SuperAdmin puede destacar cualquier aviso (no solo los suyos)
- ✅ NO descuenta de `user_featured_credits.credits_used`
- ✅ Marca `featured_ads.credit_consumed = FALSE` para tracking
- ✅ Usuarios normales siguen funcionando igual

---

### 2. `admin_cancel_featured_ad()` - **MODIFICADA**

**Lógica agregada:**
```sql
-- Verifica credit_consumed = TRUE antes de reembolsar
-- Si fue creado por SuperAdmin (credit_consumed = FALSE):
--   → NO reembolsa aunque p_refund = TRUE
--   → Retorna mensaje: "creado por SuperAdmin sin consumir créditos"
```

**Beneficios:**
- ✅ NO se reembolsan créditos que nunca se consumieron
- ✅ Auditoría clara con metadata.was_superadmin_created
- ✅ Evita balance de créditos incorrecto

---

## 🚀 Cómo Aplicar

### Opción A: Supabase Dashboard (Recomendado)

1. Abrir **Supabase Dashboard** → **SQL Editor**
2. Copiar contenido de `20260212_superadmin_featured_sin_creditos.sql`
3. Ejecutar (Run)
4. Verificar: Should see "Success. No rows returned"

### Opción B: psql CLI

```bash
psql -h <host> -U postgres -d <database> -f 20260212_superadmin_featured_sin_creditos.sql
```

---

## ✅ Testing Checklist

### Test 1: SuperAdmin Destaca Aviso
```sql
-- Como SuperAdmin (reemplazar UUIDs reales):
SELECT * FROM create_featured_ad(
  '<ad_id>',
  '<superadmin_user_id>',
  'homepage',
  CURRENT_DATE
);

-- Verificar:
-- success = TRUE
-- error_message = "SuperAdmin: Aviso programado sin consumir créditos"

-- Check featured_ads:
SELECT credit_consumed FROM featured_ads WHERE id = '<featured_id>';
-- Debe ser: FALSE
```

### Test 2: Usuario Normal Destaca Aviso
```sql
-- Como Usuario Normal:
SELECT * FROM create_featured_ad(
  '<ad_id>',
  '<user_id>',
  'results',
  CURRENT_DATE
);

-- Verificar:
-- success = TRUE si tiene créditos
-- success = FALSE si no tiene créditos
-- credit_consumed = TRUE si success
```

### Test 3: Cancelar Destacado de SuperAdmin
```sql
-- Cancelar con refund=TRUE:
SELECT * FROM admin_cancel_featured_ad(
  '<featured_id_created_by_superadmin>',
  '<admin_id>',
  'Test',
  TRUE
);

-- Verificar:
-- refunded = FALSE (no reembolsa)
-- message = "creado por SuperAdmin sin consumir créditos"
```

### Test 4: Cancelar Destacado de Usuario
```sql
-- Cancelar con refund=TRUE:
SELECT * FROM admin_cancel_featured_ad(
  '<featured_id_created_by_user>',
  '<admin_id>',
  'Test',
  TRUE
);

-- Verificar:
-- refunded = TRUE
-- refund_amount = 1-4 (según duration_days)
-- user_balance aumentó
```

---

## 📊 Impacto en Base de Datos

| Tabla | Campo | Cambio |
|-------|-------|--------|
| `featured_ads` | `credit_consumed` | SuperAdmin → FALSE, Usuario → TRUE |
| `user_featured_credits` | `credits_used` | SuperAdmin NO incrementa |
| `featured_ads_audit` | `metadata` | Incluye `was_superadmin_created` |

---

## 🔒 Seguridad

- ✅ Funciones usan `SECURITY DEFINER` (ejecutan con permisos del owner)
- ✅ Verificación de rol en cada operación sensible
- ✅ Auditoría completa en `featured_ads_audit`

---

## 📝 Notas

- **Retrocompatibilidad:** Usuarios normales NO afectados
- **Featured ads existentes:** Sin cambios (mantienen credit_consumed actual)
- **Frontend:** No requiere cambios por esta fase (Fase 3 agregará UI)

---

## ❓ Troubleshooting

### Error: "function does not exist"
**Causa:** DROP no funcionó correctamente  
**Fix:** Ejecutar DROP manual:
```sql
DROP FUNCTION IF EXISTS public.create_featured_ad(uuid, uuid, varchar, date);
DROP FUNCTION IF EXISTS public.admin_cancel_featured_ad(uuid, uuid, text, boolean);
```

### Error: "column credit_consumed does not exist"
**Causa:** Schema desactualizado  
**Fix:** Verificar que tabla `featured_ads` tenga columna:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'featured_ads' AND column_name = 'credit_consumed';
```

---

## 🎉 Próximos Pasos

**FASE 3:** Frontend - Botón "+ Destacar Nuevo Aviso" en SuperAdminFeaturedPanel
