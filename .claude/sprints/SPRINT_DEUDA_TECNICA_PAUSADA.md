# Deuda Técnica — Rural24 (Pausada)
> Registrado: 2026-03-14
> Estado: PAUSADA — retomar cuando el producto esté más maduro
> Deuda CRÍTICA resuelta en la misma sesión (ítems 1-3 → Sprint 7C.2)

---

## ✅ RESUELTA EN SESIÓN (2026-03-14)

### Item 1 — Membership coupons no implementados
- Migration `20260314000001_membership_coupons.sql`
- `coupons.membership_duration_days` INT DEFAULT 365
- `redeem_coupon()` RPC v2: maneja ARS + membresía en la misma TX
- `CouponsAdminPanel.tsx`: ars_amount + gives_membership + plan selector
- `RedeemCouponModal.tsx`: preview y success adaptados
- `creditsService.validateCoupon`: usa `ars_amount`, soporta membresía

### Item 2 — Desincronización users.role ↔ users.subscription_plan_id
- Resuelto DENTRO del RPC `redeem_coupon` v2
- Al otorgar membresía: actualiza AMBOS en una operación atómica
- Regla: `plan.name = 'free'` → role='free'; cualquier otro → role='premium'

### Item 3 — Legacy DB queries en creditsService.ts
- `getUserCredits()` → stub sin DB query
- `getCreditTransactions()` → retorna []
- `purchaseCredits()` → retorna disabled error
- `getDaysRemainingInBillingPeriod()` → retorna 30 fijo

---

## ⏸️ PAUSADA (ítems 4-12)

### #4 — Sprint 8: Hash → History API (React Router v6)
**Impacto:** URLs tipo `#/mis-avisos` → `/dashboard`, mejor SEO y UX
**Esfuerzo:** 1 sesión completa (~6-8h), refactor completo de App.tsx
**Bloqueante:** NO — producto funciona bien con hash routing
**Cuándo:** Cuando el producto esté feature-complete y estable
**Doc:** `.claude/sprints/SPRINT_8_URL_ROUTING.md`

---

### #5 — Sprint 7D: profile_type (empresa | profesional)
**Impacto:** EmpresaPublicPage diferencia layout según tipo de empresa
**Esfuerzo:** Media sesión (~3-4h) + migración DB
**Dependencias:** business_hours, lat/lng, services_offered JSONB
**Cuándo:** Cuando haya demanda de usuarios sobre distintos layouts

---

### #6 — Completeness bar en MisEmpresasPanel
**Impacto:** Motivar a empresas a completar su perfil
**Esfuerzo:** ~2h (solo frontend)
**Bloqueante:** NO
**Cuándo:** Próxima iteración de empresa

---

### #7 — Sistema de Notificaciones (Bell icon removido)
**Impacto:** Bell fue removido del header porque abría un dropdown secundario
**Esfuerzo:** Backend (pg_notify o tabla notifications) + frontend
**Bloqueante:** NO
**Cuándo:** Cuando haya mensajería activa (Sprint inbox)

---

### #8 — Sprint 3D.6: Email al activar Destacado (pg_cron)
**Impacto:** Vendedor no recibe confirmación cuando su aviso se destaca
**Esfuerzo:** ~2h (backend pg_cron + email template)
**Bloqueante:** NO pero es importante para confianza del vendor
**Cuándo:** Antes del lanzamiento público de Destacados

---

### #9 — Tablas legacy: user_credits, user_featured_credits, credit_transactions
**Impacto:** Espacio en DB, confusión en futuros agentes
**Riesgo:** BAJO — las funciones que las consultaban ya fueron stubbeadas
**Acción:** DROP TABLE en una migración dedicada
**Cuándo:** Después de confirmar que ninguna RPC existente las referencia

---

### #10 — coupons.credits_amount (campo legacy)
**Impacto:** Confusión con `ars_amount` que es el campo canónico
**Acción:** ALTER TABLE coupons DROP COLUMN credits_amount (previa validación)
**Riesgo:** Bajo si validamos que no hay código que lo lea

---

### #11 — CSP Hardening
**Impacto:** Seguridad headers en frontend y backend
**Esfuerzo:** ~2h
**Cuándo:** Antes del lanzamiento público

---

### #12 — AntiVerificationWall (Sprint 6E)
**Impacto:** Gate bloqueante para usuarios sin email+phone verificado
**Esfuerzo:** ~3h (nuevo componente + lógica de verificación)
**Cuándo:** Cuando el volumen de spam/fake accounts aumente

---

## Criterios para retomar pausados

- **#4 (Sprint 8):** Producto feature-complete, antes de escalar marketing
- **#5-6 (empresa UX):** Cuando >10 empresas activas en la plataforma
- **#7-8 (notificaciones/email):** Antes de lanzamiento público
- **#9-10 (limpieza DB):** Una sesión de mantenimiento mensual
- **#11-12 (seguridad):** Antes de lanzamiento público
