# ✅ PLAN DE TESTING - Sistema Featured Ads Unificado
**Fecha:** 6 de Febrero 2026  
**Sistema:** Featured Ads - Arquitectura Unificada  
**Roles:** SuperAdmin + Usuarios Regulares

---

## 📋 PRERREQUISITOS

### 1. Ejecutar Migración SQL
```sql
-- Desde Supabase SQL Editor
-- Abrir: database/migrations/047_unify_featured_system.sql
-- Ejecutar completo (verificar sin errores)
```

**Verificación post-migración:**
```sql
-- Ver resumen de featured ads
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_manual = true) as manuales,
  COUNT(*) FILTER (WHERE is_manual = false) as usuarios,
  COUNT(*) FILTER (WHERE status = 'active') as activos
FROM featured_ads;

-- Ver tabla de auditoría
SELECT COUNT(*) FROM featured_ads_audit;

-- Verificar función de reembolso
SELECT calculate_featured_refund('UUID_DE_UN_FEATURED_ACTIVO');
```

### 2. Verificar Endpoints Backend
```powershell
# Backend debe estar corriendo
cd backend
npm run dev

# Verificar endpoints creados:
# - POST   /api/admin/featured-ads/manual
# - PATCH  /api/admin/featured-ads/[id]
# - DELETE /api/admin/featured-ads/[id]
# - GET    /api/admin/featured-ads/audit/[id]
```

### 3. Frontend Actualizado
```powershell
# Frontend debe estar corriendo
cd frontend
npm run dev

# Verificar componentes creados:
# - ManualActivationTab.tsx
# - EditFeaturedModal.tsx
# - CancelFeaturedModal.tsx
```

---

## 🧪 SUITE DE TESTS

### TEST 1: Activación Manual (Sin Crédito) ⚡

**Objetivo:** Verificar que SuperAdmin puede destacar avisos sin consumir créditos del usuario

#### Pasos:
1. Login como SuperAdmin
2. Ir a `/featured-ads-admin`
3. Click en tab "Activación Manual" (4to tab)
4. Buscar aviso por título: "Tractor"
5. Seleccionar un resultado
6. Configurar:
   - Placement: Homepage
   - Fecha inicio: Hoy
   - Duración: 15 días
   - Motivo: "Test de activación manual"
7. Click "Activar sin Crédito"

#### Resultado Esperado:
- ✅ Toast de éxito aparece
- ✅ Mensaje: "Featured activado. Slots restantes: X/10"
- ✅ Formulario se limpia en 3 segundos
- ✅ En tab "Lista" aparece el nuevo featured con estado "active"

#### Verificar en Base de Datos:
```sql
SELECT 
  ad_id, 
  placement, 
  status, 
  is_manual, 
  credit_consumed, 
  manual_activated_by,
  admin_notes
FROM featured_ads 
WHERE is_manual = true 
ORDER BY created_at DESC 
LIMIT 1;

-- El ad_id debe coincidir
-- is_manual = true
-- credit_consumed = false
-- manual_activated_by = UUID del superadmin

-- Verificar que NO se consumieron créditos del usuario
SELECT balance FROM user_credits WHERE user_id = 'UUID_DEL_USUARIO_DEL_AVISO';
-- Balance NO debe haber cambiado
```

---

### TEST 2: Editar Featured Existente 📝

**Objetivo:** Verificar que SuperAdmin puede editar fechas y configuración

#### Pasos:
1. En tab "Lista", buscar un featured activo
2. Click en botón "Editar" (ícono lápiz verde)
3. En el modal:
   - Cambiar duración: 15 → 21 días
   - Cambiar placement: homepage → results
   - Motivo: "Prueba de edición"
4. Click "Guardar Cambios"

#### Resultado Esperado:
- ✅ Toast de éxito: "Cambios guardados exitosamente"
- ✅ Modal se cierra en 1.5 segundos
- ✅ Tabla se recarga automáticamente
- ✅ Featured muestra nuevas fechas y placement

