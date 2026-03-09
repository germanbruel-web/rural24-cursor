# Sprint 6 — Sistema de Páginas de Empresa (Fanpage)
## Documento de Arquitectura Definitivo

> **Fecha:** 2026-03-09
> **Estado:** DISEÑO APROBADO — pendiente implementación
> **Sprints:** 6A (DB) → 6B (Dashboard) → 6C (Publicar) → 6D (Perfil público)

---

## DECISIONES DE NEGOCIO CONFIRMADAS

| Decisión | Respuesta |
|---|---|
| FREE — empresas | 0 |
| PREMIUM — empresas | 1 incluida |
| Plan "Empresas 2" | 2 empresas |
| Plan "Empresas 4" | 4 empresas |
| Verificación | Automática progresiva: Email + Teléfono mínimo |
| Co-admin | V2 |
| CUIT/DNI | DNI + CUIL individual. CUIT empresa opcional. Factura C únicamente (sin Factura A) |
| Identidad del owner | Opcional: `owner_public` (default: false). La empresa NO muestra el owner por defecto |
| Link empresa en AdDetail | Por defecto VISIBLE. Owner puede ocultarlo (`show_on_ad_detail`, default: true) |
| Brands | JSONB opcional en `business_profiles.brands_worked` |

---

## SISTEMA DE VERIFICACIÓN (AntiVerification Control)

### Estado existente en DB (ya existe, no crear)
```sql
users.is_verified                 -- email verificado
users.email_verified              -- flag email
users.mobile_verification_code    -- OTP SMS (ya existe)
users.mobile_verification_sent_at
users.mobile_verification_attempts
users.verification_status         -- 'pending' | 'pending_verification' | 'verified' | 'rejected'
```

### Regla de negocio
```
Usuario publica aviso
  ├── Cards (SearchResults, HomePage) → SIEMPRE visible
  └── AdDetail (página de detalle)
        ├── email_verified = true AND mobile verificado = true → muestra detalle completo
        └── CUALQUIERA falta → muestra "AntiVerification Wall"
              "Este aviso está pendiente de verificación.
               El vendedor debe verificar su cuenta para activarlo."
              [El vendedor es avisado en cada login que complete la verificación]
```

### Perfil completion tracking
```sql
-- Agregar a users:
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  profile_completion_pct integer DEFAULT 0;
  -- Calculado: email(30%) + teléfono(30%) + nombre(20%) + provincia(10%) + foto(10%)
  -- Trigger recalcula en UPDATE de users
```

### Notificación en login
- Si `profile_completion_pct < 100` → banner/toast al login: "Tu perfil está al X% — completalo para publicar sin restricciones"
- Si empresa tiene avisos activos y `email_verified = false` → alerta urgente

---

## MODELO DE DATOS — SPRINT 6A

### A. Cambios en `subscription_plans`
```sql
-- Reemplazar booleano por número (más flexible)
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS max_company_profiles integer DEFAULT 0;
  -- 0 = FREE, 1 = PREMIUM, 2 = Plan Empresas 2, 4 = Plan Empresas 4

-- Actualizar planes existentes:
UPDATE subscription_plans SET max_company_profiles = 0 WHERE name = 'free';
UPDATE subscription_plans SET max_company_profiles = 1 WHERE name = 'premium';
-- Crear planes Empresas 2 y 4 si no existen
```

### B. Romper 1:1 en `business_profiles`
```sql
-- Eliminar constraint única user_id (era 1:1)
ALTER TABLE business_profiles
  DROP CONSTRAINT IF EXISTS business_profiles_user_id_key;

-- El campo user_id pasa a ser "owner_id" conceptualmente
-- Se mantiene como user_id para backward compat con código existente
-- Semántica: el usuario que creó la empresa (owner inmutable)
```

