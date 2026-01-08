# Sistema de Priorización de Banners - Arquitectura
**Fecha**: 8 de Enero 2026  
**Arquitecto**: Sistema Senior Fullstack  
**Versión**: 1.0

---

## 📋 Resumen Ejecutivo

Sistema de gestión inteligente de banners con **priorización estratégica** y **selección dinámica** para homepage. Permite a SuperAdmin marcar banners específicos como "prioritarios" para garantizar su visualización, o activar rotación aleatoria entre banners activos.

---

## 🎯 Características Implementadas

### 1. **Priorización de Banners**
- ✅ Campo `is_priority` (boolean) - Marca banners como prioritarios
- ✅ Campo `priority_weight` (integer) - Peso de prioridad para desempate
- ✅ Botón ⭐ en UI de administración para activar/desactivar prioridad
- ✅ Badge visual "PRIORITARIO" en banners marcados

### 2. **Estrategia de Selección Inteligente**

#### Lógica de Homepage (función `getHomepageSearchBanners`)
```
IF existe banner con is_priority = true THEN
  ↳ Seleccionar banner con mayor priority_weight
  ↳ Si hay empate → RANDOM entre los prioritarios
ELSE
  ↳ Seleccionar RANDOM entre todos los banners activos
END
```

#### Ventajas
- **Control total**: SuperAdmin decide qué banner mostrar primero
- **Flexibilidad**: Puede tener múltiples prioritarios (compiten por peso)
- **Fallback**: Si no hay prioritario, rotación automática
- **UX**: Confirmación inteligente al activar prioridad (¿desactivar otros?)

### 3. **Gestión desde Panel Admin**

#### Acciones disponibles:
1. **Marcar como prioritario** (botón estrella ⭐)
   - Click activado → Banner prioritario (peso 100)
   - Si ya existen otros prioritarios → Pregunta si desactivarlos
   - Visual feedback inmediato (estrella llena + badge amarillo)

2. **Desmarcar prioritario**
   - Click desactivado → Vuelve a rotación random
   - Priority weight resetea a 0

3. **Filtros y visualización**
   - Badge "PRIORITARIO" con estrella visible
   - Tooltip explicativo en hover
   - Notificaciones toast informativas

---

## 🗄️ Esquema de Base de Datos

### Tabla `banners` - Nuevas Columnas

```sql
ALTER TABLE public.banners 
ADD COLUMN is_priority BOOLEAN DEFAULT false,
ADD COLUMN priority_weight INTEGER DEFAULT 0;
```

### Índices para Performance

```sql
CREATE INDEX idx_banners_priority 
ON banners(is_priority, priority_weight DESC) 
WHERE is_active = true;
```

### Función SQL Helper (Opcional - No implementada aún)

```sql
CREATE FUNCTION get_homepage_banner(
  p_position text,
  p_category text,
  p_device text
) RETURNS banners
```

---

## 🔧 Componentes Modificados

### 1. **Database Migration**
📄 `database/supabase/add-banner-priority.sql`
- Agrega columnas `is_priority` y `priority_weight`
- Crea índices optimizados
- Incluye función SQL helper
- Script de verificación y estadísticas

### 2. **Banner Service** 
📄 `frontend/src/services/bannersService.ts`

#### Nuevas funciones:
```typescript
toggleBannerPriority(
  id: string, 
  isPriority: boolean,
  priorityWeight: number = 100,
  deselectOthers: boolean = false
): Promise<{ error: any }>

getBannerPriorityStats(): Promise<{
  totalBanners: number;
  activeBanners: number;
  priorityBanners: number;
  priorityActiveByPosition: Record<string, number>;
}>
```

#### Función modificada:
```typescript
getHomepageSearchBanners(
  category?: string, 
  deviceTarget: 'desktop' | 'mobile' = 'desktop'
): Promise<Banner[]>
```

**Cambios**: 
- Primero busca banners con `is_priority = true`
- Ordena por `priority_weight DESC`
- Si no encuentra, selecciona RANDOM de activos
- Logging detallado para debugging

### 3. **Admin Panel**
📄 `frontend/src/components/admin/BannersPanel.tsx`

#### UI Updates:
- ✨ Nuevo botón estrella ⭐ en acciones de cada banner
- 🏷️ Badge "PRIORITARIO" visible en banners marcados
- 💬 Confirmación inteligente al activar (evita conflictos)
- 🔔 Notificaciones toast mejoradas

#### Handler añadido:
```typescript
handleTogglePriority(banner: Banner): Promise<void>
```

### 4. **Type Definitions**
📄 `frontend/types.ts`

```typescript
export interface Banner {
  // ... campos existentes
  is_priority?: boolean;
  priority_weight?: number;
}
```

---

## 🎨 Flujo de Usuario (SuperAdmin)

### Caso 1: Activar Banner Prioritario

```
1. SuperAdmin va a Gestión de Banners
2. Click en estrella ⭐ de un banner
3. Sistema detecta si hay otros prioritarios en misma posición
4. Si los hay → Confirmación modal:
   "Ya hay X banner(s) prioritario(s) en esta posición.
    ¿Desactivar los otros?"
   
   [SÍ] → Solo este banner será prioritario ✓
   [NO]  → Múltiples prioritarios compiten por peso
   
5. Banner actualizado → Badge "PRIORITARIO" visible
6. Toast: "⭐ Banner marcado como PRIORITARIO"
7. Homepage ahora muestra este banner primero
```

### Caso 2: Rotación Random (sin prioritarios)

