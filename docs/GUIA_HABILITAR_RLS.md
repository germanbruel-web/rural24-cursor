# ✅ GUÍA RÁPIDA: Habilitar RLS en Supabase

## 🎯 Objetivo
Habilitar Row Level Security (RLS) en todas las tablas críticas del proyecto Rural24.

---

## ⚠️ IMPORTANTE
Este proceso **NO puede ser automatizado** completamente porque Supabase requiere acceso manual al SQL Editor.

---

## 📋 PASOS A SEGUIR

### 1️⃣ Ejecutar script de guía
```powershell
.\scripts\enable-rls-guide.ps1
```

### 2️⃣ Abrir Supabase Dashboard
1. Ve a: https://supabase.com/dashboard
2. Inicia sesión con tus credenciales
3. Selecciona el proyecto **Rural24**

### 3️⃣ Navegar al SQL Editor
1. En el menú lateral izquierdo, click en **"SQL Editor"**
2. Click en **"New query"** (botón verde)

### 4️⃣ Copiar el SQL
1. Abre el archivo: `database/ENABLE_RLS_CORRECTLY.sql`
2. Selecciona TODO el contenido (Ctrl+A)
3. Copia (Ctrl+C)

### 5️⃣ Ejecutar en Supabase
1. Pega el SQL en el editor de Supabase (Ctrl+V)
2. Click en **"Run"** (o presiona Ctrl+Enter)
3. Espera a que termine (puede tardar 10-15 segundos)

### 6️⃣ Verificar resultado
Deberías ver un mensaje como:
```
Success. No rows returned.
Completed in XXXms.
```

**Si ves errores:**
- Verifica que copiaste TODO el SQL
- Asegúrate de estar en la base de datos correcta
- Contacta al equipo si persisten los errores

---

## ✅ VERIFICACIÓN

### Paso 1: Ejecutar script de verificación
```bash
cd c:\Users\German\rural24
node scripts/verify-rls.js
```

### Paso 2: Resultado esperado
```
🔍 Verificando estado de RLS en Supabase...

✅ ads                       - RLS HABILITADO ✓
✅ users                     - RLS HABILITADO ✓
✅ categories                - RLS HABILITADO ✓
✅ subcategories             - RLS HABILITADO ✓
✅ brands                    - RLS HABILITADO ✓
✅ models                    - RLS HABILITADO ✓
✅ banners                   - RLS HABILITADO ✓

🎉 RLS habilitado correctamente en todas las tablas críticas
```

---

## 🔄 Si algo sale mal

### Problema: "Error: relation does not exist"
**Solución:** Verifica que estás en la base de datos correcta (schema: public)

### Problema: "Policy already exists"
**Solución:** El script elimina políticas viejas primero, intenta ejecutarlo de nuevo

### Problema: "Permission denied"
**Solución:** Asegúrate de tener permisos de administrador en Supabase

---

## 📊 ¿Qué hace el SQL?

### PARTE 1: Limpiar políticas antiguas
Elimina todas las políticas RLS existentes que puedan estar causando conflictos.

### PARTE 2: Habilitar RLS
Activa Row Level Security en 7 tablas:
- `users`
- `ads`
- `categories`
- `subcategories`
- `brands`
- `models`
- `banners`

### PARTE 3: Crear políticas de seguridad

#### **USERS:**
- Users ven solo su propio perfil
- SuperAdmins ven todos los perfiles
- Users pueden actualizar su perfil
- Permitir registro de nuevos usuarios

#### **ADS (Avisos):**
- Todos ven avisos activos y aprobados
- Users ven sus propios avisos (cualquier estado)
- SuperAdmins ven todos los avisos
- Users pueden crear, editar y eliminar sus avisos

#### **CATEGORIES/SUBCATEGORIES/BRANDS/MODELS:**
- Todos pueden leer (lectura pública)
- Solo SuperAdmins pueden crear/editar/eliminar

#### **BANNERS:**
- Todos pueden ver banners activos
- Solo SuperAdmins pueden gestionar banners

---

## 🎓 Conceptos Importantes

### ¿Qué es RLS?
**Row Level Security** es un sistema de PostgreSQL que permite controlar qué filas de una tabla puede ver/modificar cada usuario.

### ¿Por qué es importante?
- 🔐 **Seguridad:** Usuarios no pueden ver datos privados de otros
- 🛡️ **Protección:** Previene modificaciones no autorizadas
- ✅ **Compliance:** Cumple con regulaciones de privacidad (GDPR, etc.)

### ¿Cómo funciona?
```sql
-- Ejemplo simple:
CREATE POLICY "users_view_own" 
ON users FOR SELECT
USING (auth.uid() = id);
```

Esto significa: "Un usuario solo puede hacer SELECT de su propia fila (donde auth.uid() = id)"

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de Supabase
2. Ejecuta `node scripts/verify-rls.js` para diagnóstico
3. Consulta la documentación: `docs/RLS_STATUS_JAN_8_2026.md`

---

**Última actualización:** 10 de Enero, 2026