### C. Nuevos campos en `business_profiles`
```sql
ALTER TABLE business_profiles
  -- Facturación (del owner)
  ADD COLUMN IF NOT EXISTS owner_dni        varchar(15),
  ADD COLUMN IF NOT EXISTS owner_cuil       varchar(15),
  ADD COLUMN IF NOT EXISTS business_cuit    varchar(15),   -- CUIT empresa (opcional)
  ADD COLUMN IF NOT EXISTS invoice_type     varchar(5) DEFAULT 'C',  -- Solo 'C' por ahora

  -- Contenido
  ADD COLUMN IF NOT EXISTS brands_worked    jsonb DEFAULT '[]'::jsonb,
  -- [{ "name": "John Deere", "logo_url": null }, ...]

  ADD COLUMN IF NOT EXISTS gallery_images   jsonb DEFAULT '[]'::jsonb,
  -- [{ "url": "cloudinary_url", "caption": "" }, ...]

  ADD COLUMN IF NOT EXISTS phone            varchar(30),
  ADD COLUMN IF NOT EXISTS email            varchar(150),
  ADD COLUMN IF NOT EXISTS address          text,

  -- Privacidad
  ADD COLUMN IF NOT EXISTS owner_public     boolean DEFAULT false,
  -- false = no muestra nombre del owner en página pública (como Facebook)
  -- true  = muestra nombre del owner (como LinkedIn)

  ADD COLUMN IF NOT EXISTS show_on_ad_detail boolean DEFAULT true,
  -- true  = muestra "Ver Perfil de Empresa" en avisos del owner
  -- false = el owner oculta el vínculo (mantiene aviso como "particular")

  -- Verificación empresa
  ADD COLUMN IF NOT EXISTS verified_at      timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by      uuid REFERENCES auth.users(id);
```

### D. Tabla `business_profile_members` (N:M — preparada para V2)
```sql
-- Para la lógica de negocio actual (1 owner), se usa para:
--   1. Lookup "mis empresas" de un usuario (más eficiente que filtrar user_id)
--   2. Preparado para multi-admin V2

CREATE TABLE IF NOT EXISTS business_profile_members (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_profile_id uuid        NOT NULL
    REFERENCES business_profiles(id) ON DELETE CASCADE,
  user_id             uuid        NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  role                varchar(20) DEFAULT 'owner'
    CHECK (role IN ('owner', 'admin', 'editor')),
  joined_at           timestamptz DEFAULT now(),
  UNIQUE(business_profile_id, user_id)
);

-- Backfill desde business_profiles existentes
INSERT INTO business_profile_members (business_profile_id, user_id, role)
SELECT id, user_id, 'owner'
FROM business_profiles
ON CONFLICT DO NOTHING;

-- Índices
CREATE INDEX IF NOT EXISTS idx_bp_members_user_id
  ON business_profile_members(user_id);
CREATE INDEX IF NOT EXISTS idx_bp_members_profile_id
  ON business_profile_members(business_profile_id);
```

### E. Trigger: límite de empresas por plan
```sql
CREATE OR REPLACE FUNCTION check_max_companies_per_user()
RETURNS TRIGGER AS $$
DECLARE
  max_allowed    integer;
  current_count  integer;
BEGIN
  -- Solo aplica al crear empresa (owner)
  IF NEW.role != 'owner' THEN RETURN NEW; END IF;

  -- Obtener límite del plan del usuario
  SELECT COALESCE(sp.max_company_profiles, 0)
    INTO max_allowed
    FROM users u
    LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
    WHERE u.id = NEW.user_id;

  -- Superadmin: sin límite
  IF (SELECT role FROM users WHERE id = NEW.user_id) = 'superadmin' THEN
    RETURN NEW;
  END IF;

  -- Contar empresas actuales
  SELECT COUNT(*) INTO current_count
    FROM business_profile_members
    WHERE user_id = NEW.user_id AND role = 'owner';

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'COMPANY_LIMIT_REACHED: Tu plan permite hasta % empresa(s). Contratá un plan superior.', max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_max_companies ON business_profile_members;
CREATE TRIGGER enforce_max_companies
  BEFORE INSERT ON business_profile_members
  FOR EACH ROW EXECUTE FUNCTION check_max_companies_per_user();
```

### F. RLS actualizado
```sql
-- business_profiles
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- Lectura: perfiles activos son públicos
DROP POLICY IF EXISTS "Public can view active companies" ON business_profiles;
CREATE POLICY "Public can view active companies" ON business_profiles
  FOR SELECT USING (is_active = true);

-- Escritura: solo owner (user_id) puede modificar su empresa
-- (En V2 extender a miembros con rol admin)
DROP POLICY IF EXISTS "Owner can manage company" ON business_profiles;
CREATE POLICY "Owner can manage company" ON business_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Superadmin: todo
CREATE POLICY "Superadmin full access companies" ON business_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- business_profile_members
ALTER TABLE business_profile_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read their memberships" ON business_profile_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Owner manages members" ON business_profile_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE id = business_profile_id AND user_id = auth.uid()
    )
  );
```

