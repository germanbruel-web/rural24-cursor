# 🚀 Estrategia de Migración al Design System Rural24

## 📋 Estado Actual del Proyecto

### Componentes Existentes Analizados:
- ✅ **DashboardLayout** - Layout con sidebar colapsable para dashboard
- ✅ **Header** - Navbar con menú de usuario y navegación
- ✅ **Footer** - Footer del sitio
- ✅ **AdDetailPage** - Página de detalle de anuncios
- ✅ **ProductCard** - Tarjetas de productos
- ✅ **SearchBar** - Barra de búsqueda
- ✅ **FilterSidebar** - Filtros laterales

### Design System Completado:
- ✅ **Atoms**: Button, Input, Label, Badge
- ✅ **Molecules**: FormField
- ✅ **Tokens**: Colores, tipografía, espaciado
- ✅ **Showcase**: Documentación visual completa

---

## 🎯 Plan de Migración Gradual (Mobile First)

### Fase 1: Fundamentos (Semana 1-2) ⭐ PRIORIDAD ALTA
**Objetivo**: Crear layouts base y migrar componentes fundamentales

#### 1.1 Layouts Base
- [ ] **BaseLayout.tsx** - Layout base con Header + Footer + contenido
- [ ] **MobileFirstContainer.tsx** - Container responsive con breakpoints
- [ ] **PageLayout.tsx** - Layout genérico para páginas

#### 1.2 Componentes de Navegación
- [ ] Migrar **Header** → Usar Button del DS
- [ ] Migrar **Footer** → Usar Button y Badge del DS
- [ ] Crear **MobileNav** → Navegación hamburger para mobile

#### 1.3 Componentes de Formularios
- [ ] Migrar todos los `<input>` a `<Input>` del DS
- [ ] Migrar todos los `<label>` a `<Label>` del DS
- [ ] Usar `<FormField>` en formularios de Login/Registro
- [ ] Actualizar **AuthModal** con componentes del DS

**Impacto**: 🔥 Crítico - Afecta toda la navegación y autenticación

---

### Fase 2: Páginas Públicas (Semana 3) ⭐ PRIORIDAD MEDIA
**Objetivo**: Mejorar experiencia mobile en páginas principales

#### 2.1 Homepage
- [ ] Migrar **HeroSection** → Mobile First
- [ ] Actualizar **CategoryCarousel** → Swiper responsive
- [ ] Optimizar **SearchBar** para mobile
- [ ] Integrar **RegisterBanner** con Button del DS

#### 2.2 Páginas de Contenido
- [ ] **HowItWorksPage** → Mobile First
- [ ] **PricingPage** → Cards responsive con Button del DS
- [ ] Página de Contacto (si existe)

**Impacto**: 🟡 Medio - Mejora conversión y UX

---

### Fase 3: Sistema de Anuncios (Semana 4-5) ⭐ PRIORIDAD ALTA
**Objetivo**: Optimizar flujo principal de compra/venta

#### 3.1 Listado y Búsqueda
- [ ] **ProductCard** → Mobile First con Badge del DS
- [ ] **FilterSidebar** → Drawer mobile con Input del DS
- [ ] **SearchResultsPage** → Grid responsive
- [ ] Paginación con Button del DS

#### 3.2 Detalle de Anuncio
- [ ] **AdDetailPage** → Layout mobile optimizado
- [ ] Galería de imágenes → Swiper mobile
- [ ] **ContactVendorButton** → Button del DS
- [ ] Sección de atributos → Mobile friendly

#### 3.3 Publicación de Anuncios
- [ ] **PublicarAvisoV3** → Formulario Mobile First
- [ ] Upload de imágenes → Mobile friendly
- [ ] Todos los inputs → Componentes del DS
- [ ] Validación → Usar estados del Input del DS

**Impacto**: 🔥 Crítico - Core business

---

### Fase 4: Dashboard y Admin (Semana 6) ⭐ PRIORIDAD MEDIA
**Objetivo**: Mejorar experiencia de gestión

#### 4.1 Dashboard Usuario
- [ ] **DashboardLayout** → Drawer mobile responsive
- [ ] **MyAdsPanel** → Tabla responsive con Badge del DS
- [ ] **MessagesPanel** → Chat mobile friendly
- [ ] **ProfilePanel** → Formulario con FormField del DS

#### 4.2 Panel Admin
- [ ] **AllAdsPanel** → Tabla con filtros mobile
- [ ] **UsersPanel** → Gestión responsive con Badge del DS
- [ ] **BannersPanel** → Upload mobile friendly
- [ ] **CategoriasAdmin** → CRUD mobile optimizado

**Impacto**: 🟡 Medio - Productividad interna

---

### Fase 5: Componentes Avanzados (Semana 7-8) ⭐ PRIORIDAD BAJA
**Objetivo**: Pulir detalles y crear nuevos componentes

#### 5.1 Nuevos Atoms
- [ ] **Checkbox** - Para filtros y formularios
- [ ] **Radio** - Para selección única
- [ ] **Switch** - Para toggles (dark mode, etc)
- [ ] **Avatar** - Para usuarios
- [ ] **Spinner** - Para loading states
- [ ] **Alert** - Para notificaciones

