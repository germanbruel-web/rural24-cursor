# 🌾 Rural24 - Plataforma de Clasificados Agropecuarios

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**Marketplace moderno para compra y venta de maquinaria agrícola, vehículos rurales y equipamiento agropecuario.**

[Demo](https://rural24.vercel.app) • [Documentación](#-documentación) • [Instalación](#-instalación-rápida)

</div>

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Instalación Rápida](#-instalación-rápida)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Módulos Principales](#-módulos-principales)
- [Panel de Administración](#-panel-de-administración)
- [API Endpoints](#-api-endpoints)
- [Base de Datos](#-base-de-datos)
- [Documentación](#-documentación)
- [Scripts Disponibles](#-scripts-disponibles)
- [Variables de Entorno](#-variables-de-entorno)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

### Para Usuarios
- 🔍 **Búsqueda Inteligente** - Búsqueda semántica con autocompletado y sugerencias
- 📱 **100% Responsive** - Experiencia optimizada para móvil, tablet y desktop
- 📸 **Upload de Imágenes** - Hasta 8 fotos con compresión automática (Cloudinary)
- 📊 **Avisos Destacados** - Sistema de prioridad y banners promocionales
- 💳 **Planes de Suscripción** - Free, Starter, Pro y Empresa con diferentes límites
- 📬 **Contacto Directo** - Sistema de contacto con límites según plan

### Para Administradores
- 🛠️ **Panel SuperAdmin** - Gestión completa del marketplace
- 📈 **Analytics** - Estadísticas de visitas, clics y conversiones
- 🎨 **CMS Completo** - Gestión de categorías, banners, footer, SEO
- 👥 **Gestión de Usuarios** - Roles, permisos y planes
- 💰 **Gestión de Pagos** - Historial y estados de transacciones
- ⚙️ **Configuración Global** - Settings centralizados para todo el sistema

### Técnicas
- 🔒 **Autenticación Segura** - Supabase Auth + RLS
- 🚀 **Rendimiento** - Optimización de imágenes, lazy loading, SSR
- 🔐 **Row Level Security** - Políticas de seguridad a nivel de base de datos
- 📡 **API RESTful** - Endpoints documentados con validación Zod
- 🎯 **SEO Optimizado** - Sitemap dinámico, meta tags, URLs amigables

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **React** | 19.x | UI Library |
| **Vite** | 6.x | Build Tool |
| **TypeScript** | 5.x | Type Safety |
| **TailwindCSS** | 3.4 | Styling |
| **Lucide React** | Latest | Iconografía |
| **React Hot Toast** | 2.6 | Notificaciones |
| **Supabase JS** | 2.x | Cliente de DB |

### Backend (BFF)
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Next.js** | 16.x | API Routes + SSR |
| **Prisma** | 7.x | ORM |
| **Zod** | 3.x | Validación |
| **Cloudinary** | 2.x | Gestión de Imágenes |
| **Sharp** | 0.34 | Procesamiento de imágenes |

### Infraestructura
| Servicio | Uso |
|----------|-----|
| **Supabase** | PostgreSQL + Auth + RLS |
| **Cloudinary** | CDN de Imágenes |
| **Vercel** | Hosting Frontend |
| **TurboRepo** | Monorepo Management |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIOS                                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND (Vite + React)                        │
│   Puerto: 5173                                                   │
│   - Componentes React 19                                         │
│   - TailwindCSS + Lucide Icons                                   │
│   - Servicios (adsService, catalogService, etc.)                │
│   - Autenticación con Supabase                                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND BFF (Next.js 16)                      │
│   Puerto: 3001                                                   │
│   - API Routes (/api/*)                                          │
│   - Prisma ORM                                                   │
│   - Validación Zod                                               │
│   - Integración Cloudinary                                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE (PostgreSQL)                        │
│   - 20+ tablas                                                   │
│   - Row Level Security                                           │
│   - Funciones RPC                                                │
│   - Políticas de acceso                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Instalación Rápida

### Requisitos Previos
- Node.js >= 18.0.0
- npm >= 9.0.0
- Cuenta en Supabase
- Cuenta en Cloudinary

### 1. Clonar el Repositorio

```bash
git clone https://github.com/germanbruel-web/rural24.git
cd rural24
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

```bash
# Frontend (.env en /frontend)
cp frontend/.env.example frontend/.env

# Backend (.env en /backend)
cp backend/.env.example backend/.env
```

### 4. Variables Requeridas

**Frontend (`frontend/.env`):**
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_API_URL=http://localhost:3001
VITE_USE_API_BACKEND=true
VITE_FALLBACK_TO_SUPABASE=true
```

**Backend (`backend/.env`):**
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu-service-key
DATABASE_URL=postgresql://...
CLOUDINARY_CLOUD_NAME=tu-cloud
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-secret
```

### 5. Ejecutar el Proyecto

```bash
# Desarrollo (ambos servicios)
npm run dev

# O individualmente:
npm run dev:frontend  # Puerto 5173
npm run dev:backend   # Puerto 3001
```

### 6. Acceder

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

---

## 📁 Estructura del Proyecto

```
rural24/
├── frontend/                    # Aplicación React + Vite
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   │   ├── admin/           # Panel de administración
│   │   │   ├── auth/            # Login, Register, Reset
│   │   │   ├── banners/         # Sistema de banners
│   │   │   ├── catalog/         # Catálogo y productos
│   │   │   ├── filters/         # Filtros de búsqueda
│   │   │   ├── forms/           # Formularios dinámicos
│   │   │   ├── modals/          # Modales reutilizables
│   │   │   └── ui/              # Componentes base UI
│   │   ├── services/            # Servicios y APIs
│   │   ├── contexts/            # React Contexts
│   │   ├── hooks/               # Custom Hooks
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Utilidades
│   └── package.json
│
├── backend/                     # API Next.js (BFF)
│   ├── app/
│   │   ├── api/                 # API Routes
│   │   │   ├── ads/             # CRUD de avisos
│   │   │   ├── admin/           # Endpoints admin
│   │   │   ├── config/          # Configuraciones
│   │   │   ├── featured-ads/    # Avisos destacados
│   │   │   ├── search/          # Búsqueda
│   │   │   └── uploads/         # Upload de imágenes
│   │   └── (seo)/               # Rutas SEO
│   ├── domain/                  # Lógica de negocio
│   ├── infrastructure/          # Conexiones externas
│   └── prisma/                  # Schema Prisma
│
├── database/                    # SQL y migraciones
│   ├── migrations/              # Scripts de migración
│   └── supabase/                # Funciones RPC
│
├── docs/                        # Documentación técnica
│   ├── CLOUDINARY_ARCHITECTURE_2026.md
│   ├── AUTH_GUIDE.md
│   ├── BANNERS_CLEAN_V2_README.md
│   └── ...
│
├── scripts/                     # Scripts de utilidad
├── package.json                 # Root package (workspaces)
└── turbo.json                   # Configuración TurboRepo
```

---

## 📦 Módulos Principales

### 1. Catálogo y Avisos
- **Publicar avisos** con formularios dinámicos según categoría
- **8 imágenes** por aviso con compresión automática
- **Atributos dinámicos** (marca, modelo, año, etc.)
- **Estados**: activo, pausado, vendido, expirado

### 2. Sistema de Búsqueda
- **Búsqueda inteligente** con autocompletado
- **Filtros avanzados**: categoría, precio, ubicación, atributos
- **Ordenamiento**: fecha, precio, relevancia
- **Paginación** eficiente

### 3. Sistema de Banners
- **Hero VIP**: Banner principal en homepage (1 por categoría)
- **Carruseles**: Hasta 4 banners rotando en resultados
- **Tracking**: Impresiones y clics
- **Programación**: Fecha inicio y expiración

### 4. Planes de Suscripción
| Plan | Precio | Avisos | Fotos | Destacados | Contactos/mes |
|------|--------|--------|-------|------------|---------------|
| Free | $0 | 3 | 3 | 0 | 5 |
| Starter | $4.990 | 10 | 6 | 2 | 20 |
| Pro | $9.990 | 30 | 8 | 5 | 50 |
| Empresa | $19.990 | ∞ | 8 | 15 | ∞ |

### 5. Autenticación
- Login con email/password
- Registro con verificación
- Recuperación de contraseña
- Roles: Usuario, Premium, Admin, SuperAdmin

---

## 🔧 Panel de Administración

Acceso: `/admin` (requiere rol SuperAdmin)

### Secciones Disponibles

| Panel | Descripción | Ruta |
|-------|-------------|------|
| **Dashboard** | Métricas y estadísticas | `/admin` |
| **Avisos** | Gestión de todos los avisos | `/admin/avisos` |
| **Usuarios** | Gestión de usuarios y roles | `/admin/usuarios` |
| **Categorías** | CMS de categorías y atributos | `/admin/categorias` |
| **Banners** | Sistema de banners publicitarios | `/admin/banners` |
| **Pagos** | Historial de transacciones | `/admin/pagos` |
| **Configuración** | Settings globales del sistema | `/admin/settings` |
| **Planes** | CRUD de planes de suscripción | `/admin/settings` → Planes |
| **SEO/Sitemap** | Control de sitemap y meta | `/admin/seo` |

### Configuración Global

El panel de configuración permite gestionar:
- **Límites de avisos** por plan
- **Límites de imágenes** por plan
- **Límites de contactos** mensuales
- **Intercalación de banners** en resultados
- **Configuración SEO** global
- **Textos y contenido** del sitio

---

## 🔌 API Endpoints

### Públicos

```
GET  /api/health              # Estado del servidor
GET  /api/ads                 # Listar avisos (paginado)
GET  /api/ads/:id             # Detalle de aviso
GET  /api/search              # Búsqueda con filtros
GET  /api/featured-ads        # Avisos destacados
GET  /api/config/categories   # Categorías con atributos
```

### Autenticados

```
POST /api/ads                 # Crear aviso
PUT  /api/ads/:id             # Actualizar aviso
DEL  /api/ads/:id             # Eliminar aviso
POST /api/uploads/signed-url  # URL firmada para upload
```

### Admin

```
GET  /api/admin/stats         # Estadísticas dashboard
GET  /api/admin/users         # Listar usuarios
PUT  /api/admin/users/:id     # Actualizar usuario
GET  /api/admin/payments      # Historial de pagos
```

---

## 🗄️ Base de Datos

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `ads` | Avisos publicados |
| `users` | Perfiles de usuario |
| `categories` | Categorías del catálogo |
| `subcategories` | Subcategorías |
| `brands` | Marcas por subcategoría |
| `models` | Modelos por marca |
| `dynamic_attributes` | Atributos dinámicos |
| `ad_attributes` | Valores de atributos por aviso |
| `subscription_plans` | Planes de suscripción |
| `user_subscriptions` | Suscripciones activas |
| `featured_ads` | Avisos destacados |
| `banners_clean` | Sistema de banners V2 |
| `global_settings` | Configuración del sistema |
| `contact_requests` | Solicitudes de contacto |

### Migraciones

Las migraciones están en `database/migrations/`. Ejecutar en orden en Supabase SQL Editor.

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [AUTH_GUIDE.md](docs/AUTH_GUIDE.md) | Sistema de autenticación completo |
| [CLOUDINARY_ARCHITECTURE_2026.md](docs/CLOUDINARY_ARCHITECTURE_2026.md) | Arquitectura de imágenes con Cloudinary |
| [BANNERS_CLEAN_V2_README.md](docs/BANNERS_CLEAN_V2_README.md) | Sistema de banners V2 |
| [BANNER_PRIORITY_ARCHITECTURE.md](docs/BANNER_PRIORITY_ARCHITECTURE.md) | Prioridad y rotación de banners |
| [BANNERS_KIT_COMERCIAL.md](docs/BANNERS_KIT_COMERCIAL.md) | Kit comercial para ventas de banners |
| [PRISMA_MIGRATION_GUIDE.md](docs/PRISMA_MIGRATION_GUIDE.md) | Guía de migraciones Prisma |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Guía de despliegue a producción |
| [DESIGN_SYSTEM_UNIFIED.md](docs/DESIGN_SYSTEM_UNIFIED.md) | Sistema de diseño unificado |
| [GUIA_HABILITAR_RLS.md](docs/GUIA_HABILITAR_RLS.md) | Configuración de Row Level Security |

---

## 📜 Scripts Disponibles

### Root (Monorepo)

```bash
npm run dev           # Inicia frontend + backend
npm run dev:frontend  # Solo frontend (puerto 5173)
npm run dev:backend   # Solo backend (puerto 3001)
npm run build         # Build de producción
npm run lint          # Linter en todos los workspaces
npm run test          # Tests en todos los workspaces
```

### Frontend

```bash
cd frontend
npm run dev           # Servidor de desarrollo
npm run build         # Build para producción
npm run preview       # Preview del build
npm run storybook     # Storybook UI components
```

### Backend

```bash
cd backend
npm run dev           # Next.js dev server
npm run build         # Build para producción
npm run type-check    # Verificar tipos TypeScript
```

### Utilidades

```powershell
# Windows
.\INICIAR.cmd         # Inicia todo el proyecto
.\DETENER.cmd         # Detiene todos los procesos
.\status.ps1          # Estado de los servicios
```

---

## 🔐 Variables de Entorno

### Frontend

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | URL de Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Anon Key de Supabase | ✅ |
| `VITE_API_URL` | URL del backend | ✅ |
| `VITE_USE_API_BACKEND` | Usar backend BFF | ❌ |
| `VITE_FALLBACK_TO_SUPABASE` | Fallback a Supabase | ❌ |
| `VITE_DEBUG_API_CALLS` | Debug de llamadas API | ❌ |

### Backend

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `SUPABASE_URL` | URL de Supabase | ✅ |
| `SUPABASE_SERVICE_KEY` | Service Key de Supabase | ✅ |
| `DATABASE_URL` | Connection string PostgreSQL | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloud name Cloudinary | ✅ |
| `CLOUDINARY_API_KEY` | API Key Cloudinary | ✅ |
| `CLOUDINARY_API_SECRET` | API Secret Cloudinary | ✅ |

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📝 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**German Bruel**

[![GitHub](https://img.shields.io/badge/GitHub-@germanbruel--web-181717?style=flat&logo=github)](https://github.com/germanbruel-web)

---

<div align="center">

**⭐ Si este proyecto te es útil, considera darle una estrella ⭐**

</div>