### G. Índices adicionales
```sql
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id
  ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_slug
  ON business_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_ads_business_profile
  ON ads(business_profile_id) WHERE business_profile_id IS NOT NULL;
```

---

## FLUJO UX — PUBLICAR AVISO

### Selector inline en PublicarAviso
El selector aparece como primer elemento antes del wizard (sin agregar step).

```
┌────────────────────────────────────────────────────────┐
│  Publicar como:                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  👤  Mi cuenta personal (Particular)          ▼  │  │
│  │  ─────────────────────────────────────────────   │  │
│  │  🏢  Agro Sur SRL                               │  │
│  │  🏢  Maquinarias del Norte SA                   │  │
│  │  ─────────────────────────────────────────────   │  │
│  │  ＋  Crear nueva empresa                         │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

**Comportamiento:**
- Default: `null` (Particular) — `ad.ad_type = 'particular'`, `ad.business_profile_id = null`
- Selecciona empresa: `ad.ad_type = 'company'`, `ad.business_profile_id = empresa.id`
- Solo aparece si el usuario tiene ≥ 1 empresa activa
- "Crear nueva empresa" → abre `EmpresaForm` en drawer/modal

---

## PÁGINA PÚBLICA DE EMPRESA

### URL: `#/empresa/:slug`

```
┌──────────────────────────────────────────────────────────┐
│  COVER IMAGE  (full width, ratio 4:1, Cloudinary)        │
├──────────────────────────────────────────────────────────┤
│  [LOGO]  Agro Sur SRL                   ✅ Verificada    │
│          "Concesionario oficial John Deere — Córdoba"    │
│          📍 Río Cuarto, Córdoba                          │
│          📞 WhatsApp  🌐 Web  📸 Instagram               │
│          [Si owner_public=true: 👤 Juan Pérez]           │
├──────────────────────────────────────────────────────────┤
│  SOBRE LA EMPRESA          │  MARCAS QUE TRABAJA         │
│  Descripción...           │  [JD] [Case] [New Holland]  │
│  📧 email                 │                              │
│  📞 teléfono              │  CATEGORÍAS ACTIVAS          │
│  📍 dirección completa    │  Maquinarias (12 avisos)     │
│                           │  Servicios (4 avisos)        │
├──────────────────────────────────────────────────────────┤
│  AVISOS PUBLICADOS                                       │
│  [Todos ▼] [Maquinarias] [Servicios] [Insumos]          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│  │Card │ │Card │ │Card │ │Card │ │Card │              │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘              │
│                     [Ver más (8 más)]                    │
├──────────────────────────────────────────────────────────┤
│  GALERÍA                                                 │
│  [Foto][Foto][Foto][Foto][Foto][Foto] → lightbox        │
└──────────────────────────────────────────────────────────┘
```

### AdDetail — vínculo empresa (cuando `show_on_ad_detail = true`)
```
┌────────────────────────────────────────────────────────┐
│  [Logo pequeño]  Agro Sur SRL                          │
│                  Concesionario oficial — Córdoba        │
│                  [Ver perfil de empresa →]              │
└────────────────────────────────────────────────────────┘
```
- Se muestra si `ad.business_profile_id IS NOT NULL`
  AND `business_profile.show_on_ad_detail = true`
- El owner puede desactivarlo desde su configuración de empresa
- El nombre del owner NO aparece (owner_public = false por defecto)

---

## PANEL "MIS EMPRESAS" (Dashboard)

```
Mi Cuenta → Mis Empresas

┌───────────────────────────────────────────────────┐
│  MIS EMPRESAS                    [+ Nueva empresa] │
│  Plan: Premium · 1/1 empresas utilizadas           │
├───────────────────────────────────────────────────┤
│  [Logo] Agro Sur SRL              ✅ Verificada    │
│         12 avisos · 340 visitas este mes           │
│         [Ver perfil] [Editar] [Publicar aviso]     │
├───────────────────────────────────────────────────┤
│  Si plan permite más empresas:                     │
│  [+ Agregar empresa]                               │
│  Si llega al límite:                               │
│  [🔒 Necesitás Plan Empresas 2 para agregar más]   │
└───────────────────────────────────────────────────┘
```

