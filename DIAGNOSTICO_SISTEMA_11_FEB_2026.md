# 🔍 DIAGNÓSTICO TÉCNICO RURAL24
**Fecha:** 11 de Febrero de 2026  
**Arquitecto:** Senior Backend + Fullstack + UX/UI  
**Contexto:** Producción en Render + Supabase  

---

## 🚨 PROBLEMAS IDENTIFICADOS

### **PROBLEMA 1: Error de autenticación en Panel de Usuarios**
**Error reportado:**
```
"Error al cargar usuarios: No autenticado. Se requiere token Bearer válido."
```

#### 🔎 Análisis Arquitectural

**Flujo actual (ROTO):**
```
UsersPanel.tsx (Frontend)
    ↓
getAllUsers() → fetch('/api/admin/users')  ❌ SIN token Bearer
    ↓
Backend: /api/admin/users/route.ts
    ↓
withAuth() guard → Requiere Authorization header
    ↓
❌ FALLA: No encuentra token → 401 Unauthorized
```

**Causa raíz:**
- **Archivo:** `frontend/src/services/usersService.ts` línea 42
- **Código problemático:**
```typescript
export const getAllUsers = async (): Promise<{ data: UserData[] | null; error: Error | null }> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/users`);
    // ❌ FALTA: Authorization: Bearer {token}
