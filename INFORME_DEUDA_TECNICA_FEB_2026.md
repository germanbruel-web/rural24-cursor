# INFORME DE EJECUCIÓN TÉCNICA — RURAL24
## Plan de Estabilización, Seguridad y Reducción de Deuda Técnica

**Fecha:** 9 de febrero de 2026  
**Versión:** 1.0  
**Clasificación:** Ejecutivo-Técnico  
**Stack:** Next.js 16 (backend) · React 19 + Vite (frontend) · Supabase (BaaS) · PostgreSQL

---

## 1. RESUMEN EJECUTIVO

Rural24 es un marketplace de clasificados agropecuarios con una base funcional operativa en `localhost`. Sin embargo, la auditoría técnica del 9/02/2026 revela **deuda técnica crítica en seguridad, consistencia arquitectónica y calidad de código** que impide un despliegue productivo confiable.

### Diagnóstico cuantitativo

| Indicador | Valor actual | Objetivo post-plan |
|-----------|-------------|---------------------|
| Rutas API sin autenticación de escritura | **8 de 11 rutas de escritura** | 0 |
| Patrones de acceso a datos inconsistentes | **16 rutas bypass del dominio** / 5 con DDD | 100% vía Domain layer |
| Servicios frontend duplicados | **3 catálogos, 2 banners, 3 featured** | 1 de cada uno |
| Usos de `any` en frontend | **~481** | <50 (progresivo) |
| Tests unitarios | **0** | Cobertura en domain layer |
| URLs hardcodeadas sin env fallback | **4 ubicaciones** | 0 |
| Componentes >800 líneas | **7** | Todos <500 |
| Tamaño de `schema.prisma` | 1,381 líneas (sin uso runtime) | Decisión: eliminar o adoptar |

### Riesgo principal

**Cualquier request HTTP externo puede crear avisos, subir archivos, listar usuarios y modificar roles sin autenticación.** El backend usa `service_role_key` de Supabase (bypass completo de RLS) sin guardia de auth en la mayoría de rutas de escritura. Esto es un bloqueante de deploy a producción.

### Inversión estimada

| Fase | Duración | Prioridad |
|------|----------|-----------|
| Fase 1 — Seguridad y Estabilidad | 1 semana | **Bloqueante** |
| Fase 2 — Unificación Backend | 2 semanas | Alta |
| Fase 3 — Limpieza Frontend | 2 semanas | Media-Alta |
| Fase 4 — Calidad de Código | Continua | Media |

---

## 2. DETALLE POR FASE

---

### FASE 1 — Seguridad y Estabilidad

**Duración estimada:** 1 semana  
**Prioridad:** BLOQUEANTE — sin esta fase, el sistema no es desplegable.

#### 2.1.1 Objetivo

Cerrar todas las brechas de seguridad que permiten acceso no autenticado a operaciones de escritura, y corregir configuraciones que rompen en producción.

#### 2.1.2 Alcance técnico

| Tarea | Detalle | Archivos afectados |
|-------|---------|-------------------|
| **Crear guardia de auth reutilizable** | Función `withAuth(handler, { roles })` que valide Bearer token contra Supabase Auth y verifique rol en tabla `users`. Next.js 16 deprecó `middleware.ts` global; la estrategia documentada en `ARQUITECTURA_NEXT16.md` es auth a nivel de Route Handler. Se crea un helper en `domain/shared/auth-guard.ts` que cada ruta invoca. | `domain/shared/auth-guard.ts` (nuevo) |
| **Proteger rutas de escritura** | Aplicar el guard a: `POST /api/ads`, `POST/DELETE /api/uploads/*`, `POST/DELETE /api/featured-ads`, `GET/PATCH /api/admin/users`, `POST /api/featured-ads/restore`. Las rutas de lectura pública (`GET /api/config/*`, `GET /api/ads/search`) no requieren auth. | 8 archivos `route.ts` |
| **Corregir CORS** | En `next.config.js` línea 19, el header `Access-Control-Allow-Origin` está hardcodeado a `http://localhost:5173` ignorando la variable `allowedOrigin` calculada en línea 12. Reemplazar el valor literal por la variable. | `backend/next.config.js` |
| **Eliminar URLs hardcodeadas sin fallback** | 4 ubicaciones usan `'http://localhost:3001'` directamente sin `import.meta.env.VITE_API_URL`: `SitemapSeoPanel.tsx:31`, `SitemapSeoPanel.tsx:399`, `MyAdsPanel.tsx:189`, `uploadService.ts:34`. Reemplazar por la constante centralizada `API_URL` de `config/api.ts`. | 3 archivos frontend |
| **Quitar auto-approval** | En `domain/ads/repository.ts:57`, `approval_status` está hardcodeado a `'approved'`. Cambiar a `'pending'` y que el flujo de moderación determine la aprobación. Considerar variable de entorno `AUTO_APPROVE_ADS=true` para mantener comportamiento en dev. | `domain/ads/repository.ts` |

