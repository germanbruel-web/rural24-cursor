# 🚀 Plan de Migración - Backend Profesional 2026

**Fecha Inicio:** 29 de diciembre, 2025  
**Estrategia:** Evolución gradual sin downtime

---

## 📋 CHECKLIST DE PREPARACIÓN

### ✅ Completado
- [x] Proyecto actual funcionando
- [x] Git repository configurado
- [x] Supabase activo
- [x] Documentación de arquitectura

### 🔄 En Progreso
- [ ] Backup completo de BD
- [ ] Crear branch `backend-v2`
- [ ] Setup Cloudflare (cuando sea necesario)
- [ ] Crear catálogo maestro inicial

### ⏳ Pendiente
- [ ] Migración schema BD
- [ ] Setup Next.js backend
- [ ] Integración ML/IA
- [ ] Testing completo

---

## 🗂️ ESTRUCTURA DE CARPETAS PROPUESTA

```
agro-buscador-app/
├── frontend/              # Frontend actual (Vite + React)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/               # NUEVO: Backend Next.js API
│   ├── app/              # App Router
│   │   ├── api/          # API Routes
│   │   │   ├── ads/
│   │   │   ├── categories/
│   │   │   ├── ml/
│   │   │   └── admin/
│   │   └── layout.tsx
│   │
│   ├── lib/              # Servicios y utils
│   │   ├── supabase.ts
│   │   ├── gemini.ts
│   │   ├── redis.ts
│   │   └── services/
│   │
│   ├── types/
│   ├── package.json
│   └── next.config.js
│
├── database/             # Migraciones y schemas
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
│
├── shared/               # Código compartido
│   └── types/            # Types compartidos
│
└── docs/                 # Documentación
    └── BACKEND_ML_ARCHITECTURE_2026.md
```

---

## 📅 TIMELINE REALISTA

### Semana 1-2: Foundation
**Objetivo:** Backend básico funcionando

- [ ] Día 1-2: Reestructurar carpetas
- [ ] Día 3-4: Setup Next.js + tRPC
- [ ] Día 5-7: Migrar schema BD
- [ ] Día 8-10: API básica de categorías
- [ ] Día 11-14: Testing y validación

### Semana 3-4: Catálogo Maestro
**Objetivo:** Sistema de marcas/modelos con IA

- [ ] CRUD admin de marcas
- [ ] CRUD admin de modelos
- [ ] Integración Gemini para búsqueda
- [ ] Form builder básico

### Semana 5-6: ML Features
**Objetivo:** Auto-categorización y validación

- [ ] Auto-categorización de avisos
- [ ] Autocomplete inteligente
- [ ] Validación en tiempo real
- [ ] Testing de precisión

### Semana 7-8: Frontend Migration
**Objetivo:** Migrar formularios a nuevo backend

- [ ] Nuevo componente PublicarAvisoV4
- [ ] Integración con catálogo maestro
- [ ] Testing UX
- [ ] Rollout gradual (beta)

### Semana 9-12: Optimization
**Objetivo:** Production-ready

- [ ] Cloudflare setup
- [ ] Caching agresivo
- [ ] Monitoring
- [ ] Launch 🚀

---

## ☁️ CLOUDFLARE - ¿CUÁNDO?

### ❌ NO CREAR AHORA
Cloudflare se configura **AL FINAL**, cuando tengas:
- Backend funcionando
- Frontend funcionando
- Dominio listo para apuntar

### ✅ CREAR EN SEMANA 10-11
Cuando vayas a deployar a producción:
1. Configurar Cloudflare DNS
2. Setup CDN y caching
3. Configurar Workers si es necesario
4. SSL automático

**Por ahora:** Sigue usando el setup actual de hosting/deploy

---

## 🔑 CREDENCIALES QUE SÍ NECESITAS CREAR AHORA

### 2. Cloudinary (Imágenes)
**Cuándo:** AHORA (free tier: 25 créditos/mes)
**URL:** https://cloudinary.com/users/register/free

```bash
# Agregar a .env.local
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
VITE_CLOUDINARY_API_KEY=tu_api_key
VITE_CLOUDINARY_API_SECRET=tu_api_secret
```

### 2. Supabase (ya tienes)
**Status:** ✅ Ya configurado
**Verificar:** Que tengas estas variables

```bash
VITE_SUPABASE_URL=tu_url
VITE_SUPABASE_KEY=tu_key
```

### 4. Redis (opcional más adelante)
**Cuándo:** Semana 9-10 para caching
**Opción gratuita:** Upstash Redis

---

## 📊 MIGRACIÓN DE BASE DE DATOS

### Estrategia: Aditiva (no destructiva)

**NO hacer:**
- ❌ Borrar tablas existentes
- ❌ Cambiar estructura de `ads` de golpe
- ❌ Perder datos actuales

