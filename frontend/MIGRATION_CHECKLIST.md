# 📋 Checklist de Migración por Componente

## 🎯 Cómo Usar Este Checklist

Para cada componente que quieras migrar:
1. Copia la sección correspondiente
2. Marca cada ítem conforme lo completes
3. Testea en todos los breakpoints antes de dar por finalizado
4. Haz commit cuando esté 100% completado

---

## 📄 Template: Migración de Componente

### [Nombre del Componente] 
**Archivo**: `src/components/[ruta]/[nombre].tsx`  
**Prioridad**: ⭐⭐⭐ Alta / ⭐⭐ Media / ⭐ Baja  
**Fase**: 1 / 2 / 3 / 4 / 5  
**Responsable**: [Tu nombre]  
**Fecha inicio**: [DD/MM/YYYY]  
**Fecha fin**: [DD/MM/YYYY]

#### Análisis Previo
- [ ] Revisar componente actual
- [ ] Identificar todos los elementos HTML a migrar
- [ ] Listar props del componente
- [ ] Verificar dependencias (otros componentes usados)
- [ ] Capturar screenshots del estado actual

#### Migración de Elementos
- [ ] `<button>` → `<Button>` del DS
- [ ] `<input>` → `<Input>` del DS  
- [ ] `<label>` → `<Label>` del DS
- [ ] Badges/Pills → `<Badge>` del DS
- [ ] Formularios → `<FormField>` del DS
- [ ] Iconos → Lucide React
- [ ] Colores → Tokens del DS (bg-green-600, text-gray-700, etc)

#### Mobile First
- [ ] Revisar diseño mobile (320px-640px)
- [ ] Layout: `flex flex-col lg:flex-row` (stack mobile → row desktop)
- [ ] Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- [ ] Padding: `px-4 sm:px-6 lg:px-8`
- [ ] Text: `text-base sm:text-lg lg:text-xl`
- [ ] Gaps: `gap-4 sm:gap-6 lg:gap-8`
- [ ] Touch targets: Mínimo 44px de altura en botones

#### Testing
- [ ] **iPhone SE** (375px) - Chrome DevTools
- [ ] **iPhone 12 Pro** (390px) - Chrome DevTools
- [ ] **iPad** (768px) - Chrome DevTools
- [ ] **Desktop** (1280px+) - Navegador real
- [ ] **Dark Mode** - Toggle y verificar
- [ ] **Accesibilidad** - Lighthouse Accessibility Score
- [ ] **Performance** - Lighthouse Performance Score

#### Code Quality
- [ ] ESLint sin errores
- [ ] TypeScript sin errores
- [ ] Props documentadas con JSDoc
- [ ] Componente exportado correctamente
- [ ] Imports organizados (DS components primero)
- [ ] Clases Tailwind ordenadas (layout → spacing → colors → effects)

#### Documentación
- [ ] Agregar comentarios en código
- [ ] Actualizar Storybook (si aplica)
- [ ] Screenshots en MIGRATION_STRATEGY.md
- [ ] Marcar como completo en tabla de estado

#### Deploy
- [ ] Code review aprobado
- [ ] Tests pasando
- [ ] Merge a dev
- [ ] Deploy a staging
- [ ] QA validation
- [ ] Deploy a production

---

## 🔥 Ejemplo Completo: Migración del Header

### Header Component
**Archivo**: `src/components/Header.tsx`  
**Prioridad**: ⭐⭐⭐ Alta  
**Fase**: 1  
**Responsable**: Team Lead  
**Fecha inicio**: 07/01/2026  
**Fecha fin**: 08/01/2026

#### Análisis Previo
- [x] Revisar componente actual
- [x] Identificar elementos: 2 buttons, 1 input search, 5 nav links, 1 dropdown
- [x] Props: `onNavigate: (page) => void`
- [x] Dependencias: AuthModal, useAuth hook
- [x] Screenshots capturados

#### Migración de Elementos
```tsx
// ANTES
<button className="bg-green-600 text-white px-4 py-2 rounded">
  Publicar
</button>

// DESPUÉS
<Button variant="primary" size="md">
  Publicar
</Button>
```

- [x] Botón "Publicar" → `<Button variant="primary">`
- [x] Botón "Login" → `<Button variant="outline">`
- [x] Search input → `<Input leftIcon={<Search />}>`
- [x] User menu → `<Button variant="ghost">` con dropdown
- [x] Mobile menu → Hamburger con `<Button variant="ghost" size="icon">`
- [x] Nav links → `<Button variant="link">`

#### Mobile First
```tsx
// Desktop navigation: Hidden en mobile
<nav className="hidden lg:flex gap-4">

// Mobile menu: Visible solo en mobile
<div className="lg:hidden">
  <Button variant="ghost" size="icon" onClick={toggleMenu}>
    <Menu />
  </Button>
</div>

// Logo: Responsive sizing
<img 
  src="/logo.svg" 
  className="h-8 sm:h-10 lg:h-12"
  alt="Rural24"
/>

// Search: Full width en mobile
<Input
  placeholder="Buscar..."
  wrapperClassName="w-full lg:w-64"
  leftIcon={<Search size={18} />}
/>
```