#### 2.1.3 Riesgos mitigados

| Riesgo actual | Severidad | Mitigación |
|--------------|-----------|------------|
| Creación masiva de avisos spam sin login | **Crítica** | Auth guard en `POST /api/ads` |
| Borrado de assets de Cloudinary por terceros | **Crítica** | Auth guard en `DELETE /api/uploads/delete` |
| Listado completo de usuarios con emails y datos personales | **Crítica** (GDPR/LPDP) | Auth guard + role check en `/api/admin/users` |
| Activación/desactivación de featured ads sin permiso | **Alta** | Auth guard + superadmin check |
| CORS rechaza frontend en producción | **Bloqueante** | Usar variable de entorno |
| Contenido no moderado en producción | **Alta** | Quitar auto-approval |

#### 2.1.4 Impacto esperado

- **Seguridad:** De 0% a 100% de cobertura en rutas de escritura
- **Compliance:** Datos de usuarios protegidos por autenticación (base para LPDP/GDPR)
- **Disponibilidad producción:** CORS funcional con cualquier dominio configurado
- **DX:** Helper de auth reutilizable reduce boilerplate en futuras rutas

#### 2.1.5 Criterios de aceptación

- [ ] Ninguna ruta de escritura acepta requests sin header `Authorization: Bearer <token>`
- [ ] `GET /api/admin/users` sin token devuelve `401 Unauthorized`
- [ ] `POST /api/ads` con token válido de usuario `free` funciona; sin token devuelve `401`
- [ ] `PATCH /api/admin/users` con token de usuario no-superadmin devuelve `403 Forbidden`
- [ ] En `next.config.js`, el `Access-Control-Allow-Origin` responde con el valor de `FRONTEND_URL` cuando está definido
- [ ] Cero instancias de `localhost:3001` sin fallback a variable de entorno en el frontend
- [ ] Un aviso creado en producción tiene `approval_status: 'pending'`
- [ ] En dev con `AUTO_APPROVE_ADS=true`, sigue siendo `'approved'`

---

### FASE 2 — Unificación Backend

**Duración estimada:** 2 semanas  
**Prioridad:** Alta — sin esta fase, el backend es inmantenible a escala.  
**Dependencia:** Fase 1 completada (el auth guard se integra en las nuevas rutas).

#### 2.2.1 Objetivo

Eliminar la dualidad de patrones de acceso a datos, consolidar toda la lógica de negocio en la capa de dominio, y establecer un patrón único de manejo de errores.

#### 2.2.2 Alcance técnico