```

- **Comparación con código correcto:**  
  Ver `adminUsersService.ts` línea 36-46 que SÍ envía token.

**Impacto:**
- ❌ SuperAdmin NO puede ver lista de usuarios
- ❌ NO puede administrar roles
- ❌ NO puede verificar emails manualmente
- ⚠️ Otros endpoints admin probablemente tienen el mismo problema

**Edge Cases:**
1. Usuario con rol no-superadmin → 403 Forbidden (esperado)
2. Token expirado → 401 + No redirige al login automáticamente
3. Backend caído → Error de red sin mensaje amigable

---

### **PROBLEMA 2: Sistema de Créditos no ejecutado**

#### 🔎 Análisis Base de Datos

**Estado actual:**
```sql
-- ❓ DESCONOCIDO: Tablas creadas o no?
global_config
user_credits
credit_transactions
featured_ads
```

**Archivo existente pero NO aplicado:**
- `database/migrations/044_credits_system_ADAPTED.sql` (607 líneas)
- Creado: 11 Feb 2026
- Estado: ⚠️ Pendiente de ejecución en Supabase

**Impacto:**
- ❌ Usuarios NO pueden comprar créditos
- ❌ NO pueden destacar anuncios
- ❌ Promo de bienvenida (3 créditos gratis) NO funciona
- ❌ Panel de configuración superadmin NO funciona

**Riesgo de ejecución:**
- ✅ BAJO: Usa `CREATE TABLE IF NOT EXISTS` (safe)
- ✅ BAJO: Índices con `IF NOT EXISTS`
- ⚠️ MEDIO: Altera `subscription_plans` sin validar datos existentes

---

### **PROBLEMA 3: URL incorrecta en documentación**

#### 📄 Ubicación:
- `backups/2026-02-11_INFORME_STACK_TECNICO.md`
- Línea 19: "Frontend + Backend API" (ambiguo)

**Corrección:**
```markdown
ANTES: https://rural24-1.onrender.com (Frontend) + Backend API
AHORA: https://rural24-1.onrender.com (Frontend) + https://rural24.onrender.com (Backend)
```

✅ **YA CORREGIDO** en este diagnóstico.

---

## 🏗️ ARQUITECTURA PROPUESTA

### **SOLUCIÓN 1: Fix autenticación en getAllUsers()**

#### Cambio en `frontend/src/services/usersService.ts`

**ANTES (líneas 42-56):**
```typescript
export const getAllUsers = async (): Promise<{ data: UserData[] | null; error: Error | null }> => {
  try {
    console.log('📥 Cargando usuarios desde API backend...');

    const response = await fetch(`${API_BASE}/api/admin/users`);
    const json = await response.json();
```

**DESPUÉS:**
```typescript
export const getAllUsers = async (): Promise<{ data: UserData[] | null; error: Error | null }> => {
  try {
    console.log('📥 Cargando usuarios desde API backend...');

    // 🔐 Obtener token de sesión actual
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error('❌ No hay sesión activa');
      return { data: null, error: new Error('No autenticado. Inicia sesión nuevamente.') };
    }

    // 📡 Fetch con Authorization header
    const response = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    const json = await response.json();
```

**Justificación técnica:**
- ✅ Sigue el patrón de `adminUsersService.ts` (código probado)
- ✅ Compatible con `withAuth()` guard del backend
- ✅ Maneja caso de sesión expirada (error legible)
- ✅ No rompe compatibilidad con código existente

**Otros endpoints a revisar:**
```typescript
// TODO: Aplicar mismo fix en estos servicios
- updateUserRole() → línea 147
- verifyUserEmail() → línea 174  
- deleteUser() → línea 201
```

---

### **SOLUCIÓN 2: Ejecutar migración de créditos**

#### Paso 1: Backup preventivo

```sql
-- Ejecutar en Supabase SQL Editor
-- Backup de subscription_plans antes de alterar
CREATE TABLE IF NOT EXISTS subscription_plans_backup_20260211 AS
SELECT * FROM subscription_plans;
```

#### Paso 2: Ejecutar migración completa

**Opción A: Vía Supabase Dashboard (Recomendado)**
```
1. Ir a Supabase Dashboard → SQL Editor
2. New Query
3. Copiar contenido de: database/migrations/044_credits_system_ADAPTED.sql
4. Run query
5. Verificar mensajes de éxito/error
```

**Opción B: Vía CLI (si tienes psql configurado)**
```powershell
# Obtener DATABASE_URL de Render Dashboard
$env:DATABASE_URL = "postgresql://..."

# Ejecutar migración
psql $env:DATABASE_URL -f database/migrations/044_credits_system_ADAPTED.sql
```

#### Paso 3: Verificación

```sql
-- 1. Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('global_config', 'user_credits', 'credit_transactions', 'featured_ads');

-- 2. Verificar datos iniciales en global_config
SELECT * FROM global_config WHERE category IN ('credits', 'featured', 'promo');

-- 3. Verificar columnas agregadas a subscription_plans
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscription_plans' 
AND column_name IN ('slug', 'monthly_free_credits', 'monthly_credits_expire_days');

-- 4. Verificar funciones RPC creadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%credit%' OR routine_name LIKE '%featured%';
```

**Resultado esperado:**
```
✅ 4 tablas creadas/verificadas
✅ 5 global_config insertados
✅ 3 columnas agregadas a subscription_plans
✅ 10 funciones RPC creadas
```

---

## 🎨 DISEÑO UX/UI: Sistema de Créditos

### Flujo de Usuario: Destacar Anuncio

```
ESTADO INICIAL: Usuario en "Mis avisos"
    ↓
1. Click "Destacar" en anuncio
    ↓
2. Modal: FeaturedAdModalWithCredits
    │
    ├─ Header: "Destacar: {título anuncio}"
    ├─ Balance actual: "{X} créditos disponibles"
    ├─ Selector duración:
    │   ○ 7 días - 1 crédito ($2.500)
    │   ○ 14 días - 2 créditos ($5.000)
    │   ○ 21 días - 3 créditos ($7.500)
    │   ○ 28 días - 4 créditos ($10.000)
    │
    ├─ SI balance >= créditos requeridos:
    │   └─ Botón verde: "Destacar ahora"
    │
    └─ SI balance < créditos requeridos:
        └─ Botón amarillo: "Comprar créditos"
            ↓
        BuyCreditsModal
            ↓
        Mercado Pago checkout
            ↓
        Webhook: credits += purchased
            ↓
        ✅ Retomar destacado automáticamente
```

### Estados de validación

| Condición | UI | Acción |
|-----------|-----|--------|
| Balance suficiente | Botón verde "Destacar ahora" | Ejecutar |
| Balance insuficiente | Botón amarillo "Comprar créditos" | Redirigir a compra |
| Anuncio ya destacado | Badge amarillo "Destacado hasta DD/MM" | Deshabilitar |
| Error de red | Toast rojo "Error al destacar" | Retry manual |
| Éxito | Toast verde + Badge "Destacado" | Actualizar lista |

### Panel de configuración (SuperAdmin)

**Ubicación:** Dashboard → Admin → Configuración de Créditos

**Campos editables:**
```
1. Precio base (ARS)
   [2500] ← Input numérico
   
2. Duraciones disponibles (JSON)
   [{days: 7, credits: 1, label: "1 semana"}]
   ← Textarea con validación JSON
   
3. Promo signup
   ☑ Activar promo de bienvenida
   Créditos gratis: [3]
   Días de expiración: [30]
   
4. Botón: "Guardar configuración"
```

**Validaciones:**
- Precio base > 0
- JSON válido en duraciones
- credits > 0, days > 0
- Si promo active, credits > 0

---

## 📊 MODELO DE DATOS (Contratos)

### API Contract: POST /api/featured/activate

**Request:**
```typescript
interface ActivateFeaturedRequest {
  ad_id: string;           // UUID del anuncio
  duration_days: 7 | 14 | 21 | 28;
}
```

**Headers:**
```
Authorization: Bearer {supabase_jwt}
Content-Type: application/json
```

**Response (200 OK):**
```typescript
interface ActivateFeaturedResponse {
  success: true;
  data: {
    featured_id: string;
    ad_id: string;
    expires_at: string;      // ISO 8601
    credits_spent: number;
    new_balance: number;
  };
  message: string;           // "Anuncio destacado por 7 días"
}
```

**Response (400 Bad Request):**
```typescript
interface ErrorResponse {
  success: false;
  error: string;             // "insufficient_credits" | "invalid_duration" | "already_featured"
  message: string;           // User-friendly error
  required_credits?: number; // Si error = insufficient_credits
  current_balance?: number;
}
```

### Database Schema: user_credits

```sql
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  monthly_allowance INT DEFAULT 0,
  last_monthly_reset TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Trigger: Crear balance en signup automático
CREATE OR REPLACE FUNCTION create_user_credits_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_credits
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_credits_on_signup();
```

---

## 🛠️ EJEMPLO TÉCNICO CLARO

### Fix completo para usersService.ts

```typescript
import { supabase } from './supabaseClient';
import type { UserRole, UserType } from '../../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================
// HELPER: Obtener headers con autenticación
// ============================================
async function getAuthHeaders(): Promise<HeadersInit | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

// ============================================
// GET ALL USERS (FIX APLICADO)
// ============================================
export const getAllUsers = async (): Promise<{ data: UserData[] | null; error: Error | null }> => {
  try {
    console.log('📥 Cargando usuarios desde API backend...');

    // 🔐 Obtener headers con token
    const headers = await getAuthHeaders();
    if (!headers) {
      return { 
        data: null, 
        error: new Error('No autenticado. Inicia sesión nuevamente.') 
      };
    }

    // 📡 Fetch con autenticación
    const response = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'GET',
      headers,
    });

    const json = await response.json();

    if (!response.ok) {
      console.error('❌ Error loading users:', json.error);
      return { 
        data: null, 
        error: new Error(json.error || `HTTP ${response.status}`) 
      };
    }

    if (!json.success) {
      return { data: null, error: new Error(json.error) };
    }

    console.log(`✅ ${json.data?.length || 0} usuarios cargados`);
    return { data: json.data, error: null };
  } catch (error) {
    console.error('❌ Error en getAllUsers:', error);
    return { data: null, error: error as Error };
  }
};

// ============================================
// UPDATE USER ROLE (FIX APLICADO)
// ============================================
export const updateUserRole = async (
  userId: string, 
  newRole: UserRole
): Promise<{ error: Error | null }> => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) {
      return { error: new Error('No autenticado') };
    }

    const response = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ user_id: userId, role: newRole }),
    });

    const json = await response.json();

    if (!json.success) {
      return { error: new Error(json.error) };
    }

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