```
1. SuperAdmin desactiva todos los banners prioritarios
2. Sistema detecta: is_priority = false para todos
3. Homepage selecciona RANDOM entre activos
4. Cada carga de página → Banner diferente (probabilístico)
```

---

## 📊 Estrategias de Selección

### Estrategia A: Un Solo Prioritario (Recomendado)
```
Banners:
  [⭐ Banner A] is_priority=true, weight=100
  [  Banner B] is_priority=false
  [  Banner C] is_priority=false

Resultado: Siempre muestra Banner A
```

### Estrategia B: Múltiples Prioritarios (Competencia)
```
Banners:
  [⭐ Banner A] is_priority=true, weight=100
  [⭐ Banner B] is_priority=true, weight=80
  [  Banner C] is_priority=false

Resultado: Muestra A o B (A tiene más chances por peso mayor)
```

### Estrategia C: Sin Prioritarios (Random Total)
```
Banners:
  [  Banner A] is_priority=false
  [  Banner B] is_priority=false
  [  Banner C] is_priority=false

Resultado: Random entre A, B, C (33% cada uno)
```

---

## 🔐 Seguridad

- ✅ Solo **SuperAdmin** puede modificar prioridades
- ✅ Validación de permisos en `bannersService.toggleBannerPriority()`
- ✅ Políticas RLS de Supabase mantienen integridad
- ✅ Confirmaciones evitan cambios accidentales

---

## 🚀 Pasos de Implementación

### 1. Ejecutar Migración SQL
```bash
# En Supabase SQL Editor:
1. Abrir: database/supabase/add-banner-priority.sql
2. Ejecutar script completo
3. Verificar columnas agregadas (última query del script)
```

### 2. Verificar Cambios en Código
```bash
# Archivos modificados:
✓ frontend/types.ts
✓ frontend/src/services/bannersService.ts
✓ frontend/src/components/admin/BannersPanel.tsx
```

### 3. Probar Funcionalidad
```bash
1. npm run dev
2. Login como SuperAdmin
3. Ir a Gestión de Banners
4. Click en estrella ⭐ de un banner
5. Verificar badge "PRIORITARIO"
6. Abrir homepage → Confirmar banner prioritario visible
```

---

## 📈 Métricas y Monitoreo

### Queries útiles para Analytics

#### Contar banners prioritarios activos
```sql
SELECT COUNT(*) 
FROM banners 
WHERE is_active = true AND is_priority = true;
```

#### Ver distribución de prioridades por posición
```sql
SELECT 
  position,
  COUNT(*) as total_prioritarios,
  AVG(priority_weight) as peso_promedio
FROM banners
WHERE is_priority = true
GROUP BY position;
```

#### Banners sin uso (nunca prioritarios)
```sql
SELECT id, title, type
FROM banners
WHERE is_priority = false 
  AND display_order = 0
ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### Problema: Banner prioritario no aparece en homepage
**Diagnóstico:**
```typescript
// En consola del navegador:
// Buscar logs:
"🎯 Banner prioritario seleccionado: [nombre]"
"🎲 Banner random seleccionado: [nombre]"
```

**Soluciones:**
1. Verificar `is_active = true`
2. Verificar `device_target` correcto (desktop/mobile)
3. Revisar filtro de categoría (si aplica)
4. Confirmar `is_priority = true` en base de datos

### Problema: Múltiples banners prioritarios compiten
**Solución:**
1. Ir a Gestión de Banners
2. Identificar banners con badge "PRIORITARIO"
3. Click estrella de uno → Confirmar "Desactivar los otros: SÍ"
4. Ahora solo uno será prioritario

### Problema: Migración SQL falla
**Error común**: `column already exists`
**Solución**: Usar `ADD COLUMN IF NOT EXISTS` (ya incluido en script)

---

## 🔄 Evoluciones Futuras

### Fase 2: Programación Temporal
```typescript
interface Banner {
  priority_start_date?: Date;
  priority_end_date?: Date;
}

// Lógica:
// Solo marcar como prioritario si NOW() entre start y end
```

### Fase 3: A/B Testing Integrado
```typescript
interface Banner {
  ab_test_group?: 'A' | 'B' | 'control';
  conversion_rate?: number;
}

// Seleccionar banner según grupo del usuario
```

### Fase 4: Machine Learning
```python
# Modelo predictivo para selección óptima
from sklearn.ensemble import RandomForestClassifier

model.predict(user_profile, banner_features)
→ banner_id con mayor probabilidad de conversión
```

---

## 📚 Referencias

- **Supabase Docs**: https://supabase.com/docs/guides/database
- **PostgreSQL Random**: https://www.postgresql.org/docs/current/functions-math.html
- **React Performance**: https://react.dev/learn/rendering-lists

---

## ✅ Checklist de Implementación

- [x] Crear migración SQL (`add-banner-priority.sql`)
- [x] Actualizar types (`Banner` interface)
- [x] Modificar `bannersService.getHomepageSearchBanners()`
- [x] Agregar `bannersService.toggleBannerPriority()`
- [x] Agregar `bannersService.getBannerPriorityStats()`
- [x] Actualizar UI del panel admin (botón estrella)
- [x] Agregar badge visual "PRIORITARIO"
- [x] Implementar confirmación modal
- [x] Logging y debugging
- [ ] Ejecutar migración en Supabase ⚠️ **PENDIENTE**
- [ ] Testing en producción
- [ ] Documentar para equipo

---

**Próximo Paso**: Ejecutar migración SQL en Supabase

```bash
# Comando:
cd database/supabase
# Luego copiar contenido de add-banner-priority.sql a SQL Editor de Supabase
```