#### Verificar en Base de Datos:
```sql
SELECT 
  id, 
  duration_days, 
  placement, 
  expires_at,
  updated_at
FROM featured_ads 
WHERE id = 'UUID_DEL_FEATURED_EDITADO';

-- duration_days = 21
-- placement = 'results'
-- expires_at = nueva fecha calculada

-- Verificar auditoría
SELECT 
  action, 
  reason, 
  metadata 
FROM featured_ads_audit 
WHERE featured_ad_id = 'UUID_DEL_FEATURED_EDITADO' 
  AND action = 'edited'
ORDER BY created_at DESC 
LIMIT 1;

-- metadata debe contener: old_values y new_values
```

---

### TEST 3: Cancelar con Reembolso Proporcional 💰

**Objetivo:** Verificar cálculo correcto de reembolso y devolución de créditos

#### Setup Previo:
```sql
-- Crear un featured DE USUARIO (no manual) activo con 15 días de duración
-- Y que hayan pasado 5 días (quedan 10 días)
INSERT INTO featured_ads (
  ad_id, 
  user_id, 
  placement, 
  category_id,
  scheduled_start, 
  actual_start,
  expires_at, 
  duration_days,
  status,
  credit_consumed,
  credits_spent
) VALUES (
  'UUID_DE_UN_AVISO',
  'UUID_DE_UN_USUARIO',
  'homepage',
  'UUID_DE_CATEGORIA',
  CURRENT_DATE - INTERVAL '5 days',
  NOW() - INTERVAL '5 days',
  NOW() + INTERVAL '10 days',
  15,
  'active',
  true,
  4  -- homepage = 4 créditos
);

-- Anotar balance de créditos ANTES
SELECT balance FROM user_credits WHERE user_id = 'UUID_DE_UN_USUARIO';
-- Ejemplo: balance = 2
```

#### Pasos:
1. En tab "Lista", buscar el featured creado arriba
2. Click en botón "Cancelar" (ícono rojo)
3. En el modal:
   - Verificar cálculo automático:
     - Días totales: 15
     - Días restantes: 10
     - Créditos consumidos: 4
     - Reembolso calculado: 3 créditos (redondeo arriba: 10/15 × 4 = 2.67 → 3)
   - Checkbox "Reembolsar X créditos" debe estar activado
   - Motivo: "Test de reembolso proporcional"
4. Click "Sí, Cancelar Featured (3 créditos)"

#### Resultado Esperado:
- ✅ Toast de éxito: "Featured cancelado. 3 créditos reembolsados."
- ✅ Modal se cierra en 2 segundos
- ✅ Featured ya NO aparece como activo en la tabla
- ✅ Créditos del usuario aumentaron: 2 + 3 = 5

#### Verificar en Base de Datos:
```sql
-- Verificar featured cancelado
SELECT 
  status, 
  refunded, 
  cancelled_by, 
  cancelled_reason, 
  cancelled_at
FROM featured_ads 
WHERE id = 'UUID_DEL_FEATURED';

-- status = 'cancelled'
-- refunded = true
-- cancelled_by = UUID del superadmin
-- cancelled_at = NOW()

-- Verificar balance de créditos
SELECT balance FROM user_credits WHERE user_id = 'UUID_DE_UN_USUARIO';
-- balance = 5 (era 2 + 3 reembolsados)

-- Verificar transacción de reembolso
SELECT 
  type, 
  amount, 
  balance_after, 
  description 
FROM credit_transactions 
WHERE user_id = 'UUID_DE_UN_USUARIO' 
  AND type = 'refund'
ORDER BY created_at DESC 
LIMIT 1;

-- type = 'refund'
-- amount = 3
-- balance_after = 5

-- Verificar auditoría
SELECT 
  action, 
  metadata 
FROM featured_ads_audit 
WHERE featured_ad_id = 'UUID_DEL_FEATURED' 
  AND action = 'refunded'
ORDER BY created_at DESC 
LIMIT 1;

-- metadata.refund_amount = 3
```

