# 🏛️ DECISIONES ARQUITECTÓNICAS - RURAL24
**Architecture Decision Records (ADR)**  
**Última actualización:** 8 de Enero, 2026

---

## ADR-001: Eliminar IA Generativa (Gemini API)

**Estado:** ✅ Aprobado  
**Fecha:** 8 de Enero, 2026  
**Contexto:** Plan Actualizado 2026

### Problema
El sistema usa Google Gemini API para:
- Autocompletar modelos de tractores/maquinaria
- Generar títulos y descripciones
- Extraer datos de PDFs (futuro)

**Costos:**
- Gemini cobra ~$0.002 por 1K tokens
- Estimado: 500 requests/día × 1K tokens = $1/día = $30/mes
- Escalando: 5000 requests/día = $300/mes

**Problemas adicionales:**
- API key expuesta en frontend (VITE_GEMINI_API_KEY)
- Respuestas inconsistentes (modelos generados pueden no existir)
- Latencia variable (300-2000ms)

### Decisión
**Eliminar completamente Gemini API** y reemplazar con:
- Catálogo maestro manual (Admin carga specs)
- Selects normales basados en BD
- Sin generación de texto automática

### Alternativas Consideradas
1. **Usar Gemini desde backend:** Reduce exposición, pero mantiene costos
2. **Usar modelo local (Ollama):** Requiere infraestructura propia
3. **ML Custom:** Demasiado complejo para MVP

### Consecuencias

#### Positivas
- ✅ Ahorro: $30-300/mes
- ✅ Datos consistentes (todo desde BD)
- ✅ Sin API key expuesta
- ✅ Performance predecible
- ✅ Menos dependencias externas

#### Negativas
- ❌ Admin debe cargar datos manualmente
- ❌ No hay sugerencias "inteligentes"
- ❌ Menos "wow factor" para usuarios

### Implementación
1. Remover `@google/generative-ai` de package.json
2. Eliminar `aiTextGeneratorService.ts`
3. Eliminar `aiModelGenerator.ts`
4. Actualizar `PublicarAvisoV3.tsx` con selects normales
5. Documentar en CHANGELOG

---

## ADR-002: Backend como Única Fuente de Verdad

**Estado:** ✅ Aprobado  
**Fecha:** 8 de Enero, 2026

### Problema
Actualmente hay **dos fuentes de verdad**:
```
Frontend (adFieldsConfig.ts)   ≠   Backend (Supabase)
```

Esto causa:
- Desincronización de categorías
- Admin modifica BD pero frontend no se entera
- Imposible escalar sin redeploy

### Decisión
**Backend es la ÚNICA fuente de verdad**

Implementar:
```
GET /api/config/categories → Retorna tree completo
GET /api/config/form/:categoryId → Retorna config de formulario
GET /api/config/brands?subcategoryId=X → Retorna marcas
GET /api/config/models?brandId=X → Retorna modelos
```

Frontend:
- Consume APIs en lugar de config estático
- Cache con React Query (1 hora)
- Actualización en tiempo real

### Alternativas Consideradas
1. **GraphQL:** Más flexible, pero agrega complejidad
2. **tRPC:** Type-safe, pero requiere refactor grande
3. **REST APIs:** Simple, standard, fácil de implementar ✅

### Consecuencias

#### Positivas
- ✅ Admin Panel actualiza instantáneamente
- ✅ Sin redeploy para cambios de config
- ✅ Datos consistentes en todo el sistema
- ✅ Escalable a multi-tenant

#### Negativas
- ❌ Requiere refactor de frontend
- ❌ Dependencia de backend (si cae, frontend no tiene config)
  - **Mitigación:** Cache persistente en localStorage

### Implementación
- Backend: 4 endpoints nuevos (2 días)
- Frontend: Migrar a React Query (1 día)
- Testing: E2E completo (4 horas)

---

## ADR-003: Prisma como ORM Principal

**Estado:** ✅ Aprobado  
**Fecha:** 8 de Enero, 2026

### Problema
Actualmente:
- 125+ archivos SQL sin control de versiones
- Queries manuales con Supabase client
- Sin type safety en queries
- Sin rollback strategy
- Imposible saber qué migraciones se ejecutaron

### Decisión
**Adoptar Prisma como ORM**

```typescript
// Antes (manual)
const { data } = await supabase
  .from('ads')
  .select('*')
  .eq('user_id', userId)

// Después (Prisma)
const ads = await prisma.ad.findMany({
  where: { userId }
})
```

