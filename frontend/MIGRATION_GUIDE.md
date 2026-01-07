# 🔄 Guía de Migración - De Botones Antiguos al Design System

Esta guía te ayudará a migrar los botones existentes al nuevo componente Button del Design System.

---

## 📊 Tabla de Equivalencias

### Clases Tailwind → Props del Button

| Código Anterior | Nuevo Código |
|----------------|-------------|
| `className="bg-green-600 text-white px-4 py-2"` | `variant="primary"` |
| `className="bg-gray-100 text-gray-900"` | `variant="secondary"` |
| `className="border-2 border-green-600"` | `variant="outline"` |
| `className="bg-red-600 text-white"` | `variant="danger"` |
| `className="text-sm px-3 py-1.5"` | `size="sm"` |
| `className="text-base px-4 py-2"` | `size="md"` (default) |
| `className="text-lg px-6 py-3"` | `size="lg"` |
| `className="w-full"` | `fullWidth={true}` |
| `disabled={true}` | `disabled={true}` ✅ (igual) |

---

## 🔍 Ejemplos de Migración

### Ejemplo 1: Botón Verde Básico

**ANTES:**
```tsx
<button 
  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
  onClick={handleClick}
>
  Guardar
</button>
```

**DESPUÉS:**
```tsx
import { Button } from '@/components/atoms';

<Button 
  variant="primary"
  onClick={handleClick}
>
  Guardar
</Button>
```

---

### Ejemplo 2: Botón con Loading

**ANTES:**
```tsx
<button 
  className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
  disabled={isLoading}
>
  {isLoading ? (
    <>
      <Loader2 className="animate-spin mr-2" />
      Guardando...
    </>
  ) : (
    'Guardar'
  )}
</button>
```

**DESPUÉS:**
```tsx
<Button 
  variant="primary"
  loading={isLoading}
>
  {isLoading ? 'Guardando...' : 'Guardar'}
</Button>
```

---

### Ejemplo 3: Botón con Icono

**ANTES:**
```tsx
<button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
  <Save size={16} />
  Guardar Cambios
</button>
```

**DESPUÉS:**
```tsx
<Button 
  variant="primary"
  leftIcon={<Save size={16} />}
>
  Guardar Cambios
</Button>
```

---

### Ejemplo 4: Botón Ancho Completo

**ANTES:**
```tsx
<button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg">
  Contactar al Vendedor
</button>
```

**DESPUÉS:**
```tsx
<Button variant="primary" fullWidth>
  Contactar al Vendedor
</Button>
```

---

### Ejemplo 5: Botón Peligroso (Eliminar)

**ANTES:**
```tsx
<button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
  <Trash2 size={16} className="mr-2" />
  Eliminar Aviso
</button>
```

**DESPUÉS:**
```tsx
<Button 
  variant="danger"
  leftIcon={<Trash2 size={16} />}
>
  Eliminar Aviso
</Button>
```

---

### Ejemplo 6: Botón Secundario/Ghost

**ANTES:**
```tsx
<button className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200">
  Cancelar
</button>
```

**DESPUÉS:**
```tsx
<Button variant="secondary">
  Cancelar
</Button>

// O usar ghost para acciones menos importantes
<Button variant="ghost">
  Cancelar
</Button>
```

---

### Ejemplo 7: Botón Outline (Borde)

**ANTES:**
```tsx
<button className="border-2 border-green-600 text-green-600 bg-transparent px-4 py-2 rounded-lg hover:bg-green-50">
  Ver Más
</button>
```

**DESPUÉS:**
```tsx
<Button variant="outline">
  Ver Más
</Button>
```

---

### Ejemplo 8: Botón Pequeño

**ANTES:**
```tsx
<button className="bg-green-600 text-white px-3 py-1.5 text-sm rounded-md">
  Filtrar
</button>
```

**DESPUÉS:**
```tsx
<Button variant="primary" size="sm">
  Filtrar
</Button>
```

---

### Ejemplo 9: Botón Solo Icono

**ANTES:**
```tsx
<button className="bg-green-600 text-white p-2 rounded-lg w-10 h-10 flex items-center justify-center">
  <Plus size={20} />
</button>
```

**DESPUÉS:**
```tsx
<Button 
  size="icon"
  aria-label="Agregar nuevo"
>
  <Plus size={20} />
</Button>
```

---

### Ejemplo 10: Formulario Completo

**ANTES:**
```tsx
<form onSubmit={handleSubmit}>
  <input type="text" placeholder="Nombre" />
  <input type="email" placeholder="Email" />
  
  <div className="flex gap-2">
    <button 
      type="button"
      onClick={onCancel}
      className="flex-1 bg-gray-100 text-gray-900 px-4 py-2 rounded-lg"
    >
      Cancelar
    </button>
    <button 
      type="submit"
      disabled={isSubmitting}
      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
    >
      {isSubmitting ? 'Enviando...' : 'Enviar'}
    </button>
  </div>
</form>
```

