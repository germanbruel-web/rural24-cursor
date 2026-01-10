# 🚀 PLAN DE DESARROLLO - SPRINT 1 DÍA 2
**Fecha:** 10 de Enero, 2026  
**Arquitecto:** GitHub Copilot  
**Duración estimada:** 4-6 horas  

---

## 📊 CONTEXTO

### ✅ Completado Ayer (Día 1):
1. ✅ Sistema RLS documentado (scripts listos)
2. ✅ Gemini API eliminado ($600-2,400 USD/año ahorrados)
3. ✅ Backend API creado (endpoints funcionando)
4. ✅ Frontend services creados (80% migración)

### 🎯 Objetivo Hoy (Día 2):
**Completar migración frontend-backend al 100% y preparar sistema de pagos**

---

## 📋 TAREAS DEL DÍA

### 🔴 PRIORIDAD 1: Completar Integración Frontend-Backend (3 horas)

#### Tarea 1.1: Integrar DynamicFormLoader en PublicarAvisoV3 (1 hora)

**Archivo:** `frontend/src/components/pages/PublicarAvisoV3.tsx`

**Cambios:**

```typescript
// PASO 1: Actualizar imports (línea 36)
// Antes:
import { DynamicField } from '../DynamicField';

// Después:
import { DynamicFormLoader } from '../forms/DynamicFormLoader';

// PASO 2: Agregar estados para nombres de categoría (línea ~105)
const [selectedCategoryName, setSelectedCategoryName] = useState('');
const [selectedSubcategoryName, setSelectedSubcategoryName] = useState('');

// PASO 3: Actualizar selección de categoría (línea ~915)
onClick={() => {
  if (isExpanded) {
    setExpandedCategory('');
    setSelectedCategory('');
    setSelectedCategoryName(''); // NUEVO
    setSelectedSubcategory('');
    setSelectedSubcategoryName(''); // NUEVO
  } else {
    setExpandedCategory(cat.id);
    setSelectedCategory(cat.id);
    setSelectedCategoryName(cat.name); // NUEVO
    setSelectedSubcategory('');
    setSelectedSubcategoryName(''); // NUEVO
  }
}}

// PASO 4: Actualizar selección de subcategoría (línea ~960)
onClick={() => {
  setSelectedSubcategory(sub.id);
  setSelectedSubcategoryName(sub.name); // NUEVO
  // ... resto del código
}}

// PASO 5: Reemplazar renderizado de campos (línea ~1100)
// Antes:
{attributes.map(attr => (
  <DynamicField
    key={attr.id}
    attribute={attr}
    value={attributeValues[attr.id]}
    onChange={handleAttributeChange}
  />
))}

// Después:
<DynamicFormLoader
  subcategoryId={selectedSubcategory}
  categoryName={selectedCategoryName}
  subcategoryName={selectedSubcategoryName}
  values={attributeValues}
  onChange={(name, value) => {
    setAttributeValues(prev => ({ ...prev, [name]: value }));
  }}
  errors={formErrors}
  title="Características Técnicas"
  description="Completá los detalles de tu producto"
/>
```

**Testing:**
```bash
# 1. Levantar backend
cd backend
npm run dev

# 2. Levantar frontend (otra terminal)
cd frontend
npm run dev

# 3. Probar:
# - Ir a http://localhost:5173/publicar
# - Seleccionar Maquinarias → Tractores
# - Abrir DevTools Console
# - Buscar log: "✅ X campos cargados desde backend"
# - Completar formulario (todos los campos visibles)
```

**Criterio de éxito:**
- [ ] Formulario carga campos desde backend
- [ ] Console.log muestra "backend" como source
- [ ] Sin errores en DevTools
- [ ] Campos se llenan correctamente
- [ ] Preview del aviso muestra datos

---

#### Tarea 1.2: Crear tests de integración (1 hora)

**Archivo nuevo:** `test-integration.ps1`

```powershell
# Script de testing automatizado
Write-Host "🧪 Testing Integración Frontend-Backend" -ForegroundColor Cyan

# 1. Verificar backend
Write-Host "`n1️⃣ Testeando Backend API..." -ForegroundColor Yellow
$backendHealth = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -ErrorAction SilentlyContinue

if ($backendHealth.StatusCode -eq 200) {
    Write-Host "✅ Backend OK" -ForegroundColor Green
} else {
    Write-Host "❌ Backend NO responde" -ForegroundColor Red
    exit 1
}