---

### TEST 4: Cancelar SIN Reembolso (Featured Manual) 🚫

**Objetivo:** Verificar que featured manual NO genera reembolso

#### Pasos:
1. Activar un featured manual (TEST 1)
2. Ir a tab "Lista"
3. Click "Cancelar" en el featured manual
4. En el modal:
   - Debe mostrar: "Sin reembolso disponible"
   - Razón: "Este featured no consumió créditos (activación manual)"
   - Checkbox de reembolso NO debe aparecer
   - Motivo: "Test cancelación manual"
5. Click "Sí, Cancelar Featured"

#### Resultado Esperado:
- ✅ Featured cancelado exitosamente
- ✅ Toast: "Featured cancelado exitosamente" (sin mención de reembolso)
- ✅ NO se modifican créditos del usuario

#### Verificar en Base de Datos:
```sql
SELECT 
  status, 
  refunded, 
  credit_consumed,
  is_manual
FROM featured_ads 
WHERE id = 'UUID_DEL_FEATURED_MANUAL';

-- status = 'cancelled'
-- refunded = false  -- No hubo reembolso
-- credit_consumed = false
-- is_manual = true
```

---

### TEST 5: Validación de Slots Disponibles 🎯

**Objetivo:** Verificar que respeta límites de slots por ubicación

#### Pasos:
1. Ir a tab "Activación Manual"
2. Buscar 11 avisos activos de la misma categoría
3. Intentar activar el 11vo en placement "homepage"

#### Resultado Esperado:
- ❌ Error: "No hay cupo disponible en homepage para esta categoría (10/10)"
- ✅ No se crea el featured
- ✅ Modal permanece abierto para corregir

#### Verificar en Base de Datos:
```sql
-- Verificar que hay exactamente 10 en esa categoría + placement
SELECT COUNT(*) 
FROM featured_ads 
WHERE category_id = 'UUID_CATEGORIA'
  AND placement = 'homepage'
  AND status IN ('active', 'pending');
  
-- COUNT debe ser 10 (el máximo)
```

---

### TEST 6: Usuario Regular Destaca con Créditos (Sin cambios) ⭐

**Objetivo:** Verificar que usuarios SIGUEN pudiendo destacar con sus créditos

#### Pasos:
1. Logout SuperAdmin
2. Login como usuario regular con créditos disponibles
3. Ir a `/my-ads`
4. Click en "Destacar" en un aviso propio
5. Modal FeaturedAdModal aparece:
   - Seleccionar placement: homepage (4 créditos)
   - Fecha: Hoy
   - Duración: 30 días
6. Click "Confirmar y Destacar"

#### Resultado Esperado:
- ✅ Featured se crea correctamente
- ✅ Créditos del usuario se consumen: balance - 4
- ✅ Aparece en homepage
- ✅ En BD: is_manual = false, credit_consumed = true

#### Verificar en Base de Datos:
```sql
SELECT 
  id, 
  is_manual, 
  credit_consumed, 
  credits_spent,
  requires_payment
FROM featured_ads 
WHERE user_id = 'UUID_USUARIO_REGULAR' 
ORDER BY created_at DESC 
LIMIT 1;

-- is_manual = false  -- No fue activado por admin
-- credit_consumed = true
-- credits_spent = 4
-- requires_payment = true

-- Verificar créditos consumidos
SELECT balance FROM user_credits WHERE user_id = 'UUID_USUARIO_REGULAR';
-- Balance debe haber disminuido en 4
```

---

### TEST 7: Vista Administrativa Completa (v_admin_featured_ads) 👁️

**Objetivo:** Verificar que la vista consolida toda la info correctamente

#### Pasos:
1. Ejecutar query en Supabase SQL Editor:

