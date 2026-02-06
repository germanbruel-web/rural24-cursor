# 🚀 GUÍA DE INTEGRACIÓN - Panel SuperAdmin Featured Ads

**Fecha:** 6 de Febrero de 2026  
**Sistema:** Panel de administración de avisos destacados

---

## 📦 ARCHIVOS CREADOS

### 1. Base de Datos (SQL)
```
database/20260206_admin_featured_system.sql
```
- Tabla: `featured_ads_audit`
- Columnas nuevas en `featured_ads`: cancelled_by, cancelled_reason, refunded, cancelled_at
- 5 funciones RPC: admin_get_featured_ads, admin_cancel_featured_ad, admin_featured_stats, admin_get_featured_audit, admin_get_occupancy_grid
- Trigger automático para auditoría
- RLS policies

### 2. Servicios TypeScript
```
frontend/src/services/adminFeaturedService.ts
```
- Interface completa de tipos
- Funciones CRUD para admin
- Helpers de formateo y exportación
- Validación de permisos SuperAdmin

### 3. Componente React
```
frontend/src/components/admin/SuperAdminFeaturedPanel.tsx
```
- 3 tabs: Lista, Calendario, Estadísticas
- Tabla con filtros y paginación
- Modales: Cancelar, Auditoría
- Exportación CSV
- Responsive design

### 4. Testing
```
test-featured-system.ps1
TEST_FEATURED_ADMIN_MANUAL.md
```
- Suite automatizada PowerShell
- Checklist manual exhaustivo

### 5. Configuración
```
frontend/src/utils/rolePermissions.ts (modificado)
frontend/src/components/layouts/DashboardLayout.tsx (modificado)
frontend/src/components/admin/index.ts (modificado)
```

---

## 🔧 PASOS DE INSTALACIÓN

### PASO 1: Aplicar Migración SQL

1. Abrir Supabase Dashboard → SQL Editor
2. Copiar contenido de `database/20260206_admin_featured_system.sql`
3. Ejecutar
4. Verificar: No errores en la consola

**Validación:**
```sql
SELECT COUNT(*) FROM featured_ads_audit; -- Debe devolver 0 o más
SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE 'admin_%';
-- Debe devolver 5 funciones
```

### PASO 2: Verificar Imports

1. El servicio ya está creado en `/frontend/src/services/adminFeaturedService.ts`
2. El componente ya está creado en `/frontend/src/components/admin/SuperAdminFeaturedPanel.tsx`
3. Ya está exportado en `/frontend/src/components/admin/index.ts`

**No requiere acción adicional.**

### PASO 3: Integrar en Routing

Necesitas agregar el componente `SuperAdminFeaturedPanel` en tu sistema de routing/navegación.

#### Opción A: Si usas el patrón del proyecto (currentPage)

En el archivo donde renderizas las páginas basándote en `currentPage`, agrega:

```tsx
import { SuperAdminFeaturedPanel } from '@/components/admin';

// En tu switch/condición de páginas:
case 'featured-ads-admin':
  return <SuperAdminFeaturedPanel />;
```

#### Opción B: Si usas React Router

```tsx
import { SuperAdminFeaturedPanel } from '@/components/admin';

<Route 
  path="/dashboard/featured-ads-admin" 
  element={<SuperAdminFeaturedPanel />} 
/>
```

#### Opción C: Si usas Next.js App Router

Crear archivo: `app/dashboard/featured-ads-admin/page.tsx`

```tsx
import { SuperAdminFeaturedPanel } from '@/components/admin';

export default function FeaturedAdsAdminPage() {
  return <SuperAdminFeaturedPanel />;
}
```

### PASO 4: Verificar Menú Lateral

El menú lateral ya está configurado en:
- `rolePermissions.ts`: Permiso agregado
- `DashboardLayout.tsx`: Ícono mapeado

**Validar:**
1. Login como SuperAdmin
2. Ir al Dashboard
3. Buscar en el menú lateral: "Destacados Admin" (debajo de otras opciones de admin)
4. Click → Debe navegar al panel

Si NO aparece en el menú:
- Verificar que el usuario tiene `role = 'superadmin'`
- Verificar `console.log` en DashboardLayout para debug
- Verificar que `getMenuItems` incluye 'featured-ads-admin'

### PASO 5: Testing Inicial

1. Ejecutar script automatizado:
```powershell
.\test-featured-system.ps1
```

2. Seguir checklist manual:
```
Abrir: TEST_FEATURED_ADMIN_MANUAL.md
```

---

## 🎯 FLUJO COMPLETO DE USO

### Para el Usuario Regular:

1. Login
2. Ir a "Mis Avisos"
3. Click "Destacar" en un aviso
4. Seleccionar placement (Homepage/Resultados)
5. Elegir fecha de inicio
6. Confirmar (consume créditos)
7. Featured ad queda en estado "Pending" o "Active"

### Para el SuperAdmin:

1. Login como SuperAdmin
2. Dashboard → "Destacados Admin"
3. Ver lista completa con filtros
4. Cancelar featured ads si es necesario (con/sin reembolso)
5. Ver auditoría de todas las acciones
6. Ver calendario de ocupación
7. Ver estadísticas globales
8. Exportar reportes CSV

---

## 📊 ESTRUCTURA DEL PANEL