| Tarea | Detalle | Impacto |
|-------|---------|---------|
| **Migrar 16 rutas al patrón Domain/Repository** | Actualmente, 16 de 21 rutas con DB access hacen queries inline con `createClient()` local. Las rutas más críticas: `ads/search/route.ts` (685 líneas de query building inline), `config/filters/route.ts` (459 líneas), `featured-ads/route.ts` (235 líneas). Extraer lógica a servicios y repositorios dedicados. | Mantenibilidad, testabilidad |
| **Eliminar instancias inline de `createClient()`** | Existen 13 instancias de `createClient(supabaseUrl, supabaseServiceKey)` declaradas localmente en archivos de ruta. Algunas usan `SUPABASE_URL`, otras `NEXT_PUBLIC_SUPABASE_URL` — inconsistencia que puede causar fallos silenciosos. Todas deben usar el singleton `getSupabaseClient()` de `infrastructure/supabase/client.ts`. | Consistencia, debugging |
| **Crear servicios de dominio faltantes** | `SearchService` + `SearchRepository` (absorbe las 685 líneas de `/api/ads/search`), `FeaturedAdsService` + `FeaturedAdsRepository` (absorbe featured-ads CRUD completo), `AdminService` (absorbe user management y sitemap). | Separación de concerns |
| **Decidir Prisma vs Supabase** | Prisma (v7.2) está en `package.json` y el schema tiene 1,381 líneas, pero **0 imports en código de producción**. Todo el runtime usa `@supabase/supabase-js`. Opciones: (A) Eliminar Prisma como dependencia runtime, conservar schema como documentación; (B) Migrar queries a Prisma Client con type-safety nativa. **Recomendación: Opción A** — Supabase client ya funciona, Prisma no agrega valor sin migración completa, y el schema sirve como referencia. | Peso del bundle, claridad |
| **Unificar error handling** | Coexisten dos patrones: `Result.ok/fail` + errores tipados (5 rutas) vs `try/catch` con `err.message` directo al cliente (16 rutas). El segundo filtra mensajes internos de PostgreSQL/Supabase. Crear un `withErrorHandler` wrapper o estandarizar `Result` pattern en todas las rutas. | Seguridad, consistencia |

#### 2.2.3 Riesgos mitigados

| Riesgo actual | Severidad | Mitigación |
|--------------|-----------|------------|
| Archivos de ruta de 400-700 líneas imposibles de testear | **Alta** | Extracción a domain layer |
| Mensajes de error internos de PostgreSQL expuestos al cliente | **Media** | Error handler unificado |
| 13 puntos de configuración de Supabase client divergentes | **Media** | Singleton centralizado |
| Riesgo de regresión al modificar queries duplicadas | **Alta** | Un solo punto de cambio por entidad |
| Dependencia fantasma (Prisma sin uso) genera confusión | **Baja** | Decisión documentada |

#### 2.2.4 Impacto esperado

- **Mantenibilidad:** Cada cambio de lógica de negocio se hace en UN lugar
- **Testabilidad:** Servicios y repositorios son unit-testables sin HTTP ni DB real
- **Performance:** Posibilidad de agregar cache a nivel repositorio (no viable con queries inline)
- **DX:** Nuevas features siguen un patrón documentado, onboarding <1 día

#### 2.2.5 Criterios de aceptación

- [ ] 0 archivos `route.ts` con más de 80 líneas de lógica de negocio
- [ ] 0 instancias de `createClient()` fuera de `infrastructure/`
- [ ] `domain/` contiene: `ads/`, `catalog/`, `categories/`, `search/`, `featured-ads/`, `admin/`, `images/`, `shared/`
- [ ] Cada servicio de dominio tiene al menos 1 test unitario con mock de repositorio
- [ ] Ningún endpoint devuelve mensajes de error que contengan nombres de tablas o códigos SQL
- [ ] Prisma removido de `dependencies` en `package.json` (mantenido en `devDependencies` solo si se usa para introspección)
- [ ] `npx prisma` no es necesario para el funcionamiento de la aplicación

---

### FASE 3 — Limpieza Frontend

**Duración estimada:** 2 semanas  
**Prioridad:** Media-Alta  
**Dependencia:** Fase 1 completada (URLs corregidas). Fase 2 no es bloqueante pero facilita la unificación de servicios frontend que consumen las APIs.

#### 2.3.1 Objetivo

Eliminar sistemas paralelos, código muerto, y la limitación de navegación hash-based para permitir deep linking, code splitting y una UX profesional.

#### 2.3.2 Alcance técnico

