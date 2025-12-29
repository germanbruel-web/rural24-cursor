# 🌾 Rural24 - Sistema Escalable de Clasificados Agropecuarios

Sistema moderno y escalable construido con Next.js 15 + Nest.js.

> **Proyecto anterior:** [agrobuscador](https://github.com/germanbruel-web/agro-buscador-app) (MVP a migrar)

## 🎯 Stack Tecnológico

### Frontend
- **Framework:** Next.js 15 (App Router + SSR)
- **UI:** Tailwind CSS + Shadcn UI
- **State:** Zustand + React Query
- **Forms:** React Hook Form + Zod

### Backend
- **API:** Nest.js 10
- **Database:** PostgreSQL 16 (Supabase)
- **ORM:** Prisma 5
- **Cache:** Redis (Upstash)
- **Queue:** BullMQ (opcional)

### Infrastructure
- **Storage:** Cloudflare R2
- **CDN:** Cloudflare Workers
- **Email:** Resend
- **Deploy:** Vercel (frontend) + Railway (backend)

## 📁 Estructura del Proyecto

\\\
rural24/
├── apps/
│   ├── web/         # Next.js 15 (Frontend)
│   ├── api/         # Nest.js (Backend API)
│   └── admin/       # Panel Admin
├── packages/
│   ├── database/    # Prisma schemas
│   ├── ui/          # Componentes compartidos
│   ├── storage/     # Cloudflare R2 client
│   ├── cache/       # Upstash Redis
│   ├── email/       # Resend
│   └── auth/        # NextAuth.js
├── infrastructure/
│   ├── scripts/     # Scripts de migración
│   └── cloudflare/  # Workers
└── docs/
    ├── ARQUITECTURA.md
    └── MIGRACION.md
\\\

## 🚀 Setup Local

\\\ash
# 1. Clonar
git clone https://github.com/germanbruel-web/rural24.git
cd rural24

# 2. Instalar dependencias (próximamente)
npm install

# 3. Configurar environment
cp .env.example .env.local
# Editar .env.local con tus keys

# 4. Setup database
cd packages/database
npx prisma migrate dev
npx prisma db seed

# 5. Correr proyecto
npm run dev
\\\

## 🔄 Migración desde Agrobuscador

Este proyecto es un refactor completo del MVP [agrobuscador](https://github.com/germanbruel-web/agro-buscador-app) con mejoras en:

| Aspecto | Agrobuscador (V1) | Rural24 (V2) |
|---------|-------------------|--------------|
| **SEO** | ❌ Hash routing | ✅ SSR + URLs limpias |
| **API** | Supabase directo | API REST con validaciones |
| **Storage** | Supabase Storage | Cloudflare R2 + CDN |
| **Cache** | LocalStorage | Redis (Upstash) |
| **Security** | RLS deshabilitado | Guards + RLS correcto |
| **Images** | Sin optimización | Cloudflare optimization |
| **Payments** | ❌ No implementado | ✅ Mercado Pago |

Ver [docs/MIGRACION.md](docs/MIGRACION.md) para el proceso completo.

## 📊 Ambientes

- **Desarrollo:** rural24-dev (localhost + servicios cloud)
- **Producción:** rural24-prod (dominio final)

## 🗺️ Roadmap

- [ ] **Fase 1:** Setup inicial (Semana 1-2)
- [ ] **Fase 2:** Core features (Semana 3-6)
- [ ] **Fase 3:** Migración de datos (Semana 7)
- [ ] **Fase 4:** Features avanzados (Semana 8-10)
- [ ] **Fase 5:** Deploy producción (Semana 11-12)

## 📝 Licencia

MIT

---

**Desarrollado por:** [German Bruel](https://github.com/germanbruel-web)