# 2. Test endpoint categories
Write-Host "`n2️⃣ Testeando /api/config/categories..." -ForegroundColor Yellow
$categories = Invoke-WebRequest -Uri "http://localhost:3000/api/config/categories" | 
    Select-Object -Expand Content | 
    ConvertFrom-Json

if ($categories.categories.Count -gt 0) {
    Write-Host "✅ Categorías: $($categories.categories.Count) encontradas" -ForegroundColor Green
} else {
    Write-Host "❌ Sin categorías" -ForegroundColor Red
    exit 1
}

# 3. Test endpoint form (usar primera subcategoría)
Write-Host "`n3️⃣ Testeando /api/config/form..." -ForegroundColor Yellow
$firstSubcategoryId = $categories.categories[0].subcategories[0].id

$form = Invoke-WebRequest -Uri "http://localhost:3000/api/config/form/$firstSubcategoryId" | 
    Select-Object -Expand Content | 
    ConvertFrom-Json

if ($form.dynamic_attributes.Count -gt 0) {
    Write-Host "✅ Formulario: $($form.dynamic_attributes.Count) campos" -ForegroundColor Green
} else {
    Write-Host "❌ Sin campos dinámicos" -ForegroundColor Red
    exit 1
}

# 4. Verificar frontend
Write-Host "`n4️⃣ Testeando Frontend..." -ForegroundColor Yellow
$frontend = Invoke-WebRequest -Uri "http://localhost:5173" -ErrorAction SilentlyContinue

