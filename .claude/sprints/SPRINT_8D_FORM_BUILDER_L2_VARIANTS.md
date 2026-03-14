# Sprint 8D — Variantes L2 en Constructor de Formularios
> Fecha: 2026-03-14 | Decisión de producto + implementación

## Problema

El FormBuilderAdmin solo permitía crear variantes en **nodos hoja** (L2 sin hijos o L3).
Los L2 con hijos (ej: "Camionetas") solo podían expandir, no tener formulario propio.

Esto obligaba a repetir campos comunes (Combustible, KM, Tracción) en cada uno de los L3 hijos.

## Decisión de arquitectura

Permitir variantes en **todos los niveles de subcategoría**, con carga en cascada:

```
Formulario final = Global (categoría) + Variante L2 + Variante L3
```

Dedup por `field_name` — si un campo aparece en dos niveles, gana el más específico (el que se registró primero en el merge, lo que en la práctica es el global; el L3 sobreescribe al L2 si hay colisión).

## Cambios implementados

### 1. FormBuilderAdmin.tsx
- Árbol L2 expandido: agrega entrada "📋 Formulario de [L2]" al tope de la lista de hijos
- Click en esa entrada → selecciona el L2 como objetivo de variante (misma función `seleccionarHoja`)
- Eliminado badge ⚠ "variante huérfana" — ya no aplica (L2 con variante Y con hijos es válido)

### 2. DynamicFormLoader.tsx
- Al cargar, detecta si `subcategoryId` tiene `parent_id` en DB (query a `subcategories`)
- Si tiene padre → carga 3 formularios: Global + L2 variant + L3 variant
- Si no tiene padre (L2 hoja) → carga 2: Global + L2 variant (comportamiento anterior)
- Merge con dedup por `field_name` (Set), en orden: Global → L2 → L3

### 3. formFieldsService.ts (sesión anterior)
- `deleteFormTemplate()`: elimina plantilla + campos + opciones en cascada

## Patrón visual resultante en admin

```
📁 Maquinaria Agrícola
  🌐 Formulario global              ← campos comunes (Marca, Año, Horas)
  ─── VARIANTES ────────────────────
  > Camionetas
      🌐 Formulario de Camionetas   ← campos comunes a todos los tipos (Combustible, KM)
      └── Autos                     ← campo específico (Asientos)
      └── Cabina Doble              ← campo específico (Asientos traseros)
  └── Acoplados                     ← L2 hoja, directo
```

## Impacto en wizard del usuario

Cuando publica "Cabina Doble":
1. Global Maquinaria: Marca, Año de fabricación, Horas de uso
2. Variante Camionetas: Combustible, Kilometraje, Tracción
3. Variante Cabina Doble: Capacidad de carga

## Sin cambios en DB ni RPC

El RPC `get_form_for_context` ya soporta `subcategory_id` para cualquier nivel.
La tabla `form_templates_v2` ya permite `subcategory_id` apuntando a cualquier sub.
No se requirió migración.