| Tarea | Detalle | Impacto |
|-------|---------|---------|
| **Instalar React Router y migrar hash navigation** | `App.tsx` usa `useState<Page>` con ~35 strings y un `switch`. No hay deep links, no hay code splitting por ruta, browser back/forward no funciona de forma confiable. Adicionalmente, `SmartSearchInput.tsx` importa `useNavigate` de `react-router-dom` que no está instalado — esto es un **crash en runtime**. Migrar a React Router v6+ con rutas lazy-loaded. | UX, performance, SEO |
| **Unificar servicios de catálogo** | 3 archivos: `catalogService.ts` (491 líneas, usado por 8 archivos), `catalogServiceClean.ts` (289 líneas, queries legacy), `catalogServiceV2.ts` (281 líneas, wrapper). Conservar `catalogService.ts` como fuente única, migrar los 5 consumers restantes, eliminar los otros dos. | Mantenibilidad, bundle size |
| **Completar migración de banners** | Dos sistemas coexisten: `bannersService.ts` → tabla `banners`, `bannersCleanService.ts` → tabla `banners_clean`. Cada uno tiene su panel admin, sus componentes de display y su lógica. Elegir UNA tabla, migrar datos si es necesario, eliminar el servicio y los componentes del sistema descartado. | Mantenibilidad, UX admin |
| **Eliminar dead code** | Archivos identificados sin imports: `HeroSection_old.tsx`, `testCatalog.ts`, `diagnostics.ts`, probablemente `CategoriesAdminPage.tsx` (reemplazado por V2), `DesignSystemShowcaseSimple.tsx` (1,123 líneas de showcase de desarrollo). | Bundle size, claridad |
| **Descomponer componentes >800 líneas** | Los 7 componentes más grandes: `PublicarAviso.tsx` (1,530), `AttributesAdmin.tsx` (1,285), `CategoriesAdminPageV2.tsx` (1,251), `AdDetailPage.tsx` (1,094), `CategoriesTreeView.tsx` (1,040), `SuperAdminFeaturedPanel.tsx` (977), `adsService.ts` (979). Extraer sub-componentes, hooks custom y utilities. Objetivo: ningún archivo >500 líneas. | Mantenibilidad, code review |

#### 2.3.3 Riesgos mitigados

| Riesgo actual | Severidad | Mitigación |
|--------------|-----------|------------|
| `SmartSearchInput.tsx` importa `react-router-dom` inexistente → crash | **Alta** | Instalar React Router |
| Sin deep linking: usuarios no pueden compartir URLs de avisos/categorías | **Media** | React Router con rutas semánticas |
| 3 servicios de catálogo: bug fix en el equivocado → regresión | **Media** | Un solo servicio |
| Bundle incluye ~2,500 líneas de código muerto | **Baja** | Tree shaking + eliminación manual |
| Componentes de 1,500 líneas: PRs imposibles de revisar | **Media** | Descomposición |

#### 2.3.4 Impacto esperado

- **UX:** Deep links funcionales, browser navigation, URLs compartibles
- **Performance:** Code splitting reduce bundle inicial un ~30-40% estimado
- **Mantenibilidad:** 1 servicio por entidad en vez de 2-3
- **DX:** Archivos <500 líneas son reviewables, debuggeables, testables
- **SEO:** React Router habilita generación de URLs semánticas para el crawler

#### 2.3.5 Criterios de aceptación

- [ ] `react-router-dom` instalado y configurado como provider en `App.tsx`
- [ ] Mínimo 10 rutas migradas del `switch` a `<Route>` components
- [ ] Browser back/forward funciona correctamente en todos los flujos principales
- [ ] `catalogServiceClean.ts` y `catalogServiceV2.ts` eliminados, 0 imports residuales
- [ ] Una sola tabla de banners en uso; servicio eliminado no es importado por ningún archivo
- [ ] Archivos muertos identificados eliminados del repo
- [ ] 0 componentes `.tsx` con más de 500 líneas (excepto justificación documentada)
- [ ] `SmartSearchInput.tsx` no crashea al montar — `useNavigate` funciona

---

### FASE 4 — Calidad de Código

**Duración estimada:** Continua (sprint-by-sprint)  
**Prioridad:** Media  
**Dependencia:** Fases 1-3 completadas. Sin la unificación de Fase 2-3, tipar servicios duplicados es trabajo descartable.

#### 2.4.1 Objetivo

