# 🚀 RURAL24 - PLAN ACTUALIZADO 2026

**Fecha:** 5 de enero, 2026  
**Decisiones:** Sin IA/ML generativa | Cloudinary para imágenes  
**Enfoque:** Backend como fuente de verdad + Catálogo maestro manual

---

## 📋 CAMBIOS CLAVE vs PLAN ANTERIOR

### ❌ ELIMINADO
- Google Gemini / IA generativa
- ML para categorización automática
- Auto-generación de descripciones
- Extracción automática de PDFs
- Vector search (pgvector)
- Cloudflare R2

### ✅ MANTENIDO/ACTUALIZADO
- Catálogo maestro estructurado (carga manual)
- Backend como fuente de verdad
- Formularios dinámicos desde BD
- Arquitectura BFF (Backend for Frontend)
- **NUEVO:** Cloudinary para imágenes

---

## 🏗️ ARQUITECTURA ACTUALIZADA

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vite + React)                   │
│  - Consume APIs del backend                                  │
│  - NO accede directo a Supabase                              │
│  - Cloudinary Upload Widget                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│              BACKEND (Next.js 16 API Routes)                 │
│  - Única fuente de verdad                                    │
│  - Validación centralizada (Zod)                             │
│  - CORS configurado                                          │
│  - Rate limiting                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                   DATOS Y STORAGE                            │
│  ├─ Supabase PostgreSQL (datos estructurados)               │
│  ├─ Cloudinary (imágenes, thumbnails, CDN)                  │
│  └─ Redis (caching - fase posterior)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 STACK TECNOLÓGICO DEFINITIVO

### Backend
- **Framework:** Next.js 16 (App Router + API Routes)
- **Base de Datos:** Supabase PostgreSQL
- **Validación:** Zod
- **Type Safety:** tRPC (opcional)

### Storage & Media
- **Imágenes:** Cloudinary
  - Upload directo desde frontend
  - Transformaciones automáticas
  - CDN global
  - Free tier: 25 créditos/mes

### Frontend (sin cambios)
- **Framework:** Vite + React + TypeScript
- **UI:** TailwindCSS + Radix UI
- **State:** Zustand
- **Forms:** React Hook Form

---

## 📊 SISTEMA DE CATÁLOGO MAESTRO (Manual)

### Concepto

Un **catálogo estructurado** donde el Admin carga manualmente las fichas técnicas de productos/servicios más comunes.

```
┌─────────────────────────────────────────────────────────────┐
│              ADMIN: Carga Manual de Datos                    │
├─────────────────────────────────────────────────────────────┤
│  1. Admin busca specs en web (manual)                       │
│  2. Copia/pega fichas técnicas                              │
│  3. Completa formulario estructurado                         │
│  4. Sube imágenes a Cloudinary                              │
│  5. Guarda en BD                                            │
│                                                              │
│  Tiempo estimado: 10-15 min por modelo                      │
└─────────────────────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│           BASE DE DATOS: Catálogo Completo                   │
├─────────────────────────────────────────────────────────────┤
│  Por cada Marca + Modelo:                                   │
│  ├─ Especificaciones técnicas                               │
│  ├─ URLs de imágenes (Cloudinary)                           │
│  ├─ Descripción                                             │
│  ├─ Rangos de precios                                       │
│  └─ Features destacadas                                     │
└─────────────────────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│            USUARIO: Publica Aviso Rápido                     │
├─────────────────────────────────────────────────────────────┤
│  1. Selecciona: Categoría → Subcategoría                   │
│  2. Selecciona: Marca (lista precargada)                    │
│  3. Selecciona: Modelo (lista filtrada)                     │
│  4. ✨ AUTO-COMPLETA: Specs desde catálogo                  │
│  5. Usuario ajusta: año, precio, condición, fotos           │
│  6. ✅ Publica en < 3 minutos                               │
└─────────────────────────────────────────────────────────────┘
```

### Ventajas

```
✅ Datos Consistentes
   → Mismo modelo = mismas especificaciones

✅ Búsquedas Confiables
   → Datos estructurados = filtros precisos

✅ UX Mejorada
   → Menos campos manuales = más conversión

✅ Mantenible
   → Sin complejidad de IA/ML

✅ Escalable
   → Agregar modelo = 1 formulario admin
```

---

## 📅 ROADMAP ACTUALIZADO

### **FASE 1: Fundación (Semana 1-2) ← ACTUAL**