**DESPUÉS:**
```tsx
<form onSubmit={handleSubmit}>
  <input type="text" placeholder="Nombre" />
  <input type="email" placeholder="Email" />
  
  <div className="flex gap-2">
    <Button 
      type="button"
      variant="ghost"
      onClick={onCancel}
      className="flex-1"
    >
      Cancelar
    </Button>
    <Button 
      type="submit"
      variant="primary"
      loading={isSubmitting}
      className="flex-1"
    >
      {isSubmitting ? 'Enviando...' : 'Enviar'}
    </Button>
  </div>
</form>
```

---

## 🎯 Checklist de Migración

Cuando migres un botón, verificá:

- [ ] ¿Cambié el `<button>` por `<Button>`?
- [ ] ¿Agregué el import correcto?
- [ ] ¿Elegí la variante correcta (`variant`)?
- [ ] ¿Configuré el tamaño apropiado (`size`)?
- [ ] ¿Moví los iconos a las props `leftIcon`/`rightIcon`?
- [ ] ¿Reemplacé la lógica de loading por la prop `loading`?
- [ ] ¿Agregué `aria-label` si es un botón solo icono?
- [ ] ¿Quité las clases de Tailwind redundantes?
- [ ] ¿Probé todos los estados (hover, focus, disabled)?

---

## 📝 Patrón de Migración Recomendado

### Paso 1: Identificar Botones
```bash
# Buscar todos los botones en el proyecto
grep -r "<button" src/components/
```

### Paso 2: Clasificar por Tipo
- Botones primarios → `variant="primary"`
- Botones secundarios → `variant="secondary"`
- Botones de cancelar → `variant="ghost"`
- Botones de eliminar → `variant="danger"`
- Botones de confirmar → `variant="success"`
- Links → `variant="link"`

### Paso 3: Migrar Gradualmente
1. Empezá por componentes pequeños
2. Probá cada componente después de migrar
3. Verificá accesibilidad (navegación con teclado)
4. Documentá cambios si es necesario

### Paso 4: Limpiar Código Antiguo
- Eliminar clases duplicadas
- Simplificar lógica de estados
- Mejorar nombres de props

---

## 🚨 Casos Especiales

### Botón con Estilos Custom
Si necesitás agregar estilos adicionales:

```tsx
<Button 
  variant="primary"
  className="shadow-lg transform hover:scale-105"
>
  Botón con Efecto
</Button>
```

La función `cn()` combinará las clases correctamente sin conflictos.

### Botón con Ref
```tsx
const buttonRef = useRef<HTMLButtonElement>(null);

<Button ref={buttonRef} variant="primary">
  Botón con Ref
</Button>
```

### Botón como Link
Si necesitás un botón que actúe como link:

```tsx
// Opción 1: Usar variant="link"
<Button variant="link" onClick={() => navigate('/page')}>
  Ir a Página
</Button>

// Opción 2: Envolver en Next.js Link o React Router Link
<Link to="/page">
  <Button variant="ghost">
    Ir a Página
  </Button>
</Link>
```

---

## 🎨 Convenciones del Equipo

### Cuándo Usar Cada Variante

| Variante | Uso Recomendado |
|----------|----------------|
| `primary` | Acción principal de la página/formulario |
| `secondary` | Acciones secundarias importantes |
| `outline` | Alternativas a la acción principal |
| `ghost` | Acciones terciarias, cancelar |
| `danger` | Eliminar, acciones destructivas |
| `success` | Confirmar, guardar cambios |
| `link` | Navegación, "ver más", "leer más" |

### Cuándo Usar Cada Tamaño

| Tamaño | Uso Recomendado |
|--------|----------------|
| `sm` | Filtros, tags, acciones en tablas |
| `md` | Default, formularios, cards |
| `lg` | CTAs principales, hero sections |
| `xl` | Landing pages, secciones destacadas |
| `icon` | Acciones rápidas sin texto |

---

## 🔍 Búsqueda y Reemplazo (Regex)

### Buscar botones con bg-green
```regex
<button[^>]*className="[^"]*bg-green-600[^"]*"[^>]*>
```

### Buscar botones con disabled y loading
```regex
disabled=\{[^}]*loading[^}]*\}
```

---

## ✅ Beneficios de la Migración

1. **Consistencia**: Todos los botones se ven y comportan igual
2. **Accesibilidad**: ARIA labels, focus states, keyboard navigation
3. **Mantenibilidad**: Cambios centralizados, menos código duplicado
4. **TypeScript**: Type safety, autocomplete, menor cantidad de errores
5. **Testing**: Más fácil de testear componentes aislados
6. **Performance**: Clases optimizadas con tailwind-merge

---

**Última actualización**: Enero 2026  
**Versión**: 1.0.0