Elevar la calidad del codebase a estándares de producto mantenible: type-safety, observabilidad limpia, cobertura de tests, y optimización de carga.

#### 2.4.2 Alcance técnico

| Tarea | Detalle | Impacto |
|-------|---------|---------|
| **Reemplazar `any` por tipos concretos** | ~481 ocurrencias en el frontend. Priorizar: (1) interfaces de servicios que consumen APIs — contrato con backend; (2) props de componentes reutilizables; (3) state de componentes admin. Los `catch (error: any)` se reemplazan por `catch (error: unknown)` con type guard. | Type safety, refactoring confidence |
| **Eliminar `console.log` del backend** | ~53 statements en producción. Los más problemáticos: 18 en `ads/search/route.ts`, 8 en `uploads/route.ts`, 7 en `health/route.ts`. Reemplazar por logger estructurado silencioso en dev (ej: `pino` con level configurable por env). | Performance, observabilidad, seguridad (no filtrar datos en logs) |
| **Agregar tests unitarios** | Cobertura actual: **0 tests**. Priorizar domain layer (services + repositories con mocks de Supabase client). Framework sugerido: Vitest (ya usan Vite). Target inicial: servicios de `domain/ads`, `domain/catalog`, `domain/search`, `domain/shared/auth-guard`. | Confianza en deploys, regresión |
| **Code splitting por ruta** | Requiere React Router de Fase 3. Usar `React.lazy()` + `Suspense` para cargar paneles admin, PublicarAviso, AdDetail bajo demanda. El bundle actual carga los ~191 componentes de una vez. | Time-to-interactive, LCP |

#### 2.4.3 Riesgos mitigados

| Riesgo actual | Severidad | Mitigación |
|--------------|-----------|------------|
| Refactoring de servicios sin tests → regresiones silenciosas | **Alta** | Test coverage en domain layer |
| `any` oculta errores de contrato API-frontend | **Media** | Tipos estrictos en interfaces de servicio |
| Logs de producción exponen datos internos | **Media** | Logger estructurado con niveles |
| Bundle de ~2MB cargándose completo en cada visita | **Media** | Lazy loading por ruta |

#### 2.4.4 Impacto esperado

- **Confianza en releases:** Tests atrapan regresiones antes del deploy
- **Performance:** Bundle inicial reducido, TTI mejorado
- **DX:** Autocompletado, refactoring tooling, errores en compile-time
- **Observabilidad:** Logs útiles en producción sin ruido de debug

#### 2.4.5 Criterios de aceptación

- [ ] `any` reducido de ~481 a <50 ocurrencias (excluir librerías externas)
- [ ] `strict: true` en `tsconfig.json` del frontend habilitado sin errores
- [ ] 0 `console.log` en código backend de producción (solo logger)
- [ ] >80% cobertura en `domain/` del backend
- [ ] Al menos 3 rutas principales con lazy loading (home, publicar, detalle)
- [ ] Bundle inicial <500KB gzipped (medir con `vite build --report`)

---

## 3. DEPENDENCIAS Y ORDEN LÓGICO DE EJECUCIÓN

```
FASE 1 ──────────► FASE 2 ──────────► FASE 4
(Seguridad)        (Backend DDD)       (Calidad)
    │                                     ▲
    │                                     │
    └──────────► FASE 3 ─────────────────┘
                 (Frontend)
```

| Dependencia | Razón |
|-------------|-------|
| Fase 1 → Fase 2 | El auth guard creado en F1 se integra en las nuevas rutas refactorizadas en F2 |
| Fase 1 → Fase 3 | Las URLs corregidas en F1 afectan servicios que se unifican en F3 |
| Fase 2 ∥ Fase 3 | Pueden ejecutarse en paralelo con equipos distintos (backend / frontend) |
| Fase 2+3 → Fase 4 | No tiene sentido tipar servicios que se van a eliminar, ni testear código que se va a refactorizar |

**Ruta crítica:** Fase 1 (1 sem) → Fase 2 + Fase 3 en paralelo (2 sem) → Fase 4 (continua) = **~5 semanas hasta estado estable**.

---

