# 🔍 AUDITORÍA COMPLETA - Sistema Featured Ads
**Fecha:** 6 de Febrero 2026  
**Arquitecto:** Senior Software Engineer + Fullstack  
**Objetivo:** Diagnóstico completo, identificación de gaps y propuesta de mejoras

---

## 📊 EXECUTIVE SUMMARY

El sistema de Featured Ads de Rural24 cuenta con **DOS SISTEMAS COMPLETOS** operando en paralelo:

1. **Sistema Legacy (featured_ads_queue)** → SuperAdmin activa manualmente
2. **Sistema Nuevo (featured_ads + user_credits)** → Usuarios compran créditos y destacan solos

**Problema principal:** SuperAdminFeaturedPanel **SOLO LEE**, no permite EDITAR ni ELIMINAR featured ads de usuarios.

---

## 🏗️ 1. ARQUITECTURA ACTUAL

### 1.1 Base de Datos (Migraciones Relevantes)

#### ✅ Sistema Nuevo - Usuarios con Créditos
```sql
-- Migración 043_featured_ads_system.sql (Sistema principal de usuarios)
CREATE TABLE featured_ads (
  id UUID PRIMARY KEY,
  ad_id UUID REFERENCES ads(id),
  user_id UUID REFERENCES users(id),
  placement VARCHAR(20) CHECK (placement IN ('homepage', 'results', 'detail')),
  scheduled_start DATE,
  actual_start TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  duration_days INT DEFAULT 15,
  status VARCHAR(20) CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  priority INT DEFAULT 0,
  credit_consumed BOOLEAN DEFAULT FALSE
);

-- Migración 044_credits_system.sql
CREATE TABLE user_credits (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  balance INT DEFAULT 0,
  monthly_allowance INT DEFAULT 0,
  last_monthly_reset TIMESTAMPTZ
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(20), -- 'purchase', 'monthly_grant', 'spend', 'refund'
  amount INT,
  balance_after INT,
  featured_ad_id UUID REFERENCES featured_ads(id)
);
```

**Configuración:**
- `featured_slots_homepage`: 10 por categoría
- `featured_slots_results`: 4
- `featured_slots_detail`: 6
- `featured_duration_days`: 15 días fijos
- `featured_credit_price`: $2500 ARS
- Duraciones: 7/14/21/28 días con costos 1/2/3/4 créditos

#### ⚠️ Sistema Legacy - SuperAdmin Manual
```sql
-- featured_ads_queue (tabla antigua, sin migración formal documentada)
-- Usada por SuperAdmin para activación manual
-- Controlada por /api/featured-ads
```

**Coexistencia:**
- `featured_ads_queue` → SuperAdmin gestiona
- `featured_ads` → Usuarios gestionan con créditos
- **NO están sincronizadas**

---

### 1.2 Backend APIs

#### API featured_ads_queue (SuperAdmin)
```
GET    /api/featured-ads         Lista destacados activos por categoría
POST   /api/featured-ads         Activa aviso manualmente (max 10/categoría)
DELETE /api/featured-ads?ad_id=  Desactiva aviso (marca cancelled)
POST   /api/featured-ads/restore Restaura aviso cancelado
GET    /api/featured-ads/history Historial completo
```

**Restricciones:**
- Máximo 10 destacados por categoría
- Solo SuperAdmin
- Opera sobre tabla `featured_ads_queue`

#### API featured_ads (Usuarios con créditos)
```
GET/POST /api/featured-ads/cron   Procesa pending→active, active→expired
```

**Problema crítico:** No hay endpoints para que SuperAdmin gestione `featured_ads` de usuarios (CRUD missing).

---

### 1.3 Frontend - Componentes

#### MyAdsPanel.tsx (Usuario Regular)
- **Ubicación:** `/my-ads`
- **Función:** Dashboard del usuario para gestionar sus propios avisos
- **Línea 14:** `import { FeaturedAdModal } from '../dashboard';`
- **Línea 533:** Renderiza `<FeaturedAdModal>` al hacer click en "Destacar"
- **Estado:** Funcional, permite al usuario destacar con créditos