**SÍ hacer:**
- ✅ Crear nuevas tablas en paralelo
- ✅ Mantener compatibilidad
- ✅ Migrar datos gradualmente
- ✅ Hacer backup antes de CUALQUIER cambio

### Tablas a crear:

```sql
-- 1. Catálogo maestro (NUEVAS)
CREATE TABLE brands_master (...)
CREATE TABLE models_master (...)
CREATE TABLE model_specifications (...)

-- 2. Form templates (NUEVAS)
CREATE TABLE form_templates_v3 (...)
CREATE TABLE form_fields_v3 (...)

-- 3. ML tracking (NUEVAS)
CREATE TABLE ml_predictions (...)
CREATE TABLE ml_training_data (...)

-- 4. ads (MANTENER + agregar campos)
ALTER TABLE ads ADD COLUMN model_master_id UUID REFERENCES models_master(id);
ALTER TABLE ads ADD COLUMN ml_enriched BOOLEAN DEFAULT false;
```

---

## 🚦 PRIMEROS PASOS CONCRETOS (ESTA SEMANA)

### Día 1: Backup y Branch
```bash
# 1. Backup de BD completo
# En Supabase Dashboard → Database → Backups → Create backup

# 2. Crear branch para backend
git checkout -b backend-v2
git push -u origin backend-v2
```

### Día 2: Reestructurar carpetas
```bash
# Mover frontend actual a carpeta
mkdir frontend
git mv src frontend/
git mv public frontend/
git mv index.html frontend/
git mv vite.config.ts frontend/
# ... etc

# Crear carpeta backend
mkdir backend
cd backend
npx create-next-app@latest . --typescript --tailwind --app
```

### Día 3-4: Setup básico backend
```bash
cd backend
npm install @supabase/supabase-js
npm install cloudinary
npm install @trpc/server @trpc/client
npm install zod
```

### Día 5: Primera API funcionando
```typescript
// backend/app/api/test/route.ts
export async function GET() {
  return Response.json({ 
    status: 'Backend v2 funcionando!',
    timestamp: new Date().toISOString()
  });
}
```

---

## 📌 DECISIONES IMPORTANTES

### ¿Migrar TODA la BD o crear desde cero?
**Decisión:** Mantener BD actual, agregar nuevas tablas

**Razón:**
- No perder datos existentes
- No downtime
- Migración gradual más segura

### ¿Reescribir frontend en Next.js?
**Decisión:** NO por ahora

**Razón:**
- Frontend Vite funciona bien
- Next.js será SOLO para backend API
- Más adelante evaluar migrar frontend

### ¿Cuándo apagar el backend actual?
**Decisión:** Cuando backend v2 tenga 100% paridad

**Timeline:** ~3 meses realista

---

## 🎯 MÉTRICAS DE ÉXITO

### Backend v2 listo cuando:
- ✅ Todas las APIs actuales funcionan
- ✅ Catálogo maestro tiene >50 modelos
- ✅ ML funciona con >90% precisión
- ✅ Performance < 200ms p95
- ✅ Testing coverage >80%

### Frontend migrado cuando:
- ✅ Formulario nuevo más rápido que el viejo
- ✅ 0 errores en producción por 1 semana
- ✅ Feedback usuarios positivo
- ✅ Métricas mejoran vs versión actual

---

## ❓ FAQ

**Q: ¿Puedo seguir desarrollando features en la versión actual?**  
A: Sí! Trabaja en `main`, el backend v2 va en `backend-v2`

**Q: ¿Los usuarios se darán cuenta del cambio?**  
A: No! La migración es transparente. Solo verán mejoras.

**Q: ¿Cuánto cuesta todo esto?**  
A: $0 en desarrollo:
- Cloudinary: Free tier (25 créditos/mes)
- Supabase: Ya lo tienes
- Next.js: Gratis
- Cloudflare: Free tier (cuando lo uses)

**Q: ¿Qué pasa si algo sale mal?**  
A: Tienes backups y el sistema actual sigue funcionando. Zero risk.

---

## 📞 SIGUIENTE ACCIÓN

**AHORA MISMO:**

1. **Hacer backup de Supabase BD**
   - Dashboard → Database → Backups → Create manual backup
   - Exportar también schema en SQL

2. **Crear cuenta en Cloudinary**
   - https://cloudinary.com/users/register/free
   - Guardar credenciales en `.env.local`

3. **Crear branch backend-v2**
   ```bash
   git checkout -b backend-v2
   git push -u origin backend-v2
   ```

4. **Confirmar estrategia:**
   - ¿Te parece bien la evolución gradual?
   - ¿O prefieres empezar repo nuevo?

---

**Última actualización:** 29/12/2025  
**Status:** 📋 Planificación  
**Siguiente milestone:** Backup + Branch + Gemini API
