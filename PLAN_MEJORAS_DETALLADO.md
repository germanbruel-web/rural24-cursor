# 📋 PLAN DE MEJORAS - RURAL24 2026
**Roadmap Técnico y de Negocio**  
**Fecha inicio:** 8 de Enero, 2026  
**Duración:** 14 días (2 sprints)

---

## 🎯 OBJETIVO

Llevar Rural24 desde estado actual (MVP funcional pero con deuda técnica) a **estado production-ready** con sistema de pagos funcionando y arquitectura escalable.

---

## 📊 SPRINT 1: SEGURIDAD + ARQUITECTURA (Días 1-7)

### DÍA 1: Seguridad RLS + Eliminación IA Costosa

#### 🔴 Tarea 1.1: Verificar y Habilitar RLS
**Responsable:** Dev Backend  
**Duración:** 2 horas  
**Archivos:**
- `database/VERIFY_RLS_STATUS.sql`
- `database/FIX_500_ERRORS_RLS.sql`

**Pasos:**
```bash
1. cd backend
2. Conectar a Supabase SQL Editor
3. Ejecutar: VERIFY_RLS_STATUS.sql
4. Si rls_enabled = false → Ejecutar FIX_500_ERRORS_RLS.sql
5. Verificar políticas:
   - ads: SuperAdmin ve todo, users ven solo suyos
   - users: Cada user ve su perfil
   - categories: Todos leen, solo admin escribe
6. Testing manual con 3 roles:
   - anon (sin auth)
   - authenticated (user normal)
   - superadmin
7. Documentar estado en: docs/RLS_STATUS_JAN_2026.md
```

**Criterio de éxito:**
- [ ] RLS habilitado en todas las tablas críticas
- [ ] Testing passed con 3 roles diferentes
- [ ] Documentación actualizada

---

#### 🟡 Tarea 1.2: Eliminar Gemini API (Reducir Costos)
**Responsable:** Dev Frontend  
**Duración:** 4 horas  
**Ahorro estimado:** $50-200/mes

**Pasos:**
```bash
1. Remover dependencia:
   cd frontend
   npm uninstall @google/generative-ai @google/genai

2. Eliminar servicios:
   rm src/services/aiTextGeneratorService.ts
   rm src/services/aiModelGenerator.ts

3. Actualizar componentes:
   - src/components/pages/PublicarAvisoV3.tsx
     (eliminar autocompletado con IA, usar select normal)
   
4. Limpiar .env:
   - Remover VITE_GEMINI_API_KEY

5. Testing:
   npm run dev
   Verificar que formulario funciona sin IA
```

**Archivos afectados:**
- `frontend/package.json`
- `frontend/.env.local`
- `frontend/src/services/aiTextGeneratorService.ts` (DELETE)
- `frontend/src/services/aiModelGenerator.ts` (DELETE)
- `frontend/src/components/pages/PublicarAvisoV3.tsx` (UPDATE)

**Criterio de éxito:**
- [ ] 0 llamadas a Gemini API
- [ ] Formulario funciona con selects normales
- [ ] Build exitoso sin warnings

---

### DÍAS 2-3: Backend como Única Fuente de Verdad

#### 🔴 Tarea 2.1: Crear Endpoints de Configuración
**Responsable:** Dev Backend  
**Duración:** 8 horas (2 días)

**Endpoints a crear:**

##### 1. GET /api/config/categories
```typescript
// backend/app/api/config/categories/route.ts
export async function GET() {
  // Retorna tree: categories → subcategories → types
  // Con metadata: icono, color, orden
  // Cache: 1 hora
}
```

##### 2. GET /api/config/form/:categoryId
```typescript
// backend/app/api/config/form/[categoryId]/route.ts
export async function GET(request, { params }) {
  // Retorna configuración de formulario dinámico
  // Fields, validations, options
  // Basado en: form_templates_v2 + form_fields_v2
}
```

##### 3. GET /api/config/brands?subcategoryId=X
```typescript
// backend/app/api/config/brands/route.ts
export async function GET(request) {
  // Retorna marcas filtradas por subcategoría
  // Join: subcategory_brands
}
```

