# 📋 CHECKLIST DE TESTING MANUAL - Sistema de Featured Ads Admin

**Fecha:** 6 de Febrero de 2026  
**Sistema:** Panel SuperAdmin de gestión de avisos destacados  
**Responsable:** Tester/Developer

---

## 🎯 OBJETIVO

Validar el funcionamiento completo del sistema de administración de featured ads, incluyendo:
- Migración SQL aplicada correctamente
- Servicios TypeScript funcionando
- Panel React renderiza y funciona
- Flujo end-to-end desde usuario hasta admin
- Auditoría completa de acciones

---

## ✅ PRE-REQUISITOS

Antes de comenzar el testing, asegúrate de tener:

- [ ] Base de datos PostgreSQL/Supabase accesible
- [ ] Backend API corriendo en `http://localhost:3001`
- [ ] Frontend corriendo en `http://localhost:5173` (o puerto configurado)
- [ ] Un usuario SuperAdmin creado (role = 'superadmin')
- [ ] Al menos 2 usuarios regulares con créditos disponibles
- [ ] Al menos 3 categorías con avisos publicados
- [ ] Acceso al panel admin de Supabase para validar datos
- [ ] Herramienta de SQL (DBeaver, pgAdmin, etc.)

---

## 🗂️ FASE 1: MIGRACIÓN SQL

### 1.1 Aplicar Migración

- [ ] **Acción:** Ejecutar `database/20260206_admin_featured_system.sql` en Supabase
- [ ] **Validar:** No hay errores en la ejecución
- [ ] **Validar:** Tabla `featured_ads_audit` creada correctamente

```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'featured_ads_audit';
```

### 1.2 Validar Columnas Nuevas

- [ ] **Acción:** Verificar columnas agregadas a `featured_ads`

```sql
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'featured_ads' 
  AND column_name IN ('cancelled_by', 'cancelled_reason', 'refunded', 'cancelled_at');
```

- [ ] **Validar:** 4 columnas nuevas presentes

### 1.3 Validar Funciones RPC

- [ ] **Acción:** Verificar que las funciones se crearon

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'admin_get_featured_ads',
  'admin_cancel_featured_ad',
  'admin_featured_stats',
  'admin_get_featured_audit',
  'admin_get_occupancy_grid'
);
```

- [ ] **Validar:** 5 funciones creadas

### 1.4 Validar Triggers

- [ ] **Acción:** Verificar trigger de auditoría

```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'featured_ads_audit_auto';
```

- [ ] **Validar:** Trigger creado y activo

### 1.5 Validar RLS Policies

- [ ] **Acción:** Verificar policy de auditoría

```sql
SELECT 
  policyname, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'featured_ads_audit';
```

- [ ] **Validar:** Policy "SuperAdmin puede ver auditoría" existe

---

## 🔧 FASE 2: SERVICIOS TYPESCRIPT

### 2.1 Validar Importaciones

- [ ] **Archivo:** `frontend/src/services/adminFeaturedService.ts`
- [ ] **Validar:** No hay errores de compilación TypeScript
- [ ] **Validar:** Las interfaces están correctamente tipificadas

### 2.2 Validar Exports

- [ ] **Acción:** Verificar que el servicio se exporta correctamente

```typescript
import { adminFeaturedService } from './services/adminFeaturedService';
```

- [ ] **Validar:** Sin errores de importación

### 2.3 Test Unitario de Funciones Helpers

Abrir consola del navegador y ejecutar:

```javascript
// En consola del navegador
const { getStatusBadge, getPlacementLabel, getCreditCost } = 
  await import('./services/adminFeaturedService');