### Alternativas Consideradas
1. **Drizzle ORM:** Más lightweight, pero menos maduro
2. **TypeORM:** Más complejo, menos DX
3. **Kysely:** Type-safe SQL, pero sin migrations
4. **Prisma:** Best DX, migrations, type safety ✅

### Consecuencias

#### Positivas
- ✅ Type safety en 100% de queries
- ✅ Migraciones con rollback (`prisma migrate`)
- ✅ Autocomplete en IDE
- ✅ Control de versiones (git)
- ✅ Prisma Studio (GUI para BD)

#### Negativas
- ❌ Curva de aprendizaje (mínima)
- ❌ Migración de queries existentes
- ❌ Dependency adicional

### Implementación
1. `npx prisma init`
2. `npx prisma db pull` (introspection)
3. Migrar queries gradualmente
4. Archivar SQLs legacy en `/database/legacy/`

---

## ADR-004: Mercado Pago como Pasarela de Pagos, en pausa.

**Estado:** ✅ Pausa.  
**Fecha:** 8 de Enero, 2026

### Problema
Sistema tiene planes Premium pero:
- Sin forma de cobrar
- Revenue = $0
- Usuarios no pueden pagar

### Decisión
**Integrar Mercado Pago**

**Razones:**
- 🇦🇷 Líder en Argentina
- 💳 Acepta todas las tarjetas locales
- 📱 Integración con QR, Rapipago, PagoFácil
- 🔧 SDK completo en Node.js
- 📊 Dashboard de pagos

### Alternativas Consideradas
1. **Stripe:** Global, pero complicado en Argentina (regulaciones)
2. **PayPal:** Menos usado en Argentina
3. **Todo Pago:** Menos features que Mercado Pago
4. **Mercado Pago:** Best fit para Argentina ✅

### Modelo de Negocio

**Planes:**
```
Free:     $0  - 1 aviso, 5 contactos/día
Starter:  $5  - 5 avisos, 20 contactos/día
Pro:      $10 - 10 avisos, 50 contactos/día, destacados
Empresa:  $50 - Ilimitado, catálogo, banners
```

**Comisión Mercado Pago:**
- 4.99% + $10 ARS por transacción
- Ejemplo: Plan Pro $10 USD = ~$10.000 ARS
- Comisión: ~$510 ARS
- Neto: ~$9.490 ARS

### Consecuencias

#### Positivas
- ✅ Revenue desde día 1 post-integración
- ✅ Multiple medios de pago
- ✅ Webhooks para automatización
- ✅ Dashboard de analytics

#### Negativas
- ❌ Comisión 5% (costo del negocio)
- ❌ Depende de servicio externo
- ❌ Regulaciones locales (AFIP, facturación)

### Implementación
1. Crear cuenta Mercado Pago Developer
2. Backend: POST /api/payments/checkout
3. Backend: Webhooks /api/webhooks/mercadopago
4. Frontend: Botón "Pagar"
5. Testing en sandbox
6. Deploy a producción

---

## ADR-005: Monorepo con Turborepo

**Estado:** ✅ Aprobado (Parcial)  
**Fecha:** 8 de Enero, 2026

### Problema
Proyecto tiene estructura de monorepo pero:
- Workspaces incompletos
- Sin packages compartidos
- Tipos duplicados entre frontend/backend

### Decisión
**Completar estructura de monorepo**

```
rural24/
├── frontend/
├── backend/
└── packages/
    ├── @rural24/types/      ← Tipos compartidos
    ├── @rural24/database/   ← Prisma Client
    ├── @rural24/config/     ← Env validation
    └── @rural24/ui/         ← Componentes (futuro)
```

### Alternativas Consideradas
1. **Nx:** Más features, pero más complejo
2. **Lerna:** Legacy, menos mantenido
3. **pnpm workspaces:** Simple, pero sin build optimization
4. **Turborepo:** Modern, rápido, best DX ✅

### Consecuencias

#### Positivas
- ✅ Sin duplicación de código
- ✅ Type safety compartido
- ✅ Build optimization (caching)
- ✅ Mejor DX (un solo `npm install`)

#### Negativas
- ❌ Requiere refactor de imports
- ❌ Configuración inicial (1 día)

### Implementación
- Fase 1: Crear `@rural24/types` ✅
- Fase 2: Crear `@rural24/database` (con Prisma) ✅
- Fase 3: Crear `@rural24/config` ✅
- Fase 4: Crear `@rural24/ui` (opcional, futuro)