##### 4. GET /api/config/models?brandId=X
```typescript
// backend/app/api/config/models/route.ts
export async function GET(request) {
  // Retorna modelos de una marca
  // Con specs técnicas del catálogo maestro
}
```

**Pasos:**
```bash
1. Crear archivos de rutas
2. Implementar queries con Supabase client
3. Agregar validación Zod en params
4. Implementar cache (in-memory simple)
5. Testing con Postman/Thunder Client
6. Documentar en: docs/API_CONFIG.md
```

**Criterio de éxito:**
- [ ] 4 endpoints funcionando
- [ ] Response time < 200ms
- [ ] Cache implementado
- [ ] Documentación API completa

---

#### 🔴 Tarea 2.2: Migrar Frontend a APIs Backend
**Responsable:** Dev Frontend  
**Duración:** 6 horas

**Pasos:**
```typescript
1. Crear servicio API:
   // frontend/src/services/configApi.ts
   export const getCategories = () => axios.get('/api/config/categories')
   export const getFormConfig = (catId) => axios.get(`/api/config/form/${catId}`)
   
2. Implementar React Query:
   // frontend/src/hooks/useCategories.ts
   export const useCategories = () => {
     return useQuery('categories', getCategories, {
       staleTime: 1000 * 60 * 60, // 1 hora
       cacheTime: 1000 * 60 * 60 * 24, // 24 horas
     })
   }

3. Actualizar componentes:
   - PublicarAvisoV3.tsx → useCategories()
   - CategorySelect.tsx → useBrands(subcategoryId)
   - ModelSelect.tsx → useModels(brandId)

4. Eliminar archivos legacy:
   rm frontend/src/config/adFieldsConfig.ts
   rm frontend/src/constants/categories.ts

5. Testing:
   - Verificar carga de categorías
   - Verificar formulario dinámico
   - Verificar filtros en cascada
```

**Criterio de éxito:**
- [ ] 0% configuración hardcoded
- [ ] 100% datos desde backend
- [ ] UX igual o mejor que antes
- [ ] No hay regresiones

---

### DÍA 4: Testing End-to-End

#### Tarea 3.1: Testing Integrado
**Responsable:** QA / Dev Lead  
**Duración:** 4 horas

**Casos de prueba:**
```
□ Usuario sin auth:
  - Ve categorías desde BD
  - No puede publicar aviso

□ Usuario autenticado:
  - Publica aviso con formulario dinámico
  - Imágenes suben a Cloudinary
  - RLS permite ver solo sus avisos

□ SuperAdmin:
  - Ve todos los avisos
  - Modifica categoría en admin
  - Cambio se refleja inmediatamente en frontend

□ Performance:
  - Carga inicial < 2 seg
  - Formulario responde < 300ms
  - Imágenes optimizadas con Cloudinary
```

---

## 📊 SPRINT 2: MONETIZACIÓN + OPTIMIZACIÓN (Días 8-14)

### DÍAS 8-10: Sistema de Pagos (CRÍTICO DE NEGOCIO)

#### 🔴 Tarea 4.1: Setup Mercado Pago
**Responsable:** Dev Backend + Product Owner  
**Duración:** 3-4 días

**Fase A: Configuración (Día 8)**
```bash
1. Crear cuenta Mercado Pago:
   https://www.mercadopago.com.ar/developers

2. Obtener credentials:
   - Public Key (para frontend)
   - Access Token (para backend)
   - Webhook Secret

3. Instalar SDK:
   cd backend
   npm install mercadopago

4. Configurar .env:
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
   MERCADOPAGO_PUBLIC_KEY=APP_USR-...
   MERCADOPAGO_WEBHOOK_SECRET=...
```