#### FeaturedAdModal.tsx (Usuario - Sistema Principal)
- **Ubicación:** `frontend/src/components/dashboard/FeaturedAdModal.tsx` (659 líneas)
- **Función:** Modal completo para destacar aviso
- **Flujo:**
  1. Muestra créditos disponibles
  2. Seleccionar placement (homepage/results)
  3. Elegir fecha de inicio (programación)
  4. Verificar disponibilidad en tiempo real
  5. Confirmar y consumir crédito
- **Costos:**
  - `homepage`: 4 créditos
  - `results`: 1 crédito
  - `detail`: 1 crédito
- **Duración:** 30 días fijos
- **Servicio:** `userFeaturedService.ts`

#### FeaturedAdModalWithCredits.tsx (Sistema Alternativo)
- **Ubicación:** `frontend/src/components/modals/FeaturedAdModalWithCredits.tsx` (310 líneas)
- **Función:** Modal simplificado con duraciones
- **Duraciones:** 7/14/21/28 días → 1/2/3/4 créditos
- **Servicio:** `creditsService.ts`
- **Estado:** ⚠️ Parece duplicado o alternativo, revisar uso real

#### SuperAdminFeaturedPanel.tsx ⚠️ **PROBLEMA PRINCIPAL**
- **Ubicación:** `/featured-ads-admin`
- **Tabs actuales:**
  1. **Lista** → Tabla con filtros (status, placement, categoría, búsqueda)
  2. **Calendario** → Vista mensual de ocupación por categoría
  3. **Estadísticas** → KPIs (activos, revenue, top categorías)
- **Servicio:** `adminFeaturedService.ts`
- **Limitación crítica:** **SOLO LECTURA** ❌
  - ✅ Puede VER todos los featured_ads (usuarios)
  - ❌ NO puede EDITAR (cambiar fechas, placement)
  - ❌ NO puede ELIMINAR (cancelar/refund)
  - ❌ NO puede ACTIVAR MANUALMENTE (sin crédito)

#### AdsManagementPanel.tsx
- **Ubicación:** `/ads-management`
- **Función:** CRUD para Admin/SuperAdmin gestionar avisos de clientes (revendedores)
- **Permisos:** `['superadmin', 'admin']`
- **Features:**
  - Búsqueda por categoría/subcategoría
  - Paginación (10 por página)
  - Editar vendedor (seller_name)
  - Filtros locales por título
- **Decisión:** ✅ **MANTENER** (útil para rol 'admin' revendedores)

---

### 1.4 Servicios (Frontend)

#### featuredAdsService.ts
- Opera sobre **featured_ads_queue** (SuperAdmin)
- Funciones:
  - `getFeaturedQueue()` → Lista activos
  - `activateFeaturedAd()` → POST /api/featured-ads
  - `deactivateFeaturedAd()` → DELETE con ad_id
  - `restoreFeaturedAd()` → Restaurar cancelados
  - `subscribeFeaturedQueue()` → Real-time listener

#### userFeaturedService.ts ⭐ (Sistema principal usuarios)
- Opera sobre **featured_ads** + **user_credits**
- Funciones:
  - `getUserCredits()` → Balance de créditos
  - `createUserFeaturedAd()` → Destacar con placement + fecha
  - `getMonthlyAvailability()` → Disponibilidad de slots por día
  - `checkPromoStatus()` → Créditos de bienvenida
  - `claimPromoCredits()` → Reclamar 3 créditos gratis

#### adminFeaturedService.ts ⚠️
- **Para SuperAdmin ver featured_ads de usuarios**
- Funciones:
  - `getAdminFeaturedAds()` → Lista con filtros
  - `cancelFeaturedAd()` → ⚠️ EXISTE pero NO usado en UI
  - `getAdminFeaturedStats()` → Dashboard KPIs
  - `getFeaturedAudit()` → Historial de cambios
  - `getOccupancyGrid()` → Grid de ocupación
- **Gap crítico:** Función `cancelFeaturedAd()` existe pero **NO hay UI** para ejecutarla

#### creditsService.ts (¿Duplicado?)
- `getUserCredits()`
- `activateFeaturedWithCredits()` → Por duración (7/14/21/28)
- `getCreditsConfig()` → Lee global_config

---

## 🚨 2. PROBLEMAS IDENTIFICADOS (GAPS)