---

## ANTI-DUPLICACIÓN

| Riesgo | Solución |
|---|---|
| Mismo nombre, distinto slug | Búsqueda fuzzy `ilike` al escribir nombre → "¿Esta es tu empresa?" |
| CUIT duplicado | `business_cuit UNIQUE` en DB → error claro |
| Usuario crea empresa que ya existe | Sugerir "reclamar empresa" (V2) |
| Reseller publica como empresa de otro | Solo puede seleccionar sus propias empresas (user_id check) |
| Spam de empresas falsas | Trigger límite por plan + verificación requerida para publicar |
| Duplicados en producción | Panel superadmin: merge empresa → reasigna avisos + redirige slug |

---

## FACTURACIÓN (Nota de negocio)

- El que paga siempre es un **individuo físico**
- Datos requeridos al pagar: **DNI + CUIL** (en `users` o en `business_profiles.owner_*`)
- CUIT de empresa: opcional (el usuario lo puede declarar)
- Rural24 emite **solo Factura C** hasta nuevo aviso — mostrar aviso claro en el checkout
- Si el usuario pide Factura A → informar "Emitimos Factura C. Para facturación empresarial, contactanos."

---

## PLAN DE SPRINTS

### Sprint 6A — DB Core (1 sesión)
**Archivo:** `supabase/migrations/20260309000001_sprint6a_empresas_db.sql`
- [ ] `ALTER TABLE subscription_plans ADD max_company_profiles`
- [ ] `ALTER TABLE business_profiles DROP CONSTRAINT unique_user_id`
- [ ] `ALTER TABLE business_profiles ADD` (brands, gallery, owner_public, show_on_ad_detail, etc.)
- [ ] `CREATE TABLE business_profile_members`
- [ ] Backfill memberships
- [ ] Trigger `check_max_companies_per_user`
- [ ] RLS actualizado
- [ ] `ALTER TABLE users ADD profile_completion_pct`

### Sprint 6B — Dashboard Mis Empresas (1-2 sesiones)
**Archivos:**
- `frontend/src/components/dashboard/MisEmpresasPanel.tsx`
- `frontend/src/components/dashboard/EmpresaForm.tsx` (create/edit drawer)
- `frontend/src/services/empresaService.ts`
- Agregar tab "Mis Empresas" en DashboardLayout

### Sprint 6C — Publicar con Empresa (1 sesión)
**Archivos:**
- `frontend/src/components/shared/EmpresaSelectorWidget.tsx`
- Integrar en `PublicarAviso.tsx` (antes del wizard)
- `empresaService.getMyCompanies()` → lista para el selector

### Sprint 6D — Perfil Público (1-2 sesiones)
**Archivos:**
- `frontend/src/components/pages/EmpresaPublicPage.tsx`
- Routing en `App.tsx`: `#/empresa/:slug`
- `empresaService.getCompanyBySlug(slug)` + avisos paginados
- Widget empresa en `AdDetail.tsx` y `AdDetailPage.tsx`

### Sprint 6E — AntiVerification + Notificaciones (1 sesión)
**Archivos:**
- `frontend/src/components/shared/AntiVerificationWall.tsx`
- Integrar en `AdDetail.tsx` + `AdDetailPage.tsx`
- Banner login en `DashboardLayout.tsx`
- `profile_completion_pct` cálculo + display en Profile

---

## NOTAS DE IMPLEMENTACIÓN

1. `companyProfileService.ts` existente (Sprint 3G) mapea a `business_profiles` — reutilizar y extender
2. `CompanyProfilePage.tsx` existente — reescribir como `EmpresaPublicPage.tsx` más completo
3. `ads.business_profile_id` ya existe en DB — no agregar
4. `ads.ad_type` ya existe — solo asegurarse de setearlo al publicar
5. La constraint `UNIQUE(user_id)` está en la tabla `business_profiles` de la migración Sprint 3G — no en el schema legacy `company_profiles` (que está congelado)