**Fase B: Backend APIs (Día 9)**
```typescript
// backend/app/api/payments/checkout/route.ts
export async function POST(request: NextRequest) {
  // 1. Validar usuario autenticado
  // 2. Validar plan seleccionado (Free/Starter/Pro/Empresa)
  // 3. Crear preferencia de pago en Mercado Pago
  // 4. Retornar checkout URL
  return { checkoutUrl, paymentId }
}

// backend/app/api/webhooks/mercadopago/route.ts
export async function POST(request: NextRequest) {
  // 1. Verificar signature del webhook
  // 2. Procesar notificación:
  //    - payment.created
  //    - payment.updated (approved/rejected)
  // 3. Actualizar tabla user_subscriptions
  // 4. Enviar email de confirmación
  return { received: true }
}
```

**Fase C: Base de Datos (Día 9)**
```sql
-- database/PAYMENT_SYSTEM_MIGRATION.sql

-- Tabla de transacciones
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  plan_name VARCHAR(50) NOT NULL, -- 'starter', 'pro', 'empresa'
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ARS',
  
  -- Mercado Pago
  mp_payment_id VARCHAR(100) UNIQUE,
  mp_preference_id VARCHAR(100),
  mp_status VARCHAR(50), -- 'pending', 'approved', 'rejected'
  mp_status_detail TEXT,
  
  -- Metadata
  payment_method VARCHAR(50), -- 'credit_card', 'debit_card', etc
  installments INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- Tabla de suscripciones activas
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  plan_name VARCHAR(50) NOT NULL,
  
  -- Estado
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  
  -- Billing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  
  -- Relación con payment
  last_payment_id UUID REFERENCES payment_transactions(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Solo el usuario ve sus pagos
CREATE POLICY "Users can view own payments"
ON payment_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Solo el usuario ve su suscripción
CREATE POLICY "Users can view own subscription"
ON user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- SuperAdmin ve todo
CREATE POLICY "SuperAdmin can view all payments"
ON payment_transactions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'superadmin'
  )
);
```

**Fase D: Frontend Integration (Día 10)**
```typescript
// frontend/src/components/pages/PricingPage.tsx
const handleSelectPlan = async (planId: string) => {
  if (!user) {
    setShowAuthModal(true);
    return;
  }
  
  try {
    // Crear checkout
    const response = await axios.post('/api/payments/checkout', {
      planName: planId
    });
    
    // Redirigir a Mercado Pago
    window.location.href = response.data.checkoutUrl;
    
  } catch (error) {
    notify.error('Error al procesar el pago');
  }
}
```

**Testing en Sandbox (Día 10)**
```bash
1. Usar tarjetas de prueba de Mercado Pago
2. Simular pago exitoso
3. Verificar webhook recibido
4. Verificar user_subscriptions actualizada
5. Verificar email enviado
```

**Criterio de éxito:**
- [ ] Checkout funciona en sandbox
- [ ] Webhooks procesan pagos correctamente
- [ ] User subscription se actualiza
- [ ] Email de confirmación se envía
- [ ] Dashboard muestra plan activo

---

### DÍA 11: Consolidar Migraciones con Prisma

#### 🟢 Tarea 5.1: Migrar a Prisma
**Responsable:** Dev Backend  
**Duración:** 1 día

**Pasos:**
```bash
1. Instalar Prisma:
   cd backend
   npm install @prisma/client
   npm install -D prisma

2. Inicializar:
   npx prisma init

3. Configurar .env:
   DATABASE_URL="postgresql://..."

4. Introspection (obtener schema actual):
   npx prisma db pull
   
5. Generar Prisma Client:
   npx prisma generate

6. Crear baseline migration:
   npx prisma migrate dev --name init

7. Archivar SQLs legacy:
   mkdir database/legacy
   mv database/*.sql database/legacy/
   (excepto: 000_EXECUTE_ALL_MIGRATIONS.sql)

8. Actualizar código:
   - Reemplazar queries manuales por Prisma
   - Ejemplo: adsRepository.ts → usar prisma.ads.findMany()

9. Testing:
   - Verificar queries funcionan igual
   - Verificar performance similar

10. Documentar:
    docs/PRISMA_SETUP.md
```

**Beneficios:**
- ✅ Type safety en queries
- ✅ Migraciones con rollback
- ✅ Control de versiones automático
- ✅ Better DX (autocomplete en IDE)