---

## ADR-006: RLS Habilitado en Producción (SIEMPRE)

**Estado:** ✅ Aprobado  
**Fecha:** 8 de Enero, 2026

### Problema
Scripts de debug deshabilitan RLS:
- `EMERGENCY_DISABLE_RLS.sql`
- `DEBUG_DISABLE_RLS.sql`

**Riesgo:** Deployar a producción con RLS off = VULNERABILIDAD CRÍTICA

### Decisión
**RLS SIEMPRE habilitado en producción**

**Políticas:**
```sql
-- ads: Users ven solo los suyos
CREATE POLICY "users_view_own_ads" ON ads
  FOR SELECT USING (auth.uid() = user_id);

-- ads: SuperAdmin ve todo
CREATE POLICY "superadmin_view_all_ads" ON ads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );
```

### Reglas

**En desarrollo:**
- ✅ RLS puede deshabilitarse temporalmente para debug
- ⚠️ NUNCA commitear con RLS off
- ✅ Usar scripts de verificación antes de cada PR

**En staging/producción:**
- 🔒 RLS SIEMPRE habilitado
- ✅ Verificar con `VERIFY_RLS_STATUS.sql`
- ❌ NO existe manera de deshabilitarlo

### Pre-Deploy Checklist
```bash
□ Ejecutar: database/VERIFY_RLS_STATUS.sql
□ Verificar: rls_enabled = true en todas las tablas
□ Testing: Con 3 roles (anon, user, superadmin)
□ CI/CD: Check automático de RLS status
```

---

## ADR-007: Cloudinary para Imágenes

**Estado:** ✅ Implementado  
**Fecha:** Diciembre 2025 (ratificado Enero 2026)

### Decisión
**Cloudinary como storage principal**

### Razones
- ✅ CDN global
- ✅ Transformaciones on-the-fly
- ✅ Optimización automática (WebP, AVIF)
- ✅ Lazy loading URLs
- ✅ Free tier: 25 créditos/mes

### Alternativas Descartadas
1. ~~Cloudflare R2~~: Más configuración
2. ~~Supabase Storage~~: Sin transformaciones
3. ~~AWS S3~~: Más complejo

### Implementación Actual
```
Frontend → Backend (BFF) → Cloudinary
           ↓
       Validaciones:
       - Aspect ratio (16:9, 4:3)
       - Tamaño (max 10MB)
       - MIME type (solo imágenes)
       - Rate limiting (10/5min)
```

---

## ADR-008: Next.js 16 como Backend (BFF)

**Estado:** ✅ Implementado  
**Fecha:** Diciembre 2025

### Decisión
**Next.js como Backend for Frontend (BFF)**

### Razones
- ✅ Mismo lenguaje (TypeScript)
- ✅ API Routes built-in
- ✅ Edge Runtime (performance)
- ✅ Deploy simple (Vercel)
- ✅ Shared types con frontend

### Alternativas
1. ~~Nest.js~~: Más complejo, overkill para MVP
2. ~~Express~~: Menos features built-in
3. ~~Fastify~~: Performance, pero menos ecosystem

### Arquitectura
```
Frontend (Vite) → Backend (Next.js) → Supabase
                         ↓
                    Cloudinary
                         ↓
                    Mercado Pago
```

---

## 📊 RESUMEN DE DECISIONES

| ADR | Decisión | Estado | Prioridad |
|-----|----------|--------|-----------|
| 001 | Eliminar Gemini API | Aprobado | 🔴 Alta |
| 002 | Backend como única fuente | Aprobado | 🔴 Alta |
| 003 | Prisma ORM | Aprobado | 🟡 Media |
| 004 | Mercado Pago | Aprobado | 🔴 Crítica |
| 005 | Monorepo completo | Aprobado | 🟢 Baja |
| 006 | RLS siempre habilitado | Aprobado | 🔴 Crítica |
| 007 | Cloudinary | Implementado | ✅ Done |
| 008 | Next.js BFF | Implementado | ✅ Done |

---

**Próximas decisiones:**
- ADR-009: Sistema de notificaciones (Email vs Push)
- ADR-010: Analytics (Google Analytics vs Vercel Analytics)
- ADR-011: Error tracking (Sentry vs LogRocket)
- ADR-012: Testing strategy (Vitest + Playwright)

---

**Mantenimiento:**
- Revisar ADRs cada 3 meses
- Actualizar con nuevas decisiones
- Archivar decisiones obsoletas
