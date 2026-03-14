# SPRINT 8B — Block-Driven Wizard
> Creado: 2026-03-14
> Estado: PLANIFICADO
> Objetivo: Control total del contenido de cada step del wizard desde el admin, eliminando hardcodes

---

## Problema

El wizard de publicación tiene dos capas:
- `wizard_configs.steps` → controla QUÉ STEPS existen y en qué orden ✅ configurable
- `form_fields_v2` → controla los campos dinámicos del step "características" ✅ configurable
- `PublicarAviso.tsx` → HARDCODEA qué bloques UI aparecen en cada step ❌ no configurable

**Precio + Moneda específicamente:**
- El input de precio (monto + ARS/USD) está hardcodeado como JSX fijo en el step `caracteristicas`
- La lista de unidades (kg, ton, hora) SÍ viene de `form_templates_v2.price_config.units_list`
- Pero el bloque completo de precio no es un `form_field_v2` — es JSX siempre visible sin control

---

## Solución: Block-Driven Wizard

Cada step declara una lista de **bloques** en su config. PublicarAviso se convierte en un renderer puro.

### Tipos de bloques

| Block key | UI | Campos en `ads` |
|---|---|---|
| `dynamic_fields` | Campos del form_template (marca, modelo, razas) | `attributes` JSONB |
| `price` | monto + moneda (ARS/USD) + unidad | `price`, `currency`, `price_unit` |
| `location` | provincia + localidad (DB-driven) | `province`, `city` |
| `images` | uploader Cloudinary | `images` |
| `title_description` | título + descripción | `title`, `description` |
| `empresa_selector` | selector empresa activa del usuario | `business_profile_id` |

### Extensión de WizardStep

```ts
// wizardConfigService.ts
interface WizardBlock {
  type: 'price' | 'location' | 'images' | 'title_description'
      | 'empresa_selector' | 'dynamic_fields';
  order: number;
  config?: {
    // price
    price_optional?: boolean;
    show_currency?: boolean;
    show_unit?: boolean;
    // images
    max_images?: number;
    // title_description
    require_description?: boolean;
    title_max_chars?: number;
    description_min_chars?: number;
  };
}

interface WizardStep {
  key: string;
  label: string;
  description: string;
  icon: string;
  visible: boolean;
  order: number;
  locked: boolean;
  blocks: WizardBlock[];  // NUEVO — retrocompatible ([] = sin bloques = legacy render)
}
```

### Config por defecto (steps + blocks)

```json
[
  {
    "key": "categoria",
    "label": "Categoría",
    "description": "¿Qué publicás?",
    "icon": "Tag",
    "visible": true,
    "order": 1,
    "locked": true,
    "blocks": []
  },
  {
    "key": "caracteristicas",
    "label": "Características",
    "description": "Detalles técnicos",
    "icon": "Settings",
    "visible": true,
    "order": 2,
    "locked": false,
    "blocks": [
      { "type": "dynamic_fields",   "order": 1 },
      { "type": "empresa_selector", "order": 2 },
      { "type": "price",            "order": 3, "config": { "show_currency": true, "show_unit": true } }
    ]
  },
  {
    "key": "ubicacion",
    "label": "Ubicación",
    "description": "Dónde está",
    "icon": "MapPin",
    "visible": true,
    "order": 3,
    "locked": false,
    "blocks": [
      { "type": "location", "order": 1 }
    ]
  },
  {
    "key": "fotos",
    "label": "Fotos",
    "description": "Imágenes del aviso",
    "icon": "Camera",
    "visible": true,
    "order": 4,
    "locked": false,
    "blocks": [
      { "type": "images", "order": 1, "config": { "max_images": 10 } }
    ]
  },
  {
    "key": "informacion",
    "label": "Información",
    "description": "Título y descripción",
    "icon": "FileText",
    "visible": true,
    "order": 5,
    "locked": false,
    "blocks": [
      { "type": "title_description", "order": 1 }
    ]
  },
  {
    "key": "revision",
    "label": "Revisar y Publicar",
    "description": "Confirmar publicación",
    "icon": "CheckCircle2",
    "visible": true,
    "order": 6,
    "locked": true,
    "blocks": []
  }
]
```

### Ejemplo override por categoría "Empleos" (sin precio, sin fotos)

```json
[
  {
    "key": "caracteristicas",
    "blocks": [{ "type": "dynamic_fields", "order": 1 }]
  },
  {
    "key": "ubicacion",
    "blocks": [{ "type": "location", "order": 1 }]
  },
  {
    "key": "informacion",
    "blocks": [
      { "type": "title_description", "order": 1, "config": { "title_max_chars": 100 } }
    ]
  }
]
```

