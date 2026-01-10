# Sistema de Banners V2 - Limpio y Profesional

## 🎯 Resumen Ejecutivo

Sistema de banners completamente rediseñado con arquitectura limpia, 2 ubicaciones claras y UX profesional estilo Excel.

## 📊 Arquitectura

### Tabla: `banners_clean`

**2 Tipos de Ubicación (ENUM)**:
- `hero_vip`: Banner Hero Homepage (1 por categoría máximo)
- `category_carousel`: Carrusel de Categoría (4 banners rotando)

### Especificaciones de Imágenes

#### Hero VIP
- **Desktop**: 1200x200px (obligatorio)
- **Mobile**: 480x100px (obligatorio)
- **Comportamiento**: 
  - 1 banner aleatorio al cargar homepage
  - Cambia cuando usuario hace hover en categoría
  - Sin carrusel en desktop

#### Category Carousel
- **Responsive**: 650x120px (obligatorio)
- **Comportamiento**:
  - Hasta 4 banners por sección de categoría
  - Auto-rotación cada 5 segundos
  - Controles manuales de navegación

## 🗄️ Migraciones Ejecutadas

### 1. `2026-01-10_create_banners_clean.sql`
- ✅ Tabla `banners_clean` con ENUM `banner_placement`
- ✅ CHECK constraint para validar imágenes según tipo
- ✅ RLS policies (SuperAdmin full, public read active)
- ✅ Índices de performance
- ✅ Triggers de updated_at

### 2. `2026-01-10_add_banner_tracking.sql`
- ✅ Columnas `impressions` y `clicks`
- ✅ Función RPC `increment_banner_impression()`
- ✅ Función RPC `increment_banner_click()`

## 💻 Componentes Creados

### Admin Panel: `/admin/banners-clean`

**Ubicación**: `frontend/app/admin/banners-clean/page.tsx`

**Características**:
- ✅ Vista de tabla estilo Excel
- ✅ Filtros inline: Tipo, Categoría, Estado
- ✅ Modal de creación/edición
- ✅ Acciones inline: Editar, Pausar/Activar, Eliminar
- ✅ Validación de imágenes según tipo
- ✅ Programación temporal (starts_at, expires_at)
- ✅ Stats de impressions y clicks

**Campos del Formulario**:
1. **Tipo de Banner** (radio): Hero VIP o Category Carousel
2. **Categoría** (select): all, inmuebles, vehiculos, maquinarias, insumos, empleos
3. **Nombre del Cliente** (text, opcional)
4. **Título** (text, requerido)
5. **URL de Destino** (url, opcional)
6. **Imágenes** (según tipo seleccionado):
   - Hero: Desktop URL + Mobile URL
   - Carousel: Carousel URL
7. **Fecha Inicio** (datetime, opcional)
8. **Fecha Expiración** (datetime, opcional)
9. **Estado** (checkbox): Activo/Pausado

### Public Components

#### `HeroVIPBanner.tsx`
**Ubicación**: `frontend/components/banners/HeroVIPBanner.tsx`

**Props**:
```typescript
{
  currentCategory?: string;  // 'all' | 'inmuebles' | 'vehiculos' | etc.
}
```

**Comportamiento**:
- Carga banner aleatorio al montar
- Filtra por categoría si se especifica
- Registra impresión automáticamente
- Registra clic al hacer click
- Responsive (desktop 1200x200, mobile 480x100)

**Uso**:
```tsx
import HeroVIPBanner from '@/components/banners/HeroVIPBanner';

<HeroVIPBanner currentCategory="vehiculos" />
```

#### `CategoryCarousel.tsx`
**Ubicación**: `frontend/components/banners/CategoryCarousel.tsx`

**Props**:
```typescript
{
  category: string;  // 'inmuebles' | 'vehiculos' | etc. (requerido)
}
```

**Comportamiento**:
- Carga hasta 4 banners de la categoría
- Auto-rotación cada 5 segundos
- Controles manuales (prev/next)
- Indicadores de posición (dots)
- Contador "1 / 4"
- Registra impresiones y clics

**Uso**:
```tsx
import CategoryCarousel from '@/components/banners/CategoryCarousel';

<CategoryCarousel category="maquinarias" />
```

## 🔧 Service Layer

**Ubicación**: `frontend/services/bannersCleanService.ts`

**Funciones Disponibles**:

```typescript
// OBTENER BANNERS
getHeroVIPBanners(category?: string): Promise<BannerClean[]>
getCategoryCarouselBanners(category: string): Promise<BannerClean[]>
getAllBannersClean(): Promise<BannerClean[]>

// CRUD ADMIN
createBannerClean(input: CreateBannerCleanInput): Promise<BannerClean>
updateBannerClean(id: string, input: UpdateBannerCleanInput): Promise<BannerClean>
deleteBannerClean(id: string): Promise<void>
toggleBannerCleanActive(id: string, isActive: boolean): Promise<BannerClean>

// TRACKING
incrementBannerImpression(id: string): Promise<void>
incrementBannerClick(id: string): Promise<void>
```