- [x] Layout: `flex items-center justify-between`
- [x] Desktop nav: `hidden lg:flex`
- [x] Mobile menu: `lg:hidden`
- [x] Logo responsive: `h-8 sm:h-10`
- [x] Search responsive: `w-full lg:w-64`
- [x] Padding: `px-4 sm:px-6 lg:px-8`
- [x] Botones touch-friendly: `size="md"` (mínimo 44px)

#### Testing
- [x] iPhone SE (375px) ✅ - Menu hamburger funciona
- [x] iPhone 12 Pro (390px) ✅ - Logo y botones se ven bien
- [x] iPad (768px) ✅ - Transición a desktop nav
- [x] Desktop (1280px+) ✅ - Full nav visible
- [x] Dark Mode ✅ - Colores correctos
- [x] Lighthouse Accessibility: 95/100 ✅
- [x] Lighthouse Performance: 92/100 ✅

#### Code Quality
- [x] ESLint: 0 errors ✅
- [x] TypeScript: 0 errors ✅
- [x] JSDoc agregado para props
- [x] Export: `export { Header }`
- [x] Imports organizados
- [x] Clases ordenadas

#### Documentación
- [x] Comentarios agregados
- [x] Storybook story creado: `Header.stories.tsx`
- [x] Screenshots en docs/migration/header-before-after.png
- [x] Tabla actualizada en MIGRATION_STRATEGY.md

#### Deploy
- [x] Code review by @senior-dev ✅
- [x] Tests pasando ✅
- [x] Merge a dev #PR123
- [x] Deploy a staging ✅
- [x] QA validation ✅
- [x] Deploy a production 🚀

**Status**: ✅ COMPLETADO

---

## 📦 Checklists Rápidos por Tipo

### ✅ Botón Simple
```tsx
// ANTES
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click
</button>

// DESPUÉS
<Button variant="primary">Click</Button>
```
- [ ] Mapear colores → variants
- [ ] Mapear tamaño → size prop
- [ ] Agregar iconos si aplica
- [ ] Testear estados (hover, disabled, loading)

### ✅ Input de Formulario
```tsx
// ANTES
<div>
  <label>Email</label>
  <input type="email" placeholder="email@ejemplo.com" />
  <span className="text-red-500">Error</span>
</div>

// DESPUÉS
<FormField
  label="Email"
  name="email"
  type="email"
  placeholder="email@ejemplo.com"
  required
  status="error"
  error="Este campo es requerido"
/>
```
- [ ] Usar FormField para label + input juntos
- [ ] Agregar iconos (Mail, Lock, User, etc)
- [ ] Implementar validación con status prop
- [ ] Agregar helperText/description si aplica

### ✅ Badge/Pill
```tsx
// ANTES
<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
  Activo
</span>

// DESPUÉS
<Badge variant="success" dot>Activo</Badge>
```
- [ ] Mapear color → variant
- [ ] Agregar dot si es status
- [ ] Agregar icono si aplica
- [ ] Hacer removible si es tag (onRemove)

### ✅ Card/Tarjeta
```tsx
// ANTES
<div className="bg-white rounded shadow p-4">
  <h3>Título</h3>
  <p>Contenido</p>
</div>

// DESPUÉS (mientras creamos Card atom)
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
    Título
  </h3>
  <p className="text-gray-600 dark:text-gray-400">
    Contenido
  </p>
</div>
```
- [ ] Agregar dark mode
- [ ] Padding responsive
- [ ] Shadow y border sutiles
- [ ] Hover effects si es clickeable

---

## 🎨 Guía Rápida de Clases Tailwind Mobile First

### Layout
```tsx
// Stack mobile → Row desktop
<div className="flex flex-col lg:flex-row gap-4">

// Full width mobile → Fixed desktop
<div className="w-full lg:w-64">

// Hidden mobile → Visible desktop
<div className="hidden lg:block">

// Visible mobile → Hidden desktop
<div className="block lg:hidden">
```

### Spacing
```tsx
// Padding responsive
className="p-4 sm:p-6 lg:p-8"
className="px-4 sm:px-6 lg:px-8"

// Margin responsive
className="m-4 sm:m-6 lg:m-8"
className="mb-4 sm:mb-6 lg:mb-8"

// Gap responsive
className="gap-4 sm:gap-6 lg:gap-8"
```

### Typography
```tsx
// Text size responsive
className="text-base sm:text-lg lg:text-xl"
className="text-2xl sm:text-3xl lg:text-4xl"

// Line height responsive
className="leading-normal sm:leading-relaxed"
```

### Grid
```tsx
// 1 col → 2 cols → 3 cols → 4 cols
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

// Gap responsive
className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
```

---

## 🚀 Próximos Componentes a Migrar

1. **Header** (Prioridad ⭐⭐⭐) - Ejemplo completo arriba
2. **Footer** (Prioridad ⭐⭐)
3. **AuthModal** (Prioridad ⭐⭐⭐)
4. **ProductCard** (Prioridad ⭐⭐⭐)
5. **SearchBar** (Prioridad ⭐⭐⭐)

Copia el template para cada uno y empieza! 🎯
