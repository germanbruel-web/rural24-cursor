# Sprint 7A — Account Switcher + Social Proof
> Fecha: 2026-03-09 | Estado: ✅ COMPLETO | Commit: b3c5ee7

---

## Objetivo

Implementar el "Account Switcher" (contexto de cuenta activa Personal ↔ Empresa) como pieza
fundamental de UX, y agregar campos de Social Proof a la Fanpage de empresas contratistas.

---

## 1. AccountContext + AccountSwitcher

### Concepto
El usuario siempre sabe desde dónde está parado (inspirado en Instagram/LinkedIn):
- Cuenta Personal → avatar + "Mi cuenta"
- Cuenta Empresa → logo + nombre de empresa

### Archivos creados/modificados

| Archivo | Cambio |
|---|---|
| `frontend/src/contexts/AccountContext.tsx` | NUEVO — estado global cuenta activa |
| `frontend/src/components/header/AccountSwitcher.tsx` | NUEVO — dropdown en header |
| `frontend/src/contexts/index.ts` | Export AccountProvider, useAccount, ActiveAccount |
| `frontend/App.tsx` | Wrap con `<AccountProvider>` dentro de CategoryProvider |
| `frontend/src/components/header/UserMenu.tsx` | Reemplaza avatar puro por `<AccountSwitcher>` |
| `frontend/src/components/pages/PublicarAviso.tsx` | Pre-selecciona empresa activa al abrir wizard |

### AccountContext — lógica
```typescript
export type ActiveAccount =
  | { type: 'personal' }
  | { type: 'empresa'; id: string; name: string; logo: string | null; slug: string };
```
- Persistido en `localStorage` (sobrevive recarga)
- Al login: carga empresas via `getMyCompanies()`, valida que la guardada siga siendo del usuario
- Al logout: resetea a `{ type: 'personal' }`
- `switchTo(account)` → actualiza estado + localStorage

### PublicarAviso — integración
```typescript
const { activeAccount } = useAccount();
const [selectedBusinessProfileId, setSelectedBusinessProfileId] = useState<string | null>(
  activeAccount.type === 'empresa' ? activeAccount.id : null
);
```
Si el contexto activo es empresa, el EmpresaSelectorWidget pre-selecciona esa empresa.

---

## 2. Social Proof — DB

### Migration `20260309000004_sprint7a_bp_social_proof.sql`
```sql
ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS anos_experiencia    integer CHECK (anos_experiencia >= 0 AND anos_experiencia <= 100),
  ADD COLUMN IF NOT EXISTS area_cobertura      varchar(20) CHECK (area_cobertura IN ('local','regional','nacional')),
  ADD COLUMN IF NOT EXISTS superficie_maxima   integer CHECK (superficie_maxima >= 0),
  ADD COLUMN IF NOT EXISTS cultivos_json       jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS equipamiento_propio boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS aplica_precision    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS usa_drones          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS factura             boolean DEFAULT false;
```
**Estado:** pendiente aplicar en DEV/PROD (SQL editor Supabase)

### Migration `20260309000005_sprint7a_rpc_social_proof_fields.sql`
- Extiende `get_company_public_page(text)` para devolver los 8 nuevos campos
- DROP + CREATE OR REPLACE + GRANT (patrón estándar)
**Estado:** pendiente aplicar en DEV/PROD (SQL editor Supabase)

---

## 3. Social Proof — EmpresaForm

Archivo: `frontend/src/components/dashboard/EmpresaForm.tsx`

Nueva sección "Servicios y Capacidades":
- Años de experiencia (input number)
- Área de cobertura (select local/regional/nacional)
- Superficie máxima en ha (input number)
- Cultivos (input text libre, separados por coma → array JSON al guardar)
- 4 checkboxes: Equipo propio / Agricultura de precisión / Usa drones / Emite factura

FormState extendido con los 8 campos. handleSubmit los incluye en el payload de update.

---

## 4. Social Proof — EmpresaPublicPage (Fanpage)

Archivo: `frontend/src/components/pages/EmpresaPublicPage.tsx`

### Secciones nuevas agregadas:

**a) Social Proof chips en Header Card** (encima de botones de contacto)
- Chips pequeños: `[10 años de exp.] [Regional] [Factura] [Drones]`
- Solo se muestran si el campo tiene valor
- Visibles sin scroll, respuesta inmediata

**b) Stats bar** (3 cards de números)
- Avisos activos | Visitas al perfil | Verificado ✓

**c) Sección "Zona de Cobertura"**
- Chip de alcance (local/regional/nacional)
- Chip de superficie máxima (ha/campaña)

**d) Sección "Equipamiento y Capacidades"**
- Años de experiencia (si > 0)
- Grid de iconos: Equipo propio / Agr. precisión / Drones / Factura
- Lista de cultivos como pills

### CompanyPublicPage interface (empresaService.ts)
8 campos nuevos agregados al tipo TypeScript.

---

## 5. Fixes incluidos en este sprint (sesión completa)

| Fix | Archivo |
|---|---|
| `get_company_public_page` devolvía 400 — overload varchar+text | `20260309000003_fix_get_company_public_page.sql` |
| `get_company_public_page` 400 — profile_views ambiguous column | Alias `bp_upd` en UPDATE |
| `get_company_public_page` 400 — column 21 varchar vs text | Casts `::text` en full_name y display_name |
| `getMaquinariasSubcategories` 404 — tabla legacy no existe | Reescrito usando `subcategories` + join categories |
| `fetchPriority` React prop warning | Cambiado a lowercase `fetchpriority` en HeaderNew + Header |

---

## Pendiente post-Sprint 7A
- Aplicar migraciones 004 + 005 en DB DEV y PROD
- Sprint 7B: ProfileGate (onboarding gate en PublicarAviso)
- Sprint 7C: ProductCard badge INSUMO/SERVICIO + price_unit display
- Sprint 7C: MisEmpresasPanel profile completeness bar
