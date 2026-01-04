# 🚀 ARQUITECTURA BACKEND PROFESIONAL CON ML - AGROBUSCADOR 2026

**Fecha:** 16 de diciembre, 2025  
**Objetivo:** Sistema backend inteligente que sincroniza categorías, automatiza formularios y optimiza UX con Machine Learning

---

## 📋 TABLA DE CONTENIDOS

1. [Análisis del Sistema Actual](#1-análisis-del-sistema-actual)
2. [Problemas Identificados](#2-problemas-identificados)
3. [Arquitectura Backend Propuesta](#3-arquitectura-backend-propuesta)
4. [Sistema de Catálogo Maestro con IA](#4-sistema-de-catálogo-maestro-con-ia)
5. [Categorías Completas del Sistema](#5-categorías-completas-del-sistema)
6. [Base de Datos Unificada](#6-base-de-datos-unificada)
7. [Admin Panel: Gestión de Fichas Técnicas](#7-admin-panel-gestión-de-fichas-técnicas)
8. [API Design](#8-api-design)
9. [Diseño Frontend Mantenido](#9-diseño-frontend-mantenido)
10. [Plan de Implementación](#10-plan-de-implementación)

---

## 1. ANÁLISIS DEL SISTEMA ACTUAL

### 🔍 Estado Actual de las Tablas

#### Categorías Existentes:
```
✅ categories              → Categorías principales (Maquinarias, Ganadería, etc.)
✅ subcategories           → Subcategorías (Tractores, Cosechadoras, etc.)
✅ service_main_categories → Servicios principales
✅ service_subcategories   → Servicios específicos
✅ brands                  → Marcas generales
✅ models                  → Modelos por marca
✅ subcategory_brands      → Relación M2M (subcategoría ↔ marca)
```

#### Formularios Dinámicos:
```
⚠️ form_templates_v2       → Plantillas de formularios (PARCIAL)
⚠️ form_fields_v2          → Campos dinámicos (PARCIAL)
⚠️ form_field_options_v2   → Opciones de campos (PARCIAL)
❌ category_types_v2       → Tipos específicos (NO SINCRONIZADO)
```

#### Avisos:
```
✅ ads                     → Tabla principal de avisos
✅ dynamic_fields          → JSONB para campos dinámicos
⚠️ Sincronización con categorías → INCOMPLETA
```

---

## 2. PROBLEMAS IDENTIFICADOS

### 🚨 Problema 1: DESINCRONIZACIÓN
```
CRUD Admin (Backend)          ≠          Formulario Altas (Frontend)
     ↓                                            ↓
Modifica categorías                    Usa categorías hardcodeadas
Agrega marcas/modelos                  No se actualizan automáticamente
Cambia campos                          Requiere redeploy
```

**Impacto:** Cambios en backend NO se reflejan en frontend en tiempo real.

### 🚨 Problema 2: DUPLICACIÓN DE DATOS
```
📁 adFieldsConfig.ts              vs         📊 Database
     ↓                                            ↓
Campos hardcodeados en código           Campos en form_fields_v2
Opciones en TypeScript                  Opciones en form_field_options_v2
Validaciones en frontend                Validaciones en metadata JSONB
```

**Impacto:** Mantener 2 fuentes de verdad causa inconsistencias.

### 🚨 Problema 3: SIN INTELIGENCIA
```
Usuario escribe: "Tractor Jhon Dere 5075"
                      ↓
Sistema guarda:  "Jhon Dere" (error tipográfico)
                      ↓
Resultado: Datos inconsistentes, búsquedas fallidas
```

**Impacto:** Sin ML, la calidad de datos depende 100% del usuario.

### 🚨 Problema 4: PROCESO MANUAL
```
1. Usuario selecciona: Categoría → Subcategoría → Tipo
2. Usuario completa: 20+ campos manualmente
3. Usuario sube: Imágenes una por una
4. Usuario espera: Aprobación manual (48hs)
```

**Impacto:** Fricción en la experiencia, tasa de abandono alta.

---

## 3. ARQUITECTURA BACKEND PROPUESTA

### 🏗️ Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  - Next.js 14 (App Router)                                   │
│  - React Server Components                                   │
│  - TailwindCSS + shadcn/ui                                   │
│  - Mobile-First Design System                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                      API LAYER                               │
│  - Next.js API Routes (Edge Runtime)                         │
│  - tRPC (Type-safe APIs)                                     │
│  - Zod (Runtime validation)                                  │
│  - Rate Limiting + Caching                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                       │
│  - Service Pattern                                           │
│  - ML Integration Service                                    │
│  - Category Manager Service                                  │
│  - Form Builder Service                                      │
│  - Validation Engine                                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                   ML LAYER                                │
│  - Custom ML Models (TensorFlow.js)                          │
│  - Vector Search (Supabase pgvector)                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                    DATA LAYER                                │
│  - Supabase (PostgreSQL + pgvector)                          │
│  - Redis (Caching + Queue)                                   │
│  - S3-compatible Storage (Supabase Storage)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. SISTEMA DE CATÁLOGO MAESTRO CON IA

### 🎯 Concepto: "ML Artesanal"

En lugar de ML tradicional (entrenamiento de modelos), implementaremos un **Sistema de Catálogo Maestro** donde:

```
┌─────────────────────────────────────────────────────────────┐
│              ADMIN: Carga de Datos Maestros                  │
│                                                              │
│  Superadmin usa IA (Gemini) para:                           │
│  ├─ Buscar especificaciones en web                          │
│  ├─ Extraer fichas técnicas de PDFs                         │
│  ├─ Generar descripciones automáticas                       │
│  └─ Estructurar datos en formato JSON                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│           BASE DE DATOS: Catálogo Completo                   │
│                                                              │
│  Por cada Marca + Modelo:                                   │
│  ├─ Especificaciones técnicas completas                     │
│  ├─ Imágenes oficiales                                      │
│  ├─ Descripciones pre-escritas                              │
│  ├─ Rangos de precios históricos                            │
│  └─ Features por defecto                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│            USUARIO: Publica Aviso Fácil                      │
│                                                              │
│  1. Selecciona: Maquinarias → Tractores                     │
│  2. Selecciona: Marca = John Deere                          │
│  3. Selecciona: Modelo = 5075E                              │
│  4. ✨ AUTO-COMPLETA:                                        │
│     ├─ Año: 2015-2024                                       │
│     ├─ Potencia: 75 HP                                      │
│     ├─ Tracción: 4x4                                        │
│     ├─ Peso: 3,200 kg                                       │
│     ├─ Título sugerido: "Tractor John Deere 5075E..."      │
│     └─ Descripción base prellenada                          │
│  5. Usuario solo ajusta: año específico, precio, fotos     │
│  6. ✅ Publica en < 2 minutos                               │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 Ventajas de este Enfoque

```
✅ Datos Consistentes
   → Todos los avisos de "John Deere 5075E" tienen las mismas specs

✅ Experiencia Usuario
   → Publicar aviso: 2 min vs 10 min actual

✅ Calidad de Búsqueda
   → Datos estructurados = búsquedas precisas

✅ Sin Duplicados
   → Sistema detecta mismo modelo automáticamente

✅ Escalable
   → Agregar nueva marca/modelo = 1 entrada en Admin

✅ Mantenible
   → Admin actualiza specs, todos los avisos se benefician
```

---

## 5. CATEGORÍAS COMPLETAS DEL SISTEMA

### 📊 Árbol Completo de Categorías

```
🚜 MAQUINARIAS
   ├─ Tractores
   │  ├─ Tractor Agrícola
   │  ├─ Tractor Frutero/Viñero
   │  ├─ Tractor Compacto
   │  └─ Minitractor
   │
   ├─ Cosechadoras
   │  ├─ Cosechadora de Granos
   │  ├─ Cosechadora de Forraje
   │  ├─ Cabezal Maicero
   │  └─ Cabezal Draper
   │
   ├─ Sembradoras
   │  ├─ Sembradora de Grano Fino
   │  ├─ Sembradora de Grano Grueso
   │  ├─ Sembradora Neumática
   │  └─ Sembradora de Siembra Directa
   │
   ├─ Pulverizadoras
   │  ├─ Pulverizadora Autopropulsada
   │  ├─ Pulverizadora de Arrastre
   │  └─ Pulverizadora de Barral
   │
   ├─ Fertilizadoras
   │  ├─ Fertilizadora al Voleo
   │  ├─ Fertilizadora de Precisión
   │  └─ Fertilizadora Líquida
   │
   ├─ Implementos de Labranza
   │  ├─ Arado de Reja
   │  ├─ Arado de Disco
   │  ├─ Rastra de Disco
   │  ├─ Cincel
   │  ├─ Subsolador
   │  └─ Rolo
   │
   ├─ Forraje y Ganadería
   │  ├─ Henificadora
   │  ├─ Rotoenfardadora
   │  ├─ Enfardadora
   │  ├─ Mixer
   │  └─ Desmalezadora
   │
   ├─ Cosecha y Post-Cosecha
   │  ├─ Secadora de Granos
   │  ├─ Silo Bolsa
   │  ├─ Embutidora
   │  └─ Extractora
   │
   ├─ Carga y Movimiento
   │  ├─ Pala Cargadora
   │  ├─ Minicargadora
   │  ├─ Grúa
   │  └─ Montacargas
   │
   ├─ Maquinaria Vial
   │  ├─ Motoniveladora
   │  ├─ Retroexcavadora
   │  ├─ Excavadora
   │  ├─ Pala Cargadora
   │  └─ Rodillo Compactador
   │
   ├─ Transporte
   │  ├─ Camión
   │  ├─ Acoplado
   │  ├─ Tolva Autodescargable
   │  └─ Carretón
   │
   ├─ Instalaciones y Energía
   │  ├─ Generador
   │  ├─ Bomba de Agua
   │  ├─ Tanque de Agua
   │  ├─ Molino de Viento
   │  └─ Panel Solar
   │
   ├─ Repuestos
   │  ├─ Repuestos Motor
   │  ├─ Repuestos Transmisión
   │  ├─ Repuestos Hidráulicos
   │  ├─ Neumáticos
   │  └─ Filtros y Aceites
   │
   ├─ Herramientas
   │  ├─ Soldadora
   │  ├─ Compresor
   │  ├─ Herramientas Manuales
   │  └─ Herramientas Eléctricas
   │
   └─ Otros Equipos

🐄 GANADERÍA
   ├─ Bovinos
   │  ├─ Terneros
   │  ├─ Novillos
   │  ├─ Vacas
   │  ├─ Toros
   │  ├─ Vaquillonas
   │  └─ Reproductores
   │
   ├─ Ovinos
   │  ├─ Corderos
   │  ├─ Borregos
   │  ├─ Ovejas
   │  └─ Carneros
   │
   ├─ Porcinos
   │  ├─ Lechones
   │  ├─ Capones
   │  ├─ Cerdas
   │  └─ Padrillos
   │
   ├─ Equinos
   │  ├─ Caballos de Trabajo
   │  ├─ Caballos de Deporte
   │  ├─ Potrillos
   │  └─ Yeguas
   │
   ├─ Caprinos
   │  ├─ Cabritos
   │  ├─ Cabras
   │  └─ Machos
   │
   ├─ Aves
   │  ├─ Pollos Parrilleros
   │  ├─ Gallinas Ponedoras
   │  ├─ Pollitos BB
   │  └─ Otras Aves
   │
   └─ Otros Animales

🌾 INSUMOS
   ├─ Semillas
   │  ├─ Semillas de Soja
   │  ├─ Semillas de Maíz
   │  ├─ Semillas de Trigo
   │  ├─ Semillas de Girasol
   │  ├─ Semillas de Sorgo
   │  ├─ Semillas Forrajeras
   │  └─ Otras Semillas
   │
   ├─ Fertilizantes
   │  ├─ Fertilizantes Nitrogenados
   │  ├─ Fertilizantes Fosfatados
   │  ├─ Fertilizantes Potásicos
   │  ├─ Fertilizantes Compuestos
   │  └─ Enmiendas
   │
   ├─ Agroquímicos
   │  ├─ Herbicidas
   │  ├─ Insecticidas
   │  ├─ Fungicidas
   │  ├─ Acaricidas
   │  └─ Coadyuvantes
   │
   ├─ Alimentos Balanceados
   │  ├─ Alimento Bovinos
   │  ├─ Alimento Ovinos
   │  ├─ Alimento Porcinos
   │  ├─ Alimento Equinos
   │  ├─ Alimento Aves
   │  └─ Suplementos
   │
   ├─ Sanidad Animal
   │  ├─ Vacunas
   │  ├─ Antibióticos
   │  ├─ Antiparasitarios
   │  ├─ Desinfectantes
   │  └─ Vitaminas y Minerales
   │
   └─ Otros Insumos

🏡 INMUEBLES RURALES
   ├─ Campos en Venta
   ├─ Campos en Alquiler
   ├─ Chacras
   ├─ Estancias
   ├─ Quintas
   ├─ Galpones Rurales
   └─ Otros Inmuebles

📖 GUÍA DEL CAMPO
   ├─ Productores
   ├─ Contratistas
   ├─ Veterinarios
   ├─ Ingenieros Agrónomos
   ├─ Consignatarios
   ├─ Cabañas
   ├─ Casas de Insumos
   ├─ Talleres Rurales
   ├─ Transporte Rural
   └─ Servicios Rurales
```

### 📋 Ejemplo: Ficha Técnica Completa

```json
// Ejemplo: John Deere 5075E (Tractor)
{
  "id": "uuid-123",
  "category": "Maquinarias",
  "subcategory": "Tractores",
  "type": "Tractor Agrícola",
  "brand": "John Deere",
  "model": "5075E",
  
  "specifications": {
    // Motor
    "engine": {
      "manufacturer": "PowerTech",
      "type": "Diesel 4 cilindros",
      "displacement": "3.0 L",
      "power_hp": 75,
      "power_kw": 55.9,
      "max_torque": "285 Nm @ 1,400 rpm",
      "cooling": "Líquido",
      "fuel_system": "Inyección directa Common Rail",
      "emissions": "Tier 3"
    },
    
    // Transmisión
    "transmission": {
      "type": "Sincronizada",
      "gears_forward": 12,
      "gears_reverse": 12,
      "max_speed": "32.4 km/h",
      "clutch": "Monodisco seco"
    },
    
    // Hidráulico
    "hydraulics": {
      "system": "Sistema hidráulico cerrado",
      "pump_flow": "57 L/min",
      "lift_capacity": "2,400 kg",
      "remote_valves": 2,
      "three_point_hitch": "Categoría II"
    },
    
    // Toma de Fuerza (PTO)
    "pto": {
      "type": "Independiente",
      "speeds": ["540 rpm", "1000 rpm"],
      "engagement": "Electrohidráulico"
    },
    
    // Dimensiones
    "dimensions": {
      "length": "3,810 mm",
      "width": "1,994 mm",
      "height": "2,692 mm",
      "wheelbase": "2,159 mm",
      "ground_clearance": "457 mm",
      "weight": "3,200 kg"
    },
    
    // Neumáticos
    "tires": {
      "front": "11.2-24",
      "rear": "16.9-30",
      "traction": "4x4"
    },
    
    // Cabina
    "cabin": {
      "type": "Cabina cerrada con A/C",
      "air_conditioning": true,
      "heating": true,
      "sound_insulation": "81 dB(A)",
      "visibility": "360°"
    },
    
    // Capacidades
    "capacities": {
      "fuel_tank": "95 L",
      "hydraulic_oil": "42 L",
      "coolant": "12 L",
      "engine_oil": "9 L"
    },
    
    // Años de producción
    "production_years": {
      "from": 2015,
      "to": 2024,
      "current": false
    }
  },
  
  "features": [
    "Transmisión sincronizada 12x12",
    "Tracción 4x4",
    "Cabina cerrada con A/C",
    "Sistema hidráulico de alta capacidad",
    "Motor Tier 3 de bajo consumo",
    "Asiento con suspensión neumática",
    "Control de crucero",
    "Levante hidráulico de gran capacidad"
  ],
  
  "typical_uses": [
    "Labranza primaria y secundaria",
    "Siembra de precisión",
    "Pulverización",
    "Transporte de cargas",
    "Labores de forraje"
  ],
  
  "price_range": {
    "currency": "USD",
    "new_min": 45000,
    "new_max": 55000,
    "used_min": 25000,
    "used_max": 45000,
    "last_updated": "2024-12"
  },
  
  "images": {
    "main": "https://..../john-deere-5075e-main.jpg",
    "gallery": [
      "https://..../john-deere-5075e-front.jpg",
      "https://..../john-deere-5075e-side.jpg",
      "https://..../john-deere-5075e-cabin.jpg",
      "https://..../john-deere-5075e-engine.jpg"
    ],
    "technical_drawing": "https://..../john-deere-5075e-drawing.pdf"
  },
  
  "documents": {
    "brochure": "https://..../5075e-brochure.pdf",
    "manual": "https://..../5075e-manual.pdf",
    "specifications": "https://..../5075e-specs.pdf"
  },
  
  "related_models": [
    "5065E", "5085E", "5090E", "5100E"
  ],
  
  "metadata": {
    "created_by": "superadmin",
    "ai_generated": true,
    "ai_confidence": 0.95,
    "verified": true,
    "verified_by": "admin-john",
    "verified_at": "2024-12-15",
    "source": "https://www.deere.com/es/tractors/5075e/",
    "last_updated": "2024-12-15"
  }
}
```

---

## 7. ADMIN PANEL: GESTIÓN DE FICHAS TÉCNICAS

### 🎛️ Panel de Administración

```
┌─────────────────────────────────────────────────────────────┐
│               ADMIN: Gestión de Catálogo Maestro             │
└─────────────────────────────────────────────────────────────┘

├─ 📂 Categorías
│  ├─ CRUD de categorías principales
│  ├─ CRUD de subcategorías
│  ├─ CRUD de tipos específicos
│  └─ Orden y activación/desactivación
│
├─ 🏷️ Marcas
│  ├─ CRUD de marcas
│  ├─ Asignación a categorías/subcategorías
│  ├─ Upload de logos
│  └─ Websites y redes sociales
│
├─ 📋 Modelos (★ CORE ★)
│  ├─ CRUD de modelos por marca
│  ├─ 🤖 IA Assistant para carga automática:
│  │   ├─ Buscar specs en web (Google Search API)
│  │   ├─ Extraer de PDFs (Gemini Vision)
│  │   ├─ Generar descripciones (Gemini)
│  │   └─ Estructurar JSON automático
│  │
│  ├─ Editor de Ficha Técnica:
│  │   ├─ Secciones personalizables por categoría
│  │   ├─ Campos dinámicos
│  │   ├─ Validación de rangos
│  │   └─ Preview en tiempo real
│  │
│  ├─ Gestión de Imágenes:
│  │   ├─ Upload múltiple
│  │   ├─ Reordenar galería
│  │   ├─ Crop y resize automático
│  │   └─ Watermark opcional
│  │
│  ├─ Documentos:
│  │   ├─ Brochures (PDF)
│  │   ├─ Manuales (PDF)
│  │   ├─ Fichas técnicas (PDF/Excel)
│  │   └─ Extracción automática de datos
│  │
│  └─ Historial de Precios:
│      ├─ Rangos por año
│      ├─ Gráficos de tendencia
│      └─ Fuentes de datos
│
├─ 🔗 Relaciones
│  ├─ Marcas ↔ Subcategorías
│  ├─ Modelos relacionados
│  └─ Accesorios compatibles
│
└─ 📊 Analytics
   ├─ Modelos más buscados
   ├─ Marcas más publicadas
   ├─ Gaps en el catálogo
   └─ Solicitudes de usuarios
```

### 🤖 IA Assistant: Carga Automática de Fichas

#### Paso 1: Búsqueda Inteligente
```typescript
// Admin ingresa: "John Deere 5075E"

const aiSearch = await aiService.searchModelInfo({
  brand: "John Deere",
  model: "5075E",
  category: "Tractores"
});

// IA busca en:
// 1. Sitio oficial del fabricante
// 2. Distribuidores autorizados
// 3. Bases de datos técnicas
// 4. PDFs de especificaciones
// 5. Reviews y comparativas

// Resultado:
{
  sources: [
    {
      url: "https://www.deere.com/es/tractors/5075e/",
      type: "official_website",
      confidence: 0.98,
      found_data: ["specs", "images", "brochure"]
    },
    {
      url: "https://dealer.com/john-deere-5075e.pdf",
      type: "pdf_brochure",
      confidence: 0.95,
      found_data: ["specs", "prices"]
    }
  ],
  extracted_data: {
    // Datos estructurados...
  }
}
```

#### Paso 2: Extracción de PDFs
```typescript
// IA analiza PDFs con Gemini Vision

const pdfExtraction = await aiService.extractFromPDF({
  pdfUrl: "https://dealer.com/john-deere-5075e.pdf",
  extractionType: "technical_specs"
});

// Resultado:
{
  specifications: {
    engine: {
      power_hp: 75,
      displacement: "3.0 L",
      type: "Diesel 4 cilindros"
    },
    dimensions: {
      weight: "3,200 kg",
      length: "3,810 mm"
    }
  },
  confidence: 0.92,
  pages_analyzed: [1, 2, 5]
}
```

#### Paso 3: Generación de Descripciones
```typescript
// IA genera descripciones atractivas

const descriptions = await aiService.generateDescriptions({
  modelData: extractedSpecs,
  language: "es-AR",
  tone: "professional_friendly"
});

// Resultado:
{
  short: "Tractor John Deere 5075E de 75 HP con tracción 4x4 y cabina cerrada. Ideal para labores agrícolas medianas.",
  
  full: "El John Deere 5075E es un tractor agrícola versátil de 75 HP, diseñado para productores que buscan eficiencia y confiabilidad. Su motor PowerTech de 3.0L ofrece excelente torque y bajo consumo. La transmisión sincronizada 12x12 permite una selección precisa de velocidades para cada labor. El sistema hidráulico de alta capacidad (2,400 kg de levante) facilita el trabajo con implementos pesados. La cabina cerrada con aire acondicionado garantiza comodidad durante largas jornadas. Su tracción 4x4 y neumáticos de alta flotación lo hacen ideal para trabajar en terrenos difíciles. Perfecto para labranza, siembra, pulverización y transporte.",
  
  features_highlighted: [
    "Motor de 75 HP con excelente torque",
    "Transmisión sincronizada 12x12",
    "Levante hidráulico de 2,400 kg",
    "Cabina con A/C",
    "Tracción 4x4"
  ]
}
```

#### Paso 4: Preview y Validación
```typescript
// Admin revisa y ajusta antes de guardar

<PreviewCard
  model={generatedModel}
  editable={true}
  onSave={saveToDatabase}
  onRegenerate={(field) => {
    // Regenerar un campo específico
    aiService.regenerateField(field);
  }}
/>
```

### 📝 Formulario de Admin: Nuevo Modelo

```tsx
// Componente: NewModelForm.tsx

interface NewModelFormProps {
  brandId: string;
  categoryId: string;
  subcategoryId: string;
}

export const NewModelForm: React.FC<NewModelFormProps> = ({
  brandId,
  categoryId,
  subcategoryId
}) => {
  
  return (
    <div className="space-y-6">
      
      {/* Paso 1: Datos Básicos */}
      <Card>
        <CardHeader>
          <h3>Información Básica</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nombre del Modelo"
            placeholder="5075E"
            value={modelName}
            onChange={setModelName}
          />
          
          <Input
            label="Nombre para Mostrar"
            placeholder="John Deere 5075E"
            value={displayName}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Año Desde"
              value={yearFrom}
            />
            <Input
              type="number"
              label="Año Hasta"
              value={yearTo}
            />
          </div>
          
          <Checkbox
            label="Está actualmente en producción"
            checked={isCurrentProduction}
          />
          
          {/* 🤖 IA ASSISTANT BUTTON */}
          <Button
            variant="gradient"
            icon={<Sparkles />}
            onClick={handleAISearch}
            loading={aiLoading}
          >
            🤖 Buscar Especificaciones con IA
          </Button>
        </CardContent>
      </Card>
      
      {/* Paso 2: Especificaciones (Auto-llenado por IA) */}
      {aiData && (
        <Card className="border-green-500 border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500" />
              <h3>Especificaciones Encontradas</h3>
              <Badge variant="success">
                Confianza: {(aiData.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            
            {/* Motor */}
            <SpecSection title="Motor">
              <Input label="Fabricante" value={specs.engine.manufacturer} />
              <Input label="Tipo" value={specs.engine.type} />
              <Input label="Potencia (HP)" type="number" value={specs.engine.power_hp} />
              <Input label="Cilindrada" value={specs.engine.displacement} />
              {/* ... más campos */}
            </SpecSection>
            
            {/* Transmisión */}
            <SpecSection title="Transmisión">
              {/* ... */}
            </SpecSection>
            
            {/* Hidráulico */}
            <SpecSection title="Sistema Hidráulico">
              {/* ... */}
            </SpecSection>
            
            {/* Dimensiones */}
            <SpecSection title="Dimensiones y Peso">
              {/* ... */}
            </SpecSection>
            
          </CardContent>
        </Card>
      )}
      
      {/* Paso 3: Imágenes */}
      <Card>
        <CardHeader>
          <h3>Imágenes</h3>
        </CardHeader>
        <CardContent>
          <ImageUploadGrid
            mainImage={mainImage}
            gallery={galleryImages}
            onMainImageChange={setMainImage}
            onGalleryChange={setGalleryImages}
            maxImages={8}
          />
          
          {/* IA puede sugerir imágenes de la web */}
          {aiData?.suggested_images && (
            <div className="mt-4">
              <h4>Imágenes Sugeridas por IA</h4>
              <div className="grid grid-cols-4 gap-2">
                {aiData.suggested_images.map(img => (
                  <img
                    src={img.thumbnail}
                    onClick={() => addImageFromAI(img)}
                    className="cursor-pointer hover:opacity-80"
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Paso 4: Descripción */}
      <Card>
        <CardHeader>
          <h3>Descripción</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Descripción Corta (1-2 líneas)"
            value={shortDescription}
            maxLength={200}
            helperText="Se mostrará en las cards de búsqueda"
          />
          
          <Textarea
            label="Descripción Completa"
            value={fullDescription}
            rows={8}
            helperText="Se mostrará en la página de detalle"
          />
          
          <Button
            variant="outline"
            icon={<Sparkles />}
            onClick={handleGenerateDescription}
          >
            Generar con IA
          </Button>
          
          {/* Features */}
          <TagInput
            label="Características Destacadas"
            values={features}
            onChange={setFeatures}
            placeholder="Ej: Motor de 75 HP, Tracción 4x4..."
          />
          
          {/* Usos Típicos */}
          <TagInput
            label="Usos Típicos"
            values={typicalUses}
            onChange={setTypicalUses}
            placeholder="Ej: Labranza, Siembra, Pulverización..."
          />
        </CardContent>
      </Card>
      
      {/* Paso 5: Precios */}
      <Card>
        <CardHeader>
          <h3>Rangos de Precio</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4>Nuevo</h4>
              <Input label="Mínimo (USD)" type="number" value={priceNewMin} />
              <Input label="Máximo (USD)" type="number" value={priceNewMax} />
            </div>
            <div>
              <h4>Usado</h4>
              <Input label="Mínimo (USD)" type="number" value={priceUsedMin} />
              <Input label="Máximo (USD)" type="number" value={priceUsedMax} />
            </div>
          </div>
          
          <Alert variant="info" className="mt-4">
            <InfoIcon />
            Estos precios son referenciales y se actualizarán automáticamente
            con datos del mercado.
          </Alert>
        </CardContent>
      </Card>
      
      {/* Paso 6: Documentos */}
      <Card>
        <CardHeader>
          <h3>Documentos Técnicos</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUpload
            label="Brochure (PDF)"
            accept=".pdf"
            value={brochureUrl}
            onChange={setBrochureUrl}
          />
          
          <FileUpload
            label="Manual del Operador (PDF)"
            accept=".pdf"
            value={manualUrl}
            onChange={setManualUrl}
          />
          
          <FileUpload
            label="Ficha Técnica (PDF)"
            accept=".pdf"
            value={specSheetUrl}
            onChange={setSpecSheetUrl}
            onUpload={(file) => {
              // IA puede extraer specs del PDF
              aiService.extractFromPDF(file);
            }}
          />
        </CardContent>
      </Card>
      
      {/* Paso 7: Modelos Relacionados */}
      <Card>
        <CardHeader>
          <h3>Modelos Relacionados</h3>
        </CardHeader>
        <CardContent>
          <ModelSelector
            brandId={brandId}
            selectedModels={relatedModels}
            onChange={setRelatedModels}
            placeholder="Ej: 5065E, 5085E, 5090E..."
          />
        </CardContent>
      </Card>
      
      {/* Paso 8: Metadata */}
      <Card>
        <CardHeader>
          <h3>Metadata y Fuentes</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Checkbox
            label="Generado por IA"
            checked={aiGenerated}
            disabled
          />
          
          {aiGenerated && (
            <>
              <Input
                label="Confianza IA"
                value={`${(aiConfidence * 100).toFixed(0)}%`}
                disabled
              />
              
              <Input
                label="Fuente"
                value={aiSource}
                helperText="URL de donde se extrajo la información"
              />
            </>
          )}
          
          <Checkbox
            label="Verificado manualmente"
            checked={verified}
            onChange={setVerified}
          />
        </CardContent>
      </Card>
      
      {/* Botones de Acción */}
      <div className="flex gap-4">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          loading={saving}
        >
          💾 Guardar Modelo
        </Button>
        
        <Button
          variant="outline"
          onClick={handlePreview}
        >
          👁️ Vista Previa
        </Button>
        
        <Button
          variant="ghost"
          onClick={handleCancel}
        >
          Cancelar
        </Button>
      </div>
      
    </div>
  );
};
```

### 🔄 Flujo Completo: Admin Carga un Tractor

```
1. Admin va a: Panel → Modelos → Nuevo Modelo

2. Selecciona:
   ├─ Categoría: Maquinarias
   ├─ Subcategoría: Tractores
   ├─ Marca: John Deere
   └─ Modelo: [Campo vacío]

3. Escribe: "5075E"

4. Click: "🤖 Buscar Especificaciones con IA"

5. IA trabaja (15-30 segundos):
   ├─ Busca en Google: "John Deere 5075E specifications"
   ├─ Encuentra sitio oficial
   ├─ Scraping de datos estructurados
   ├─ Busca PDFs de brochures
   ├─ Extrae especificaciones con Gemini Vision
   ├─ Genera descripción atractiva
   ├─ Sugiere imágenes oficiales
   └─ Estima rangos de precio

6. Formulario se auto-llena:
   ✅ 60 campos completados automáticamente
   ✅ Descripción generada
   ✅ Imágenes sugeridas
   ✅ Features listadas
   ✅ Precios estimados

7. Admin revisa y ajusta:
   ├─ Corrige algún dato si es necesario
   ├─ Agrega imágenes adicionales
   ├─ Ajusta descripción
   └─ Marca como "Verificado"

8. Click: "💾 Guardar Modelo"

9. ✅ Modelo disponible instantáneamente para usuarios

10. Usuarios ahora pueden:
    ├─ Seleccionar "John Deere 5075E" en el form
    ├─ Ver todos los datos pre-cargados
    ├─ Solo ajustar: año específico, precio, condición, fotos
    └─ Publicar en < 2 minutos
```

---

## 4. INTEGRACIÓN DE IA PARA BÚSQUEDA Y SUGERENCIAS

### 🤖 IA para Usuarios (Frontend)
```typescript
// Usuario escribe: "Vendo tractor John Deere 5075E 2020"
const input = {
  text: "Vendo tractor John Deere 5075E 2020"
};

// ML analiza y sugiere:
const aiSuggestion = await mlService.categorizeAd(input);
// Resultado:
{
  confidence: 0.95,
  suggestions: {
    category: "Maquinarias",
    subcategory: "Tractores",
    type: "Tractor Agrícola",
    brand: "John Deere",
    model: "5075E",
    year: 2020,
    extractedKeywords: ["tractor", "john deere", "5075e", "2020"]
  }
}
```

#### 4.2. Autocomplete Inteligente
```typescript
// Usuario empieza a escribir: "Joh"
const suggestions = await mlService.getSuggestions({
  query: "Joh",
  context: { category: "Maquinarias", subcategory: "Tractores" }
});
// Resultado:
{
  brands: [
    { name: "John Deere", confidence: 0.98, logo: "..." },
    { name: "Johnson Controls", confidence: 0.15 }
  ],
  didYouMean: "John Deere" // Si escribió "Jon Dere"
}
```

#### 4.3. Validación de Datos en Tiempo Real
```typescript
// Usuario ingresa: Año = 2030, HP = 5000
const validation = await mlService.validateFields({
  category: "Tractores",
  data: { year: 2030, horsepower: 5000 }
});
// Resultado:
{
  isValid: false,
  warnings: [
    {
      field: "year",
      message: "El año 2030 parece incorrecto. ¿Quisiste decir 2020?",
      suggestedValue: 2020
    },
    {
      field: "horsepower",
      message: "5000 HP es inusual para tractores. El rango típico es 50-500 HP.",
      suggestedValue: 500
    }
  ]
}
```

#### 4.4. Enriquecimiento Automático
```typescript
// Usuario sube foto de tractor
const enrichment = await mlService.enrichFromImage({
  imageUrl: "...",
  category: "Tractores"
});
// Resultado (usando Gemini Vision):
{
  detectedBrand: "John Deere",
  detectedModel: "5075E",
  estimatedYear: 2018,
  condition: "Usado - Buen estado",
  visualFeatures: ["Cabina cerrada", "Tracción 4x4", "Neumáticos nuevos"],
  suggestedTitle: "Tractor John Deere 5075E 2018 - 4x4 con Cabina",
  suggestedDescription: "..."
}
```

#### 4.5. Detección de Duplicados
```typescript
// Usuario publica aviso similar a otro existente
const duplicateCheck = await mlService.checkDuplicates({
  title: "Tractor John Deere 5075E",
  description: "...",
  images: ["..."]
});
// Resultado:
{
  isDuplicate: true,
  confidence: 0.89,
  similarAds: [
    {
      id: "uuid-123",
      similarity: 0.89,
      reason: "Misma marca, modelo y año. Descripción 85% similar."
    }
  ]
}
```

#### 4.6. Pricing Intelligence
```typescript
// Usuario no sabe qué precio poner
const priceSuggestion = await mlService.suggestPrice({
  category: "Tractores",
  brand: "John Deere",
  model: "5075E",
  year: 2020,
  condition: "Usado",
  province: "Buenos Aires"
});
// Resultado:
{
  suggestedPrice: 35000,
  currency: "USD",
  confidence: 0.87,
  marketAnalysis: {
    min: 30000,
    avg: 35000,
    max: 42000,
    similarAds: 12
  },
  priceFactors: [
    { factor: "Año reciente", impact: "+10%" },
    { factor: "Marca premium", impact: "+15%" },
    { factor: "Condición usada", impact: "-20%" }
  ]
}
```

---

## 6. BASE DE DATOS UNIFICADA

### 📊 Schema Completo V2 (Actualizado para Fichas Técnicas)

```sql
-- =====================================================
-- CORE: CATEGORÍAS Y TAXONOMÍA
-- =====================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon TEXT, -- lucide-react icon name
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- ML Metadata
  ml_keywords TEXT[], -- Keywords para categorización automática
  ml_model_version VARCHAR(50), -- Versión del modelo ML usado
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  icon TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Features
  has_brands BOOLEAN DEFAULT false,
  has_models BOOLEAN DEFAULT false,
  has_year BOOLEAN DEFAULT false,
  has_condition BOOLEAN DEFAULT false,
  
  -- ML Metadata
  ml_keywords TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

CREATE TABLE category_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Formulario asociado
  form_template_id UUID REFERENCES form_templates(id),
  
  -- ML Metadata
  ml_keywords TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subcategory_id, slug)
);

-- =====================================================
-- FORMS: FORMULARIOS DINÁMICOS
-- =====================================================

CREATE TABLE form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Asociación
  category_id UUID REFERENCES categories(id),
  subcategory_id UUID REFERENCES subcategories(id),
  category_type_id UUID REFERENCES category_types(id),
  
  -- Config
  is_multi_step BOOLEAN DEFAULT true,
  sections JSONB DEFAULT '[]'::jsonb, -- Array de secciones
  
  -- Validación
  validation_rules JSONB DEFAULT '{}'::jsonb,
  
  -- ML Config
  ml_enabled BOOLEAN DEFAULT true,
  ml_autocomplete BOOLEAN DEFAULT true,
  ml_validation BOOLEAN DEFAULT true,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_template_id UUID REFERENCES form_templates(id) ON DELETE CASCADE,
  
  -- Field Config
  name VARCHAR(100) NOT NULL, -- campo técnico (ej: "horsepower")
  display_name VARCHAR(200) NOT NULL, -- label visible (ej: "Potencia (HP)")
  field_type VARCHAR(50) NOT NULL, -- text, number, select, multiselect, date, etc.
  
  -- Layout
  section VARCHAR(100), -- ej: "Especificaciones Técnicas"
  sort_order INTEGER DEFAULT 0,
  column_span INTEGER DEFAULT 1, -- 1 = mitad, 2 = completo
  
  -- Validación
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB DEFAULT '{}'::jsonb, -- min, max, pattern, etc.
  
  -- UI
  placeholder TEXT,
  help_text TEXT,
  prefix TEXT, -- ej: "$"
  suffix TEXT, -- ej: "HP", "km", "ha"
  
  -- Data Source (para selects)
  data_source VARCHAR(50), -- 'static', 'database', 'api', 'ml'
  data_source_config JSONB DEFAULT '{}'::jsonb,
  
  -- ML Features
  ml_autocomplete BOOLEAN DEFAULT false,
  ml_validation BOOLEAN DEFAULT false,
  ml_suggestions BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE form_field_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_field_id UUID REFERENCES form_fields(id) ON DELETE CASCADE,
  
  value TEXT NOT NULL,
  display_text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- ML
  ml_keywords TEXT[], -- Para matching inteligente
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DATA: MARCAS, MODELOS Y DATOS PRECARGADOS
-- =====================================================

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  
  -- Asociación (NULL = aplica a todas las categorías)
  category_id UUID REFERENCES categories(id),
  
  -- Assets
  logo_url TEXT,
  website TEXT,
  
  -- ML Features
  ml_aliases TEXT[], -- Ej: ["JD", "John Deer", "Jhon Deere"]
  ml_embedding VECTOR(1536), -- Vector para similarity search
  
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  
  name VARCHAR(200) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  
  -- Especificaciones
  year_from INTEGER,
  year_to INTEGER,
  specifications JSONB DEFAULT '{}'::jsonb, -- Datos técnicos
  
  -- ML Features
  ml_aliases TEXT[],
  ml_embedding VECTOR(1536),
  
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, slug)
);

-- Relación M2M: Subcategorías → Marcas
CREATE TABLE subcategory_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subcategory_id, brand_id)
);

-- =====================================================
-- ADS: AVISOS (Actualizado)
-- =====================================================

CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Categorización
  category_id UUID REFERENCES categories(id),
  subcategory_id UUID REFERENCES subcategories(id),
  category_type_id UUID REFERENCES category_types(id),
  
  -- Datos básicos
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'ARS',
  
  -- Ubicación
  province VARCHAR(100),
  city VARCHAR(100),
  location_coords GEOGRAPHY(POINT), -- PostGIS para búsquedas geográficas
  
  -- Referencias (si aplica)
  brand_id UUID REFERENCES brands(id),
  model_id UUID REFERENCES models(id),
  year INTEGER,
  condition VARCHAR(50),
  
  -- Imágenes
  images TEXT[], -- Array de URLs
  thumbnail_url TEXT,
  
  -- Campos dinámicos (específicos por categoría)
  dynamic_fields JSONB DEFAULT '{}'::jsonb,
  
  -- Tags y keywords
  tags TEXT[],
  keywords_vector VECTOR(1536), -- Para búsqueda semántica
  
  -- Estado
  status VARCHAR(20) DEFAULT 'active', -- active, paused, expired, deleted
  approval_status VARCHAR(20) DEFAULT 'approved', -- pending, approved, rejected
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Características
  featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  -- Contacto
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  
  -- Métricas
  views_count INTEGER DEFAULT 0,
  contacts_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  
  -- ML Metadata
  ml_score DECIMAL(3, 2), -- Score de calidad del aviso (0-1)
  ml_category_confidence DECIMAL(3, 2), -- Confianza en categorización
  ml_enriched BOOLEAN DEFAULT false,
  ml_enrichment_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
);

-- =====================================================
-- ML: LOGS Y ANALYTICS
-- =====================================================

CREATE TABLE ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de predicción
  prediction_type VARCHAR(50) NOT NULL, -- categorization, pricing, validation, etc.
  
  -- Input
  input_data JSONB NOT NULL,
  
  -- Output
  prediction JSONB NOT NULL,
  confidence DECIMAL(3, 2),
  
  -- Modelo usado
  model_name VARCHAR(100),
  model_version VARCHAR(50),
  
  -- Asociación (opcional)
  ad_id UUID REFERENCES ads(id),
  user_id UUID REFERENCES users(id),
  
  -- Feedback
  was_accepted BOOLEAN,
  user_feedback TEXT,
  
  -- Performance
  processing_time_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ml_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Data para entrenar modelos
  data_type VARCHAR(50) NOT NULL, -- brand_aliases, category_keywords, etc.
  input_value TEXT NOT NULL,
  expected_output JSONB NOT NULL,
  
  -- Metadata
  source VARCHAR(50), -- user_correction, admin_input, auto_generated
  confidence DECIMAL(3, 2),
  
  is_validated BOOLEAN DEFAULT false,
  validated_by UUID REFERENCES users(id),
  validated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES OPTIMIZADOS
-- =====================================================

-- Full Text Search
CREATE INDEX idx_ads_title_fts ON ads USING GIN (to_tsvector('spanish', title));
CREATE INDEX idx_ads_description_fts ON ads USING GIN (to_tsvector('spanish', description));

-- Vector Search (pgvector)
CREATE INDEX idx_ads_keywords_vector ON ads USING ivfflat (keywords_vector vector_cosine_ops);
CREATE INDEX idx_brands_embedding ON brands USING ivfflat (ml_embedding vector_cosine_ops);
CREATE INDEX idx_models_embedding ON models USING ivfflat (ml_embedding vector_cosine_ops);

-- Categorías
CREATE INDEX idx_ads_category ON ads(category_id) WHERE status = 'active';
CREATE INDEX idx_ads_subcategory ON ads(subcategory_id) WHERE status = 'active';
CREATE INDEX idx_ads_category_type ON ads(category_type_id) WHERE status = 'active';

-- Búsquedas frecuentes
CREATE INDEX idx_ads_brand_model ON ads(brand_id, model_id) WHERE status = 'active';
CREATE INDEX idx_ads_province ON ads(province) WHERE status = 'active';
CREATE INDEX idx_ads_price ON ads(price) WHERE status = 'active';

-- ML
CREATE INDEX idx_ml_predictions_type ON ml_predictions(prediction_type, created_at DESC);
CREATE INDEX idx_ml_predictions_ad ON ml_predictions(ad_id);

-- Dynamic Fields (JSONB)
CREATE INDEX idx_ads_dynamic_fields ON ads USING GIN (dynamic_fields);

-- Tags
CREATE INDEX idx_ads_tags ON ads USING GIN (tags);

-- Geolocation
CREATE INDEX idx_ads_location ON ads USING GIST (location_coords);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate keywords vector (cuando se actualiza título/descripción)
CREATE OR REPLACE FUNCTION generate_keywords_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Esto llamaría a un servicio externo para generar embeddings
  -- Por ahora, dejar NULL y actualizar via API
  NEW.keywords_vector = NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_ads_keywords BEFORE INSERT OR UPDATE ON ads
  FOR EACH ROW WHEN (NEW.title IS NOT NULL OR NEW.description IS NOT NULL)
  EXECUTE FUNCTION generate_keywords_vector();

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista completa de avisos con todas las relaciones
CREATE OR REPLACE VIEW ads_full AS
SELECT 
  a.*,
  c.name AS category_name,
  c.display_name AS category_display_name,
  sc.name AS subcategory_name,
  sc.display_name AS subcategory_display_name,
  ct.name AS type_name,
  ct.display_name AS type_display_name,
  b.name AS brand_name,
  b.display_name AS brand_display_name,
  b.logo_url AS brand_logo_url,
  m.name AS model_name,
  m.display_name AS model_display_name,
  u.email AS seller_email,
  u.full_name AS seller_name,
  u.role AS seller_role,
  p.business_name AS seller_business_name,
  p.phone AS seller_phone
FROM ads a
LEFT JOIN categories c ON a.category_id = c.id
LEFT JOIN subcategories sc ON a.subcategory_id = sc.id
LEFT JOIN category_types ct ON a.category_type_id = ct.id
LEFT JOIN brands b ON a.brand_id = b.id
LEFT JOIN models m ON a.model_id = m.id
LEFT JOIN users u ON a.user_id = u.id
LEFT JOIN profiles p ON a.user_id = p.user_id;

-- Vista de categorías con contadores
CREATE OR REPLACE VIEW categories_stats AS
SELECT 
  c.id,
  c.name,
  c.display_name,
  c.icon,
  COUNT(DISTINCT a.id) AS ads_count,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'active') AS active_ads_count,
  COUNT(DISTINCT sc.id) AS subcategories_count
FROM categories c
LEFT JOIN ads a ON c.id = a.category_id
LEFT JOIN subcategories sc ON c.id = sc.category_id
GROUP BY c.id, c.name, c.display_name, c.icon;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Categorías: lectura pública, escritura solo admin
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Only admins can modify categories" ON categories FOR ALL
  USING (auth.jwt()->>'role' IN ('admin', 'superadmin'));

-- Similar para otras tablas...

```

---

## 6. API DESIGN

### 🔌 Endpoints Principales

```typescript
// =====================================================
// CATEGORIES API
// =====================================================

/**
 * GET /api/categories
 * Obtener todas las categorías con estadísticas
 */
interface GetCategoriesResponse {
  categories: {
    id: string;
    name: string;
    displayName: string;
    icon: string;
    adsCount: number;
    subcategories: {
      id: string;
      name: string;
      displayName: string;
      adsCount: number;
    }[];
  }[];
}

/**
 * GET /api/categories/:id/form
 * Obtener formulario dinámico para una categoría/subcategoría/tipo
 */
interface GetFormResponse {
  template: {
    id: string;
    name: string;
    displayName: string;
    isMultiStep: boolean;
    sections: FormSection[];
  };
  fields: FormField[];
  preloadedData: {
    brands?: Brand[];
    models?: Model[];
    years?: number[];
    // ... más datos precargados
  };
  mlConfig: {
    enabled: boolean;
    features: {
      autocomplete: boolean;
      validation: boolean;
      enrichment: boolean;
    };
  };
}

// =====================================================
// ML API
// =====================================================

/**
 * POST /api/ml/categorize
 * Categorización automática basada en texto
 */
interface CategorizeRequest {
  text: string; // Título + descripción
  images?: string[]; // URLs de imágenes
}

interface CategorizeResponse {
  confidence: number;
  suggestions: {
    category: string;
    categoryId: string;
    subcategory?: string;
    subcategoryId?: string;
    type?: string;
    typeId?: string;
    brand?: string;
    brandId?: string;
    model?: string;
    modelId?: string;
    year?: number;
    keywords: string[];
    reasoning: string;
  };
}

/**
 * POST /api/ml/autocomplete
 * Autocomplete inteligente
 */
interface AutocompleteRequest {
  field: string; // ej: "brand"
  query: string; // texto parcial
  context: {
    categoryId?: string;
    subcategoryId?: string;
  };
}

interface AutocompleteResponse {
  suggestions: {
    value: string;
    displayText: string;
    confidence: number;
    metadata?: any;
  }[];
  didYouMean?: string;
}

/**
 * POST /api/ml/validate
 * Validación inteligente de campos
 */
interface ValidateRequest {
  categoryId: string;
  fields: Record<string, any>;
}

interface ValidateResponse {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    suggestedValue?: any;
  }[];
  warnings: {
    field: string;
    message: string;
    suggestedValue?: any;
  }[];
}

/**
 * POST /api/ml/enrich
 * Enriquecimiento automático desde imágenes
 */
interface EnrichRequest {
  images: string[];
  category?: string;
  existingData?: Record<string, any>;
}

interface EnrichResponse {
  detectedData: {
    brand?: string;
    model?: string;
    year?: number;
    condition?: string;
    features?: string[];
  };
  suggestedTitle: string;
  suggestedDescription: string;
  confidence: number;
}

/**
 * POST /api/ml/suggest-price
 * Sugerencia inteligente de precio
 */
interface SuggestPriceRequest {
  categoryId: string;
  brandId?: string;
  modelId?: string;
  year?: number;
  condition?: string;
  province?: string;
  features?: Record<string, any>;
}

interface SuggestPriceResponse {
  suggestedPrice: number;
  currency: string;
  confidence: number;
  marketAnalysis: {
    min: number;
    avg: number;
    max: number;
    median: number;
    similarAdsCount: number;
  };
  priceFactors: {
    factor: string;
    impact: string; // ej: "+10%"
    reason: string;
  }[];
}

/**
 * POST /api/ml/check-duplicates
 * Detección de duplicados
 */
interface CheckDuplicatesRequest {
  title: string;
  description: string;
  images?: string[];
  brandId?: string;
  modelId?: string;
}

interface CheckDuplicatesResponse {
  isDuplicate: boolean;
  confidence: number;
  similarAds: {
    id: string;
    title: string;
    similarity: number;
    reason: string;
  }[];
}

// =====================================================
// ADS API
// =====================================================

/**
 * POST /api/ads
 * Crear aviso (con ML integrado)
 */
interface CreateAdRequest {
  // Categorización (puede ser sugerida por ML)
  categoryId: string;
  subcategoryId?: string;
  categoryTypeId?: string;
  
  // Datos básicos
  title: string;
  description: string;
  price?: number;
  currency?: string;
  
  // Ubicación
  province?: string;
  city?: string;
  
  // Referencias
  brandId?: string;
  modelId?: string;
  year?: number;
  condition?: string;
  
  // Imágenes
  images: string[];
  
  // Campos dinámicos
  dynamicFields: Record<string, any>;
  
  // Features
  tags?: string[];
  featured?: boolean;
  
  // Contacto
  contactPhone?: string;
  contactEmail?: string;
  
  // ML Features
  mlEnrich?: boolean; // Auto-enriquecer con ML
  mlValidate?: boolean; // Validar con ML
}

interface CreateAdResponse {
  ad: Ad;
  mlAnalysis?: {
    qualityScore: number;
    suggestions: string[];
    enrichedData: any;
  };
  warnings?: string[];
}

/**
 * GET /api/ads/search
 * Búsqueda inteligente con ML
 */
interface SearchAdsRequest {
  query?: string; // Búsqueda semántica
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
  province?: string;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  
  // ML Features
  semanticSearch?: boolean; // Usar vector search
  fuzzyMatch?: boolean; // Búsqueda difusa
  
  // Pagination
  page?: number;
  limit?: number;
  
  // Sorting
  sortBy?: 'relevance' | 'price' | 'date' | 'views';
  sortOrder?: 'asc' | 'desc';
}

interface SearchAdsResponse {
  ads: Ad[];
  total: number;
  page: number;
  limit: number;
  filters: {
    availableBrands: { id: string; name: string; count: number }[];
    availableProvinces: { name: string; count: number }[];
    priceRange: { min: number; max: number };
  };
  mlInsights?: {
    didYouMean?: string;
    relatedSearches?: string[];
  };
}

// =====================================================
// ADMIN API
// =====================================================

/**
 * POST /api/admin/categories
 * CRUD de categorías (solo admin)
 */
interface CreateCategoryRequest {
  name: string;
  displayName: string;
  slug: string;
  icon?: string;
  description?: string;
  mlKeywords?: string[];
}

/**
 * POST /api/admin/forms/builder
 * Form Builder (drag & drop)
 */
interface CreateFormTemplateRequest {
  name: string;
  displayName: string;
  categoryId?: string;
  subcategoryId?: string;
  categoryTypeId?: string;
  isMultiStep: boolean;
  sections: {
    name: string;
    displayName: string;
    sortOrder: number;
    fields: {
      name: string;
      displayName: string;
      fieldType: string;
      isRequired: boolean;
      validationRules: any;
      dataSource?: string;
      mlFeatures?: {
        autocomplete: boolean;
        validation: boolean;
        suggestions: boolean;
      };
    }[];
  }[];
}

/**
 * POST /api/admin/brands
 * Gestión de marcas
 */
interface CreateBrandRequest {
  name: string;
  displayName: string;
  slug: string;
  categoryId?: string;
  logoUrl?: string;
  website?: string;
  mlAliases?: string[]; // Variaciones del nombre
}

/**
 * POST /api/admin/ml/train
 * Entrenar modelo con nuevos datos
 */
interface TrainMLRequest {
  dataType: string; // brand_aliases, category_keywords, etc.
  trainingData: {
    input: string;
    expectedOutput: any;
  }[];
}

```

---

## 7. PLAN DE IMPLEMENTACIÓN

### 📅 Roadmap Completo

#### **FASE 1: Foundation (Semana 1-2)**
```
✅ Backend Setup
  ├─ Migración BD completa (schema V2)
  ├─ Setup Next.js 14 + tRPC
  ├─ Integración Supabase + pgvector
  ├─ Setup Redis para caching
  └─ CI/CD pipeline

✅ ML Integration Básica
  ├─ Integración Gemini 2.0 Flash
  ├─ Service layer para ML
  ├─ API endpoints básicos
  └─ Testing framework
```

#### **FASE 2: Categories & Forms (Semana 3-4)**
```
✅ CRUD Admin de Categorías
  ├─ Panel de categorías
  ├─ Panel de subcategorías
  ├─ Panel de tipos
  └─ Sincronización automática

✅ Form Builder
  ├─ Drag & drop interface
  ├─ Field configuration
  ├─ Preview en tiempo real
  └─ Versionado de formularios

✅ Data Preloading
  ├─ Gestión de marcas
  ├─ Gestión de modelos
  ├─ Relaciones M2M
  └─ Import/Export masivo
```

#### **FASE 3: ML Features (Semana 5-6)**
```
✅ Auto-Categorización
  ├─ Text analysis con Gemini
  ├─ Image recognition
  ├─ Confidence scoring
  └─ Manual override

✅ Autocomplete Inteligente
  ├─ Fuzzy search
  ├─ Typo correction
  ├─ Context-aware suggestions
  └─ Caching agresivo

✅ Validación en Tiempo Real
  ├─ Range validation
  ├─ Cross-field validation
  ├─ ML-based anomaly detection
  └─ User feedback loop
```

#### **FASE 4: Frontend Mobile-First (Semana 7-8)**
```
✅ Design System
  ├─ TailwindCSS + shadcn/ui
  ├─ Mobile components
  ├─ Responsive layouts
  └─ Dark mode

✅ Smart Form UI
  ├─ Multi-step wizard
  ├─ Progress indicator
  ├─ Auto-save
  └─ Inline validation

✅ Image Upload
  ├─ Multi-upload with preview
  ├─ Drag & drop
  ├─ Auto-compression
  └─ ML analysis en upload
```

#### **FASE 5: Advanced ML (Semana 9-10)**
```
✅ Enrichment Pipeline
  ├─ Image-to-text extraction
  ├─ Auto-title generation
  ├─ Auto-description generation
  └─ Feature detection

✅ Pricing Intelligence
  ├─ Market analysis
  ├─ Price suggestion
  ├─ Price trends
  └─ Competitor monitoring

✅ Duplicate Detection
  ├─ Text similarity
  ├─ Image similarity
  ├─ User notification
  └─ Auto-merge suggestions
```

#### **FASE 6: Optimization & Analytics (Semana 11-12)**
```
✅ Performance
  ├─ Edge caching
  ├─ Database optimization
  ├─ Image CDN
  └─ Lazy loading

✅ Analytics
  ├─ ML predictions tracking
  ├─ User behavior analytics
  ├─ A/B testing framework
  └─ Dashboard de métricas

✅ Training Loop
  ├─ User corrections → training data
  ├─ Auto-retraining
  ├─ Model versioning
  └─ Rollback capability
```

---

## 9. DISEÑO FRONTEND MANTENIDO

### 🎨 Mantener Diseño Actual - Zero UI Breaking Changes

**Objetivo:** Toda la mejora es BACKEND. El frontend mantiene exactamente el mismo diseño que ya funciona.

```
┌─────────────────────────────────────────────────────────────┐
│              ❌ NO CAMBIAR:                                  │
├─────────────────────────────────────────────────────────────┤
│  ✅ Cards de Avisos (ProductCard.tsx)                       │
│  ✅ Página de Resultados (ResultsPage.tsx)                  │
│  ✅ Página de Detalle (AdDetailPage.tsx)                    │
│  ✅ Homepage (HomePage.tsx)                                 │
│  ✅ Buscador Principal (SearchBar.tsx)                      │
│  ✅ Header y Footer                                         │
│  ✅ Filtros Sidebar (FilterSidebar.tsx)                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              ✅ SOLO MEJORAR INTERNAMENTE:                   │
├─────────────────────────────────────────────────────────────┤
│  🔄 AdForm.tsx → Conectar con catálogo maestro             │
│  🔄 SearchBar.tsx → Agregar autocomplete inteligente       │
│  🔄 Backend calls → Usar nuevas APIs                        │
└─────────────────────────────────────────────────────────────┘
```

### 📦 Componentes Actuales Mantenidos

#### 1. **ProductCard.tsx** (Card de Aviso)
```tsx
// ✅ MANTENER TAL CUAL
// Solo recibe más datos estructurados del backend

interface ProductCardProps {
  product: {
    id: string;
    title: string; // ← Ahora puede venir auto-generado
    description: string; // ← Descripción rica del catálogo
    price: number;
    currency: string;
    location: string;
    imageUrl: string; // ← Imágenes de calidad del catálogo
    category: string;
    subcategory: string;
    brand?: string; // ← Ahora siempre estructurado
    model?: string; // ← Ahora con ficha técnica
    year?: number;
    condition?: string;
    // ... resto igual
  };
}

// El componente renderiza IGUAL, pero con mejor calidad de datos
```

#### 2. **AdDetailPage.tsx** (Página de Detalle)
```tsx
// ✅ MANTENER DISEÑO ACTUAL
// Agregar nueva sección opcional: "Especificaciones Técnicas"

<AdDetailPage>
  {/* Todo el layout actual se mantiene */}
  <ImageGallery /> {/* ← Misma UI */}
  <AdTitle /> {/* ← Mismo estilo */}
  <AdPrice /> {/* ← Mismo formato */}
  <AdDescription /> {/* ← Mismo layout */}
  
  {/* ✨ NUEVO: Solo si el modelo tiene ficha técnica */}
  {hasSpecifications && (
    <SpecificationsSection>
      <Accordion title="Especificaciones Técnicas">
        {/* Tabla expandible con specs del catálogo */}
        <SpecsTable data={model.specifications} />
      </Accordion>
    </SpecificationsSection>
  )}
  
  <SellerInfo /> {/* ← Mismo diseño */}
  <ContactForm /> {/* ← Mismo modal */}
</AdDetailPage>
```

#### 3. **HomePage.tsx** (Homepage)
```tsx
// ✅ MANTENER TODO EL DISEÑO ACTUAL
// El hero, las categorías, los featured ads, todo igual

<HomePage>
  <HeroSection>
    <SearchBar /> {/* ← Mismo diseño, internamente más inteligente */}
  </HeroSection>
  
  <CategoriesSection>
    {/* Grid de categorías - mismo diseño */}
  </CategoriesSection>
  
  <FeaturedAdsCarousel>
    {/* Carousel - mismo diseño */}
  </FeaturedAdsCarousel>
  
  <BannersSection>
    {/* Banners - mismo sistema */}
  </BannersSection>
</HomePage>
```

#### 4. **SearchBar.tsx** (Buscador Principal)
```tsx
// ✅ MANTENER DISEÑO VISUAL
// Agregar autocomplete inteligente DEBAJO del input

<SearchBar>
  <Input
    placeholder="¿Qué estás buscando?"
    value={query}
    onChange={handleChange} // ← Ahora con debounce para IA
  />
  
  {/* ✨ NUEVO: Autocomplete con IA (dropdown debajo) */}
  {query && suggestions.length > 0 && (
    <AutocompleteDropdown>
      {suggestions.map(suggestion => (
        <SuggestionItem
          key={suggestion.id}
          onClick={() => selectSuggestion(suggestion)}
        >
          {/* Icon de categoría */}
          <CategoryIcon icon={suggestion.category} />
          
          {/* Texto de sugerencia */}
          <div>
            <span className="font-medium">{suggestion.brand} {suggestion.model}</span>
            <span className="text-gray-500 text-sm">en {suggestion.category}</span>
          </div>
          
          {/* Badge de confianza */}
          {suggestion.confidence > 0.9 && (
            <Badge variant="success">Exacto</Badge>
          )}
        </SuggestionItem>
      ))}
    </AutocompleteDropdown>
  )}
</SearchBar>

// Ejemplo de sugerencias:
// Usuario escribe: "tractor john"
// Sugerencias:
// → 🚜 John Deere 5075E en Tractores ✓ Exacto
// → 🚜 John Deere 6110D en Tractores
// → 🚜 John Deere 5090E en Tractores
```

#### 5. **ResultsPage.tsx** (Página de Resultados)
```tsx
// ✅ MANTENER LAYOUT COMPLETO
// Grid de resultados + filtros sidebar - TODO IGUAL

<ResultsPage>
  <Sidebar>
    <FilterSidebar
      categories={categories} // ← Desde nueva API
      brands={brands} // ← Lista estructurada del catálogo
      provinces={provinces}
      priceRange={priceRange}
      // ... mismo componente, mismos filtros
    />
  </Sidebar>
  
  <MainContent>
    <ResultsHeader>
      {/* Breadcrumb, ordenamiento, vista grid/list */}
      {/* ← Todo igual */}
    </ResultsHeader>
    
    <ResultsGrid>
      {/* Grid de ProductCards */}
      {/* ← Mismo layout responsive */}
      {ads.map(ad => (
        <ProductCard key={ad.id} product={ad} />
      ))}
    </ResultsGrid>
    
    <Pagination />
  </MainContent>
</ResultsPage>
```

### 🔄 AdForm.tsx - ÚNICA MEJORA VISIBLE

**Antes:**
```tsx
// Usuario llenaba TODO manualmente

<AdForm>
  <Input label="Categoría" /> {/* Select hardcodeado */}
  <Input label="Marca" /> {/* Text libre → typos */}
  <Input label="Modelo" /> {/* Text libre → inconsistencias */}
  <Input label="Año" /> {/* Number libre */}
  <Input label="Potencia HP" /> {/* Text libre */}
  <Input label="Título" /> {/* Text libre */}
  <Textarea label="Descripción" /> {/* Textarea vacío */}
  {/* 20+ campos más... */}
</AdForm>
```

**Después (CON CATÁLOGO MAESTRO):**
```tsx
<AdForm>
  
  {/* Paso 1: Categorización */}
  <FormStep title="¿Qué estás vendiendo?">
    <CategorySelector
      categories={categoriesFromDB} // ← Desde BD, no hardcodeado
      onSelect={handleCategorySelect}
    />
  </FormStep>
  
  {/* Paso 2: Subcategoría */}
  <FormStep title="Especifica el tipo">
    <SubcategorySelector
      subcategories={subcategoriesFromDB}
      onSelect={handleSubcategorySelect}
    />
  </FormStep>
  
  {/* Paso 3: Marca y Modelo (MAGIA AQUÍ) */}
  <FormStep title="Marca y Modelo">
    {/* Brands desde catálogo maestro */}
    <Select
      label="Marca"
      options={brandsFromDB} // ← Lista precargada
      value={selectedBrand}
      onChange={handleBrandChange}
      searchable
    />
    
    {/* Models desde catálogo maestro */}
    {selectedBrand && (
      <Select
        label="Modelo"
        options={modelsFromDB} // ← Modelos de esa marca
        value={selectedModel}
        onChange={handleModelChange}
        searchable
      />
    )}
    
    {/* ✨ AL SELECCIONAR MODELO: AUTO-FILL */}
    {selectedModel && (
      <Alert variant="success" className="mt-4">
        <CheckCircle className="mr-2" />
        <div>
          <p className="font-medium">¡Ficha técnica cargada!</p>
          <p className="text-sm">
            Hemos pre-llenado {autoFilledFieldsCount} campos con información del modelo.
          </p>
        </div>
      </Alert>
    )}
  </FormStep>
  
  {/* Paso 4: Detalles específicos (PRE-LLENADOS) */}
  <FormStep title="Detalles del aviso">
    
    {/* Campo año - limitado por los años de producción del modelo */}
    <Select
      label="Año"
      options={yearRange} // ← 2015-2024 si es John Deere 5075E
      value={year}
    />
    
    {/* Título - SUGERIDO por IA */}
    <Input
      label="Título"
      value={suggestedTitle} // ← "Tractor John Deere 5075E 2020 - 75 HP 4x4"
      helperText="Título sugerido basado en el modelo. Puedes editarlo."
    />
    
    {/* Descripción - PRE-LLENADA */}
    <Textarea
      label="Descripción"
      value={suggestedDescription} // ← Descripción completa del catálogo
      rows={8}
      helperText="Descripción generada automáticamente. Agrégale tus detalles personales."
    />
    
    {/* Specs técnicas - PRE-LLENADAS (solo lectura / editables) */}
    {hasSpecifications && (
      <Card className="bg-blue-50">
        <CardHeader>
          <InfoIcon className="mr-2" />
          <h4>Especificaciones del modelo (precargadas)</h4>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Potencia"
              value={`${specs.engine.power_hp} HP`}
              disabled
            />
            <Input
              label="Tracción"
              value={specs.tires.traction}
              disabled
            />
            <Input
              label="Transmisión"
              value={specs.transmission.type}
              disabled
            />
            {/* ... más specs */}
          </div>
        </CardContent>
      </Card>
    )}
    
    {/* Condición */}
    <Select
      label="Condición"
      options={["Nuevo", "Usado - Excelente", "Usado - Bueno", "Usado - Regular"]}
      value={condition}
    />
    
    {/* Precio */}
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Precio"
        type="number"
        value={price}
        prefix="$"
      />
      
      {/* Rango de precio del mercado (referencia) */}
      {priceRange && (
        <div className="text-sm text-gray-600 pt-8">
          <p>💡 Rango de mercado para este modelo:</p>
          <p className="font-medium">${priceRange.min.toLocaleString()} - ${priceRange.max.toLocaleString()}</p>
        </div>
      )}
    </div>
    
  </FormStep>
  
  {/* Paso 5: Imágenes */}
  <FormStep title="Fotos">
    <ImageUpload
      maxImages={8}
      onUpload={handleImageUpload}
    />
    
    {/* Opcional: Sugerir imágenes del catálogo como referencia */}
    {model.gallery_images && (
      <div className="mt-4">
        <h5>Imágenes de referencia del modelo</h5>
        <div className="grid grid-cols-4 gap-2">
          {model.gallery_images.map(img => (
            <img src={img} className="rounded" />
          ))}
        </div>
      </div>
    )}
  </FormStep>
  
  {/* Paso 6: Confirmación */}
  <FormStep title="Revisar y publicar">
    <PreviewCard ad={adPreview} />
    
    <Button
      size="lg"
      variant="primary"
      onClick={handlePublish}
    >
      ✅ Publicar Aviso
    </Button>
  </FormStep>
  
</AdForm>
```

### 📊 Comparación: Antes vs Después

```
┌─────────────────────────────────────────────────────────────┐
│                    ANTES (Manual)                            │
├─────────────────────────────────────────────────────────────┤
│  Usuario llena:        25 campos                            │
│  Tiempo promedio:      8-12 minutos                         │
│  Typos/Errores:        40% de avisos                        │
│  Datos incompletos:    60% de avisos                        │
│  Búsquedas fallidas:   35% por inconsistencias              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              DESPUÉS (Con Catálogo Maestro)                  │
├─────────────────────────────────────────────────────────────┤
│  Usuario llena:        5-8 campos (resto auto-completado)  │
│  Tiempo promedio:      2-3 minutos                          │
│  Typos/Errores:        0% (datos estructurados)            │
│  Datos completos:      95% de avisos                        │
│  Búsquedas exitosas:   98% por consistencia                │
└─────────────────────────────────────────────────────────────┘
```

### 🎯 Resumen: Lo que el Usuario Ve

```
✅ IGUAL: Todo el diseño visual (colores, layouts, componentes)
✅ IGUAL: Navegación y estructura de páginas
✅ IGUAL: Homepage, resultados, cards, detalle

✨ MEJOR: Formulario de alta mucho más rápido
✨ MEJOR: Búsquedas más precisas y rápidas
✨ MEJOR: Avisos con más información técnica
✨ MEJOR: Sugerencias inteligentes al buscar

❌ NO CAMBIAR: Diseño, colores, tipografía, spacing
❌ NO CAMBIAR: Flujos de usuario establecidos
❌ NO CAMBIAR: Componentes UI que ya funcionan
```

---

## 10. FRONTEND MOBILE-FIRST 2026

### 🎨 Principios de Diseño (para Admin Panel)

#### 8.1. Mobile-First Approach
```
📱 Mobile (320-768px)
  ├─ Single column
  ├─ Stack layout
  ├─ Bottom navigation
  ├─ Full-width forms
  └─ Touch-optimized (48px min)

💻 Tablet (768-1024px)
  ├─ Two columns
  ├─ Sidebar navigation
  └─ Compact forms

🖥️ Desktop (1024px+)
  ├─ Three columns
  ├─ Advanced filters
  └─ Multi-pane layout
```

#### 8.2. Progressive Disclosure
```
Paso 1: ¿Qué vendes?
  └─ Solo categoría (3 opciones visibles)
  
Paso 2: Especifica
  └─ Subcategoría + Tipo (condicional)
  
Paso 3: Detalles básicos
  └─ Título, descripción, precio
  
Paso 4: Especificaciones
  └─ Campos dinámicos (según categoría)
  
Paso 5: Imágenes
  └─ Upload con análisis ML
  
Paso 6: Revisión
  └─ Preview + confirmar
```

#### 8.3. Componentes Clave

```typescript
// Smart Autocomplete
<SmartAutocomplete
  field="brand"
  context={{ categoryId: 'maquinarias' }}
  mlEnabled={true}
  placeholder="Empieza a escribir..."
  onSelect={(brand) => {
    // Auto-load modelos
    loadModels(brand.id);
  }}
/>

// ML Suggestion Card
<MLSuggestionCard
  type="category"
  confidence={0.95}
  suggestion={{
    category: "Maquinarias",
    subcategory: "Tractores",
    brand: "John Deere",
    model: "5075E"
  }}
  onAccept={acceptSuggestion}
  onReject={rejectSuggestion}
/>

// Image Upload con ML
<SmartImageUpload
  onUpload={(files) => {
    // Auto-analyze con ML
    analyzeImages(files);
  }}
  onAnalysisComplete={(enrichment) => {
    // Auto-fill form
    setFieldsFromML(enrichment);
  }}
/>

// Real-time Validation
<SmartInput
  field="year"
  value={year}
  onChange={setYear}
  mlValidate={true}
  onValidation={(result) => {
    if (!result.isValid) {
      showWarning(result.message);
      suggestCorrection(result.suggestedValue);
    }
  }}
/>
```

#### 8.4. UX Patterns 2026

```
✨ Micro-interactions
  ├─ Haptic feedback (mobile)
  ├─ Smooth animations (Framer Motion)
  ├─ Loading skeletons
  └─ Success celebrations

🎯 Smart Defaults
  ├─ Auto-detect ubicación (geolocation)
  ├─ Pre-fill user data
  ├─ Remember last selections
  └─ ML suggestions

💬 Contextual Help
  ├─ Inline tooltips
  ├─ Progressive onboarding
  ├─ ML-powered suggestions
  └─ Chatbot assistant

🚀 Performance
  ├─ < 100ms interaction latency
  ├─ < 2s initial load
  ├─ Optimistic UI updates
  └─ Offline support (PWA)
```

---

## 📊 KPIs y Métricas de Éxito

### Backend ML
```
✅ Categorization Accuracy: > 95%
✅ Autocomplete Relevance: > 90%
✅ API Response Time: < 200ms (p95)
✅ ML Prediction Time: < 500ms
✅ Cache Hit Rate: > 80%
```

### User Experience
```
✅ Form Completion Rate: > 80% (actual: ~50%)
✅ Time to Publish: < 3 min (actual: ~10 min)
✅ User Corrections: < 10% (ML accuracy)
✅ Mobile Bounce Rate: < 30%
✅ NPS Score: > 70
```

### Data Quality
```
✅ Duplicate Ads: < 2% (actual: ~15%)
✅ Complete Profiles: > 90% (actual: ~60%)
✅ Image Quality: > 85% HD
✅ Pricing Accuracy: ±15% market value
```

---

## 🎯 Siguiente Paso Inmediato

### 1. **Ejecutar Migraciones**
```bash
# En Supabase SQL Editor
1. Ejecutar schema completo (sección 5)
2. Verificar todas las tablas creadas
3. Seed inicial de categorías
```

### 2. **Setup ML Service**
```bash
# Crear servicio ML
/server/services/mlService.ts

# Integrar Gemini 2.0 Flash
VITE_GEMINI_API_KEY=tu_api_key

# Test básico
curl /api/ml/categorize -d '{"text": "Tractor John Deere 5075E"}'
```

### 3. **Admin Panel**
```bash
# Crear CRUD de categorías
/src/components/admin/CategoriesManager.tsx

# Sincronizar con BD en tiempo real
```

---

## 📚 Recursos y Documentación

### ML/AI
- [Gemini 2.0 Flash API](https://ai.google.dev/gemini-api/docs)
- [OpenAI GPT-4o](https://platform.openai.com/docs)
- [Supabase pgvector](https://supabase.com/docs/guides/ai)
- [TensorFlow.js](https://www.tensorflow.org/js)

### Frontend
- [Next.js 14](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [TailwindCSS](https://tailwindcss.com/)

### Backend
- [tRPC](https://trpc.io/)
- [Zod](https://zod.dev/)
- [Supabase](https://supabase.com/docs)
- [Redis](https://redis.io/docs/)

---

## ✅ Checklist de Implementación

```
Backend Foundation:
[ ] Migración BD completa ejecutada
[ ] pgvector habilitado
[ ] Redis configurado
[ ] Next.js + tRPC setup
[ ] Gemini API integrada

Data Layer:
[ ] CRUD categorías funcional
[ ] CRUD marcas/modelos funcional
[ ] Form templates funcionando
[ ] Seed data inicial

ML Features:
[ ] Auto-categorización working
[ ] Autocomplete working
[ ] Validación en tiempo real
[ ] Image analysis working

Frontend:
[ ] Design system implementado
[ ] Form wizard multi-step
[ ] Mobile-first responsive
[ ] Smart components

Testing:
[ ] Unit tests (>80% coverage)
[ ] Integration tests
[ ] E2E tests (Playwright)
[ ] Performance tests

Production:
[ ] CI/CD pipeline
[ ] Monitoring (Sentry)
[ ] Analytics (PostHog)
[ ] Documentation completa
```

---

## 🎯 RESUMEN EJECUTIVO: SISTEMA DE CATÁLOGO MAESTRO

### Qué es?

Un **sistema de biblioteca de información precargada** donde cada Categoría → Subcategoría → Marca → Modelo tiene su ficha técnica completa almacenada en la base de datos.

### Cómo funciona?

```
1️⃣ ADMIN carga fichas técnicas (1 vez)
   ├─ Usa IA para buscar y extraer especificaciones
   ├─ Guarda en BD: especificaciones + imágenes + documentos
   └─ Verifica y aprueba

2️⃣ USUARIO publica aviso (infinitas veces)
   ├─ Selecciona: Categoría → Subcategoría → Marca → Modelo
   ├─ Sistema AUTO-COMPLETA todo desde la ficha técnica
   ├─ Usuario solo ajusta: año, precio, condición, fotos
   └─ Publica en < 2 minutos

3️⃣ BÚSQUEDAS se benefician
   ├─ Datos estructurados = búsquedas precisas
   ├─ Sin typos, sin inconsistencias
   └─ Filtros confiables
```

### Ejemplo Real: John Deere 5075E

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN (Setup inicial - 1 vez)                              │
├─────────────────────────────────────────────────────────────┤
│  1. Crea marca: "John Deere"                                │
│  2. Crea modelo: "5075E"                                    │
│  3. Click "🤖 Buscar con IA"                                │
│  4. IA encuentra y extrae:                                  │
│     ├─ 60+ especificaciones técnicas                        │
│     ├─ 8 imágenes oficiales                                 │
│     ├─ Descripción completa                                 │
│     ├─ Brochure PDF                                         │
│     └─ Rango de precios                                     │
│  5. Admin revisa y aprueba                                  │
│  6. ✅ Guardado en BD                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  USUARIO 1 (Vende su tractor)                               │
├─────────────────────────────────────────────────────────────┤
│  1. Selecciona: Maquinarias → Tractores                    │
│  2. Selecciona: John Deere                                  │
│  3. Selecciona: 5075E                                       │
│  4. ✨ MAGIA: Todo se auto-completa:                        │
│     ├─ Título: "Tractor John Deere 5075E..."               │
│     ├─ Descripción: 3 párrafos ya escritos                 │
│     ├─ Especificaciones: 60 campos llenos                   │
│     ├─ Imágenes de referencia disponibles                   │
│     └─ Rango de precio sugerido                             │
│  5. Usuario ajusta:                                         │
│     ├─ Año: 2020                                            │
│     ├─ Precio: $38,000 USD                                  │
│     ├─ Condición: "Usado - Excelente"                       │
│     ├─ Sube 6 fotos reales                                  │
│     └─ Agrega detalles: "1,500 horas, siempre galpón"      │
│  6. Click "Publicar"                                        │
│  7. ✅ Aviso publicado en 2 minutos                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  USUARIO 2, 3, 4... (Siguientes vendedores)                │
├─────────────────────────────────────────────────────────────┤
│  → Mismo proceso, misma velocidad                           │
│  → Todos los avisos de "5075E" tienen datos consistentes   │
│  → Búsquedas y comparaciones funcionan perfecto            │
└─────────────────────────────────────────────────────────────┘
```

### Por qué NO es ML tradicional?

```
❌ ML Tradicional:
   ├─ Entrenar modelos con datasets
   ├─ Predecir categorías con probabilidades
   ├─ Requiere miles de ejemplos
   └─ Complejo de mantener

✅ "ML Artesanal" (Catálogo Maestro):
   ├─ IA solo para BUSCAR y EXTRAER datos
   ├─ Datos se guardan estructurados en BD
   ├─ Usuario selecciona (no predice)
   └─ Simple, confiable, escalable
```

### Ventajas para Agrobuscador

```
🚀 Para Usuarios:
   ├─ Publicar en 2 min vs 10 min
   ├─ No más frustraciones con formularios largos
   ├─ Sugerencias inteligentes
   └─ Avisos de calidad profesional

📊 Para el Negocio:
   ├─ Datos estructurados = mejores búsquedas
   ├─ Consistencia = mejor UX = más ventas
   ├─ Diferenciación vs competencia
   └─ Base para futuros features (comparador, alertas, etc.)

🔧 Para Desarrollo:
   ├─ Sistema escalable y mantenible
   ├─ Agregar categorías sin código
   ├─ Admin controla todo el catálogo
   └─ Testing más fácil (datos predecibles)
```

### Categorías Completas a Implementar

```
✅ Fase 1 (MVP): MAQUINARIAS
   ├─ 15 subcategorías
   ├─ ~50 marcas principales
   ├─ ~500 modelos top
   └─ Estimado: 2-3 semanas con IA

✅ Fase 2: GANADERÍA
   ├─ 7 subcategorías
   ├─ Razas principales
   └─ Estimado: 1 semana

✅ Fase 3: INSUMOS
   ├─ 6 subcategorías
   ├─ Marcas principales
   └─ Estimado: 1 semana

✅ Fase 4: INMUEBLES RURALES
   ├─ 7 tipos
   ├─ Datos geo estructurados
   └─ Estimado: 1 semana

✅ Fase 5: GUÍA DEL CAMPO
   ├─ 10 tipos de servicios
   ├─ Formularios específicos
   └─ Estimado: 1 semana
```

### ROI Estimado

```
⏱️ Tiempo de Admin Setup:
   ├─ Por marca: 5-10 min (con IA)
   ├─ Por modelo: 2-5 min (con IA)
   └─ Total fase 1: ~40 horas (1 admin)

💰 Beneficio Usuario:
   ├─ Ahorro por aviso: 8 minutos
   ├─ 100 avisos/día: 800 min = 13.3 hrs
   ├─ 1 mes: ~400 horas ahorradas
   └─ ROI: 10x en el primer mes

📈 Calidad de Datos:
   ├─ Antes: 40% avisos con errores
   ├─ Después: <5% avisos con errores
   └─ Mejora: 88% en calidad
```

### Stack Técnico Resumido

```
Backend:
├─ PostgreSQL (Supabase)
├─ JSONB para especificaciones flexibles
├─ pgvector para búsquedas semánticas (futuro)
└─ RLS policies para seguridad

IA/ML:
├─ Google Gemini 2.0 Flash (buscar y extraer)
├─ Gemini Vision (PDFs y fotos)
├─ OpenAI GPT-4o (fallback)
└─ Web scraping inteligente

Frontend:
├─ React + TypeScript (actual)
├─ Mantener diseño existente
├─ Mejorar solo AdForm
└─ Agregar autocomplete inteligente

Admin Panel:
├─ CRUD completo de categorías/marcas/modelos
├─ IA Assistant integrado
├─ Preview en tiempo real
└─ Bulk import/export
```

### Próximos Pasos Concretos

```
1️⃣ Ejecutar Migración BD (Sección 6)
   └─ Tiempo: 30 min

2️⃣ Seed Categorías Iniciales (Maquinarias)
   └─ Tiempo: 1 hora

3️⃣ Admin Panel - CRUD Modelos
   └─ Tiempo: 2-3 días

4️⃣ IA Service Integration
   └─ Tiempo: 2-3 días

5️⃣ AdForm Update (conectar con catálogo)
   └─ Tiempo: 2-3 días

6️⃣ Testing + Ajustes
   └─ Tiempo: 1 semana

TOTAL: ~2 semanas para MVP funcional de Maquinarias
```

---

**¿Empezamos con la migración de BD y creamos el primer modelo de prueba (John Deere 5075E)?** 🚀