### 2.1 SuperAdmin NO puede gestionar featured_ads de usuarios ⚠️ CRÍTICO

**Escenario:**
1. Usuario destaca un aviso con créditos → inserta en `featured_ads`
2. Surgen problemas (imagen inapropiada, error de categoría)
3. SuperAdmin abre `/featured-ads-admin` → **SOLO VE, NO PUEDE HACER NADA**

**Funcionalidad faltante:**
- ❌ Cancelar/eliminar featured_ad con reembolso
- ❌ Modificar fechas (extender/acortar)
- ❌ Cambiar placement
- ❌ Activar manualmente SIN consumir crédito

**Impacto:** SuperAdmin tiene visibilidad pero **CERO CONTROL** sobre sistema de usuarios.

---

### 2.2 Duplicación de sistemas

**Problema:**
- `featured_ads_queue` → SuperAdmin gestiona manualmente (legacy)
- `featured_ads` → Usuarios con créditos (nuevo)

**Consecuencias:**
- Dos tablas, dos APIs, dos servicios
- Confusión sobre qué sistema usar
- featured_ads_queue parece obsoleto si usuarios pueden destacar solos

**¿Por qué coexisten?**
- SuperAdmin necesita poder destacar **sin cobrar** (casos especiales, VIPs, promociones)
- Usuarios regulares pagan con créditos
- **Solución correcta:** Un solo sistema con flag `manual_activation` y `requires_payment`

---

### 2.3 Dos modales de usuario diferentes

**FeaturedAdModal.tsx:**
- Placements (homepage/results)
- Fecha programada
- 30 días fijos

**FeaturedAdModalWithCredits.tsx:**
- Duraciones (7/14/21/28 días)
- Activación inmediata

**Problema:** ¿Cuál se usa? ¿Están ambos activos? Inconsistencia de UX.

---

### 2.4 Falta CRUD completo en APIs

**Endpoints faltantes para SuperAdmin:**
```
PATCH  /api/admin/featured-ads/:id  → Editar featured_ad (fechas, placement)
DELETE /api/admin/featured-ads/:id  → Cancelar con reembolso
POST   /api/admin/featured-ads      → Activar sin crédito (manual)
```

---

## 💡 3. PROPUESTA DE ARQUITECTURA (Mejoras)

### 3.1 Unificar ambos sistemas en `featured_ads`

**Propuesta:**
```sql
ALTER TABLE featured_ads 
  ADD COLUMN is_manual BOOLEAN DEFAULT FALSE,
  ADD COLUMN manual_activated_by UUID REFERENCES users(id),
  ADD COLUMN requires_payment BOOLEAN DEFAULT TRUE,
  ADD COLUMN refunded BOOLEAN DEFAULT FALSE,
  ADD COLUMN cancelled_by UUID REFERENCES users(id),
  ADD COLUMN cancelled_reason TEXT,
  ADD COLUMN cancelled_at TIMESTAMPTZ;
```

**Lógica:**
- `is_manual = true` → Activado por SuperAdmin (sin cobro)
- `requires_payment = false` → No requiere créditos (VIP, promo)
- `refunded = true` → Si se canceló y devolvió créditos

**Ventajas:**
- Un solo sistema, una sola tabla, una sola lógica
- SuperAdmin puede destacar manual o gestionar de usuarios
- Auditoría completa en un solo lugar

**Deprecar:**
- ❌ `featured_ads_queue` → Migrar registros históricos a `featured_ads`

---

### 3.2 SuperAdminFeaturedPanel - Agregar Tab "Gestión Manual"

**Nuevo Tab (4to):** "Activación Manual"

**Funcionalidad:**
1. **Buscar aviso:**
   - Por ID
   - Por título/usuario
   - Autocompletar

2. **Formulario:**
   - Placement (homepage/results/detail)
   - Fecha inicio
   - Fecha fin (o duración)
   - Categoría (detectar automática del aviso)
   - Motivo: Textarea (opcional)

3. **Acciones:**
   - Botón "Activar sin crédito" (verde)
   - Validación de cupos (slots disponibles)
   - No consume créditos del usuario