#### 5.2 Nuevas Molecules
- [ ] **SearchField** - Input + botón buscar
- [ ] **CheckboxGroup** - Grupo de checkboxes
- [ ] **RadioGroup** - Grupo de radios
- [ ] **Card** - Contenedor genérico
- [ ] **Modal** - Modal genérico con overlay

#### 5.3 Nuevos Organisms
- [ ] **Navbar** - Barra de navegación completa
- [ ] **Sidebar** - Sidebar genérico
- [ ] **DataTable** - Tabla con ordenamiento y filtros
- [ ] **ImageGallery** - Galería responsive
- [ ] **Breadcrumbs** - Navegación jerárquica

**Impacto**: 🟢 Bajo - Nice to have

---

## 📱 Principios Mobile First

### Breakpoints (Tailwind):
```css
sm: 640px   - Phones landscape
md: 768px   - Tablets
lg: 1024px  - Small laptops
xl: 1280px  - Desktops
2xl: 1536px - Large screens
```

### Estrategia:
1. **Diseñar primero para mobile** (320px-640px)
2. **Agregar complejidad progresivamente** para tablets y desktop
3. **Touch-friendly**: Botones mínimo 44px de altura
4. **Contenido prioritario**: Lo más importante arriba
5. **Navegación simplificada**: Hamburger menu en mobile

### Ejemplos de Clases:
```tsx
// ❌ MALO - Desktop First
<div className="grid grid-cols-4 md:grid-cols-2 sm:grid-cols-1">

// ✅ BUENO - Mobile First
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
```

---

## 🔄 Proceso de Migración por Componente

### Checklist para cada componente:
1. [ ] Identificar elementos a migrar (buttons, inputs, etc)
2. [ ] Revisar diseño mobile actual
3. [ ] Rediseñar Mobile First si es necesario
4. [ ] Reemplazar elementos con componentes del DS
5. [ ] Testear en mobile (320px, 375px, 428px)
6. [ ] Testear en tablet (768px, 1024px)
7. [ ] Testear en desktop (1280px+)
8. [ ] Verificar dark mode (si aplica)
9. [ ] Code review
10. [ ] Deploy

---

## 📊 Métricas de Éxito

### KPIs a Monitorear:
- ✅ **Consistencia**: 100% componentes usando DS
- ✅ **Performance**: Lighthouse Mobile Score > 90
- ✅ **Accesibilidad**: WCAG 2.1 AA compliant
- ✅ **Responsive**: 0 errores en dispositivos móviles
- ✅ **DX**: Reducción 50% tiempo desarrollo formularios

---

## 🎨 Convenciones de Código

### Imports:
```tsx
// Siempre importar desde index
import { Button, Input, Badge } from '@/components/atoms';
import { FormField } from '@/components/molecules';
```

### Props:
```tsx
// Usar variants del DS
<Button variant="primary" size="lg" />
<Input variant="outlined" status="error" />
<Badge variant="success" dot />
```

### Layouts Mobile First:
```tsx
// Container genérico
<div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

// Grid responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Stack mobile, row desktop
<div className="flex flex-col lg:flex-row gap-4">
```

---

## 🚦 Estado de Migración

### Leyenda:
- 🔴 No iniciado
- 🟡 En progreso
- 🟢 Completado
- ⭐ Prioridad

| Componente | Estado | Prioridad | Fase |
|-----------|--------|-----------|------|
| Button Atom | 🟢 | ⭐⭐⭐ | ✅ |
| Input Atom | 🟢 | ⭐⭐⭐ | ✅ |
| Label Atom | 🟢 | ⭐⭐⭐ | ✅ |
| Badge Atom | 🟢 | ⭐⭐⭐ | ✅ |
| FormField Molecule | 🟢 | ⭐⭐⭐ | ✅ |
| BaseLayout | 🔴 | ⭐⭐⭐ | 1 |
| Header | 🔴 | ⭐⭐⭐ | 1 |
| Footer | 🔴 | ⭐⭐ | 1 |
| AuthModal | 🔴 | ⭐⭐⭐ | 1 |
| ProductCard | 🔴 | ⭐⭐⭐ | 3 |
| AdDetailPage | 🔴 | ⭐⭐⭐ | 3 |
| PublicarAvisoV3 | 🔴 | ⭐⭐⭐ | 3 |
| DashboardLayout | 🔴 | ⭐⭐ | 4 |

---

## 📚 Recursos

### Documentación:
- **Design System Showcase**: http://localhost:5173/#/design-showcase
- **Storybook**: `npm run storybook` → http://localhost:6006
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/icons

### Testing Devices:
- iPhone SE (375×667)
- iPhone 12 Pro (390×844)
- iPhone 14 Pro Max (428×926)
- iPad (768×1024)
- iPad Pro (1024×1366)
- Desktop (1920×1080)

---

## 🎯 Próximos Pasos Inmediatos

1. **Revisar este documento** con el equipo
2. **Crear BaseLayout.tsx** (siguiente archivo)
3. **Migrar Header** como prueba de concepto
4. **Testear en mobile** y ajustar
5. **Iterar y mejorar** el proceso

---

**Última actualización**: Enero 7, 2026
**Responsable**: Equipo Rural24 Design System