// ============================================
// TODO: Aplicar mismo patrón a:
// - verifyUserEmail()
// - deleteUser()
// - Cualquier endpoint que requiera auth
// ============================================
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### ✅ Fase 1: Fixes críticos (30 min)

- [ ] **1.1** Aplicar fix a `usersService.ts` (getAllUsers, updateUserRole, verifyUserEmail, deleteUser)
- [ ] **1.2** Backup de subscription_plans en Supabase
- [ ] **1.3** Ejecutar migración 044_credits_system_ADAPTED.sql
- [ ] **1.4** Verificar tablas y funciones creadas
- [ ] **1.5** Commit + Push a GitHub

### ✅ Fase 2: Validación (15 min)

- [ ] **2.1** Login como superadmin en producción
- [ ] **2.2** Ir a Dashboard → Usuarios
- [ ] **2.3** Verificar que carga lista de usuarios
- [ ] **2.4** Verificar que muestra conteo de avisos
- [ ] **2.5** Probar cambiar rol de usuario de prueba
- [ ] **2.6** Ir a Dashboard → Mis avisos
- [ ] **2.7** Click "Destacar" en anuncio
- [ ] **2.8** Verificar modal de créditos se abre
- [ ] **2.9** Verificar balance muestra 0 créditos (usuario nuevo)