```sql
SELECT 
  id,
  ad_title,
  user_full_name,
  category_name,
  placement,
  status,
  is_manual,
  credit_consumed,
  refunded,
  days_remaining,
  potential_refund,
  manual_activator_name,
  cancelled_by_name
FROM v_admin_featured_ads
ORDER BY created_at DESC
LIMIT 20;
```

#### Resultado Esperado:
- ✅ Muestra todos los featured (manuales y de usuarios)
- ✅ Columna `is_manual` diferencia origen
- ✅ Columna `days_remaining` calcula días restantes correctamente
- ✅ Columna `potential_refund` calcula reembolso posible
- ✅ JOINs traen nombre de usuario, categoría, etc

---

### TEST 8: Auditoría Completa 📜

**Objetivo:** Verificar que todas las acciones se registran en auditoría

#### Pasos:
1. Realizar acciones:
   - Activar manual
   - Editar featured
   - Cancelar con reembolso
2. Consultar auditoría:

```sql
SELECT 
  action,
  performer_email,
  reason,
  metadata,
  created_at
FROM featured_ads_audit
ORDER BY created_at DESC
LIMIT 10;
```

#### Resultado Esperado:
- ✅ Cada acción tiene registro correspondiente
- ✅ action = 'manual_activation', 'edited', 'refunded', 'cancelled'
- ✅ metadata contiene detalles (old_values, new_values, refund_amount)
- ✅ performer\_email identifica quién ejecutó la acción

---

### TEST 9: Carga Masiva y Performance ⚡

**Objetivo:** Verificar que el sistema maneja volumen

#### Setup:
```sql
-- Insertar 100 featured ads de prueba
INSERT INTO featured_ads (
  ad_id, user_id, placement, category_id,
  scheduled_start, duration_days, status, 
  is_manual, credit_consumed
)
SELECT 
  (SELECT id FROM ads WHERE status = 'active' ORDER BY RANDOM() LIMIT 1),
  (SELECT id FROM users WHERE role = 'user' ORDER BY RANDOM() LIMIT 1),
  (ARRAY['homepage', 'results', 'detail'])[FLOOR(RANDOM() * 3 + 1)],
  (SELECT id FROM categories ORDER BY RANDOM() LIMIT 1),
  CURRENT_DATE + (RANDOM() * 30)::INT,
  (ARRAY[7, 14, 15, 21, 28])[FLOOR(RANDOM() * 5 + 1)],
  (ARRAY['active', 'pending'])[FLOOR(RANDOM() * 2 + 1)],
  RANDOM() < 0.3,  -- 30% son manuales
  RANDOM() > 0.3   -- 70% consumieron créditos
FROM generate_series(1, 100);
```

#### Pasos:
1. Ir a SuperAdminFeaturedPanel → Tab "Lista"
2. Aplicar filtros:
   - Status: active
   - Placement: homepage
3. Exportar CSV
4. Abrir Tab "Estadísticas"

#### Resultado Esperado:
- ✅ Tabla carga en < 1 segundo
- ✅ Filtros responden instantáneamente
- ✅ Paginación funciona correctamente
- ✅ CSV se descarga completo
- ✅ Estadísticas calculan correctamente

---

### TEST 10: Edge Cases y Validaciones 🛡️

#### Test 10.1: Editar featured ya expirado
- ❌ Modal debe mostrar: "No se puede editar un featured expired"
- ✅ Botón "Guardar" deshabilitado

#### Test 10.2: Cancelar featured ya cancelado
- ❌ Modal debe mostrar: "No se puede cancelar un featured cancelled"
- ✅ Botón deshabilitado

#### Test 10.3: Activar aviso no activo
- ❌ Error: "El aviso debe estar activo para destacarlo"

#### Test 10.4: Buscar aviso inexistente
- ✅ Mensaje: "No se encontraron avisos"
- ✅ Autocompletado vacío

