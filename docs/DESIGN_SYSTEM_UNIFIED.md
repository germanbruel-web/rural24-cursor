# 🎨 Design System Unificado - AgroBuscador

## 📐 Jerarquía Tipográfica

### Títulos de Sección (H2)
**Uso:** Títulos principales de bloques de contenido
- **Clase:** `text-2xl font-bold text-gray-900`
- **Tamaño:** 24px (1.5rem)
- **Ejemplos:**
  - "Descripción"
  - "Información General"
  - "Características"
  - "Especificaciones Técnicas"

### Subtítulos de Grupo (H3)
**Uso:** Títulos secundarios dentro de secciones
- **Clase:** `text-xl font-bold text-{color}`
- **Tamaño:** 20px (1.25rem)
- **Ejemplos:**
  - Títulos de grupos en componentes dinámicos
  - Headers de cards expandibles

### Labels / Etiquetas
**Uso:** Nombres de campos, atributos, propiedades
- **Clase:** `text-sm font-bold text-gray-600 uppercase tracking-wide`
- **Tamaño:** 14px (0.875rem)
- **Características:** Uppercase + tracking espaciado
- **Ejemplos:**
  - "MARCA"
  - "MODELO"
  - "AÑO DE FABRICACION"
  - "CONDICIÓN"

### Valores / Contenido
**Uso:** Valores de campos, datos del usuario
- **Clase:** `text-base font-bold text-gray-900` o `text-lg font-bold text-gray-900`
- **Tamaño:** 
  - Base: 16px (1rem) - Para valores compactos
  - Large: 18px (1.125rem) - Para valores destacados
- **Ejemplos:**
  - Valores de atributos
  - Datos de información general
  - Características técnicas

### Texto Descriptivo
**Uso:** Párrafos, descripciones largas
- **Clase:** `text-base text-gray-700 leading-relaxed`
- **Tamaño:** 16px (1rem)
- **Ejemplos:**
  - Descripción del producto
  - Textos informativos

### Texto Pequeño
**Uso:** Metadata, ayudas, textos secundarios
- **Clase:** `text-sm text-gray-600`
- **Tamaño:** 14px (0.875rem)
- **Ejemplos:**
  - Contador de características
  - Textos de ayuda
  - Metadata

---

## 🎯 Aplicación por Componente

### AdDetailPage.tsx
```tsx
// Título principal del aviso
<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">

// Sección "Descripción"
<h3 className="text-2xl font-bold text-gray-900 mb-4">

// Sección "Información General"
<h3 className="text-2xl font-bold text-gray-900 mb-4">

// Labels (Marca, Modelo, Año, etc.)
<span className="text-sm font-bold text-gray-600 uppercase tracking-wide">

// Valores de Información General
<span className="text-base font-bold text-gray-900 mt-1">

// Título "Características" (con schema)
<h3 className="text-2xl font-bold text-gray-900 mb-4">

// Labels de atributos dinámicos
<span className="text-sm font-bold text-gray-600 uppercase tracking-wide">

// Valores de atributos dinámicos
<span className="text-lg font-bold text-gray-900 mt-1">
```

### AdDetailDynamic.tsx
```tsx
// Títulos de grupos (Especificaciones Técnicas, etc.)
<h2 className="text-2xl font-bold text-{color}">

// Contador de características
<p className="text-base text-gray-600 mt-1">

// Labels de atributos
<span className="text-sm font-bold text-gray-600 uppercase tracking-wide">

// Valores de atributos
<span className="text-lg font-bold text-gray-900">
```

### PublicarAvisoV3.tsx
```tsx
// Títulos de steps
<h2 className="text-3xl sm:text-4xl font-bold text-gray-900">

// Labels de formulario
<label className="text-base sm:text-lg font-bold text-gray-900">

// Inputs
<input className="px-5 py-5 text-base sm:text-lg">
```

### LivePreviewCard.tsx
```tsx
// Título del preview
<h3 className="text-xl font-bold text-gray-900">

// Precio
<p className="text-2xl font-bold text-green-600">

// Descripción preview
<p className="text-sm text-gray-700 line-clamp-3">
```

---

## 📏 Espaciado Consistente

### Márgenes entre secciones
- **mb-4**: 16px - Entre título y contenido
- **mb-6**: 24px - Entre secciones completas
- **gap-3**: 12px - Entre items en grids
- **gap-y-3**: 12px - Vertical gap en grids

### Padding de contenedores
- **p-4 sm:p-6**: Mobile: 16px, Desktop: 24px
- **px-5 py-5**: Inputs grandes (touch-friendly)

### Espaciado de labels/valores
- **mt-1**: 4px - Entre label y valor

---

## 🎨 Colores Estandarizados

### Textos
- **Títulos principales:** `text-gray-900` (#111827)
- **Labels:** `text-gray-600` (#4B5563)
- **Valores:** `text-gray-900` (#111827)
- **Descriptivos:** `text-gray-700` (#374151)
- **Secundarios:** `text-gray-500` (#6B7280)

### Acentos
- **Verde principal:** `text-green-600` (#16A34A)
- **Verde oscuro:** `text-green-700` (#15803D)
- **Verde destacado:** `text-green-900` (#14532D)

### Iconos
- **Primarios:** `text-green-600` w-5 h-5 o w-6 h-6
- **Secundarios:** `text-gray-400`

---

## ✅ Reglas de Implementación

### DO ✅
- **Usar `text-2xl`** para títulos de sección principales
- **Usar `text-sm`** para labels en UPPERCASE
- **Usar `text-base` o `text-lg`** para valores según importancia
- **Usar `font-bold`** para títulos y valores
- **Usar `mt-1`** entre label y valor
- **Iconos siempre `w-5 h-5` o `w-6 h-6`** según contexto

### DON'T ❌
- ~~`text-xs` para labels principales~~ → Usar `text-sm`
- ~~`text-base` para títulos~~ → Usar `text-2xl`
- ~~`font-semibold` para valores~~ → Usar `font-bold`
- ~~`text-gray-500` para labels~~ → Usar `text-gray-600`
- ~~`mt-0.5` entre label/valor~~ → Usar `mt-1`

---

## 🔄 Migraciones Realizadas

### Cambios aplicados:
1. **Títulos de sección:** `text-base` → `text-2xl`
2. **Labels:** `text-xs` → `text-sm`
3. **Color labels:** `text-gray-500` → `text-gray-600`
4. **Valores:** `text-base` → `text-lg` (atributos destacados)
5. **Iconos:** `w-5 h-5` → `w-6 h-6` (títulos de sección)
6. **Espaciado:** `mt-0.5` → `mt-1` (label-valor)
7. **Margin bottom:** `mb-3` → `mb-4` (títulos)

---

## 📱 Responsive

### Mobile First
- Base sizes en mobile
- `sm:` prefix para tablets (640px+)
- `lg:` prefix para desktop (1024px+)

### Ejemplo:
```tsx
// Mobile: text-base (16px), Desktop: text-lg (18px)
<span className="text-base sm:text-lg">

// Mobile: text-2xl (24px), Desktop: text-3xl (30px)
<h1 className="text-2xl sm:text-3xl">
```

---

## 🚀 Componentes Aplicados

✅ **AdDetailPage.tsx**
✅ **AdDetailDynamic.tsx**
✅ **PublicarAvisoV3.tsx**
✅ **LivePreviewCard.tsx**

---

**Fecha de implementación:** 23 de Diciembre 2025
**Versión:** 1.0