**UX:**
```
┌─────────────────────────────────────────────┐
│ 🎯 Activar Featured Manualmente            │
├─────────────────────────────────────────────┤
│ Buscar Aviso:                               │
│ [________________________________________]  │
│  ID o Título...                             │
│                                             │
│ Aviso seleccionado:                         │
│ ┌─────────────────────────────────────────┐ │
│ │ 📷 [Tractor John Deere 2024]            │ │
│ │ Usuario: Juan Pérez                     │ │
│ │ Categoría: Maquinaria → Tractores      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Placement: ● Homepage  ○ Resultados        │
│ Fecha inicio: [2026-02-10]                 │
│ Duración: [15 días ▼]                      │
│ Motivo: [Promoción día del campo______]    │
│                                             │
│ ⚠️ Slots disponibles: 3/10                 │
│                                             │
│ [Cancelar]  [✅ Activar sin crédito]       │
└─────────────────────────────────────────────┘
```

---

### 3.3 SuperAdminFeaturedPanel - Mejorar Tab "Lista"

**Agregar acciones por fila:**

```tsx
<table>
  <tbody>
    {featuredAds.map((featured) => (
      <tr key={featured.id}>
        <td>{featured.ad_title}</td>
        <td>{featured.placement}</td>
        <td>{featured.status}</td>
        <td>
          {/* ACCIONES */}
          <div className="flex gap-2">
            {/* EDITAR */}
            <button onClick={() => handleEdit(featured)}>
              <Edit2 /> Editar
            </button>
            
            {/* CANCELAR CON REEMBOLSO */}
            {featured.status === 'active' && featured.credit_consumed && (
              <button onClick={() => handleCancelWithRefund(featured)}>
                <RotateCcw /> Cancelar y Reembolsar
              </button>
            )}
            
            {/* CANCELAR SIN REEMBOLSO */}
            {featured.status === 'active' && !featured.credit_consumed && (
              <button onClick={() => handleCancel(featured)}>
                <X /> Cancelar
              </button>
            )}
            
            {/* VER DETALLE */}
            <button onClick={() => handleViewAd(featured.ad_id)}>
              <Eye /> Ver Aviso
            </button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**Modal de Edición:**
- Campos editables: `scheduled_start`, `expires_at`, `placement`
- NO cambiar: `ad_id`, `user_id`, `credits_spent`
- Guardar log en `featured_ads_audit`

**Modal de Cancelación:**
- Textarea: Motivo de cancelación
- Checkbox: "Reembolsar créditos" (si aplicable)
- Confirmación: "¿Seguro? Esta acción es irreversible"

---

### 3.4 Backend - Nuevos Endpoints

#### 1. Activar Featured Manual (sin crédito)
```typescript
// POST /api/admin/featured-ads/manual
{
  ad_id: string;
  placement: 'homepage' | 'results' | 'detail';
  scheduled_start: string; // ISO date
  duration_days: number;
  reason?: string;
}

// Lógica:
// - Verificar cupo disponible en categoría
// - Insertar en featured_ads con:
//   - is_manual = true
//   - manual_activated_by = superadmin_user_id
//   - requires_payment = false
//   - credit_consumed = false
// - NO tocar user_credits
// - Guardar en featured_ads_audit
```

#### 2. Editar Featured Existente
```typescript
// PATCH /api/admin/featured-ads/:id
{
  scheduled_start?: string;
  expires_at?: string;
  placement?: 'homepage' | 'results' | 'detail';
  reason?: string;
}

// Lógica:
// - Solo SuperAdmin
// - Validar status !== 'expired'
// - Verificar cupo si cambia categoría (por placement)
// - Actualizar campos
// - Log en featured_ads_audit: { action: 'edit', changes: {...} }
```

#### 3. Cancelar con/sin Reembolso
```typescript
// DELETE /api/admin/featured-ads/:id
{
  reason: string;
  refund_credits: boolean;
}