if ($frontend.StatusCode -eq 200) {
    Write-Host "✅ Frontend OK" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend NO responde" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Todos los tests pasaron!" -ForegroundColor Green
Write-Host "`n📋 Próximo paso: Probar publicación manual en http://localhost:5173/publicar" -ForegroundColor Cyan
```

**Ejecutar:**
```powershell
.\test-integration.ps1
```

**Criterio de éxito:**
- [ ] Script ejecuta sin errores
- [ ] Todos los tests pasan (✅)
- [ ] Documentar resultado en SPRINT1_DIA2_COMPLETADO.md

---

#### Tarea 1.3: Optimizar DynamicFormLoader (1 hora)

**Mejoras:**

```typescript
// frontend/src/components/forms/DynamicFormLoader.tsx

// 1. Agregar retry automático
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

const loadFieldsWithRetry = async (retries = 0): Promise<void> => {
  try {
    const backendFields = await getFieldsForSubcategory(subcategoryId);
    setFields(backendFields);
    setSource('backend');
  } catch (error) {
    if (retries < MAX_RETRIES) {
      console.warn(`⚠️ Reintentando (${retries + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return loadFieldsWithRetry(retries + 1);
    }
    
    // Fallback después de MAX_RETRIES
    console.warn('⚠️ Usando fallback después de 3 reintentos');
    if (categoryName && subcategoryName) {
      const fallbackFields = getFieldsForAd(categoryName, subcategoryName);
      setFields(fallbackFields);
      setSource('fallback');
    }
  }
};

// 2. Agregar prefetch para categorías comunes
useEffect(() => {
  // Prefetch categorías más usadas en background
  const prefetchCommonCategories = async () => {
    const common = ['tractores', 'sembradoras', 'cosechadoras'];
    common.forEach(id => {
      getFieldsForSubcategory(id).catch(() => {}); // Silent fail
    });
  };
  
  prefetchCommonCategories();
}, []);

// 3. Agregar analytics (opcional)
const trackFormLoad = () => {
  // Enviar evento a analytics
  console.log('📊 Analytics:', {
    event: 'form_loaded',
    source: source,
    subcategory_id: subcategoryId,
    fields_count: fields.length,
  });
};

useEffect(() => {
  if (!loading && fields.length > 0) {
    trackFormLoad();
  }
}, [loading, fields]);
```

**Criterio de éxito:**
- [ ] Retry automático funciona (test con backend offline)
- [ ] Prefetch mejora performance (medir tiempo)
- [ ] Analytics registra eventos correctamente

---

### 🟡 PRIORIDAD 2: Preparar Sistema de Pagos (2 horas)

#### Tarea 2.1: Análisis y Decisión de Pasarela (30 min)

**Archivo nuevo:** `docs/ANALISIS_PASARELAS_PAGO.md`

**Contenido:**

```markdown
# 💳 Análisis de Pasarelas de Pago

## Opciones Evaluadas

### 1. Mercado Pago (Argentina)
**Ventajas:**
- ✅ Más usado en Argentina
- ✅ Integración simple (SDK JavaScript)
- ✅ Checkout Pro (hosted)
- ✅ Webhooks robustos
- ✅ Acepta tarjetas y efectivo
- ✅ Documentación en español

**Desventajas:**
- ❌ Solo Latinoamérica
- ❌ Comisiones: 4.99% + IVA

**Integración:**
- SDK: `mercadopago` npm package
- Tiempo: 2-3 días
- Complejidad: Media

---

### 2. Stripe
**Ventajas:**
- ✅ Global
- ✅ API excelente
- ✅ Documentación top-tier
- ✅ Webhooks confiables
- ✅ Subscriptions built-in

**Desventajas:**
- ❌ Menos conocido en Argentina
- ❌ Requiere tarjeta internacional
- ❌ Comisiones: 2.9% + $0.30 USD

**Integración:**
- SDK: `@stripe/stripe-js`
- Tiempo: 2 días
- Complejidad: Media

---

## 🎯 Recomendación Final

### **USAR MERCADO PAGO**

**Razones:**
1. Target audience: Usuarios rurales argentinos
2. Familiaridad: Todos conocen Mercado Pago
3. Efectivo: Permite pago en Rapipago/Pago Fácil
4. Local: Mejor UX para el mercado objetivo

**Plan de implementación:**
1. Crear cuenta Mercado Pago Developers
2. Obtener credenciales (Access Token)
3. Implementar Checkout Pro (hosted)
4. Webhooks para actualizar suscripciones
5. Testing en Sandbox
6. Producción

**Estimación:** 3-4 días (Sprint 1.5)
```

**Acción:**
- [ ] Leer análisis completo
- [ ] Decidir: ¿Mercado Pago o Stripe?
- [ ] Crear cuenta de desarrollador
- [ ] Obtener credenciales de Sandbox

---

#### Tarea 2.2: Diseñar Arquitectura de Pagos (1 hora)

**Archivo nuevo:** `docs/ARQUITECTURA_SISTEMA_PAGOS.md`

**Contenido:**

```markdown
# 🏗️ Arquitectura Sistema de Pagos - Rural24

## Flujo de Usuario

```
1. Usuario ve planes en /pricing
   ↓
2. Click en "Contratar Plan Pro ($10/mes)"
   ↓
3. Verifica autenticación
   ↓
4. Redirect a Mercado Pago Checkout
   ↓
5. Usuario paga (tarjeta/efectivo)
   ↓
6. Webhook actualiza BD → plan activo
   ↓
7. Redirect a /dashboard (con plan activo)
```

## Base de Datos

### Nueva tabla: `user_subscriptions`

```sql
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL, -- 'free', 'starter', 'pro', 'empresa'
  status TEXT NOT NULL, -- 'active', 'cancelled', 'expired', 'pending'
  payment_method TEXT, -- 'mercadopago', 'stripe', null (free)
  
  -- Mercado Pago
  mp_subscription_id TEXT UNIQUE,
  mp_payer_id TEXT,
  mp_payment_id TEXT,
  
  -- Fechas
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_mp_subscription_id ON user_subscriptions(mp_subscription_id);

-- RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_subscription" 
ON user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "superadmin_manage_subscriptions" 
ON user_subscriptions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'superadmin'
  )
);
```

### Modificar tabla: `users`

```sql
-- Agregar columna de plan activo (desnormalizado para performance)
ALTER TABLE users ADD COLUMN current_plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN plan_expires_at TIMESTAMPTZ;

-- Función para sincronizar plan activo
CREATE OR REPLACE FUNCTION sync_user_current_plan()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET 
    current_plan = NEW.plan_id,
    plan_expires_at = NEW.expires_at
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_sync_user_plan
AFTER INSERT OR UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_user_current_plan();
```

## Backend API

### Endpoints necesarios

#### 1. POST /api/payments/create-checkout
```typescript
// Crear sesión de pago en Mercado Pago
// Input: { planId: 'pro', userId: 'uuid' }
// Output: { checkoutUrl: 'https://mpago.li/...' }
```

#### 2. POST /api/payments/webhook
```typescript
// Recibir notificaciones de Mercado Pago
// Validar signature
// Actualizar user_subscriptions
// Sincronizar users.current_plan
```

#### 3. GET /api/payments/subscription/:userId
```typescript
// Obtener suscripción activa del usuario
// Output: { plan, status, expiresAt, ... }
```

#### 4. POST /api/payments/cancel
```typescript
// Cancelar suscripción
// Input: { userId: 'uuid' }
// Output: { success: true, cancelledAt: '...' }
```

## Frontend Components

### 1. PricingPage.tsx (YA EXISTE)
```tsx
// Modificar botones:
<Button onClick={() => handleSelectPlan('pro')}>
  Contratar Pro
</Button>

const handleSelectPlan = async (planId: string) => {
  if (!user) {
    // Mostrar modal de login
    return;
  }
  
  // Crear checkout session
  const { checkoutUrl } = await createCheckoutSession(planId);
  
  // Redirect a Mercado Pago
  window.location.href = checkoutUrl;
};
```

### 2. SubscriptionStatus.tsx (NUEVO)
```tsx
// Componente para Dashboard
// Muestra plan actual, fecha de renovación, botón cancelar

<Card>
  <h3>Tu Plan Actual</h3>
  <div className="plan-badge">Pro</div>
  <p>Se renueva el: 10 de Febrero, 2026</p>
  <Button variant="outline" onClick={handleCancel}>
    Cancelar Suscripción
  </Button>
</Card>
```

### 3. PaymentSuccessPage.tsx (NUEVO)
```tsx
// Página de éxito después del pago
// /payment/success?payment_id=123

export default function PaymentSuccess() {
  useEffect(() => {
    // Verificar estado del pago
    verifyPayment(paymentId);
  }, []);
  
  return (
    <div className="success-page">
      <CheckCircle size={64} />
      <h1>¡Pago Exitoso!</h1>
      <p>Tu plan Pro está activo.</p>
      <Button onClick={() => navigate('/dashboard')}>
        Ir a Mi Panel
      </Button>
    </div>
  );
}
```

## Seguridad

### Validación de Webhooks
```typescript
// Verificar firma de Mercado Pago
import crypto from 'crypto';

function validateWebhook(signature: string, body: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return hash === signature;
}
```

### Rate Limiting
```typescript
// Limitar requests a webhook
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

// En webhook handler:
const { success } = await ratelimit.limit(ip);
if (!success) {
  return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

## Testing

### 1. Sandbox de Mercado Pago
```javascript
// Tarjetas de prueba:
VISA: 4509 9535 6623 3704
MasterCard: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
```

### 2. Script de testing
```bash
# test-payment-flow.ps1
# 1. Crear checkout
# 2. Simular pago en sandbox
# 3. Verificar webhook recibido
# 4. Verificar BD actualizada
```

## Estimación

- Database schema: 1 hora
- Backend endpoints: 1 día
- Frontend components: 1 día
- Mercado Pago integration: 1 día
- Testing: 0.5 días
- **TOTAL: 3.5 días**

## Sprint Planning

- **Sprint 1.5 (días 4-7):**
  - Día 4: DB + Backend endpoints
  - Día 5: Frontend components
  - Día 6: Integración Mercado Pago
  - Día 7: Testing + Deploy
```

**Acción:**
- [ ] Revisar arquitectura
- [ ] Validar con equipo de negocio
- [ ] Crear issues en GitHub para cada tarea
- [ ] Estimar días de desarrollo

---

#### Tarea 2.3: Crear Issues en GitHub (30 min)

**Issues a crear:**

```markdown
# Issue 1: [FEATURE] Integración Mercado Pago
**Labels:** feature, payments, high-priority  
**Milestone:** Sprint 1.5  
**Estimación:** 3 días  

## Descripción
Implementar sistema completo de pagos con Mercado Pago para monetizar plataforma.

## Tareas
- [ ] Crear tabla user_subscriptions
- [ ] Backend: POST /api/payments/create-checkout
- [ ] Backend: POST /api/payments/webhook
- [ ] Frontend: Modificar PricingPage
- [ ] Frontend: Crear PaymentSuccessPage
- [ ] Testing en Sandbox
- [ ] Deploy a producción

## Referencias
- Docs: docs/ARQUITECTURA_SISTEMA_PAGOS.md
- API: https://www.mercadopago.com.ar/developers/

---

# Issue 2: [FEATURE] Dashboard de Usuario con Plan Activo
**Labels:** feature, frontend, medium-priority  
**Milestone:** Sprint 1.5  
**Estimación:** 1 día  

## Descripción
Crear dashboard donde usuario vea su plan activo, límites, y pueda cancelar.

## Tareas
- [ ] Componente SubscriptionStatus
- [ ] Endpoint GET /api/payments/subscription/:userId
- [ ] Botón cancelar suscripción
- [ ] Modal de confirmación

---

# Issue 3: [FEATURE] Lógica de Límites por Plan
**Labels:** feature, backend, high-priority  
**Milestone:** Sprint 1.5  
**Estimación:** 1 día  

## Descripción
Implementar validación de límites según plan del usuario.

## Tareas
- [ ] Middleware verificarPlan()
- [ ] Validar límite de avisos activos
- [ ] Validar límite de fotos por aviso
- [ ] Validar acceso a banners destacados
- [ ] Mensajes de upgrade cuando límite alcanzado
```

**Acción:**
- [ ] Crear 3 issues en GitHub
- [ ] Asignar labels y milestones
- [ ] Agregar a project board

---

### 🟢 PRIORIDAD 3: Documentación y Limpieza (1 hora)

#### Tarea 3.1: Crear SPRINT1_DIA2_COMPLETADO.md (30 min)

**Archivo:** `SPRINT1_DIA2_COMPLETADO.md`

**Contenido:** Resumen ejecutivo del día
- Tareas completadas
- Tiempo real vs estimado
- Próximos pasos
- Screenshots de tests pasando

#### Tarea 3.2: Actualizar README.md principal (30 min)

**Archivo:** `README.md`

**Agregar sección:**
```markdown
## 🚀 Estado Actual del Proyecto (Actualizado: 10/01/2026)

### ✅ Completado
- Backend API con endpoints de configuración
- Frontend migrado a backend como única fuente de verdad
- Sistema RLS configurado (pendiente ejecución)
- Gemini API eliminado (ahorro: $600-2,400/año)

### 🔄 En Progreso
- Integración frontend-backend (95%)
- Sistema de pagos (diseño arquitectónico)

### ⏳ Próximo
- Mercado Pago integration
- Admin Panel para catálogo maestro
- Testing automatizado

### 📊 Métricas
- Backend: ✅ Compila sin errores
- Frontend: ✅ TypeScript strict mode
- Tests: ⏳ 0% coverage (Sprint 2)
- RLS: ⚠️ Pendiente ejecución manual
```

---

## ✅ CHECKLIST DIARIO

### Mañana (3 horas)
- [ ] 09:00 - 10:00: Tarea 1.1 (Integrar DynamicFormLoader)
- [ ] 10:00 - 11:00: Tarea 1.2 (Tests de integración)
- [ ] 11:00 - 12:00: Tarea 1.3 (Optimizar DynamicFormLoader)

### Tarde (3 horas)
- [ ] 14:00 - 14:30: Tarea 2.1 (Análisis pasarelas)
- [ ] 14:30 - 15:30: Tarea 2.2 (Arquitectura pagos)
- [ ] 15:30 - 16:00: Tarea 2.3 (GitHub issues)

### Final (1 hora)
- [ ] 16:00 - 16:30: Tarea 3.1 (Documentación)
- [ ] 16:30 - 17:00: Tarea 3.2 (Update README)

---

## 🎯 CRITERIOS DE ÉXITO DEL DÍA

### ✅ Día exitoso si:
1. **Integración completa:**
   - DynamicFormLoader usado en PublicarAvisoV3
   - Tests de integración pasando
   - Sin errores en DevTools

2. **Sistema de pagos planeado:**
   - Arquitectura documentada
   - Pasarela seleccionada (Mercado Pago)
   - Issues creados en GitHub

3. **Documentación actualizada:**
   - SPRINT1_DIA2_COMPLETADO.md creado
   - README.md actualizado
   - Estado del proyecto claro

---

## 📞 SOPORTE

Si encuentras bloqueos:
1. Revisar logs de DevTools (frontend)
2. Revisar logs de Next.js (backend)
3. Ejecutar `npm run build` en ambos para detectar errores TypeScript
4. Consultar documentación en `docs/`

---

**Última actualización:** 10 de Enero, 2026 - 10:30 AM  
**Próxima revisión:** Hoy a las 17:00 (fin del día)
