# 🏗️ RURAL24 BACKEND - BFF (Backend for Frontend)

**Arquitectura:** Next.js 16 + Supabase + Cloudinary  
**Fase:** 1 - Fundación (Semana 1-2)  
**Status:** ✅ En desarrollo

---

## 📁 ESTRUCTURA DEL PROYECTO

```
backend/
├── app/
│   └── api/                    # Next.js API Routes
│       ├── route.ts            # GET /api → Info del API
│       ├── health/             # GET /api/health → Health check
│       └── config/             # (próximo) Configuración dinámica
│
├── domain/                     # LÓGICA DE NEGOCIO (sin dependencias de framework)
│   ├── categories/             # (próximo) Categorías
│   ├── ads/                    # (próximo) Avisos
│   └── shared/
│       ├── result.ts           # ✅ Result pattern
│       └── errors.ts           # ✅ Domain errors
│
├── infrastructure/             # ADAPTADORES EXTERNOS
│   ├── supabase/
│   │   └── client.ts           # ✅ Supabase client singleton
│   └── cloudinary/             # (próximo) Cloudinary client
│
├── types/                      # Type definitions compartidos
│
├── .env.local                  # Variables de entorno (NO subir a git)
├── .env.example                # Plantilla de variables
├── next.config.js              # ✅ Config con CORS
├── tsconfig.json               # ✅ TypeScript config
└── package.json                # ✅ Dependencies
```

---

## 🚀 QUICK START

### 1. Instalar Dependencias
```bash
cd backend
npm install
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase
```

### 3. Arrancar Servidor
```bash
npm run dev
```

Servidor corriendo en: **http://localhost:3000**

---

## 📡 ENDPOINTS DISPONIBLES

### ✅ GET /api
Info del API

**Response:**
```json
{
  "status": "ok",
  "message": "Rural24 Backend API v1.0",
  "timestamp": "2026-01-04T...",
  "environment": "development"
}
```

### ✅ GET /api/health
Health check del backend

**Response:**
```json
{
  "status": "healthy",
  "database": "pending connection",
  "timestamp": "2026-01-04T..."
}
```

---

## 🏗️ PRÓXIMOS ENDPOINTS (Semana 1-2)

### Configuración Dinámica
```
GET /api/config/categories     → Categorías y subcategorías
GET /api/config/form/:id       → Formulario dinámico por subcategoría
```

### Catálogo
```
GET /api/catalog/brands        → Marcas
GET /api/catalog/models        → Modelos
```

---

## 🎯 PRINCIPIOS ARQUITECTÓNICOS

### 1. Backend como Fuente de Verdad
- Frontend NO accede directamente a Supabase
- Todas las queries pasan por el backend
- Validación y autenticación centralizadas

### 2. Dominio Desacoplado
- Lógica de negocio en `/domain` (no depende de Next.js)
- Result pattern para manejo de errores type-safe
- Fácil migración futura a backend dedicado

### 3. Contratos API Formales
- Zod para validación de schemas
- TypeScript end-to-end
- Documentación automática

---

## 🔐 SEGURIDAD

- ✅ Service Role Key solo en backend (nunca en frontend)
- ✅ CORS configurado para frontend específico
- ✅ Variables de entorno no commiteadas (.env.local en .gitignore)
- ⏳ Rate limiting (próximo)
- ⏳ Auth middleware (próximo)

---

## 📅 ROADMAP SEMANA 1-2

- [x] Setup proyecto Next.js
- [x] Estructura de carpetas (BFF architecture)
- [x] Supabase client singleton
- [x] Result pattern y error handling
- [x] Health check endpoint
- [x] CORS configuration
- [ ] GET /api/config/categories
- [ ] Prisma schema (opcional)
- [ ] First connection a Supabase
- [ ] Testing con Postman

---

## 📚 DOCUMENTACIÓN

- [Arquitectura Completa](../docs/BACKEND_ML_ARCHITECTURE_2026.md)
- [Plan de Migración](../docs/MIGRACION_BACKEND_PLAN.md)

---

**Última actualización:** 5 de enero, 2026  
**Autor:** German Bruel  
**Fase:** Semana 1 - Fundación
