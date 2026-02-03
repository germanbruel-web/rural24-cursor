# 🗺️ ROADMAP RURAL24 - Febrero 2026

---

## 📊 Estado Actual del Proyecto

### ✅ Completado (última sesión 21 Ene 2026)

| Ítem | Estado |
|------|--------|
| Formularios dinámicos - Soporte boolean/checkbox | ✅ Corregido |
| Puertos API unificados a 3001 | ✅ Completado |
| Páginas SSR creadas en `backend/app/(seo)/` | ✅ Estructura lista |
| Sitemap dinámico `backend/app/sitemap.ts` | ✅ Implementado |

---

## 📁 Estructura SSR Implementada

```
backend/app/(seo)/
├── page.tsx                    ← Home SSR
├── layout.tsx                  ← Layout SEO
├── globals.css                 ← Estilos Tailwind
├── utils/
│   ├── ssr-data.ts            ← Queries Supabase
│   └── ssr-components.tsx     ← Componentes SSR
├── aviso/
│   └── [slug]/page.tsx        ← Detalle aviso SSR
└── [categoria]/
    ├── page.tsx               ← Categoría SSR
    └── [subcategoria]/
        └── page.tsx           ← Subcategoría SSR

backend/app/sitemap.ts          ← Sitemap XML dinámico
```

---

## 🎯 ROADMAP DE TAREAS

### FASE 1: Estabilización (Inmediato)

| # | Tarea | Prioridad | Estimación |
|---|-------|-----------|------------|
| 1.1 | Reiniciar servidores y verificar páginas SSR | 🔴 Alta | 15 min |
| 1.2 | Probar `/sitemap.xml` funciona | 🔴 Alta | 10 min |
| 1.3 | Validar Home SSR renderiza HTML | 🔴 Alta | 15 min |
| 1.4 | Completar atributos "Inmuebles Rurales" en BD | 🟡 Media | 30 min |

**Tiempo estimado FASE 1:** 1 hora

---

### FASE 2: SEO Técnico (1-2 semanas)

| # | Tarea | Prioridad | Estimación |
|---|-------|-----------|------------|
| 2.1 | Agregar robots.txt | 🔴 Alta | 10 min |
| 2.2 | Validar metatags dinámicos funcionan | 🔴 Alta | 30 min |
| 2.3 | Implementar JSON-LD en detalle de aviso | 🟡 Media | 1 hora |
| 2.4 | Configurar canonical URLs | 🟡 Media | 30 min |
| 2.5 | Optimizar imágenes Cloudinary (WebP, lazy) | 🟡 Media | 1 hora |

**Tiempo estimado FASE 2:** 4-5 horas

---

### FASE 3: Refactor UX/Código (2-3 semanas)

| # | Tarea | Prioridad | Estimación |
|---|-------|-----------|------------|
| 3.1 | Unificar 3 componentes de campos dinámicos | 🟡 Media | 4 horas |
| 3.2 | Mejorar manejo de errores en formularios | 🟡 Media | 2 horas |
| 3.3 | Agregar loading states consistentes | 🟢 Baja | 1 hora |

**Tiempo estimado FASE 3:** 7 horas

---

### FASE 4: Features Comerciales (1 mes)

| # | Tarea | Prioridad | Estimación |
|---|-------|-----------|------------|
| 4.1 | Verificar flujo de pagos (Mercado Pago) | 🟡 Media | 3 horas |
| 4.2 | Probar planes premium end-to-end | 🟡 Media | 2 horas |
| 4.3 | Validar avisos destacados funcionan | 🟡 Media | 1 hora |

**Tiempo estimado FASE 4:** 6 horas

---

## 📌 Pendientes Identificados

1. **Categoría "Inmuebles Rurales"** - No tiene atributos dinámicos configurados en BD
2. **Unificar componentes de campos dinámicos** - Actualmente hay 3 componentes separados:
   - `DynamicField.tsx`
   - `DynamicFields.tsx`
   - `BackendDynamicField.tsx`

---

## 🔧 Configuración Técnica

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (Next.js) | 3001 | http://localhost:3001 |
| Supabase | Remoto | (configurado en .env) |
| Cloudinary | Remoto | (configurado en .env) |

---

## 📅 Estimación Total

| Fase | Tiempo |
|------|--------|
| Fase 1: Estabilización | 1 hora |
| Fase 2: SEO Técnico | 4-5 horas |
| Fase 3: Refactor UX | 7 horas |
| Fase 4: Features Comerciales | 6 horas |
| **TOTAL** | **18-19 horas** |

---

*Documento generado: 2 de Febrero 2026*
*Proyecto: Rural24 - Clasificados Agropecuarios*