## 📝 TypeScript Types

**Ubicación**: `frontend/types.ts`

```typescript
export type BannerPlacement = 'hero_vip' | 'category_carousel';

export interface BannerClean {
  id: string;
  placement: BannerPlacement;
  category: string;
  client_name?: string;
  title: string;
  link_url?: string;
  desktop_image_url?: string;   // 1200x200 (hero_vip)
  mobile_image_url?: string;    // 480x100 (hero_vip)
  carousel_image_url?: string;  // 650x120 (category_carousel)
  is_active: boolean;
  starts_at?: string;
  expires_at?: string;
  impressions: number;
  clicks: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBannerCleanInput {
  placement: BannerPlacement;
  category: string;
  client_name?: string;
  title?: string;
  link_url?: string;
  desktop_image_url?: string;
  mobile_image_url?: string;
  carousel_image_url?: string;
  is_active?: boolean;
  starts_at?: string;
  expires_at?: string;
}

export interface UpdateBannerCleanInput {
  // Same as Create but all optional
}
```

## 🚀 Próximos Pasos

### 1. Ejecutar la migración de tracking (SI NO SE HIZO):

```sql
-- En Supabase SQL Editor:
-- Copiar y ejecutar: database/migrations/2026-01-10_add_banner_tracking.sql
```

### 2. Actualizar el routing del admin

Agregar la ruta en `frontend/app/admin/layout.tsx` o donde corresponda:

```tsx
<Link href="/admin/banners-clean">
  Gestor de Banners V2
</Link>
```

### 3. Integrar en Homepage

```tsx
import HeroVIPBanner from '@/components/banners/HeroVIPBanner';

// En tu homepage:
<HeroVIPBanner currentCategory="all" />
```

### 4. Integrar en Secciones de Categoría

```tsx
import CategoryCarousel from '@/components/banners/CategoryCarousel';

// En cada sección de categoría:
<CategoryCarousel category="vehiculos" />
<CategoryCarousel category="maquinarias" />
```

## 🎨 Design System

- **Color Principal**: #16a135 (Rural24 Green)
- **Iconos**: Lucide React
- **Estilo**: Tailwind CSS
- **Filosofía**: Clean, profesional, Excel-style CRUD

## ✅ Validaciones

### Base de Datos (CHECK Constraint)
- Hero VIP: Requiere `desktop_image_url` Y `mobile_image_url`
- Category Carousel: Requiere `carousel_image_url`

### Frontend (Formulario)
- Título es obligatorio
- Imágenes requeridas según tipo seleccionado
- URLs deben ser válidas (type="url")
- Fechas opcionales pero validadas

## 📊 Tracking y Analytics

- ✅ **Impresiones**: Registradas automáticamente al mostrar banner
- ✅ **Clics**: Registrados al hacer click en banner con link
- ✅ **Visible en tabla**: Columna "Stats" muestra 👁️ / 🖱️

## 🔐 Seguridad (RLS)

- **SuperAdmin**: Full CRUD access
- **Public**: Solo lectura de banners activos y vigentes
- **Autenticados**: Sin acceso directo (solo SuperAdmin)

## 🆚 Comparación con Sistema Anterior

| Aspecto | Sistema Antiguo | Sistema Nuevo |
|---------|----------------|---------------|
| **Tipos de Banner** | 6 tipos confusos | 2 tipos claros |
| **Tabla** | `banners` (legacy) | `banners_clean` |
| **Columnas** | display_order, is_priority, priority_weight, position, device_target | placement (ENUM) |
| **Imágenes** | 1 columna + device_target | Columnas separadas por uso |
| **Validación** | Solo en frontend | DB CHECK constraint |
| **UX Admin** | Prompts múltiples | Tabla + Modal profesional |
| **Filtros** | Sin filtros | 3 filtros inline |
| **Tracking** | Manual | Automático |

## 🗑️ Tabla Antigua

La tabla `banners` **NO se elimina** por seguridad (rollback si es necesario).

Si deseas eliminarla después de confirmar que todo funciona:

```sql
-- ⚠️ SOLO DESPUÉS DE CONFIRMAR QUE TODO FUNCIONA
DROP TABLE banners CASCADE;
DROP TYPE banner_type CASCADE;
DROP TYPE device_target CASCADE;
```

## 📞 Soporte

Si encuentras algún error:
1. Verificar que las migraciones se ejecutaron correctamente
2. Verificar RLS policies en Supabase
3. Verificar que el usuario tiene rol `superadmin`
4. Revisar console del navegador para errores