```
SuperAdminFeaturedPanel
│
├── Tab: Lista
│   ├── Toolbar (Filtros, Refrescar, Exportar)
│   ├── Tabla paginada
│   │   ├── Columnas: Estado, Aviso, Usuario, Placement, Fecha, Créditos
│   │   └── Acciones: Ver Auditoría, Cancelar
│   ├── Filtros Panel (Status, Placement, Search)
│   └── Modales
│       ├── CancelModal (razón + refund checkbox)
│       └── AuditModal (historial completo)
│
├── Tab: Calendario
│   ├── Navegación mensual (< Mes >)
│   ├── Selector Placement (Homepage/Resultados)
│   ├── Leyenda de colores
│   └── Grid por categoría
│       └── Días coloreados (verde/amarillo/rojo)
│
└── Tab: Estadísticas
    ├── Selector de rango de fechas
    ├── KPIs (4 cards)
    │   ├── Total Activos
    │   ├── Total Pendientes
    │   ├── Créditos Consumidos
    │   └── Ingreso Neto
    ├── Estadísticas por Placement
    ├── Top 10 Categorías
    └── Ocupación Promedio (barra de progreso)
```

---

## 🔑 PERMISOS Y SEGURIDAD

### Validación de Permisos

El servicio `adminFeaturedService.ts` incluye función `isSuperAdmin()` que verifica:
1. Usuario autenticado
2. Role = 'superadmin'

Si no cumple, las funciones devuelven error: `"Acceso denegado. Solo SuperAdmin"`

### RLS en Supabase

La tabla `featured_ads_audit` tiene RLS habilitado con policy:
```sql
CREATE POLICY "SuperAdmin puede ver auditoría"
  ON featured_ads_audit FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'superadmin'
  ));
```

**Importante:** Asegúrate de que la tabla `users` tiene columna `role` correctamente configurada.

---

## 🐛 TROUBLESHOOTING

### Problema: Panel no carga datos

**Causa probable:** Funciones RPC no existen en BD

**Solución:**
```sql
-- Verificar que las funciones existen
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN (
  'admin_get_featured_ads',
  'admin_cancel_featured_ad',
  'admin_featured_stats',
  'admin_get_featured_audit',
  'admin_get_occupancy_grid'
);
```

Si no existen → Re-ejecutar migración SQL

### Problema: Error "Access denied"

**Causa:** Usuario no es SuperAdmin o RLS mal configurado

**Solución:**
```sql
-- Verificar role del usuario actual
SELECT role FROM users WHERE id = auth.uid();

-- Debe devolver 'superadmin'
```

Si es NULL o 'free' → Actualizar role:
```sql
UPDATE users SET role = 'superadmin' WHERE email = 'tu-email@example.com';
```

### Problema: Modales no se abren

**Causa:** Estado de React no actualiza

**Solución:**
- Abrir DevTools → Console
- Buscar errores de React
- Verificar que imports son correctos
- Refrescar página (F5)

### Problema: Exportar CSV descarga vacío

**Causa:** No hay datos o función `exportToCSV` falló

**Solución:**
- Verificar que `ads.length > 0`
- Revisar consola por errores
- Verificar permisos del navegador para descargas

---

## 📈 MÉTRICAS DE ÉXITO

Después de la integración, el sistema debe:

✅ **Funcionalidad:**
- [ ] SuperAdmin puede ver todos los featured ads
- [ ] Puede cancelar y reembolsar
- [ ] Ve auditoría completa
- [ ] Calendario muestra ocupación real
- [ ] Estadísticas son precisas

✅ **Performance:**
- [ ] Lista carga en < 2 segundos
- [ ] Filtros responden instantáneamente
- [ ] Exportar CSV < 5 segundos con 1000 registros

✅ **UX:**
- [ ] No hay bugs visuales
- [ ] Responsive en mobile/tablet/desktop
- [ ] Loading states claros
- [ ] Mensajes de error descriptivos

✅ **Seguridad:**
- [ ] Solo SuperAdmin accede
- [ ] RLS funciona correctamente
- [ ] Auditoría registra TODO

---

## 🔄 PRÓXIMOS PASOS (Futuras Mejoras)

1. **Notificaciones:** Email al usuario cuando su featured ad es cancelado
2. **Bulk Actions:** Cancelar múltiples featured ads a la vez
3. **Reportes Avanzados:** Gráficos de tendencias temporales
4. **Configuración:** Panel para cambiar max slots, precios, duraciones
5. **API Pública:** Endpoint REST para integraciones externas
6. **Webhook:** Notificar sistemas externos de cambios en featured ads

---

## 📞 SOPORTE

Si encuentras problemas durante la integración:

1. Revisar `TEST_FEATURED_ADMIN_MANUAL.md` para casos conocidos
2. Ejecutar `test-featured-system.ps1` para diagnóstico
3. Revisar logs de Supabase → Logs → RPC calls
4. Revisar console del navegador → Errores de React/TypeScript

---

## ✅ CHECKLIST DE INTEGRACIÓN FINAL

Antes de considerar la integración completa:

- [x] Migración SQL aplicada sin errores ✅
- [x] Componente renderiza correctamente ✅
- [x] Permisos SuperAdmin funcionan ✅
- [x] Menú lateral muestra opción ✅
- [x] Testing automatizado ejecutado (24/24 PASS) ✅
- [ ] **Testing manual en navegador** ← AHORA
- [ ] 3 tabs funcionan (Lista, Calendario, Stats)
- [ ] Panel carga datos reales de la base de datos
- [ ] Filtros funcionan correctamente
- [ ] Paginación funciona
- [ ] Cancelar featured ad funciona
- [ ] Reembolso de créditos funciona
- [ ] Auditoría registra acciones
- [ ] Exportar CSV funciona
- [ ] 0 bugs críticos

---

**Estado actual: Backend completo ✅ | Testing UX/UI en navegador → AHORA**