## 4. RIESGOS RESIDUALES POST-PLAN

Aun completando las 4 fases, quedan elementos de deuda técnica que no están en el alcance:

| Riesgo residual | Descripción | Recomendación |
|-----------------|-------------|---------------|
| **Sin E2E tests** | Solo se cubren unit tests en F4. Flujos críticos (publicar aviso, contactar vendedor, featured ads) no tienen cobertura end-to-end. | Agregar Playwright E2E en siguiente sprint. |
| **Rate limiting básico** | Solo `uploads/route.ts` tiene rate limiting rudimentario. Las APIs públicas de búsqueda y catálogo son vulnerables a scraping/DDoS. | Implementar rate limiting a nivel de middleware o edge (Vercel Edge Middleware, Upstash). |
| **Sin monitoring en producción** | No hay APM, no hay error tracking (Sentry), no hay métricas de request. | Integrar Sentry + Vercel Analytics post-deploy. |
| **Modelo de datos acoplado a Supabase** | Toda la capa de repositorio depende de `@supabase/supabase-js`. Un cambio de proveedor requiere reescribir todos los repos. | Aceptable para el horizonte actual. Considerar abstracción si se evalúa migración de BaaS. |
| **Sin CI/CD pipeline** | No hay GitHub Actions para lint, type-check, tests, build antes de merge. | Crear pipeline básico: `lint → type-check → test → build` en PR. |
| **Edge vs Node runtime inconsistente** | 7 rutas usan `runtime = 'edge'`, el resto Node. Los edge routes crean su propio Supabase client porque el singleton usa module-level state incompatible con Edge. | Estandarizar: Node para rutas con auth, Edge para rutas públicas de lectura. Documentar la convención. |

---

## 5. RECOMENDACIONES ADICIONALES

### Arquitectura

1. **Convención de capas obligatoria**: Todo route handler que acceda a DB debe pasar por `Domain Service → Repository → Infrastructure`. Agregar linting rule o review checklist.

2. **Separar auth de Supabase del transporte HTTP**: El auth guard no debe estar acoplado a `NextRequest`. Crear un `AuthService` en domain que reciba el token y devuelva `Result<UserContext, AuthError>`. Esto permite reusar la lógica en cron jobs, webhooks, o futuros WebSockets.

3. **Definir contrato API con esquemas Zod compartidos**: Las validaciones de Zod en rutas backend (`AdCreateSchema`, `AdFiltersSchema`) deberían exportarse como paquete compartido o al menos vivir en un directorio `types/schemas/` referenciable tanto por backend como por frontend. Esto elimina la divergencia tipo-contrato.

### Proceso

4. **Feature flags para la migración**: Usar variables de entorno para activar/desactivar sistemas nuevos vs legacy (ej: `USE_BANNERS_CLEAN=true`). Esto permite rollback inmediato sin revert de código.

5. **Migración incremental, no big-bang**: Cada ruta migrada al domain layer se despliega individualmente. No acumular 16 migraciones en un PR monolítico.

6. **Definition of Done actualizada**: Ningún PR se mergea sin:
   - Type-check passing (`tsc --noEmit`)
   - 0 `any` nuevos introducidos
   - Test para lógica de negocio nueva
   - Auth guard aplicado si es ruta de escritura

---

## 6. CONCLUSIÓN

El sistema tiene una base funcional sólida — el modelo de datos es coherente, la capa de dominio existe como patrón para 5 rutas, y la separación frontend/backend es clara. La deuda técnica no es resultado de mala arquitectura sino de **velocidad de desarrollo que priorizó features sobre consistencia**.

El plan propuesto ataca primero lo que bloquea producción (seguridad), luego lo que previene escalabilidad del equipo (consistencia del backend), después lo que afecta UX y performance (frontend), y finalmente lo que sostiene la calidad largo plazo (tipos, tests, splitting).

**La inversión de ~5 semanas transforma el proyecto de un prototipo funcional a un producto desplegable y mantenible.**

---

*Documento generado a partir de auditoría técnica del 9 de febrero de 2026 sobre el repositorio `germanbruel-web/rural24`, rama `rural24-deploy`.*
