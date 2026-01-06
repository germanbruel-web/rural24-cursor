# 🚨 RLS DEBUG MODE - Instrucciones

## Estado Actual
- ⚠️ **RLS está DESHABILITADO temporalmente en tabla `ads`**
- 🎯 **Propósito:** Ver todos los avisos sin restricciones para debugging
- ⏰ **Duración:** Solo durante desarrollo/testing

---

## 📋 Pasos para Ejecutar

### 1. Abrir Supabase SQL Editor

1. Ir a: https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Click en **SQL Editor** (menú lateral izquierdo)

### 2. Ejecutar Script

Copiar y pegar el contenido de `DEBUG_DISABLE_RLS.sql`:

```sql
-- Ver estado actual
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'ads';

-- Deshabilitar RLS
ALTER TABLE public.ads DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT id, title, user_id FROM ads LIMIT 5;
```

### 3. Verificar en Frontend

1. Recargar la página del Dashboard (F5)
2. Ir a **Mis Avisos** o **Avisos** (admin)
3. Deberías ver TODOS los avisos en la base de datos

---

## ✅ RE-HABILITAR RLS (IMPORTANTE)

**Antes de commit/deploy, ejecutar:**

```sql
-- Re-habilitar seguridad
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'ads';
-- Resultado esperado: rls_enabled = true
```

---

## 🔍 Diagnóstico Completo

### Problema Original
- Avisos existen en DB pero no se muestran en frontend
- **Root cause:** Usuario `fadd0359-ae43-4cad-9612-cbd639583196` no existe en tabla `users`
- RLS policy `ads_select_own` requiere `auth.uid() = user_id`
- Query falla porque no hay match

### Soluciones Permanentes (elegir una)

#### Opción A: Crear usuario faltante
```sql
-- Ver archivo: FIX_ORPHAN_ADS.sql
INSERT INTO public.users (id, email, role, full_name)
VALUES (
  'fadd0359-ae43-4cad-9612-cbd639583196',
  'admin@rural24.com',
  'superadmin',
  'Admin Principal'
);
```

#### Opción B: Reasignar avisos a tu usuario
```sql
-- Primero obtener tu user_id actual
SELECT id, email FROM users WHERE email = 'TU_EMAIL@example.com';

-- Luego reasignar
UPDATE ads
SET user_id = 'TU_USER_ID_AQUI'
WHERE user_id = 'fadd0359-ae43-4cad-9612-cbd639583196';
```

#### Opción C: Modificar RLS policy (más flexible)
```sql
-- Permitir que SuperAdmin vea todos los avisos
CREATE POLICY ads_select_superadmin ON public.ads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );
```

---

## 📊 Arquitectura de Seguridad (Producción)

```
Usuario Autenticado
    ↓
Supabase Auth (JWT)
    ↓
RLS Policies (PostgreSQL)
    ├─ ads_select_active: Todos ven avisos activos
    ├─ ads_select_own: Usuario ve sus propios avisos
    └─ ads_select_superadmin: SuperAdmin ve todo
    ↓
Tabla ads (filtrada por permisos)
```

---

## ⚡ Quick Commands

```bash
# Ver avisos huérfanos
SELECT a.id, a.title, a.user_id, u.email
FROM ads a
LEFT JOIN users u ON a.user_id = u.id
WHERE u.id IS NULL;

# Ver usuarios SuperAdmin
SELECT id, email, role, full_name
FROM users
WHERE role = 'superadmin';

# Contar avisos por usuario
SELECT user_id, COUNT(*) as total_ads
FROM ads
GROUP BY user_id
ORDER BY total_ads DESC;
```

---

## 🛡️ Checklist Seguridad

Antes de ir a producción:

- [ ] RLS re-habilitado en tabla `ads`
- [ ] Todos los avisos tienen `user_id` válido
- [ ] Policies probadas para cada rol (free, premium, superadmin)
- [ ] Warning removido de `adsService.ts`
- [ ] Tests de permisos ejecutados

---

**Última actualización:** 2026-01-06  
**Autor:** Arquitectura Rural24  
**Estado:** 🚨 DEBUG MODE ACTIVO