// Lógica:
// - Marcar status = 'cancelled'
// - Guardar cancelled_by, cancelled_reason, cancelled_at
// - Si refund_credits = true:
//   - Calcular días NO usados
//   - Reembolsar proporcionalmente a user_credits
//   - Insertar credit_transaction: { type: 'refund', amount: X }
//   - Marcar refunded = true
// - Log en featured_ads_audit
```

---

### 3.5 Modelo de Datos - Tabla Unificada

```sql
-- featured_ads (UNIFICADA)
CREATE TABLE featured_ads (
  id UUID PRIMARY KEY,
  ad_id UUID REFERENCES ads(id),
  user_id UUID REFERENCES users(id),
  
  -- Placement
  placement VARCHAR(20) CHECK (placement IN ('homepage', 'results', 'detail')),
  category_id UUID REFERENCES categories(id),
  
  -- Fechas
  scheduled_start DATE NOT NULL,
  actual_start TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  duration_days INT DEFAULT 15,
  
  -- Estado
  status VARCHAR(20) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  
  -- Créditos
  credit_consumed BOOLEAN DEFAULT FALSE,
  credits_spent INT DEFAULT 1,
  
  -- Activación manual (NUEVO)
  is_manual BOOLEAN DEFAULT FALSE,
  manual_activated_by UUID REFERENCES users(id),
  requires_payment BOOLEAN DEFAULT TRUE,
  
  -- Cancelación (NUEVO)
  refunded BOOLEAN DEFAULT FALSE,
  cancelled_by UUID REFERENCES users(id),
  cancelled_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  
  -- Metadata
  priority INT DEFAULT 0,
  transaction_id UUID REFERENCES credit_transactions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_featured_ads_manual ON featured_ads(is_manual) WHERE is_manual = true;
CREATE INDEX idx_featured_ads_cancelled ON featured_ads(cancelled_at) WHERE cancelled_at IS NOT NULL;
```

---

### 3.6 Auditoría Completa

```sql
CREATE TABLE featured_ads_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  featured_ad_id UUID REFERENCES featured_ads(id),
  action VARCHAR(50) NOT NULL, -- 'created', 'activated', 'cancelled', 'edited', 'refunded'
  performed_by UUID REFERENCES users(id),
  reason TEXT,
  metadata JSONB, -- { old_values: {...}, new_values: {...} }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_featured_ads_audit_featured_id ON featured_ads_audit(featured_ad_id);
CREATE INDEX idx_featured_ads_audit_performed_by ON featured_ads_audit(performed_by);
```

**Uso:**
- Cada acción (crear, cancelar, editar) → log en audit
- SuperAdminFeaturedPanel → Tab "Auditoría" para ver historial completo

---

## 🎨 4. DISEÑO UX/UI (Flujos)

### 4.1 Flujo SuperAdmin - Cancelar Featured con Reembolso

```
1. SuperAdmin → /featured-ads-admin → Tab "Lista"
2. Busca featured activo problemático
3. Click en botón "Cancelar y Reembolsar"
4. Modal:
   ┌─────────────────────────────────────┐
   │ ⚠️ Cancelar Featured Ad             │
   ├─────────────────────────────────────┤
   │ Aviso: "Tractor John Deere"         │
   │ Usuario: Juan Pérez                 │
   │ Placement: Homepage                 │
   │ Días restantes: 10/15               │
   │                                     │
   │ Motivo de cancelación: *            │
   │ [Imagen inapropiada____________]    │
   │                                     │
   │ ☑ Reembolsar créditos (10 días)    │
   │   Créditos a devolver: 2.67         │
   │                                     │
   │ [Cancelar]  [⚠️ Confirmar]          │
   └─────────────────────────────────────┘
5. Click "Confirmar"
6. Backend:
   - Marca status = 'cancelled'
   - Calcula reembolso: (10/15) * 4 = 2.67 ≈ 3 créditos
   - Actualiza user_credits: balance += 3
   - Inserta credit_transaction: { type: 'refund', amount: 3 }
   - Log en featured_ads_audit
7. Toast: "✅ Featured cancelado. 3 créditos reembolsados."
8. Recarga tabla automáticamente
```

---

### 4.2 Flujo SuperAdmin - Activar Manual sin Crédito

```
1. SuperAdmin → /featured-ads-admin → Tab "Activación Manual"
2. Busca aviso por ID o título
3. Autocompletar muestra resultados:
   ┌─────────────────────────────────┐
   │ 🔍 "tractor"                    │
   ├─────────────────────────────────┤
   │ [📷] Tractor John Deere 2024    │
   │      Usuario: Juan Pérez        │
   │                                 │
   │ [📷] Tractor Massey Ferguson    │
   │      Usuario: María Gómez       │
   └─────────────────────────────────┘
4. Selecciona aviso
5. Formulario se completa:
   - Categoría: Maquinaria (detectada)
   - Placement: Seleccionar (homepage/results)
   - Fecha inicio: Hoy (editable)
   - Duración: 15 días (editable)
6. Sistema verifica slots disponibles en tiempo real
7. Muestra: "✅ Slots disponibles: 3/10"
8. Click "Activar sin crédito"
9. Backend:
   - Inserta en featured_ads:
     - is_manual = true
     - requires_payment = false
     - credit_consumed = false
     - manual_activated_by = superadmin_id
   - NO toca user_credits
   - Log en audit: { action: 'manual_activation', reason: '...' }
10. Toast: "✅ Featured activado exitosamente"
11. Redirige a Tab "Lista" con filtro = 'active'
```

---

### 4.3 Estados y Validaciones

**Estados del Featured:**
- `pending` → Programado para fecha futura
- `active` → Visible en plataforma ahora
- `expired` → Venció por fecha
- `cancelled` → Cancelado por admin/user

**Validaciones:**
1. **Slots disponibles:**
   - Verificar antes de activar
   - Mostrar contador en tiempo real
   - Bloquear si max alcanzado

2. **Fechas coherentes:**
   - `scheduled_start` >= hoy
   - `expires_at` = scheduled_start + duration_days
   - No solapar con featured existente del mismo ad_id

3. **Permisos:**
   - Solo SuperAdmin puede activar manual
   - Solo SuperAdmin puede cancelar/editar
   - Usuario regular solo puede destacar sus propios avisos

---

## 📈 5. MÉTRICAS Y KPIs (Sistema Mejorado)

**Dashboard SuperAdmin debe mostrar:**

```tsx
<StatsGrid>
  {/* Total activos */}
  <StatCard
    title="Activos Ahora"
    value={stats.total_active}
    subtitle={`${stats.manual_count} manuales`}
    icon={<TrendingUp />}
  />
  
  {/* Revenue de créditos */}
  <StatCard
    title="Revenue Créditos"
    value={`$${stats.net_revenue.toLocaleString()}`}
    subtitle={`${stats.total_credits_consumed} créditos consumidos`}
    icon={<DollarSign />}
  />
  
  {/* Ocupación promedio */}
  <StatCard
    title="Ocupación Promedio"
    value={`${stats.avg_occupancy_percent}%`}
    subtitle="Slots utilizados"
    icon={<BarChart3 />}
  />
  
  {/* Reembolsos */}
  <StatCard
    title="Reembolsos"
    value={stats.total_refunded}
    subtitle={`${stats.refund_rate}% tasa`}
    icon={<RotateCcw />}
  />
</StatsGrid>
```

**Gráficos:**
1. Línea temporal: Activos por día (últimos 30 días)
2. Pie chart: Distribución por placement (homepage/results/detail)
3. Barra horizontal: Top 10 categorías con más destacados

---

## 🚀 6. PLAN DE IMPLEMENTACIÓN (Prioridades)

### FASE 1: Backend - Nuevos Endpoints (2-3 horas) ⚡ CRÍTICO
```
✅ POST   /api/admin/featured-ads/manual        → Activar sin crédito
✅ PATCH  /api/admin/featured-ads/:id           → Editar fechas/placement
✅ DELETE /api/admin/featured-ads/:id           → Cancelar con/sin reembolso
✅ GET    /api/admin/featured-ads/audit/:id     → Historial de cambios
```

### FASE 2: Modelo de Datos - Ampliar featured_ads (1 hora)
```sql
ALTER TABLE featured_ads ADD COLUMN ...
```

### FASE 3: Frontend - SuperAdminFeaturedPanel (4-5 horas)
```
✅ Tab "Activación Manual" completo
✅ Tab "Lista" → Agregar botones EDITAR / CANCELAR
✅ Modal EditFeaturedModal
✅ Modal CancelFeaturedModal con reembolso
```

### FASE 4: Testing Integral (2 horas)
```
✅ Test: Activar manual sin crédito
✅ Test: Cancelar y reembolsar proporcionalmente
✅ Test: Editar fechas sin afectar créditos
✅ Test: Verificar slots disponibles
✅ Test: Auditoría registra todo
```

### FASE 5: Deprecar featured_ads_queue (Opcional - 3 horas)
```
✅ Migrar registros históricos a featured_ads (is_manual=true)
✅ Eliminar endpoints /api/featured-ads (legacy)
✅ Eliminar featuredAdsService.ts
✅ Actualizar docs
```

---

## 🔒 7. SEGURIDAD Y PERMISOS

**RolePermissions:**
```typescript
// rolePermissions.ts
export const FEATURE_PERMISSIONS = {
  'featured-ads-admin': ['superadmin'], // Solo superadmin
  'ads-management': ['superadmin', 'admin'], // Admin + superadmin
  'my-ads': ['user', 'premium', 'admin', 'superadmin'] // Todos
};

// Middleware backend
async function requireSuperAdmin(req: NextRequest) {
  const user = await getUser(req);
  if (user.role !== 'superadmin') {
    return NextResponse.json(
      { error: 'Forbidden. SuperAdmin required.' },
      { status: 403 }
    );
  }
}
```

**Validaciones:**
- Todos los endpoints `/api/admin/*` requieren superadmin
- Frontend: Ocultar botones si rol !== superadmin
- Backend: Doble verificación en cada endpoint

---

## 📝 8. DOCUMENTACIÓN (Entregas)

**Archivos a crear/actualizar:**
1. `backend/app/api/admin/featured-ads/manual/route.ts` (nuevo)
2. `backend/app/api/admin/featured-ads/[id]/route.ts` (PATCH, DELETE)
3. `frontend/src/components/admin/SuperAdminFeaturedPanel.tsx` (actualizar)
4. `frontend/src/services/adminFeaturedService.ts` (agregar funciones)
5. `database/migrations/047_unify_featured_system.sql` (nuevo)
6. `docs/FEATURED_ADS_ADMIN_GUIDE.md` (manual de uso)

---

## ✅ 9. CHECKLIST DE ACEPTACIÓN

### Funcionalidad requerida:
- [ ] SuperAdmin puede activar featured manual sin crédito
- [ ] SuperAdmin puede editar fechas de featured existente
- [ ] SuperAdmin puede cancelar con reembolso proporcional
- [ ] SuperAdmin puede cancelar sin reembolso (manuales)
- [ ] Tab "Activación Manual" funcional y UX clara
- [ ] Tab "Lista" con botones: Editar / Cancelar / Ver
- [ ] Auditoría completa en `featured_ads_audit`
- [ ] Validación de slots disponibles en tiempo real
- [ ] Reembolso proporcional calculado correctamente
- [ ] Migración de datos desde `featured_ads_queue` (si aplica)

### Testing:
- [ ] Test E2E: Activar manual → Ver en homepage → Cancelar con refund
- [ ] Test: Usuario regular NO puede ejecutar endpoints admin
- [ ] Test: Editar fechas → Verificar disponibilidad de slots
- [ ] Test: Calculo reembolso: (días_restantes/total) × créditos

---

## 🎯 RESUMEN EJECUTIVO FINAL

### Problema actual:
❌ SuperAdminFeaturedPanel **SOLO LECTURA** → Visibilidad sin control

### Solución propuesta:
✅ **Tab "Activación Manual"** → Destacar sin crédito  
✅ **Tab "Lista" mejorado** → EDITAR + CANCELAR con reembolso  
✅ **Sistema unificado** → `featured_ads` (deprecar queue)  
✅ **Auditoría completa** → Trazabilidad total  

### Impacto:
- 🚀 SuperAdmin con **CONTROL TOTAL** del sistema
- 💰 Gestión de reembolsos transparente
- 📊 Dashboard con métricas reales
- 🔒 Seguridad y permisos claros
- 🧩 Arquitectura limpia (sin duplicación)

### Tiempo estimado:
**12-15 horas** (Backend + Frontend + Testing)

---

**Próximos pasos:** ¿Aprobado para proceder con implementación?
