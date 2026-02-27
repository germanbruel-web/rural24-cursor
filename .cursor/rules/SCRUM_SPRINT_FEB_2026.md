# 🏃 SCRUM — Sprint Tracker Rural24
> **Inicio:** 2026-02-06 | **Actualizado:** 2026-02-16  
> **Sprint Goal:** Migración featured_ads + UI Panel Mis Avisos + Estabilización

---

## ✅ COMPLETADOS (Done)

### Epic 1: Infraestructura & CRON
| # | Tarea | Estado | Fecha | Notas |
|---|-------|--------|-------|-------|
| 1.1 | Fix CRON_SECRET sincronización Render | ✅ Done | Feb 06 | `render.yaml` → `fromService` |
| 1.2 | Fix localhost bypass en cron/route.ts | ✅ Done | Feb 06 | Solo en NODE_ENV=development |
| 1.3 | Mejorar error logging en cron | ✅ Done | Feb 06 | Stack traces detallados |

### Epic 2: Arquitectura de Agentes IA
| # | Tarea | Estado | Fecha | Notas |
|---|-------|--------|-------|-------|
| 2.1 | Crear ARCHITECTURE.md | ✅ Done | Feb 06 | Decisiones inmutables |
| 2.2 | Crear SUPERAGENT.md | ✅ Done | Feb 06 | Coordinación multi-dominio |
| 2.3 | Crear 6 agent files (frontend/backend/db/devops/perf/ux) | ✅ Done | Feb 06 | En carpeta `ai/` |
| 2.4 | Crear .github/copilot-instructions.md | ✅ Done | Feb 12 | Auto-loaded por Copilot |
| 2.5 | Crear ROADMAP_DEUDA_TECNICA_FEB_2026.md | ✅ Done | Feb 06 | 73 items, 6 fases |

### Epic 3: Migración Featured Ads (Phase 0 + Phase 1)
| # | Tarea | Estado | Fecha | Notas |
|---|-------|--------|-------|-------|
| 3.1 | Phase 0: Verificar seguridad (3 fixes) | ✅ Done | Feb 06 | Localhost, JWT, admin whitelist |
| 3.2 | Pre-migration audit SQL | ✅ Done | Feb 06 | queue_only=9, duplicates=5, phantom=1 |
| 3.3 | Migración SQL (9 records queue → featured_ads) | ✅ Done | Feb 06 | Con `status='completed'`, `action='edited'` |
| 3.4 | Post-migration verification | ✅ Done | Feb 06 | 32 active, 0 desync, 0 queue active |
| 3.5 | Eliminar stubs muertos (restore/, history/) | ✅ Done | Feb 06 | 2 carpetas API borradas |
| 3.6 | Redirect #/featured-queue → featured-ads | ✅ Done | Feb 12 | En getPageFromHash() |
| 3.7 | Fix isProtectedPage (4 páginas faltantes) | ✅ Done | Feb 12 | featured-ads, coupons, credits-config, settings |

### Epic 4: UI Panel "Mis Avisos" — Publicidad
| # | Tarea | Estado | Fecha | Notas |
|---|-------|--------|-------|-------|
| 4.1 | cancelActiveFeaturedAd() en userFeaturedService | ✅ Done | Feb 16 | Sin reembolso de créditos |
| 4.2 | FeaturedAdModal → 3 columnas PP/PR/PA | ✅ Done | Feb 16 | Multi-select, theme verde |
| 4.3 | Columna PUBLICIDAD en tabla MyAdsPanel | ✅ Done | Feb 16 | Destacar/restan Nd/cancelar/+ Agregar |
| 4.4 | Header con créditos + Comprar + Cupón | ✅ Done | Feb 16 | BuyCreditsModal + RedeemCouponModal |
| 4.5 | Remover Star de columna Acciones | ✅ Done | Feb 16 | Solo Eye/Edit/Trash |
| 4.6 | Modal confirmación cancelar destacado | ✅ Done | Feb 16 | Aviso "créditos no se devuelven" |
| 4.7 | TypeScript — zero errors en archivos modificados | ✅ Done | Feb 16 | tsc --noEmit ✓ |

---

## 🔄 PENDIENTE DE TESTING (Ready for QA)

| # | Tarea | Estado | Prioridad | Notas |
|---|-------|--------|-----------|-------|
| T.1 | Probar panel Mis Avisos con usuario logueado | 🧪 QA | Alta | Frontend localhost:5173 |
| T.2 | Probar modal Destacar con 3 columnas | 🧪 QA | Alta | Multi-select, costo total |
| T.3 | Probar botón Cancelar destacado | 🧪 QA | Alta | Confirm modal, no refund |
| T.4 | Probar Comprar Créditos / Canjear Cupón | 🧪 QA | Media | Modals existentes integrados |
| T.5 | Responsive mobile (tabla + modal) | 🧪 QA | Media | 3 cols en mobile puede ser tight |

