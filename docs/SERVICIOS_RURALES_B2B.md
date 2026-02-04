# Servicios Rurales B2B - Arquitectura Implementada

## Resumen

Se implementó un sistema de **perfiles de empresa** y **catálogos** para la categoría "Servicios Rurales", transformándola en un marketplace B2B donde las empresas pueden:

1. Crear un perfil de empresa con branding (logo, banner, descripción)
2. Gestionar catálogos de productos/servicios
3. Recibir contactos a través de WhatsApp o formulario

---

## Tablas Creadas en Supabase

### 1. `company_profiles`
Perfil único por usuario con plan empresa.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users |
| `company_name` | TEXT | Nombre de la empresa |
| `slug` | TEXT | URL amigable (único) |
| `logo_url` | TEXT | URL del logo |
| `banner_url` | TEXT | URL del banner |
| `description` | TEXT | Descripción |
| `contact_*` | TEXT | Datos de contacto |
| `allow_whatsapp` | BOOLEAN | Habilitar WhatsApp |
| `allow_contact_form` | BOOLEAN | Habilitar formulario |
| `province`, `city`, `address` | TEXT | Ubicación |
| `services_offered` | TEXT[] | Array de servicios |
| `business_hours` | JSONB | Horarios |
| `website_url`, `facebook_url`, `instagram_url` | TEXT | Redes |
| `is_active` | BOOLEAN | Estado |
| `is_verified` | BOOLEAN | Verificación manual |

### 2. `catalogs`
Catálogos de productos/servicios de cada empresa.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `company_id` | UUID | FK → company_profiles |
| `name` | TEXT | Nombre del catálogo |
| `slug` | TEXT | URL amigable |
| `description` | TEXT | Descripción |
| `cover_image_url` | TEXT | Imagen de portada |
| `is_active` | BOOLEAN | Estado |
| `sort_order` | INT | Orden de visualización |

### 3. `catalog_items`
Items dentro de cada catálogo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `catalog_id` | UUID | FK → catalogs |
| `title` | TEXT | Título del producto/servicio |
| `description` | TEXT | Descripción |
| `images` | TEXT[] | Array de URLs de imágenes |
| `price` | DECIMAL | Precio (opcional) |
| `currency` | TEXT | Moneda (USD/ARS) |
| `price_type` | TEXT | 'fixed', 'negotiable', 'consult' |
| `specs` | JSONB | Especificaciones técnicas |
| `views_count` | INT | Contador de vistas |
| `contact_count` | INT | Contador de contactos |

### Extensiones a tablas existentes

**`ads`:**
- `ad_type`: 'standard' | 'service' | 'catalog_item'
- `company_profile_id`: FK opcional

**`subscription_plans`:**
- `max_catalogs`: Límite de catálogos
- `max_catalog_items`: Límite de items por catálogo
- `has_company_profile`: Acceso a perfil de empresa
- `has_landing_page`: Landing page dedicada
- `has_priority_listing`: Listado prioritario

---

## Archivos Creados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/services/companyProfileService.ts` | CRUD para perfiles, catálogos e items |
| `src/components/empresa/CompanyProfileForm.tsx` | Formulario crear/editar perfil |
| `src/components/empresa/CompanyProfilePage.tsx` | Página pública del perfil |
| `src/components/empresa/index.ts` | Barrel export |

### Rutas

| Hash | Página |
|------|--------|
| `#/empresa/:slug` | Perfil público de empresa |

---

## Flujo de Usuario

### 1. Usuario con Plan Empresa

```
Dashboard → "Mi Empresa" → CompanyProfileForm
                         ↓
              Completa datos + sube logo/banner
                         ↓
              Perfil público en #/empresa/mi-empresa-slug
```

### 2. Visitante

```
Navega a #/empresa/mi-empresa-slug
         ↓
Ve perfil con logo, descripción, servicios
         ↓
Puede contactar por WhatsApp o ver catálogos
```

---

## Próximos Pasos

### Fase 2 - UX

1. [ ] Agregar acceso a "Mi Empresa" en el menú del dashboard
2. [ ] Mostrar badge "Empresa Verificada" en listados
3. [ ] Integrar con flujo de publicación (detectar categoría Servicios Rurales)

### Fase 3 - Catálogos

1. [ ] Crear `CatalogManager.tsx` para CRUD de catálogos
2. [ ] Crear `CatalogItemForm.tsx` para CRUD de items
3. [ ] Crear `CatalogGallery.tsx` para visualización pública

### Fase 4 - Métricas

1. [ ] Dashboard de estadísticas para empresa
2. [ ] Tracking de vistas y contactos
3. [ ] Reportes de rendimiento

---

## API del Servicio

```typescript
// Perfil
getMyCompanyProfile(): Promise<CompanyProfile | null>
getCompanyProfileBySlug(slug: string): Promise<CompanyProfile | null>
createCompanyProfile(data: CreateCompanyProfileData): Promise<CompanyProfile>
updateCompanyProfile(data: UpdateCompanyProfileData): Promise<CompanyProfile>
updateCompanyLogo(logoUrl: string): Promise<CompanyProfile>
updateCompanyBanner(bannerUrl: string): Promise<CompanyProfile>

// Catálogos
getCatalogsByCompany(companyId: string): Promise<Catalog[]>
getMyCatalogs(): Promise<Catalog[]>
createCatalog(data): Promise<Catalog>
updateCatalog(id, data): Promise<Catalog>
deleteCatalog(id): Promise<boolean>

// Items
getCatalogItems(catalogId: string): Promise<CatalogItem[]>
createCatalogItem(catalogId, data): Promise<CatalogItem>
updateCatalogItem(id, data): Promise<CatalogItem>
deleteCatalogItem(id): Promise<boolean>

// Utilidades
hasCompanyProfile(): Promise<boolean>
isServiciosRuralesCategory(categoryName: string): boolean
getCompanyStats(companyId): Promise<Stats>
```

---

## RLS Policies

Todas las tablas tienen políticas configuradas:

- **SELECT**: Público para perfiles activos
- **INSERT**: Solo usuario autenticado (su propio perfil)
- **UPDATE**: Solo propietario
- **DELETE**: Solo propietario

---

## Notas Técnicas

1. **Hash Routing**: La app usa hash routing manual, no react-router-dom
2. **Lazy Loading**: CompanyProfilePage se carga con `React.lazy()`
3. **Uploads**: Usa `uploadService.uploadImage()` existente
4. **Sin react-hook-form**: El formulario usa useState nativo
