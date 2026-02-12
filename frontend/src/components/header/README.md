# Header Rediseñado - Rural24

Implementación del nuevo diseño de header optimizado para conversión y UX.

## 📐 Estructura

```
header/
├── TopNav.tsx              # Barra superior secundaria (40px)
├── HeaderNew.tsx           # Header principal (80px)
├── SmartSearchBar.tsx      # Buscador con autocompletado inteligente
├── UserMenu.tsx            # Menú de usuario con dropdown
├── styles.css              # Estilos y microinteracciones
├── index.ts                # Exportaciones
└── README.md               # Esta documentación
```

## 🎯 Componentes Principales

### TopNav
Barra superior secundaria de 40px de altura.

**Estructura:**
- **Izquierda:** Widget de clima + ubicación + cotización dólar
- **Centro:** Espacio para alertas institucionales (futuro)
- **Derecha:** Links secundarios (FAQ, Servicios, Info)

**Props:**
```typescript
interface TopNavProps {
  onNavigate: (page: Page) => void;
}
```

### HeaderNew
Header principal de 80px de altura con sticky scroll.

**Estructura:**
- **Izquierda:** Logo (click → home)
- **Centro:** SmartSearchBar protagonista
- **Derecha:** CTA "Publicar Gratis" + UserMenu

**Features:**
- ✅ Sticky header con backdrop blur al scroll
- ✅ Responsive mobile con menú lateral
- ✅ Reducción de altura al hacer scroll (80px → 64px)
- ✅ Modal de autenticación integrado

**Props:**
```typescript
interface HeaderNewProps {
  onNavigate: (page: Page) => void;
  onSearch?: (query: string, location?: string) => void;
}
```

### SmartSearchBar
Buscador inteligente con autocompletado en tiempo real.

**Características:**
- ✅ Autocompletado desde el primer carácter (debounce 200ms)
- ✅ Búsqueda híbrida: productos + categorías + marcas + ubicaciones
- ✅ Skeleton loading mientras busca
- ✅ Highlight de coincidencias en resultados
- ✅ Historial de búsquedas (localStorage)
- ✅ Sugerencias populares
- ✅ Shortcuts de teclado (`/` para focus, `Esc` para cerrar)
- ✅ Clear button integrado
- ✅ Selector de ubicación con dropdown

**Props:**
```typescript
interface SmartSearchBarProps {
  onSearch: (query: string, location?: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}
```

### UserMenu
Menú de usuario con estados autenticado/no autenticado.

**Estados:**
- **No autenticado:** Links "Ingresá" y "Registrate"
- **Autenticado:** Iconos de acciones rápidas + Avatar con dropdown

**Features:**
- ✅ Iconos de favoritos, mensajes, notificaciones (con badges)
- ✅ Avatar con iniciales y gradiente
- ✅ Dropdown con secciones organizadas
- ✅ Permisos por rol (admin, user)
- ✅ Logout con confirmación

**Props:**
```typescript
interface UserMenuProps {
  onNavigate: (page: Page) => void;
  onShowAuthModal?: () => void;
}
```

## 🚀 Uso

### Integración básica

```typescript
import { HeaderNew } from './components/header';

function App() {
  const handleNavigate = (page: Page) => {
    // Lógica de navegación
  };

  const handleSearch = (query: string, location?: string) => {
    // Lógica de búsqueda
    console.log('Buscar:', query, 'en', location);
  };

  return (
    <HeaderNew 
      onNavigate={handleNavigate}
      onSearch={handleSearch}
    />
  );
}
```

### Uso de componentes individuales

```typescript
import { SmartSearchBar } from './components/header';

function CustomLayout() {
  return (
    <SmartSearchBar
      onSearch={(query, location) => {
        // Tu lógica aquí
      }}
      placeholder="Buscar en el marketplace..."
      autoFocus={true}
    />
  );
}
```

## 🎨 Personalización

### Variables CSS

Los componentes usan las siguientes variables de Tailwind CSS:

```css
/* Colores principales */
--color-primary: #16a135;      /* Verde brand */
--color-primary-dark: #138a2e; /* Verde oscuro */

/* Alturas */
--topnav-height: 40px;
--header-height: 80px;
--header-scrolled: 64px;

/* Breakpoints */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

### Clases CSS customizables

Puedes sobrescribir las siguientes clases en `header/styles.css`:

- `.animate-pulse-cta` - Animación del botón CTA
- `.dropdown-menu` - Animación de dropdowns
- `.sticky-header` - Efecto blur del sticky header
- `.skeleton` - Loading states
- `.notification-badge` - Badges de notificaciones

## 📊 Features UX Implementadas

### 1. Jerarquía Visual Clara
- Buscador ocupa posición central prominente
- CTA "Publicar Gratis" destacado con gradiente y shadow
- Clima y links secundarios en peso visual bajo

### 2. Microinteracciones
- ✅ Lift effect en hover del CTA
- ✅ Scale animation en botones
- ✅ Chevron rotation en dropdowns
- ✅ Smooth transitions (300ms cubic-bezier)
- ✅ Pulse animation sutil en CTA cada 5s

### 3. Performance
- ✅ Lazy loading del modal de auth
- ✅ Debounce en búsqueda (200ms)
- ✅ Optimización de re-renders con useCallback
- ✅ Logo con eager loading y fetchPriority="high"

### 4. Accesibilidad
- ✅ ARIA labels en iconos
- ✅ Focus trap en modales
- ✅ Keyboard navigation (Tab, Escape, /)
- ✅ Screen reader friendly
- ✅ Focus visible states

### 5. Responsive
- ✅ Mobile-first approach
- ✅ Breakpoints: sm (640), md (768), lg (1024), xl (1280)
- ✅ Menú lateral en mobile
- ✅ Buscador adaptativo

## 🔧 Configuración

### Integración con API de búsqueda

Para conectar con tu API de búsqueda real, modifica `SmartSearchBar.tsx`:

```typescript
const performSearch = async (searchQuery: string) => {
  // Reemplazar mock con llamada real
  const results = await fetch(`/api/search?q=${searchQuery}`)
    .then(res => res.json());
  
  setSuggestions(results);
};
```

### Integración con API de clima

Para obtener clima real en `TopNav.tsx`:

```typescript
useEffect(() => {
  const fetchWeather = async () => {
    const response = await fetch('/api/weather');
    const data = await response.json();
    setWeather(data);
  };
  
  fetchWeather();
}, []);
```

## 📈 Métricas de Conversión Esperadas

Según el análisis UX, se espera:

- **+40%** en tasa de uso del buscador
- **+30%** en clicks del CTA "Publicar Gratis"
- **+25%** en engagement general
- **-20%** en bounce rate

## 🐛 Troubleshooting

### El sticky header no funciona
Verifica que el componente padre no tenga `overflow: hidden`

### El autocompletado no aparece
Verifica que `z-index` del dropdown sea mayor al del contenido

### Mobile menu no se cierra
Asegúrate de pasar correctamente el callback `onNavigate`

## 🚧 Roadmap

- [ ] Integración con analytics (track de búsquedas)
- [ ] A/B testing del CTA
- [ ] Voice search en mobile
- [ ] Dark mode
- [ ] PWA notifications badge
- [ ] Geolocalización automática para clima

## 📝 Changelog

### v1.0.0 (Feb 2026)
- ✅ Implementación inicial
- ✅ TopNav con clima y links
- ✅ SmartSearchBar con autocompletado
- ✅ UserMenu con dropdown
- ✅ Responsive mobile
- ✅ Microinteracciones
