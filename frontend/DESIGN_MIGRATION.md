# 🎨 Guía de Migración de Diseño - Del Código Actual al Design System

Esta guía te ayudará a migrar tus componentes actuales (formularios, cards, tipografías) al nuevo Design System profesional.

---

## 📋 Tabla de Contenidos

1. [Colores](#colores)
2. [Formularios](#formularios)
3. [Cards](#cards)
4. [Tipografía](#tipografía)
5. [Botones](#botones)
6. [Modo Oscuro](#modo-oscuro)

---

## 🎨 Colores

### Antes vs Después

| Antes | Después | Uso |
|-------|---------|-----|
| `bg-green-600` | `bg-brand-600` | Fondo principal |
| `text-green-600` | `text-brand-600` | Texto principal |
| `bg-gray-100` | `bg-neutral-100` | Fondo secundario |
| `text-gray-900` | `text-neutral-900` | Texto oscuro |
| `border-gray-200` | `border-neutral-200` | Bordes |

### Ejemplo Práctico

**ANTES:**
```tsx
<div className="bg-green-600 text-white p-4 rounded-lg border border-gray-200">
  <h3 className="text-gray-900">Título</h3>
  <p className="text-gray-600">Descripción</p>
</div>
```

**DESPUÉS:**
```tsx
<div className="bg-brand-600 dark:bg-brand-700 text-white p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
  <h3 className="text-neutral-900 dark:text-neutral-50">Título</h3>
  <p className="text-neutral-600 dark:text-neutral-400">Descripción</p>
</div>
```

---

## 📝 Formularios

### Input Simple

**ANTES:**
```tsx
<input 
  type="text" 
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
  placeholder="Nombre"
/>
```

**DESPUÉS:**
```tsx
<input 
  type="text" 
  className="input"
  placeholder="Nombre"
/>
```

O usando clases directamente:
```tsx
<input 
  type="text" 
  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
  placeholder="Nombre"
/>
```

### Textarea

**ANTES:**
```tsx
<textarea 
  className="w-full px-4 py-2 border rounded-lg"
  rows={4}
/>
```

**DESPUÉS:**
```tsx
<textarea 
  className="input min-h-[100px]"
  rows={4}
/>
```

### Select

**ANTES:**
```tsx
<select className="w-full px-4 py-2 border rounded-lg">
  <option>Opción 1</option>
</select>
```

**DESPUÉS:**
```tsx
<select className="input">
  <option>Opción 1</option>
</select>
```

### Formulario Completo

**ANTES:**
```tsx
<form className="space-y-4 bg-white p-6 rounded-lg shadow">
  <div>
    <label className="block text-sm font-medium text-gray-700">
      Nombre
    </label>
    <input 
      type="text" 
      className="mt-1 w-full px-4 py-2 border rounded-lg"
    />
  </div>
  
  <div>
    <label className="block text-sm font-medium text-gray-700">
      Email
    </label>
    <input 
      type="email" 
      className="mt-1 w-full px-4 py-2 border rounded-lg"
    />
  </div>
  
  <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg">
    Enviar
  </button>
</form>
```

**DESPUÉS:**
```tsx
<form className="space-y-4 card p-6">
  <div>
    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
      Nombre
    </label>
    <input 
      type="text" 
      className="input"
      placeholder="Ingresá tu nombre"
    />
  </div>
  
  <div>
    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
      Email
    </label>
    <input 
      type="email" 
      className="input"
      placeholder="tu@email.com"
    />
  </div>
  
  <Button variant="primary" fullWidth type="submit">
    Enviar
  </Button>
</form>
```

---

## 🎴 Cards

### Card Básica

**ANTES:**
```tsx
<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
  <h3 className="text-xl font-bold mb-2">Título</h3>
  <p className="text-gray-600">Descripción del producto</p>
</div>
```

**DESPUÉS:**
```tsx
<div className="card p-6">
  <h3 className="text-xl font-bold mb-2">Título</h3>
  <p className="text-neutral-600 dark:text-neutral-400">Descripción del producto</p>
</div>
```

### Card con Hover

**ANTES:**
```tsx
<div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6">
  {/* Contenido */}
</div>
```

**DESPUÉS:**
```tsx
<div className="card-hover p-6">
  {/* Contenido */}
</div>
```

### Card de Producto

**ANTES:**
```tsx
<div className="bg-white rounded-xl shadow-lg overflow-hidden">
  <img src="..." className="w-full h-48 object-cover" />
  <div className="p-6">
    <h3 className="text-xl font-bold mb-2">Tractor John Deere</h3>
    <p className="text-gray-600 mb-4">Excelente estado</p>
    <div className="text-3xl font-bold text-green-600 mb-4">
      $85.000
    </div>
    <button className="w-full bg-green-600 text-white py-2 rounded-lg">
      Contactar
    </button>
  </div>
</div>
```

**DESPUÉS:**
```tsx
<div className="card overflow-hidden">
  <img src="..." className="w-full h-48 object-cover" />
  <div className="p-6">
    <h3 className="text-xl font-bold mb-2">Tractor John Deere</h3>
    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
      Excelente estado
    </p>
    <div className="text-3xl font-bold text-brand-600 dark:text-brand-400 mb-4">
      $85.000
    </div>
    <Button variant="primary" fullWidth>
      Contactar
    </Button>
  </div>
</div>
```

### Card con Glass Effect

**NUEVO:**
```tsx
<div className="glass p-6 rounded-2xl">
  <h3 className="text-xl font-bold mb-2">Título</h3>
  <p>Contenido con efecto glass</p>
</div>
```

---

## ✍️ Tipografía

### Headings

**ANTES:**
```tsx
<h1 className="text-4xl font-bold text-gray-900">Título Principal</h1>
<h2 className="text-3xl font-bold text-gray-900">Subtítulo</h2>
<h3 className="text-2xl font-bold text-gray-900">Sección</h3>
```

**DESPUÉS:**
```tsx
<h1>Título Principal</h1>  {/* Ya tiene estilos base */}
<h2>Subtítulo</h2>
<h3>Sección</h3>

{/* O con personalización: */}
<h1 className="text-5xl font-extrabold text-brand-600 dark:text-brand-400">
  Título Destacado
</h1>
```

### Párrafos

**ANTES:**
```tsx
<p className="text-base text-gray-700 leading-relaxed">
  Descripción del producto...
</p>
```

**DESPUÉS:**
```tsx
<p>Descripción del producto...</p>  {/* Ya tiene estilos base */}

{/* O personalizado: */}
<p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed">
  Descripción del producto...
</p>
```

### Enlaces

**ANTES:**
```tsx
<a href="#" className="text-green-600 hover:text-green-700 underline">
  Ver más
</a>
```

**DESPUÉS:**
```tsx
<a href="#">Ver más</a>  {/* Ya tiene estilos base */}

{/* O personalizado: */}
<a 
  href="#" 
  className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 underline underline-offset-4"
>
  Ver más
</a>
```

---

## 🔘 Botones

### Migración Completa

**ANTES:**
```tsx
<button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
  Guardar
</button>
```

**DESPUÉS:**
```tsx
import { Button } from '@/components/atoms';

<Button variant="primary">
  Guardar
</Button>
```

Ver [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) para más ejemplos de botones.

---

## 🌓 Modo Oscuro

### Agregar Soporte Dark Mode

**Básico:**
```tsx
<div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50">
  <p className="text-neutral-700 dark:text-neutral-300">
    Este texto se adapta al modo oscuro
  </p>
</div>
```

### Toggle Dark Mode

Creá un componente para activar/desactivar:

```tsx
import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/atoms';

export function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Detectar preferencia del sistema
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      aria-label="Toggle dark mode"
    >
      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
    </Button>
  );
}
```

---

## 🎯 Patrones Comunes

### Hero Section

**ANTES:**
```tsx
<section className="bg-green-600 text-white py-20">
  <div className="max-w-7xl mx-auto px-4">
    <h1 className="text-5xl font-bold mb-4">
      Bienvenido a AgroBuscador
    </h1>
    <p className="text-xl mb-8">
      La mejor plataforma de maquinaria agrícola
    </p>
    <button className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold">
      Comenzar
    </button>
  </div>
</section>
```

**DESPUÉS:**
```tsx
<section className="bg-gradient-to-br from-brand-600 to-brand-700 dark:from-brand-700 dark:to-brand-800 text-white py-20">
  <div className="container-custom">
    <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
      Bienvenido a AgroBuscador
    </h1>
    <p className="text-xl mb-8 text-brand-50">
      La mejor plataforma de maquinaria agrícola
    </p>
    <Button variant="secondary" size="lg">
      Comenzar
    </Button>
  </div>
</section>
```

### Grid de Productos

**ANTES:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {products.map(product => (
    <div key={product.id} className="bg-white rounded-lg shadow-md p-4">
      {/* Card content */}
    </div>
  ))}
</div>
```

**DESPUÉS:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {products.map(product => (
    <div key={product.id} className="card-hover p-6">
      {/* Card content */}
    </div>
  ))}
</div>
```

---

## ✅ Checklist de Migración

Cuando migres un componente:

- [ ] Reemplazá `green-*` por `brand-*`
- [ ] Reemplazá `gray-*` por `neutral-*`
- [ ] Agregá clases `dark:` para modo oscuro
- [ ] Usá `card` para contenedores con borde y sombra
- [ ] Usá `input` para campos de formulario
- [ ] Migrá botones al componente `Button`
- [ ] Usá radios más grandes: `rounded-lg` → `rounded-xl`
- [ ] Usá sombras más suaves: `shadow-md` → `shadow-sm` o `shadow`
- [ ] Probá en modo claro y oscuro

---

## 🚀 Cómo Pedirme Migraciones

### Formato de Pedido

Para que te ayude a migrar componentes, pedímelo así:

1. **Especificá el componente:**
   - "Migrá el formulario de contacto al Design System"
   - "Actualizá las cards de productos con el nuevo diseño"
   - "Convertí el header al Design System con dark mode"

2. **Mostrá el código actual:**
   - Pegá el código del componente que querés migrar
   - O indicá el archivo: "Migrá AdDetailPage.tsx"

3. **Indicá preferencias:**
   - "Con modo oscuro"
   - "Usando el componente Button"
   - "Con animaciones"
   - "Mobile-first"

### Ejemplos de Pedidos

✅ **Bueno:**
> "Migrá el componente ContactForm de `src/components/ContactForm.tsx` al Design System. Quiero que use el componente Button, soporte dark mode y tenga validaciones visuales."

✅ **Bueno:**
> "Actualizá todas las cards de productos para que usen la clase `card-hover`, colores brand en vez de green, y funcionen en dark mode."

✅ **Bueno:**
> "Convertí este formulario al Design System con las nuevas clases:
> ```tsx
> [pegás el código aquí]
> ```"

---

**Siguiente paso:** Elegí un componente y pedime que lo migre al Design System! 🎨

---

**Última actualización**: Enero 2026