**Criterio de éxito:**
- [ ] Prisma generando tipos correctamente
- [ ] Todas las queries migradas
- [ ] Tests passing
- [ ] Documentación completa

---

### DÍA 12: Monorepo - Shared Packages

#### 🟢 Tarea 6.1: Crear Packages Compartidos
**Responsable:** Dev Lead  
**Duración:** 1 día

**Estructura final:**
```
rural24/
├── frontend/
├── backend/
└── packages/
    ├── @rural24/types/
    │   ├── package.json
    │   └── src/
    │       ├── ad.types.ts
    │       ├── user.types.ts
    │       └── index.ts
    │
    ├── @rural24/database/
    │   ├── package.json
    │   ├── prisma/
    │   │   └── schema.prisma
    │   └── src/
    │       └── index.ts (export PrismaClient)
    │
    └── @rural24/config/
        ├── package.json
        └── src/
            └── env.ts (validación Zod de .env)
```

**Pasos:**
```bash
1. Crear estructura:
   mkdir -p packages/@rural24/{types,database,config}

2. Package: @rural24/types
   cd packages/@rural24/types
   npm init -y
   # Mover tipos compartidos desde frontend/types.ts
   # Exportar todo en index.ts

3. Package: @rural24/database
   cd packages/@rural24/database
   npm init -y
   npm install @prisma/client
   # Mover prisma/ desde backend
   # Exportar PrismaClient singleton

4. Package: @rural24/config
   cd packages/@rural24/config
   npm init -y
   npm install zod
   # Crear validador de env con Zod

5. Actualizar root package.json:
   "workspaces": [
     "frontend",
     "backend",
     "packages/@rural24/*"
   ]

6. Actualizar imports:
   // Antes
   import { Ad } from '../../types'
   
   // Después
   import { Ad } from '@rural24/types'

7. Testing:
   npm run build (en root)
   turbo run build --filter=@rural24/*
```

**Criterio de éxito:**
- [ ] 3 packages creados
- [ ] Imports funcionando en frontend/backend
- [ ] Build exitoso
- [ ] No duplicación de código

---

### DÍAS 13-14: Testing Final + Deploy Staging

#### 🎯 Tarea 7.1: Testing E2E Completo
**Responsable:** Todo el equipo  
**Duración:** 1.5 días

**Casos de prueba críticos:**

```
□ User Journey: Registro → Pago → Publicar Aviso
  1. Usuario se registra (Free)
  2. Ve pricing page
  3. Selecciona plan Pro ($10 USD)
  4. Paga con Mercado Pago (sandbox)
  5. Recibe email de confirmación
  6. Dashboard muestra plan activo
  7. Publica aviso con formulario dinámico
  8. Aviso aparece en listado
  9. Upload de 8 imágenes horizontales
  10. Aviso visible en frontend

□ Admin Workflow:
  1. SuperAdmin modifica categoría
  2. Cambio se refleja en frontend inmediatamente
  3. Aprueba aviso pendiente
  4. Usuario recibe notificación

□ Security:
  1. RLS bloquea acceso no autorizado
  2. User solo ve sus avisos
  3. SuperAdmin ve todo
  4. Anon no puede modificar nada

□ Performance:
  1. Homepage carga < 2 seg
  2. Formulario responde < 300ms
  3. Images optimizadas (Cloudinary)
  4. APIs responden < 200ms
```

---

#### 🚀 Tarea 7.2: Deploy a Staging
**Responsable:** DevOps / Dev Lead  
**Duración:** 4 horas

**Pasos:**
```bash
1. Preparar Vercel:
   - Conectar repo GitHub
   - Configurar env vars (staging)
   - Deploy frontend + backend

2. Preparar Supabase:
   - Crear proyecto staging
   - Ejecutar migraciones Prisma
   - Configurar RLS

3. Configurar Cloudinary:
   - Folder staging/
   - Upload preset separado

4. Configurar Mercado Pago:
   - Usar credentials de sandbox

5. Deploy:
   git push origin staging
   Vercel auto-deploy

6. Smoke tests:
   - Health check: /api/health
   - Login funciona
   - Publicar aviso funciona
   - Pago funciona (sandbox)

7. Monitoring:
   - Vercel Analytics
   - Supabase logs
   - Sentry (optional)
```