---

## 📋 BACKLOG (No iniciado)

### Epic 5: Deuda Técnica Fase 2 (ver ROADMAP completo)
| # | Tarea | Estado | Prioridad | Estimación |
|---|-------|--------|-----------|------------|
| 5.1 | Eliminar tablas obsoletas (featured_ads_queue, etc.) | ⬜ | Media | 1h |
| 5.2 | Limpiar código muerto: imports no usados | ⬜ | Baja | 2h |
| 5.3 | Unificar servicios duplicados (featured admin/user) | ⬜ | Media | 3h |
| 5.4 | Implementar tests unitarios featured | ⬜ | Media | 4h |

### Epic 6: UX Mejoras Pendientes
| # | Tarea | Estado | Prioridad | Estimación |
|---|-------|--------|-----------|------------|
| 6.1 | Indicador visual "plan pago requerido" → CTA upgrade | ⬜ | Alta | 2h |
| 6.2 | Toast notifications consistency | ⬜ | Baja | 1h |
| 6.3 | Loading skeletons en tabla Mis Avisos | ⬜ | Baja | 1h |

### Epic 7: Backend / DB pendientes
| # | Tarea | Estado | Prioridad | Estimación |
|---|-------|--------|-----------|------------|
| 7.1 | Agregar credit_cost_homepage a global_settings | ⬜ | Media | 30min |
| 7.2 | RPC check_featured_availability para 'detail' | ⬜ | Media | 1h |
| 7.3 | Cron: limpiar featured_ads_queue tabla | ⬜ | Baja | 30min |

---

## 🐛 BUGS CONOCIDOS

| # | Bug | Severidad | Archivo | Estado |
|---|-----|-----------|---------|--------|
| B.1 | Puertos 5173/3001 se bloquean al cerrar mal dev servers | Media | dev.ps1 | Mitigado con kill manual |
| B.2 | tsc tiene ~40+ errores pre-existentes (no relacionados) | Baja | Varios | Conocido, no bloqueante |

---

## 📊 MÉTRICAS DEL SPRINT

| Métrica | Valor |
|---------|-------|
| Tasks completadas | 21 |
| Tasks en QA | 5 |
| Tasks backlog | 10 |
| Bugs conocidos | 2 |
| Archivos modificados (sesión actual) | 3 |
| Archivos creados (sesión actual) | 0 |
| Archivos eliminados (histórico) | 2 |

---

## 🗂️ ARCHIVOS CLAVE MODIFICADOS

### Sesión 2026-02-16
| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `frontend/src/services/userFeaturedService.ts` | +cancelActiveFeaturedAd() | +50 |
| `frontend/src/components/dashboard/FeaturedAdModal.tsx` | Rediseño completo 3-col multi-select | ~840 (rewrite) |
| `frontend/src/components/admin/MyAdsPanel.tsx` | +PUBLICIDAD col, +créditos, +modals | ~750 (major refactor) |

### Sesiones anteriores (resumen)
| Archivo | Cambio |
|---------|--------|
| `render.yaml` | CRON_SECRET fromService |
| `backend/app/api/cron/route.ts` | Localhost bypass + logging |
| `frontend/App.tsx` | Redirect featured-queue, isProtectedPage |
| `ai/*` (8 archivos) | Agent architecture system |
| `.github/copilot-instructions.md` | Auto-protocol Copilot |

---

## 📌 DECISIONES ARQUITECTÓNICAS TOMADAS

1. **featuredMap ahora es `Record<string, FeaturedInfo[]>`** — soporta múltiples placements por aviso (antes era single object)
2. **cancelActiveFeaturedAd vs cancelUserFeaturedAd** — activo no reembolsa, pendiente sí reembolsa
3. **FeaturedAdModal multi-select** — crea N records en `featured_ads` (uno por placement) en llamadas secuenciales
4. **Theme verde (#386539/#169834)** en vez de amber en el modal de destacar
5. **PUBLICIDAD como columna separada** de Acciones (clean CRUD separation)

---

## 🔑 LECCIONES APRENDIDAS (Post-mortem)

1. **CHECK constraints**: SIEMPRE consultar `pg_constraint` antes de INSERT/UPDATE con valores nuevos
2. **7 capas de routing**: Page type, getPageFromHash, hashMap, hashchange, isDashboardPage, isProtectedPage, PAGE_PERMISSIONS — todas deben estar sincronizadas
3. **Puertos bloqueados**: Al usar `dev.ps1` con Turborepo, si el terminal se interrumpe, los procesos node quedan huérfanos. Usar `Stop-Process -Id <PID> -Force` para liberar
4. **JSX.Element → React.JSX.Element**: En React 19 + TS strict, usar `React.JSX.Element` explícito

---

> **Próximo paso sugerido:** Levantar dev servers (`dev.ps1`), probar QA items T.1-T.5, luego decidir prioridad de backlog.