#### Test 10.5: Motivo muy corto
- ❌ Error: "El motivo debe tener al menos 5 caracteres"

---

## 📊 CHECKLIST FINAL DE ACEPTACIÓN

### Funcionalidad
- [ ] SuperAdmin puede activar featured manual sin crédito
- [ ] SuperAdmin puede editar fechas y placement
- [ ] SuperAdmin puede cancelar con reembolso proporcional
- [ ] SuperAdmin puede cancelar sin reembolso (manuales)
- [ ] Tab "Activación Manual" funcional y UX clara
- [ ] Tab "Lista" con botones: Ver, Editar, Cancelar
- [ ] Usuarios regulares siguen destacando con créditos (sin cambios)

### Datos
- [ ] Migración SQL ejecutada sin errores
- [ ] Tabla `featured_ads` tiene columnas nuevas
- [ ] Tabla `featured_ads_audit` creada y funcionando
- [ ] Función `calculate_featured_refund()` calcula correctamente
- [ ] Vista `v_admin_featured_ads` devuelve data completa
- [ ] Trigger de auditoría automático funciona

### Backend
- [ ] Endpoint POST /api/admin/featured-ads/manual funciona
- [ ] Endpoint PATCH /api/admin/featured-ads/[id] funciona
- [ ] Endpoint DELETE /api/admin/featured-ads/[id] funciona
- [ ] Endpoint GET /api/admin/featured-ads/audit/[id] funciona
- [ ] Validación de SuperAdmin en todos los endpoints

### Frontend
- [ ] ManualActivationTab renderiza correctamente
- [ ] EditFeaturedModal abre y guarda cambios
- [ ] CancelFeaturedModal calcula reembolso automáticamente
- [ ] Botones de acción aparecen solo para featured editables/cancelables
- [ ] Toast notifications funcionan correctamente

### Performance
- [ ] Tabla carga rápido con 100+ registros
- [ ] Filtros responden instantáneamente
- [ ] Paginación funciona correctamente
- [ ] Export CSV completo

### Seguridad
- [ ] Solo SuperAdmin puede acceder a endpoints admin
- [ ] Usuarios regulares NO pueden ejecutar endpoints admin
- [ ] Validación de permisos en frontend y backend

---

## 🐛 PROBLEMAS CONOCIDOS

### Issue #1: featured_ads_queue deprecada
**Status:** Pendiente  
**Descripción:** La tabla `featured_ads_queue` aún existe pero ya no se usa  
**Solución:** Descomentar sección 7 de migración 047 después de verificar que todo funciona

### Issue #2: Imports de lucide-react
**Status:** A verificar  
**Descripción:** Asegurar que todos los iconos están importados en SuperAdminFeaturedPanel  
**Solución:** Verificar imports: `Zap`, `Edit2`

---

## 📝 NOTAS ADICIONALES

### Orden de Testing Recomendado:
1. TEST 1 (Activación manual) → Base del sistema
2. TEST 6 (Usuario regular) → Verificar no se rompió nada
3. TEST 2 (Editar) → Modificación
4. TEST 3 (Reembolso) → Lógica crítica
5. TEST 5 (Slots) → Validaciones
6. TEST 8 (Auditoría) → Trazabilidad
7. Resto de tests en cualquier orden

### Tiempo Estimado de Testing:
- Setup inicial: 15 minutos
- Tests 1-6: 40 minutos
- Tests 7-10: 30 minutos
- Verificaciones BD: 20 minutos
- **Total: ~2 horas**

---

## ✅ SIGN-OFF

Una vez completados todos los tests:

**QA Engineer:** _________________________  
**SuperAdmin Tester:** _________________________  
**Usuario Regular Tester:** _________________________  
**Fecha:** _________________________  

**Status Final:**  
⬜ Todos los tests pasaron → Deploy a producción  
⬜ Tests fallaron → Revisar issues y retest