```
✅ Completado:
  ├─ Backend Next.js inicializado
  ├─ Estructura de carpetas (BFF)
  ├─ Supabase client
  ├─ Result pattern
  ├─ Health check endpoint
  └─ CORS configurado

🔄 En progreso:
  ├─ Cloudinary setup
  ├─ Migración schema BD
  └─ Primer endpoint con datos reales

⏳ Pendiente:
  ├─ GET /api/config/categories
  ├─ Testing con Postman
  └─ Documentación de APIs
```

### **FASE 2: Catálogo Maestro (Semana 3-4)**

```
Objetivos:
  ├─ Admin Panel básico (CRUD)
  ├─ Gestión de Categorías
  ├─ Gestión de Marcas
  ├─ Gestión de Modelos
  ├─ Formularios dinámicos
  └─ Upload de imágenes a Cloudinary

Entregables:
  ├─ Panel admin funcional
  ├─ 10 modelos de tractores cargados (prueba)
  ├─ Formulario dinámico funcionando
  └─ Testing completo
```

### **FASE 3: Frontend Integration (Semana 5-6)**

```
Objetivos:
  ├─ Conectar frontend con nuevas APIs
  ├─ Migrar AdForm a catálogo maestro
  ├─ Cloudinary upload widget
  ├─ Validación en tiempo real
  └─ Preview y testing

Entregables:
  ├─ PublicarAvisoV4.tsx funcionando
  ├─ Imágenes en Cloudinary
  ├─ Formulario < 3 min para completar
  └─ Beta testing con usuarios reales
```

### **FASE 4: Expansion (Semana 7-10)**

```
Objetivos:
  ├─ Cargar más modelos al catálogo
  ├─ Expandir a más categorías
  ├─ Optimización de búsquedas
  ├─ Métricas y analytics
  └─ Performance tuning

Entregables:
  ├─ 100+ modelos en catálogo
  ├─ 3 categorías completas
  ├─ Dashboard de analytics
  └─ Documentación completa
```

### **FASE 5: Producción (Semana 11-12)**

```
Objetivos:
  ├─ Deploy a producción
  ├─ Cloudflare setup
  ├─ Monitoring (Sentry)
  ├─ Backup strategies
  └─ Launch 🚀

Entregables:
  ├─ Sistema en producción
  ├─ Documentación de operaciones
  ├─ Runbook de troubleshooting
  └─ Plan de soporte
```

---

## 🔧 SETUP INICIAL (ESTA SEMANA)

### 1. Cloudinary

```bash
# Crear cuenta free
https://cloudinary.com/users/register/free

# Obtener credenciales del Dashboard

# Agregar a .env.local (backend)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Agregar a .env.local (frontend)
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset
```

### 2. Supabase (verificar)

```bash
# Variables ya existentes
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_KEY=tu_anon_key

# Backend (service role)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 3. Instalación de dependencias

```bash
# Backend
cd backend
npm install cloudinary
npm install zod

# Frontend (si es necesario)
cd frontend
npm install @cloudinary/url-gen
```

---

## 📊 SCHEMA DE BASE DE DATOS

### Tablas Principales (simplificadas)

```sql
-- Categorías
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Subcategorías
CREATE TABLE subcategories (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  has_brands BOOLEAN DEFAULT false,
  has_models BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);