**URLs Staging:**
- Frontend: `https://rural24-staging.vercel.app`
- Backend: `https://rural24-staging.vercel.app/api`
- Supabase: `https://staging-rural24.supabase.co`

**Criterio de éxito:**
- [ ] Deploy exitoso
- [ ] Smoke tests passing
- [ ] No errores en logs
- [ ] Listo para user testing

---

## 📈 MÉTRICAS DE ÉXITO

### Técnicas (Al final de Sprint 2)
- [ ] RLS: 100% habilitado en producción
- [ ] Configuración: 0% hardcoded, 100% desde BD
- [ ] IA: $0 gastos en Gemini API
- [ ] Migraciones: 100% con Prisma
- [ ] Type safety: 100% con shared packages
- [ ] APIs: < 200ms response time
- [ ] Frontend: < 2 seg carga inicial

### Negocio
- [ ] Sistema de pagos: Funcional en staging
- [ ] Primer pago test: Exitoso
- [ ] Webhooks: Procesando correctamente
- [ ] Email confirmación: Enviándose
- [ ] Dashboard: Mostrando plan activo

### UX
- [ ] Formulario: < 3 min para completar
- [ ] Upload: < 2 seg por imagen
- [ ] Mensajes: 100% accionables
- [ ] Mobile: 100% responsive

---

## 🚀 POST-SPRINT: Deploy a Producción

### Pre-requisitos

**Checklist obligatorio:**
```
Seguridad:
□ RLS verificado en todas las tablas
□ Secrets en Vercel env vars
□ CORS configurado solo para dominio prod
□ Rate limiting activo
□ Honeypot en formularios

Negocio:
□ Mercado Pago: Credentials PRODUCTION
□ Webhooks verificados con IP whitelist
□ Términos y condiciones aprobados
□ Política de privacidad publicada
□ Email confirmation obligatoria

Performance:
□ Cloudinary: Transformations configuradas
□ React Query: Cache configurado
□ Bundle: < 500KB gzipped
□ Lighthouse: Score > 90

Legal:
□ GDPR compliance (si aplicable)
□ Cookie consent banner
□ Data retention policy
```

### Proceso de Deploy

```bash
# 1. Merge staging → main
git checkout main
git merge staging
git push origin main

# 2. Deploy automático via Vercel
# Vercel detecta push a main y deploya

# 3. Ejecutar migraciones
npx prisma migrate deploy

# 4. Verificar health
curl https://rural24.vercel.app/api/health

# 5. Smoke tests en producción
- Login con usuario real
- Publicar aviso de prueba
- Pagar plan con tarjeta real ($1 test)
- Verificar webhook recibido

# 6. Monitoring 24hs
- Vercel logs
- Sentry errors
- Supabase queries
- Mercado Pago dashboard
```

---

## 📊 KANBAN SUGERIDO

### TODO
- [ ] Verificar RLS status
- [ ] Eliminar Gemini API
- [ ] Crear endpoints /api/config/*
- [ ] Migrar frontend a APIs
- [ ] Setup Mercado Pago

### IN PROGRESS
- (mover tareas según avance)

### TESTING
- (tareas completadas, en testing)

### DONE
- [x] Análisis crítico
- [x] Plan de mejoras
- [x] Documentación

---

## 📞 CONTACTO Y SOPORTE

**Durante el Sprint:**
- Daily standup: 9:00 AM (15 min)
- Code reviews: Obligatorias para features críticas
- Bloqueadores: Comunicar inmediatamente

**Post-Deploy:**
- Monitoring: 24/7 primera semana
- Hotfixes: Prioridad máxima
- User feedback: Recopilar y priorizar

---

**Última actualización:** 8 de Enero, 2026  
**Próxima revisión:** 15 de Enero (post-Sprint 1)  
**Deploy target:** 22 de Enero (post-Sprint 2)