### ✅ Fase 3: Test de créditos (20 min)

- [ ] **3.1** Ejecutar promo de bienvenida (query SQL o via UI)
- [ ] **3.2** Verificar balance actualiza a 3 créditos
- [ ] **3.3** Destacar anuncio por 7 días (1 crédito)
- [ ] **3.4** Verificar balance queda en 2 créditos
- [ ] **3.5** Verificar anuncio muestra badge "Destacado"
- [ ] **3.6** Verificar búsqueda muestra anuncio destacado primero
- [ ] **3.7** Verificar transacción en historial

### ✅ Fase 4: Config superadmin (10 min)

- [ ] **4.1** Ir a Dashboard → Admin → Configuración Créditos
- [ ] **4.2** Cambiar precio base a 3000
- [ ] **4.3** Guardar y verificar actualización
- [ ] **4.4** Verificar frontend lee nuevo precio en modal

---

## 🎯 NEXT STEPS

### Inmediato (HOY)
1. Aplicar fix de autenticación
2. Ejecutar migración de créditos
3. Validar flujo completo en producción

### Corto plazo (Esta semana)
1. Integrar Mercado Pago para compra real
2. Webhook handler para credits += purchased
3. Email confirmation de destacado activado

### Mediano plazo (Próximo mes)
1. Panel de estadísticas de créditos (admin)
2. Refactorizar 14+ paneles admin a lazy load
3. Optimizar queries con índices aplicados

---

## 🚀 COMANDO FINAL

```powershell
# 1. Fix autenticación
code frontend/src/services/usersService.ts

# 2. Ejecutar migración
# → Ir a Supabase Dashboard → SQL Editor
# → Copiar database/migrations/044_credits_system_ADAPTED.sql
# → Run query

# 3. Commit
git add frontend/src/services/usersService.ts
git add DIAGNOSTICO_SISTEMA_11_FEB_2026.md
git commit -m "fix(auth): Add Bearer token to admin users API calls

- Fix getAllUsers() sin token Bearer
- Fix updateUserRole(), verifyUserEmail(), deleteUser()
- Add getAuthHeaders() helper
- Docs: Add complete diagnosis with credits system guide"

git push origin main

# 4. Monitorear deploy en Render
# https://dashboard.render.com/
```

---

**Preparado por:** Arquitecto Senior Backend + Fullstack + UX/UI  
**Última actualización:** 11 de Febrero de 2026  
**Estado:** ✅ Diagnóstico completo - Listo para implementar