-- Marcas
CREATE TABLE brands (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  logo_url TEXT, -- Cloudinary URL
  website TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Modelos (Catálogo Maestro)
CREATE TABLE models (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  name VARCHAR(200) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  year_from INTEGER,
  year_to INTEGER,
  specifications JSONB DEFAULT '{}'::jsonb,
  images TEXT[], -- Array de URLs de Cloudinary
  thumbnail_url TEXT, -- Cloudinary URL
  short_description TEXT,
  full_description TEXT,
  features TEXT[],
  typical_uses TEXT[],
  price_range_new_min DECIMAL(12, 2),
  price_range_new_max DECIMAL(12, 2),
  price_range_used_min DECIMAL(12, 2),
  price_range_used_max DECIMAL(12, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Formularios dinámicos
CREATE TABLE form_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category_id UUID REFERENCES categories(id),
  subcategory_id UUID REFERENCES subcategories(id),
  sections JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE form_fields (
  id UUID PRIMARY KEY,
  form_template_id UUID REFERENCES form_templates(id),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  section VARCHAR(100),
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  placeholder TEXT,
  help_text TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Avisos (simplificado)
CREATE TABLE ads (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  category_id UUID REFERENCES categories(id),
  subcategory_id UUID REFERENCES subcategories(id),
  brand_id UUID REFERENCES brands(id),
  model_id UUID REFERENCES models(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'ARS',
  year INTEGER,
  condition VARCHAR(50),
  province VARCHAR(100),
  city VARCHAR(100),
  images TEXT[], -- Cloudinary URLs
  thumbnail_url TEXT, -- Cloudinary URL
  dynamic_fields JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔌 API ENDPOINTS (Planificados)

### Configuración

```typescript
// GET /api/config/categories
// Obtener categorías y subcategorías
{
  categories: [
    {
      id: "uuid",
      name: "Maquinarias",
      displayName: "🚜 Maquinarias",
      subcategories: [...]
    }
  ]
}

// GET /api/config/form/:subcategoryId
// Obtener formulario dinámico
{
  template: {...},
  fields: [...],
  brands: [...],  // Si la subcategoría tiene marcas
}
```

### Catálogo

```typescript
// GET /api/catalog/brands?subcategoryId=xxx
// Obtener marcas para una subcategoría
{
  brands: [
    { id: "uuid", name: "John Deere", logoUrl: "cloudinary..." }
  ]
}

// GET /api/catalog/models?brandId=xxx
// Obtener modelos de una marca
{
  models: [
    {
      id: "uuid",
      name: "5075E",
      displayName: "John Deere 5075E",
      yearFrom: 2015,
      yearTo: 2024,
      thumbnailUrl: "cloudinary...",
      specifications: {...},
      priceRange: {...}
    }
  ]
}

// GET /api/catalog/model/:id
// Detalle completo de un modelo
{
  model: {
    id: "uuid",
    brand: {...},
    specifications: {...},
    images: ["cloudinary...", ...],
    description: "...",
    features: [...],
    priceRange: {...}
  }
}
```

### Avisos

```typescript
// POST /api/ads
// Crear aviso
{
  categoryId: "uuid",
  subcategoryId: "uuid",
  brandId: "uuid",
  modelId: "uuid",  // Opcional, trae specs del catálogo
  title: "...",
  description: "...",
  price: 35000,
  year: 2020,
  condition: "used",
  images: ["cloudinary_url_1", ...],
  dynamicFields: {...}
}

// GET /api/ads/search
// Búsqueda con filtros
?category=maquinarias&subcategory=tractores&brand=john-deere&priceMin=30000&priceMax=50000
```

---

## 📝 PRÓXIMOS PASOS INMEDIATOS

### Esta Semana (5-11 enero)

```
[ ] 1. Crear cuenta Cloudinary
      └─ Configurar upload presets
      └─ Obtener credenciales

[ ] 2. Actualizar .env files
      └─ Backend: CLOUDINARY_*
      └─ Frontend: VITE_CLOUDINARY_*

[ ] 3. Ejecutar migración BD
      └─ Crear tablas actualizadas
      └─ Seed categorías iniciales

[ ] 4. Implementar primer endpoint
      └─ GET /api/config/categories
      └─ Testing con Postman

[ ] 5. Cloudinary integration
      └─ Upload endpoint en backend
      └─ Test upload desde frontend
```

### Próxima Semana (12-18 enero)

```
[ ] 6. Admin Panel - Categorías CRUD
[ ] 7. Admin Panel - Marcas CRUD
[ ] 8. Admin Panel - Modelos CRUD (con Cloudinary)
[ ] 9. Cargar 5 modelos de prueba
[ ] 10. Testing E2E del flujo completo
```

---

## 💰 COSTOS (Desarrollo)

```
✅ FREE:
  ├─ Supabase: Plan free (ya tienes)
  ├─ Cloudinary: 25 créditos/mes free
  ├─ Next.js: Open source
  ├─ Vercel: Free tier (deploy)
  └─ GitHub: Free (código)

💰 OPCIONAL (Producción):
  ├─ Cloudinary Plus: $89/mes (si excedes free tier)
  ├─ Supabase Pro: $25/mes (más DB, backups)
  ├─ Upstash Redis: $0.20/100k requests
  └─ Dominio: $12/año
```

---

## ✅ DECISIONES CONFIRMADAS

```
✅ Backend como única fuente de verdad
✅ Cloudinary para todas las imágenes
✅ Catálogo maestro con carga manual
✅ Sin IA/ML generativa
✅ Formularios dinámicos desde BD
✅ Arquitectura BFF (Next.js)
✅ Mantener diseño frontend actual
✅ PostgreSQL como DB principal
✅ TypeScript end-to-end
```

---

## 📚 DOCUMENTACIÓN DE REFERENCIA

- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)
- [Zod Validation](https://zod.dev/)

---

**Última actualización:** 5 de enero, 2026  
**Autor:** German Bruel  
**Status:** Plan Activo - Fase 1 en ejecución