console.log(getCreditCost('homepage')); // Debe ser 4
console.log(getCreditCost('results'));  // Debe ser 1
console.log(getStatusBadge('active'));  // Debe tener label "Activo"
console.log(getPlacementLabel('homepage')); // "Homepage"
```

- [ ] **Validar:** Todas las funciones devuelven valores esperados

---

## 🎨 FASE 3: COMPONENTE REACT

### 3.1 Montaje del Componente

- [ ] **Acción:** Navegar a `/dashboard` (o ruta configurada)
- [ ] **Acción:** Click en menú lateral "Destacados Admin"
- [ ] **Validar:** El panel `SuperAdminFeaturedPanel` se renderiza sin errores
- [ ] **Validar:** Se muestran los 3 tabs: Lista, Calendario, Estadísticas

### 3.2 Tab "Lista"

#### 3.2.1 Carga Inicial

- [ ] **Validar:** Tabla se carga con datos (o mensaje "No hay registros")
- [ ] **Validar:** Skeleton/loader se muestra durante carga
- [ ] **Validar:** Columnas visibles: Estado, Aviso, Usuario, Placement, Fecha, Créditos, Acciones

#### 3.2.2 Filtros

- [ ] **Acción:** Click en botón "Filtros"
- [ ] **Validar:** Panel de filtros se despliega
- [ ] **Acción:** Seleccionar "Estado: Activo"
- [ ] **Acción:** Click "Aplicar"
- [ ] **Validar:** Tabla filtra solo featured ads activos
- [ ] **Validar:** Badge de filtros activos muestra "1"

- [ ] **Acción:** Seleccionar "Ubicación: Homepage"
- [ ] **Acción:** Click "Aplicar"
- [ ] **Validar:** Tabla filtra solo featured ads en homepage

- [ ] **Acción:** Escribir en campo "Buscar": nombre de un aviso
- [ ] **Acción:** Click "Aplicar"
- [ ] **Validar:** Tabla filtra por el término buscado

- [ ] **Acción:** Click "Limpiar"
- [ ] **Validar:** Todos los filtros se resetean

#### 3.2.3 Paginación

- [ ] **Acción:** Si hay más de 20 registros, verificar paginación
- [ ] **Validar:** Botones Anterior/Siguiente funcionan
- [ ] **Validar:** Muestra "Página X de Y"
- [ ] **Validar:** Botón "Anterior" deshabilitado en página 1
- [ ] **Validar:** Botón "Siguiente" deshabilitado en última página

#### 3.2.4 Acciones por Featured Ad

**Test: Ver Auditoría**
- [ ] **Acción:** Click en ícono "ojo" de un featured ad
- [ ] **Validar:** Modal de auditoría se abre
- [ ] **Validar:** Muestra historial de acciones (created, activated, etc.)
- [ ] **Validar:** Muestra quién realizó cada acción
- [ ] **Validar:** Muestra fechas correctamente
- [ ] **Validar:** Click en "Ver metadata" despliega JSON
- [ ] **Acción:** Click "Cerrar"
- [ ] **Validar:** Modal se cierra

**Test: Cancelar Featured Ad (Sin Reembolso)**
- [ ] **Acción:** Click en ícono "prohibido" de un featured ad ACTIVO
- [ ] **Validar:** Modal de cancelación se abre
- [ ] **Validar:** Muestra datos del aviso y usuario
- [ ] **Acción:** Desmarcar checkbox "Reembolsar créditos"
- [ ] **Acción:** Escribir razón: "Test sin reembolso"
- [ ] **Acción:** Click "Confirmar"
- [ ] **Validar:** Modal muestra loading spinner
- [ ] **Validar:** Featured ad cambia a estado "Cancelado"
- [ ] **Validar:** En BD, columna `refunded` = false
- [ ] **Validar:** Entry en `featured_ads_audit` con action='cancelled'

**Test: Cancelar Featured Ad (Con Reembolso)**
- [ ] **Acción:** Click en ícono "prohibido" de OTRO featured ad activo
- [ ] **Validar:** Modal de cancelación se abre
- [ ] **Acción:** Mantener checkbox "Reembolsar créditos" marcado
- [ ] **Acción:** Escribir razón: "Test con reembolso"
- [ ] **Acción:** Click "Confirmar"
- [ ] **Validar:** Featured ad cambia a estado "Cancelado"
- [ ] **Validar:** En BD, columna `refunded` = true
- [ ] **Validar:** Créditos del usuario aumentaron correctamente

```sql
SELECT credits_total, credits_used 
FROM user_featured_credits 
WHERE user_id = '<user_id>';
```

- [ ] **Validar:** Entry en `featured_ads_audit` con action='refunded'

**Test: Intentar Cancelar Ya Cancelado**
- [ ] **Acción:** Intentar cancelar un featured ad ya cancelado
- [ ] **Validar:** Botón de cancelar NO visible (disabled)

#### 3.2.5 Exportar CSV

- [ ] **Acción:** Click en botón "Exportar CSV"
- [ ] **Validar:** Archivo `.csv` se descarga
- [ ] **Validar:** Abrir CSV: contiene todas las columnas correctas
- [ ] **Validar:** Datos coinciden con los de la tabla
- [ ] **Validar:** Caracteres especiales (ñ, tildes) se muestran correctamente

#### 3.2.6 Refrescar

- [ ] **Acción:** Click en botón "Refrescar"
- [ ] **Validar:** Tabla se recarga con datos actualizados
- [ ] **Validar:** Loading spinner se muestra durante recarga

### 3.3 Tab "Calendario"

#### 3.3.1 Navegación Mensual

- [ ] **Acción:** Click en tab "Calendario"
- [ ] **Validar:** Se muestra el mes actual
- [ ] **Validar:** Nombre del mes en español (ej: "febrero 2026")
- [ ] **Acción:** Click en flecha izquierda
- [ ] **Validar:** Cambia al mes anterior
- [ ] **Acción:** Click en flecha derecha x2
- [ ] **Validar:** Avanza dos meses

#### 3.3.2 Selector de Placement

- [ ] **Acción:** Verificar que "Homepage" está seleccionado por defecto
- [ ] **Validar:** Botón "Homepage" tiene background verde
- [ ] **Acción:** Click en botón "Resultados"
- [ ] **Validar:** Calendario se actualiza
- [ ] **Validar:** Botón "Resultados" tiene background verde
- [ ] **Acción:** Click en botón "Homepage"
- [ ] **Validar:** Vuelve a homepage

#### 3.3.3 Visualización de Ocupación

- [ ] **Validar:** Leyenda de colores visible:
  - Verde: Disponible
  - Amarillo: Parcialmente ocupado
  - Rojo: Lleno

- [ ] **Validar:** Grid muestra ocupación por categoría
- [ ] **Validar:** Cada día muestra: número del día + "X/10" slots
- [ ] **Validar:** Colores corresponden a ocupación:
  - 0 usados = verde
  - 1-9 usados = amarillo
  - 10 usados = rojo

#### 3.3.4 Datos Dinámicos

- [ ] **Acción:** Destacar un aviso desde el modal de usuario
- [ ] **Acción:** Refrescar el calendario
- [ ] **Validar:** Ocupación aumenta en 1 para esa categoría/fecha
- [ ] **Acción:** Cancelar ese featured ad desde la tabla
- [ ] **Acción:** Refrescar el calendario
- [ ] **Validar:** Ocupación disminuye en 1

#### 3.3.5 Empty State

- [ ] **Acción:** Navegar a un mes futuro sin featured ads
- [ ] **Validar:** Muestra mensaje "No hay datos para este mes"
- [ ] **Validar:** Ícono de calendario vacío visible

### 3.4 Tab "Estadísticas"

#### 3.4.1 Rango de Fechas

- [ ] **Acción:** Click en tab "Estadísticas"
- [ ] **Validar:** Rango por defecto: últimos 30 días
- [ ] **Validar:** Campos "Desde" y "Hasta" populados
- [ ] **Acción:** Cambiar "Desde" a hace 60 días
- [ ] **Acción:** Click "Aplicar"
- [ ] **Validar:** Estadísticas se recargan con nuevo rango

#### 3.4.2 KPIs Principales

- [ ] **Validar:** Card "Activos" muestra número correcto
- [ ] **Validar:** Ícono verde de check visible
- [ ] **Validar:** Card "Pendientes" muestra número correcto
- [ ] **Validar:** Ícono amarillo de reloj visible
- [ ] **Validar:** Card "Créditos consumidos" muestra total
- [ ] **Validar:** Ícono de tarjeta visible
- [ ] **Validar:** Card "Ingreso neto" = consumidos - reembolsados
- [ ] **Validar:** Ícono de gráfico visible

#### 3.4.3 Estadísticas por Ubicación

- [ ] **Validar:** Sección "Por Ubicación" visible
- [ ] **Validar:** Muestra Homepage y Resultados
- [ ] **Validar:** Para cada placement:
  - Número de destacados
  - Créditos generados
- [ ] **Validar:** Íconos de "Home" y "Lupa" visibles

#### 3.4.4 Top Categorías

- [ ] **Validar:** Sección "Top Categorías" visible
- [ ] **Validar:** Lista de hasta 10 categorías
- [ ] **Validar:** Ordenadas por cantidad (mayor a menor)
- [ ] **Validar:** Muestra ranking (#1, #2, etc.)
- [ ] **Validar:** Muestra nombre de categoría y count

#### 3.4.5 Ocupación Promedio

- [ ] **Validar:** Sección "Ocupación Promedio" visible
- [ ] **Validar:** Barra de progreso muestra % correcto
- [ ] **Validar:** Animación smooth al cargar
- [ ] **Validar:** Porcentaje en grande al lado derecho
- [ ] **Validar:** Cálculo: (promedio de slots_used / 10) * 100

---

## 🔄 FASE 4: FLUJO END-TO-END

### 4.1 Flujo Completo: Usuario Destaca Aviso

**Preparación:**
- [ ] Crear usuario de prueba con 10 créditos
- [ ] Crear aviso en categoría "Maquinaria Agrícola"

**Test:**
1. [ ] **Login** como usuario regular
2. [ ] **Navegar** a "Mis Avisos"
3. [ ] **Click** en botón "Destacar" del aviso creado
4. [ ] **Seleccionar** Placement: "Homepage" (4 créditos)
5. [ ] **Seleccionar** Fecha de inicio: mañana
6. [ ] **Validar** disponibilidad: "8/10 slots disponibles" (ejemplo)
7. [ ] **Confirmar** destacar aviso
8. [ ] **Validar** mensaje éxito
9. [ ] **Validar** créditos disminuyeron de 10 a 6
10. [ ] **Logout**

### 4.2 Flujo: SuperAdmin Revisa y Gestiona

**Continuación:**
11. [ ] **Login** como SuperAdmin
12. [ ] **Navegar** a Dashboard → "Destacados Admin"
13. [ ] **Validar** en tab "Lista": nuevo featured ad aparece con status "Pending"
14. [ ] **Click** ícono "ojo" para ver auditoría
15. [ ] **Validar** entry "created" con user_id del usuario
16. [ ] **Cerrar** modal auditoría
17. [ ] **Click** ícono "prohibido" para cancelar
18. [ ] **Escribir** razón: "Prueba de cancelación"
19. [ ] **Marcar** checkbox "Reembolsar créditos"
20. [ ] **Confirmar** cancelación
21. [ ] **Validar** featured ad cambia a "Cancelado"
22. [ ] **Navegar** a tab "Estadísticas"
23. [ ] **Validar** "Total Créditos Reembolsados" aumentó en 4
24. [ ] **Logout**

### 4.3 Flujo: Usuario Ve Reembolso

**Continuación:**
25. [ ] **Login** como usuario regular nuevamente
26. [ ] **Navegar** a "Mis Avisos" o panel de créditos
27. [ ] **Validar** créditos volvieron a 10 (reembolso aplicado)
28. [ ] **Fin del test**

---

## 🐛 FASE 5: EDGE CASES Y VALIDACIONES

### 5.1 Validaciones de Negocio

**Test: Sin Créditos Suficientes**
- [ ] Usuario con 0 créditos intenta destacar
- [ ] **Validar:** Error "No tenes creditos suficientes"
- [ ] **Validar:** No se crea featured ad

**Test: Slots Llenos**
- [ ] Llenar 10 slots de una categoría/placement
- [ ] Intentar agregar slot 11
- [ ] **Validar:** Error "No hay lugares disponibles"
- [ ] **Validar:** No se crea featured ad

**Test: Aviso Sin Categoría**
- [ ] Intentar destacar aviso sin category_id
- [ ] **Validar:** Error "El aviso debe tener categoria y subcategoria"

**Test: Duplicado por Usuario**
- [ ] Usuario con 1 featured ad activo en "Homepage"
- [ ] Intentar destacar OTRO aviso en "Homepage"
- [ ] **Validar:** Error "Ya tenes un aviso destacado en esta ubicacion"

### 5.2 Permisos y Seguridad

**Test: Usuario Regular Intenta Acceder Admin**
- [ ] Login como usuario regular (no superadmin)
- [ ] Intentar acceder a `/dashboard/featured-ads-admin`
- [ ] **Validar:** Acceso denegado o redirección
- [ ] **Validar:** Menú "Destacados Admin" NO visible

**Test: Admin (no SuperAdmin) Intenta Acceder**
- [ ] Login como usuario con role='admin'
- [ ] Intentar acceder al panel
- [ ] **Validar:** Acceso denegado (solo superadmin)

### 5.3 Auditoría Completa

**Test: Todas las Acciones Se Registran**
- [ ] Crear featured ad → verificar entry "created"
- [ ] Featured ad pasa a "active" → verificar entry "activated"
- [ ] Cancelar featured ad → verificar entry "cancelled" o "refunded"
- [ ] Featured ad expira (simular) → verificar entry "expired"

```sql
SELECT * FROM featured_ads_audit 
WHERE featured_ad_id = '<featured_ad_id>' 
ORDER BY created_at DESC;
```

- [ ] **Validar:** Todas las acciones tienen `performed_by` correcto
- [ ] **Validar:** Metadata contiene información relevante

### 5.4 Performance y UX

**Test: Carga con Muchos Datos**
- [ ] Crear 100+ featured ads en BD (script seed)
- [ ] Cargar tab "Lista"
- [ ] **Validar:** Paginación funciona correctamente
- [ ] **Validar:** No hay lag perceptible
- [ ] **Validar:** Filtros responden rápido (<2s)

**Test: Loading States**
- [ ] Throttle network a "Slow 3G" en DevTools
- [ ] Refrescar tab "Lista"
- [ ] **Validar:** Skeleton/spinner visible durante carga
- [ ] **Validar:** No hay "flash" de contenido vacío

**Test: Responsive Design**
- [ ] Abrir en mobile (375px width)
- [ ] **Validar:** Tabla se comporta correctamente (scroll horizontal o stack)
- [ ] **Validar:** Modales se ajustan al viewport
- [ ] **Validar:** Tabs accesibles
- [ ] Abrir en tablet (768px width)
- [ ] **Validar:** Layout se adapta correctamente

---

## 📸 FASE 6: VALIDACIÓN VISUAL

### 6.1 Accesibilidad

- [ ] **Tab navigation:** Recorrer panel con tecla Tab
- [ ] **Validar:** Orden lógico de foco
- [ ] **Validar:** Elementos interactivos tienen focus visible
- [ ] **Enter/Space:** Activar botones con teclado
- [ ] **Escape:** Cerrar modales con Esc
- [ ] **Screen reader:** Probar con lector de pantalla (opcional)

### 6.2 Consistencia UI

- [ ] **Colores:** Badges de estado usan colores consistentes
  - Verde: Activo/Disponible
  - Amarillo: Pendiente/Parcial
  - Rojo: Cancelado/Lleno
  - Gris: Expirado

- [ ] **Íconos:** Todos los íconos son de Lucide React
- [ ] **Tipografía:** Fuentes Tailwind consistentes
- [ ] **Espaciado:** Padding/margin uniforme en cards/modales

### 6.3 Estados de Error

**Test: Error de Red**
- [ ] Detener backend API
- [ ] Intentar cargar datos
- [ ] **Validar:** Mensaje de error amigable
- [ ] **Validar:** No hay crash de la app
- [ ] **Validar:** Botón "Reintentar" funcional

**Test: Error de Validación**
- [ ] Intentar cancelar sin razón
- [ ] **Validar:** Mensaje "Debes ingresar una razón"
- [ ] **Validar:** Modal no se cierra

---

## 📊 FASE 7: VALIDACIÓN EN BASE DE DATOS

### 7.1 Integridad de Datos

**Test: Referencias FK**
- [ ] Cancelar featured ad
- [ ] **Validar:** `cancelled_by` es UUID válido de tabla users
- [ ] Borrar usuario (si permite)
- [ ] **Validar:** FK constraints funcionan (ON DELETE aplica)

**Test: Constraints**
```sql
-- Intentar insertar refunded sin cancelled_by (debería fallar lógicamente)
INSERT INTO featured_ads (ad_id, user_id, placement, category_id, status, refunded)
VALUES (..., 'active', TRUE); -- Refunded=true con status=active no tiene sentido
```

### 7.2 Índices y Performance

**Test: Query Performance**
```sql
EXPLAIN ANALYZE
SELECT * FROM admin_get_featured_ads(
  ARRAY['active']::VARCHAR[],
  NULL, NULL, NULL, NULL, NULL, NULL,
  50, 0
);
```

- [ ] **Validar:** Usa índices correctos
- [ ] **Validar:** Execution time < 100ms con 1000 registros

### 7.3 Transaccionalidad

**Test: Rollback en Error**
- [ ] Simular error en medio de `admin_cancel_featured_ad`
  (ej: FK inválido en `cancelled_by`)
- [ ] **Validar:** Transacción hace rollback completo
- [ ] **Validar:** No quedan datos inconsistentes

---

## ✅ CHECKLIST FINAL

### Documentación

- [ ] README actualizado con instrucciones de uso del panel
- [ ] Comentarios en código SQL claros
- [ ] JSDoc en funciones TypeScript completo
- [ ] Tipos TypeScript exportados correctamente

### Deploy Readiness

- [ ] Variables de entorno configuradas (.env)
- [ ] Migración SQL versionada correctamente
- [ ] No hay `console.log` en producción (solo desarrollo)
- [ ] Build de frontend sin warnings
- [ ] Tests automatizados pasan (si existen)

### Training

- [ ] Documentar flujo para SuperAdmin
- [ ] Screenshots/vídeo demo del panel (opcional)
- [ ] FAQ de preguntas comunes

---

## 📝 REGISTRO DE BUGS/ISSUES

**Durante el testing, documentar cualquier bug encontrado:**

| # | Descripción | Severidad | Estado | Notas |
|---|-------------|-----------|--------|-------|
| 1 | Ejemplo: Paginación no funciona en mobile | Media | Pendiente | Revisar CSS responsive |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

**Severidades:**
- 🔴 **Crítica:** Impide uso del sistema
- 🟡 **Media:** Funcionalidad afectada pero tiene workaround
- 🟢 **Baja:** UX/UI inconsistencia menor

---

## 🎉 CRITERIOS DE ACEPTACIÓN

El sistema se considera **APROBADO** si:

- [ ] ✅ Todos los tests de Fase 1-4 pasan
- [ ] ✅ Máximo 2 bugs de severidad Media sin resolver
- [ ] ✅ 0 bugs de severidad Crítica
- [ ] ✅ Panel accesible solo para SuperAdmin
- [ ] ✅ Auditoría registra todas las acciones
- [ ] ✅ Reembolsos funcionan correctamente
- [ ] ✅ Performance aceptable (< 2s para cargar lista)
- [ ] ✅ Responsive en mobile, tablet, desktop

---

**Firma del Tester:**  
Nombre: ____________________  
Fecha: ____________________  
Resultado: ☐ APROBADO  ☐ RECHAZADO  ☐ CON OBSERVACIONES

---

**Notas Adicionales:**

_Espacio para notas del tester durante el testing..._



