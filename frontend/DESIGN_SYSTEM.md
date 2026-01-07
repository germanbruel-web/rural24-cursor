# 🎨 Design System Rural24

Sistema de diseño basado en **Atomic Design** para garantizar consistencia visual y reutilización de componentes.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Estructura de Carpetas](#estructura-de-carpetas)
- [Componentes](#componentes)
- [Tokens de Diseño](#tokens-de-diseño)
- [Convenciones](#convenciones)

---

## 🏗️ Arquitectura

El Design System sigue la metodología **Atomic Design** de Brad Frost:

```
Atoms → Molecules → Organisms → Templates → Pages
```

### Niveles de Abstracción

1. **Atoms (Átomos)**: Componentes UI básicos e indivisibles
   - Button, Input, Label, Icon, Badge, Avatar

2. **Molecules (Moléculas)**: Combinaciones simples de átomos
   - SearchBar, FormField, Card, Alert, Notification

3. **Organisms (Organismos)**: Secciones complejas de la UI
   - Header, Footer, Sidebar, ProductCard, ContactForm

4. **Templates**: Layouts de página reutilizables
   - AuthLayout, DashboardLayout, LandingLayout

5. **Pages**: Instancias específicas de templates con contenido real

---

## 📦 Instalación

### Dependencias Necesarias

```bash
# Navegá a la carpeta frontend
cd frontend

# Instalá las dependencias del Design System
npm install class-variance-authority clsx tailwind-merge

# Instalá tipos de TypeScript (si no están)
npm install -D @types/react @types/react-dom

# Instalá Storybook (si no está instalado)
npx storybook@latest init

# Instalá iconos Lucide React (si no están)
npm install lucide-react
```

### Verificación de Instalación

```bash
# Verificá que todo esté instalado
npm list class-variance-authority clsx tailwind-merge lucide-react
```

---

## 📁 Estructura de Carpetas

```
frontend/
├── src/
│   ├── components/
│   │   ├── atoms/              # Componentes atómicos
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.stories.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── molecules/          # Componentes moleculares
│   │   ├── organisms/          # Componentes organismos
│   │   ├── templates/          # Templates de layout
│   │   └── [legacy components] # Componentes existentes (migrar gradualmente)
│   │
│   ├── design-system/          # Sistema de diseño
│   │   ├── tokens.ts          # Tokens de diseño (colores, espaciado, etc.)
│   │   └── utils.ts           # Utilidades (cn helper)
│   │
│   └── ...
```

---

## 🧩 Componentes

### Button (Átomo)

Botón flexible y accesible con múltiples variantes y estados.

#### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger' \| 'success' \| 'link'` | `'primary'` | Variante visual |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'icon'` | `'md'` | Tamaño del botón |
| `loading` | `boolean` | `false` | Estado de carga |
| `disabled` | `boolean` | `false` | Deshabilitar botón |
| `fullWidth` | `boolean` | `false` | Ancho completo |
| `leftIcon` | `ReactNode` | - | Icono izquierdo |
| `rightIcon` | `ReactNode` | - | Icono derecho |

#### Ejemplos de Uso

```tsx
import { Button } from '@/components/atoms';
import { Save, Trash2 } from 'lucide-react';

// Botón básico
<Button>Click me</Button>

// Con variante y tamaño
<Button variant="secondary" size="lg">
  Botón Grande
</Button>

// Con loading
<Button loading>
  Guardando...
</Button>

// Con iconos
<Button leftIcon={<Save size={16} />}>
  Guardar
</Button>

// Ancho completo
<Button fullWidth variant="danger">
  Eliminar Cuenta
</Button>

// Solo icono
<Button size="icon" aria-label="Eliminar">
  <Trash2 size={20} />
</Button>
```

---

## 🎨 Tokens de Diseño

Los tokens están centralizados en `design-system/tokens.ts`:

### Colores

```typescript
import { tokens } from '@/design-system/tokens';

// Usar en componentes
const primaryColor = tokens.colors.primary[600]; // #138a2c
```

### Espaciado

```typescript
// Tailwind ya usa estos valores
<div className="p-4 m-8">
```

### Tipografía

```typescript
// Font families disponibles
font-heading // Raleway
font-body    // Roboto
```

---

## 📐 Convenciones

### Nomenclatura de Archivos

- **Componentes**: PascalCase → `Button.tsx`
- **Stories**: PascalCase + `.stories.tsx` → `Button.stories.tsx`
- **Utilitarios**: camelCase → `utils.ts`
- **Tipos**: PascalCase + `.types.ts` → `Button.types.ts`

### Estructura de Componente

```tsx
// 1. Imports
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/design-system/utils';

// 2. Variantes CVA
const componentVariants = cva(/* ... */);

// 3. Props Interface
export interface ComponentProps {
  // ...
}

// 4. Componente
export const Component: React.FC<ComponentProps> = ({
  // ...
}) => {
  return (/* JSX */);
};

// 5. Display Name
Component.displayName = 'Component';
```

### Accesibilidad

Todos los componentes deben:
- Tener `aria-label` cuando sea necesario
- Usar roles ARIA apropiados
- Ser navegables por teclado
- Tener estados visuales claros (focus, hover, active)

### TypeScript

- Usar `interface` para props de componentes
- Usar `type` para uniones y utilitarios
- Exportar tipos e interfaces
- Evitar `any`, usar `unknown` si es necesario

---

## 🚀 Roadmap

### Fase 1: Átomos ✅
- [x] Button
- [x] Input
- [x] Label
- [x] Badge
- [ ] Avatar
- [ ] Icon

### Fase 2: Moléculas
- [x] FormField
- [ ] SearchBar
- [ ] Card
- [ ] Alert
- [ ] Modal

### Fase 3: Organismos
- [ ] Header
- [ ] Footer
- [ ] Sidebar
- [ ] ContactForm
- [ ] ProductCard

### Fase 4: Templates
- [ ] AuthLayout
- [ ] DashboardLayout
- [ ] LandingLayout

---

## 🛠️ Herramientas

- **CVA**: Gestión de variantes de componentes
- **Tailwind CSS**: Utilidades de CSS
- **clsx + tailwind-merge**: Combinación de clases
- **Storybook**: Documentación interactiva
- **TypeScript**: Type safety
- **Lucide React**: Biblioteca de iconos

---

## 📚 Recursos

- [Atomic Design - Brad Frost](https://atomicdesign.bradfrost.com/)
- [Class Variance Authority](https://cva.style/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Storybook](https://storybook.js.org/docs/react/get-started/introduction)
- [Lucide Icons](https://lucide.dev/)

---

## 🤝 Contribuir

Al agregar nuevos componentes:

1. Seguir la estructura de carpetas de Atomic Design
2. Crear el componente con CVA y TypeScript
3. Agregar stories de Storybook
4. Documentar props y ejemplos de uso
5. Asegurar accesibilidad WCAG 2.1 AA
6. Exportar desde el index correspondiente

---

**Última actualización**: Enero 2026  
**Versión**: 1.0.0  
**Mantenedor**: Equipo Rural24
