/**
 * CÓMO EJECUTAR LA MIGRACIÓN - GUÍA PASO A PASO
 * 
 * El error que recibiste indica que `membership_plans` no existe.
 * Sigue estos pasos para ejecutar correctamente.
 */

# 🔧 GUÍA: Ejecutar Migración de Créditos

## PASO 1️⃣ - Verificar Schema (IMPORTANTE)

**Antes de correr la migración principal**, ejecuta este query en Supabase:

```bash
📄 Archivo: database/VERIFICAR_SCHEMA.sql
```

Copia TODO el contenido y ve a:
1. Supabase Dashboard → Tu Proyecto
2. **SQL Editor** (o Query)
3. Pega el contenido y RUN

**¿Qué buscamos?**
- ✅ `users` → DEBE existir
- ✅ `ads` → DEBE existir  
- ❌ `membership_plans` → Puede NO existir
- ❌ `featured_ads` → Puede NO existir
- ❌ `categories` → Puede NO existir
- ❌ `subcategories` → Puede NO existir

**Si ves:**
```
users         | true
ads           | true
categories    | true
subcategories | true
membership_plans | FALSE  ← Problema aquí
featured_ads  | FALSE
```

Entonces necesitas CREAR `membership_plans` primero.

---

## PASO 2️⃣ - Crear Tablas Base (SI FALTAN)

Si alguna tabla base NO existe, crea estas PRIMERO:

### Si falta `categories`:
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Si falta `subcategories`:
```sql
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id),
  slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Si falta `membership_plans`:
```sql
CREATE TABLE membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  monthly_free_credits INT DEFAULT 0,
  monthly_credits_expire_days INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar algunos planes por defecto
INSERT INTO membership_plans (name, slug, price, is_active, monthly_free_credits) VALUES
  ('Free', 'free', 0, true, 0),
  ('Basic', 'basic', 29.99, true, 1),
  ('Professional', 'professional', 99.99, true, 3),
  ('Business', 'business', 299.99, true, 999)
ON CONFLICT DO NOTHING;
```

---

## PASO 3️⃣ - Ejecutar Migración Principal

Una vez que verificaste todas las tablas base existen:

```bash
📄 Archivo: database/migrations/044_credits_system.sql
```

1. Abre el archivo (ya actualizado con validaciones)
2. Copia TODO el contenido
3. Ve a Supabase → SQL Editor
4. Pega y RUN
5. Espera a que termine (sin errores)

**Qué creará:**
- ✅ `global_config` (nueva)
- ✅ `user_credits` (nueva)
- ✅ `credit_transactions` (nueva)
- ✅ `featured_ads` (crea si no existe, o actualiza)
- ✅ 10 Funciones RPC para créditos

---

## PASO 4️⃣ - Verificar Ejecución

Después de correr la migración, verifica:

```sql
-- Ver tablas nuevas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('global_config', 'user_credits', 'credit_transactions', 'featured_ads')
ORDER BY table_name;

-- Ver funciones RPC creadas
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%credit%'
ORDER BY routine_name;

-- Ver configuración inicial
SELECT key, value FROM global_config;
```

---

## ⚠️ SI ALGO FALLA

### Error: "Relation 'X' does not exist"
→ Significa que una tabla base no existe. Crea según PASO 2

### Error: "Column 'X' already exists"
→ Normal, la migración tiene `IF NOT EXISTS`. Ignora o corre sin error.

### Error: "Function 'X' already exists"
→ Normal, la migración detecta. Corre `DROP FUNCTION IF EXISTS` primero si necesita.

---

## 📋 CHECKLIST FINAL

```
☐ Ejecuté VERIFICAR_SCHEMA.sql
☐ Todas las tablas base existen (users, ads, categories, subcategories, membership_plans)
☐ Creé las tablas faltantes (si hubo)
☐ Ejecuté 044_credits_system.sql completo
☐ Sin errores
☐ Verifiqué tablas nuevas existen
☐ Verifiqué funciones RPC existen
☐ Ver global_config tiene 5 registros
```

---

## 🚀 SIGUIENTE

Una vez ejecutada la migración:

1. Los componentes React ya están listos (`UserCreditsPanel.tsx`, etc)
2. El servicio `creditsService.ts` ya está configurado
3. Solo falta integrar en tu app

Ver: [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md)

---

## 💬 EJEMPLO PASOS RÁPIDOS

```bash
# 1. Verificar
🔍 Run: VERIFICAR_SCHEMA.sql

# 2. Resultado esperado:
# users: true
# ads: true
# membership_plans: false ← CREAR
# featured_ads: false ← SE CREA EN MIGRACIÓN

# 3. Crear membership_plans (copiar SQL de arriba)

# 4. Migración principal
🚀 Run: 044_credits_system.sql

# 5. Verificar
✅ SELECT * FROM global_config; -- debe retornar 5 filas

LISTO ✨
```

---

**Versión:** 1.0  
**Fecha:** Feb 2026