---

## Arquitectura técnica

### Nuevo componente: BlockRenderer

```tsx
// frontend/src/components/wizard/BlockRenderer.tsx
interface BlockRendererProps {
  block: WizardBlock;
  // estado del wizard
  price: number | '';
  currency: 'ARS' | 'USD';
  priceUnit: string;
  province: string;
  locality: string;
  images: ImageItem[];
  title: string;
  description: string;
  selectedBusinessProfileId: string | null;
  attributes: Record<string, any>;
  priceConfig: PriceConfig | null;
  categoryId: string | null;
  subcategoryId: string | null;
  // callbacks
  onPriceChange: ...
  onLocationChange: ...
  // etc.
}

export function BlockRenderer({ block, ...props }: BlockRendererProps) {
  switch (block.type) {
    case 'price':           return <PriceBlock config={block.config} {...props} />;
    case 'location':        return <LocationBlock {...props} />;
    case 'images':          return <ImagesBlock config={block.config} {...props} />;
    case 'title_description': return <TitleDescriptionBlock config={block.config} {...props} />;
    case 'empresa_selector':  return <EmpresaSelectorWidget ... />;
    case 'dynamic_fields':    return <DynamicFormLoader categoryId={props.categoryId} ... />;
    default: return null;
  }
}
```

### Refactor de PublicarAviso.tsx (solo el render del step activo)

```tsx
// Antes (hardcodeado):
{activeStepKey === 'caracteristicas' && (
  <div>
    <DynamicFormLoader ... />
    <EmpresaSelectorWidget ... />
    <PrecioBlock hardcodeado ... />
  </div>
)}

// Después (driven by config):
{activeStep.blocks
  .sort((a, b) => a.order - b.order)
  .map(block => (
    <BlockRenderer key={block.type} block={block} {...wizardState} />
  ))
}
```

### SQL: actualizar wizard_configs default

```sql
UPDATE public.wizard_configs
SET steps = '[... JSON con blocks ...]'::jsonb,
    updated_at = NOW()
WHERE name = 'default';
```

**No requiere migración de schema** — `steps` ya es JSONB.

---

## Fases de implementación

| # | Tarea | Archivos | Prioridad |
|---|---|---|---|
| 1 | Agregar `WizardBlock` interface + `blocks` a `WizardStep` | `wizardConfigService.ts` | Alta |
| 2 | Extraer bloques a componentes propios (`PriceBlock`, `LocationBlock`, etc.) | nuevos en `wizard/` | Alta |
| 3 | Crear `BlockRenderer` | `wizard/BlockRenderer.tsx` | Alta |
| 4 | Refactorizar render de steps en `PublicarAviso.tsx` | `PublicarAviso.tsx` | Alta |
| 5 | UPDATE SQL en `wizard_configs` default | migration | Alta |
| 6 | Admin: editor de bloques en `WizardConfigPanel` | `WizardConfigPanel.tsx` | Media |
| 7 | Override por categoría desde FormBuilderAdmin | `FormBuilderAdmin.tsx` | Baja |

**Fases 1-5:** el usuario final nota cero cambios, pero ahora TODO es configurable desde DB.
**Fase 6:** el admin puede editar visualmente qué bloques van en cada step.
**Fase 7:** integración con el FormBuilderAdmin para configurar wizard por categoría.

---

## Compatibilidad retroactiva

- `blocks: []` en un step → PublicarAviso puede usar fallback al render legacy
- Permite migración incremental step por step
- Los form_fields_v2 existentes no se tocan

---

## Decisiones de producto

- **Precio, moneda, ubicación, fotos, título NO se convierten en form_fields_v2** — mantienen sus componentes UI dedicados con lógica especial (validaciones, Cloudinary, autocomplete de localidades)
- Son **system blocks** referenciables desde la config, no campos genéricos
- Esto evita sobre-ingeniería (no hay que reimplementar upload en el form engine)
- Los `dynamic_fields` (marca, modelo, razas, etc.) siguen siendo form_fields_v2 como hoy

---

## Estado actual de hardcodes a eliminar

| Hardcode | Archivo | Línea aprox | Block equivalente |
|---|---|---|---|
| Precio + moneda | PublicarAviso.tsx | ~820-860 | `price` |
| Provincia + localidad | PublicarAviso.tsx | ~900-960 | `location` |
| SimpleImageUploader | PublicarAviso.tsx | ~1000-1060 | `images` |
| Título + descripción | PublicarAviso.tsx | ~1100-1200 | `title_description` |
| EmpresaSelectorWidget | PublicarAviso.tsx | ~850 | `empresa_selector` |
