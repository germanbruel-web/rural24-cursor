# Deuda Técnica - Header Rediseñado
**Fecha:** 12 de Febrero 2026  
**Componentes:** `frontend/src/components/header/`

---

## 🚧 TAREAS PENDIENTES

### 1. Integraciones con Backend

#### 1.1 API de Búsqueda Real
**Archivo:** `SmartSearchBar.tsx` (línea 125)
```typescript
// MOCK ACTUAL (línea 125-133)
const mockResults: SearchResult[] = POPULAR_SEARCHES
  .filter(s => s.text.toLowerCase().includes(searchQuery.toLowerCase()))
  .map((s, index) => ({...}));

// TODO: Reemplazar con:
const results = await fetch(`/api/search/autocomplete?q=${searchQuery}`)
  .then(res => res.json());
```

**Prioridad:** 🔴 Alta  
**Estimación:** 2-3 horas  
**Requiere:**
- Endpoint `/api/search/autocomplete` en backend
- Índice de búsqueda optimizado (Elasticsearch/Algolia?)
- Rate limiting (máx 10 requests/segundo)

---

#### 1.2 API de Clima Real
**Archivo:** `TopNav.tsx` (línea 33-36)
```typescript
// TODO: Implementar geolocalización + API de clima
useEffect(() => {
  const fetchWeather = async () => {
    // Obtener geolocalización del usuario
    const position = await getCurrentPosition();
    
    // Llamar API de clima (OpenWeather, WeatherAPI, etc.)
    const weather = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      .then(res => res.json());
    
    setWeather(weather);
  };
  
  fetchWeather();
}, []);
```

**Prioridad:** 🟡 Media  
**Estimación:** 3-4 horas  
**Requiere:**
- API Key de servicio de clima (OpenWeather recomendado)
- Backend proxy para no exponer API key
- Caché de 15 minutos por ubicación
- Fallback a ubicación por IP si usuario no permite geolocalización

---

#### 1.3 Cotización de Dólar en Tiempo Real
**Archivo:** `TopNav.tsx` (línea 26-29)
```typescript
// MOCK ACTUAL
const [dollarRates] = useState({
  oficial: 1250,
  blue: 1420,
});

// TODO: Conectar con API de cotizaciones
useEffect(() => {
  const fetchDollar = async () => {
    const rates = await fetch('/api/dollar-rates').then(res => res.json());
    setDollarRates(rates);
  };
  
  fetchDollar();
  const interval = setInterval(fetchDollar, 30 * 60 * 1000); // Cada 30 min
  
  return () => clearInterval(interval);
}, []);
```

**Prioridad:** 🟡 Media  
**Estimación:** 2 horas  
**API sugerida:** https://dolarapi.com/ (Argentina)

---

### 2. Funcionalidades del UserMenu

#### 2.1 Sistema de Notificaciones
**Archivo:** `UserMenu.tsx` (línea 52-60)
```typescript
// TODO: Implementar badges de notificaciones reales
<button className="relative p-2...">
  <MessageSquare className="w-5 h-5" />
  {/* MOCK - Activar cuando esté el backend */}
  {unreadMessages > 0 && (
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 
                     text-white text-xs rounded-full">
      {unreadMessages}
    </span>
  )}
</button>
```

**Prioridad:** 🔴 Alta  
**Estimación:** 4-5 horas  
**Requiere:**
- Backend: Endpoint `/api/notifications/unread`
- WebSocket o polling para updates en tiempo real
- Context de notificaciones global
- Sistema de marcado como leído

---

#### 2.2 Sistema de Favoritos
**Archivo:** `UserMenu.tsx` (línea 45-50)
```typescript
// TODO: Integrar con backend de favoritos
const [favoriteCount, setFavoriteCount] = useState(0);

useEffect(() => {
  if (user) {
    fetchFavoritesCount().then(setFavoriteCount);
  }
}, [user]);
```

**Prioridad:** 🟡 Media  
**Estimación:** 3 horas  
**Requiere:**
- Tabla `user_favorites` en BD
- Endpoint `/api/favorites/count`
- Sincronización con localStorage para users no logueados

---

### 3. Optimizaciones de Performance

#### 3.1 Caché de Sugerencias de Búsqueda
**Archivo:** `SmartSearchBar.tsx`
```typescript
// TODO: Implementar caché en memoria/localStorage
const searchCache = new Map<string, SearchResult[]>();

const performSearch = async (query: string) => {
  // Check cache first
  if (searchCache.has(query)) {
    setSuggestions(searchCache.get(query)!);
    return;
  }
  
  // Fetch y guardar en cache
  const results = await fetchSearchResults(query);
  searchCache.set(query, results);
  setSuggestions(results);
};
```

**Prioridad:** 🟢 Baja  
**Estimación:** 1-2 horas  
**Beneficio:** Reduce llamadas a API en 40-60%

---

#### 3.2 Lazy Loading de Avatar
**Archivo:** `UserMenu.tsx`
```typescript
// TODO: Implementar lazy loading de imágenes de avatar
// Si el usuario tiene foto de perfil, cargarla de forma diferida
{profile?.avatar_url ? (
  <img 
    src={profile.avatar_url} 
    alt="Avatar"
    loading="lazy"
    className="w-8 h-8 rounded-full"
  />
) : (
  <div className="w-8 h-8 rounded-full bg-gradient...">
    {getInitials()}
  </div>
)}
```

**Prioridad:** 🟢 Baja  
**Estimación:** 1 hora

---

### 4. Testing

#### 4.1 Unit Tests
**Pendiente:**
```bash
# Crear tests para cada componente
tests/
├── header/
│   ├── TopNav.test.tsx
│   ├── HeaderNew.test.tsx
│   ├── SmartSearchBar.test.tsx
│   └── UserMenu.test.tsx
```

**Casos de test prioritarios:**
- ✅ Buscador muestra sugerencias al escribir
- ✅ Debounce funciona correctamente (200ms)
- ✅ Dropdown se cierra al hacer clic fuera
- ✅ Keyboard shortcuts funcionan (`/`, `Esc`)
- ✅ UserMenu muestra dropdown solo si hay usuario
- ✅ CTA redirige a login si no hay usuario

**Prioridad:** 🟡 Media  
**Estimación:** 6-8 horas  
**Framework:** Vitest + React Testing Library

---

#### 4.2 E2E Tests
**Pendiente:**
```typescript
// tests/e2e/header.spec.ts
describe('Header Flow', () => {
  it('busca un producto y muestra resultados', async () => {
    // 1. Focus en buscador con "/"
    // 2. Escribir "tractor"
    // 3. Verificar que aparecen sugerencias
    // 4. Click en sugerencia
    // 5. Verificar navegación correcta
  });
  
  it('usuario puede publicar desde CTA', async () => {
    // 1. Sin login → debe abrir modal
    // 2. Con login → debe ir a /publicar
  });
});
```

**Prioridad:** 🟢 Baja  
**Estimación:** 4 horas  
**Framework:** Playwright o Cypress

---

### 5. Accesibilidad (WCAG 2.1)

#### 5.1 Screen Reader Testing
**Pendiente:**
- Testear con NVDA (Windows)
- Testear con VoiceOver (Mac)
- Verificar que todos los iconos tienen `aria-label`
- Verificar orden de tabulación lógico

**Prioridad:** 🟡 Media  
**Estimación:** 2 horas

---

#### 5.2 Contraste de Colores
**Revisar:**
```typescript
// TopNav links secundarios (línea 110)
// Color actual: text-gray-500
// Contraste sobre bg-gray-50: ??:1
// WCAG AA requiere 4.5:1 mínimo

// TODO: Verificar con herramienta de contraste
// https://contrast-ratio.com/
```

**Prioridad:** 🟡 Media  
**Estimación:** 1 hora

---

### 6. Mobile UX Improvements

#### 6.1 Bottom Navigation (Mobile)
**Propuesta:**
```typescript
// Agregar navegación inferior en mobile para acceso rápido
<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
  <div className="flex justify-around py-2">
    <button>🏠 Inicio</button>
    <button>🔍 Buscar</button>
    <button>➕ Publicar</button>
    <button>💬 Mensajes</button>
    <button>👤 Perfil</button>
  </div>
</nav>
```

**Prioridad:** 🟢 Baja  
**Estimación:** 3 horas  
**Justificación:** Mejora thumb zone en mobile (estudio Steven Hoober)

---

#### 6.2 Voice Search
**Propuesta:**
```typescript
// Agregar botón de búsqueda por voz en mobile
<button 
  onClick={startVoiceRecognition}
  className="p-2 text-gray-600"
>
  🎤
</button>

// Usar Web Speech API
const recognition = new webkitSpeechRecognition();
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  setQuery(transcript);
  performSearch(transcript);
};
```

**Prioridad:** 🟢 Baja  
**Estimación:** 4 horas  
**Soporte:** Chrome, Safari, Edge (no Firefox)

---

### 7. Analytics y Tracking

#### 7.1 Event Tracking
**Implementar:**
```typescript
// En SmartSearchBar.tsx
const trackSearchEvent = (query: string, hasResults: boolean) => {
  // Google Analytics
  gtag('event', 'search', {
    search_term: query,
    has_results: hasResults,
  });
  
  // Mixpanel/Amplitude
  analytics.track('Search Performed', {
    query,
    hasResults,
    timestamp: Date.now(),
  });
};

// En HeaderNew.tsx
const trackCTAClick = () => {
  analytics.track('CTA Click', {
    cta_text: 'Publicar Gratis',
    user_authenticated: !!user,
    page_url: window.location.href,
  });
};
```

**Prioridad:** 🔴 Alta  
**Estimación:** 2-3 horas  
**KPIs a trackear:**
- Tasa de búsqueda (% de usuarios que buscan)
- CTR del CTA "Publicar Gratis"
- Términos de búsqueda sin resultados
- Tiempo hasta primera búsqueda
- Tasa de abandono en modal de auth

---

#### 7.2 Heatmaps
**Implementar:**
- Hotjar o Microsoft Clarity
- Analizar clicks en header
- Ver si usuarios encuentran el buscador

**Prioridad:** 🟡 Media  
**Estimación:** 1 hora (config)

---

### 8. A/B Testing

#### 8.1 Variantes del CTA
**Propuesta de tests:**
```typescript
// Variant A (actual): "✨ Publicar Gratis"
// Variant B: "🚀 Publicar Ahora Gratis"
// Variant C: "📢 Crear Anuncio"
// Variant D: "➕ Publicar" (minimalista)

// Implementar con feature flags
const ctaVariant = getFeatureFlag('cta_text_variant', 'A');
const ctaTexts = {
  A: '✨ Publicar Gratis',
  B: '🚀 Publicar Ahora Gratis',
  C: '📢 Crear Anuncio',
  D: '➕ Publicar',
};
```

**Prioridad:** 🟡 Media  
**Estimación:** 2 horas  
**Duración del test:** 2 semanas  
**Sample size:** Mínimo 10,000 visitantes por variante

---

### 9. Security

#### 9.1 XSS Prevention en Búsqueda
**Revisar:**
```typescript
// SmartSearchBar.tsx - línea 184
// Verificar que el highlight no permita inyección de HTML

const highlightText = (text: string, highlight: string) => {
  // TODO: Sanitizar input antes de renderizar
  const sanitized = DOMPurify.sanitize(highlight);
  // ... resto del código
};
```

**Prioridad:** 🔴 Alta  
**Estimación:** 1 hora  
**Librería sugerida:** `dompurify`

---

#### 9.2 Rate Limiting en Frontend
**Implementar:**
```typescript
// Limitar cantidad de búsquedas por minuto
const searchRateLimiter = {
  searches: [],
  maxPerMinute: 30,
  
  canSearch() {
    const now = Date.now();
    this.searches = this.searches.filter(t => now - t < 60000);
    return this.searches.length < this.maxPerMinute;
  },
  
  recordSearch() {
    this.searches.push(Date.now());
  }
};
```

**Prioridad:** 🟡 Media  
**Estimación:** 1 hora

---

### 10. Bugs Conocidos / Edge Cases

#### 10.1 Sticky Header en iOS Safari
**Issue:** El `backdrop-filter: blur()` puede tener performance issues en iOS < 16  
**Workaround:**
```css
/* Agregar fallback */
@supports not (backdrop-filter: blur(12px)) {
  .sticky-header {
    background: rgba(255, 255, 255, 0.95);
  }
}
```

**Prioridad:** 🟡 Media  
**Estimación:** 30 min

---

#### 10.2 Dropdown se Corta en Pantallas Pequeñas
**Issue:** Si el dropdown de ubicaciones es muy largo, puede salirse del viewport  
**Fix:**
```typescript
// Agregar max-height y overflow
<div className="... max-h-80 overflow-y-auto">
  {LOCATIONS.map(...)}
</div>
```

**Prioridad:** 🟢 Baja  
**Estimación:** 15 min

---

#### 10.3 Focus Trap en Modal Mobile
**Issue:** Al abrir modal de auth en mobile, el focus puede escaparse  
**Fix:** Implementar `react-focus-lock`

**Prioridad:** 🟡 Media  
**Estimación:** 1 hora

---

### 11. Documentación Pendiente

#### 11.1 Storybook
**Crear stories para:**
- `TopNav` (con/sin clima, con/sin dólar)
- `HeaderNew` (sticky/no-sticky, mobile/desktop)
- `SmartSearchBar` (empty, con resultados, sin resultados, loading)
- `UserMenu` (authenticated, unauthenticated, admin)

**Prioridad:** 🟢 Baja  
**Estimación:** 4 horas

---

#### 11.2 Documentación de API
**Crear:**
```markdown
# API Contracts for Header

## Search Autocomplete
GET /api/search/autocomplete?q={query}

Response:
{
  results: SearchResult[],
  suggestions: string[],
  categories: Category[],
  meta: { total: number, time: number }
}
```

**Prioridad:** 🟡 Media  
**Estimación:** 1 hora

---

### 12. Refactoring Sugerido

#### 12.1 Separar Lógica de Búsqueda en Custom Hook
**Propuesta:**
```typescript
// hooks/useSmartSearch.ts
export const useSmartSearch = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const performSearch = useCallback(async (q: string) => {
    // Toda la lógica aquí
  }, []);
  
  return { query, setQuery, suggestions, isSearching, performSearch };
};

// Uso en SmartSearchBar.tsx
const { query, setQuery, suggestions, isSearching, performSearch } = useSmartSearch();
```

**Prioridad:** 🟢 Baja  
**Estimación:** 2 horas  
**Beneficio:** Reutilizable en otras partes de la app

---

#### 12.2 Context de Header Global
**Propuesta:**
```typescript
// contexts/HeaderContext.tsx
export const HeaderProvider = ({ children }) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  return (
    <HeaderContext.Provider value={{...}}>
      {children}
    </HeaderContext.Provider>
  );
};

// Beneficio: Coordinar estado entre TopNav y Header
```

**Prioridad:** 🟢 Baja  
**Estimación:** 2 horas

---

## 📊 Resumen de Prioridades

### 🔴 Alta (Hacer ASAP)
1. API de búsqueda real
2. Sistema de notificaciones
3. Analytics/Tracking de eventos
4. XSS prevention

**Tiempo total:** ~12-15 horas

### 🟡 Media (Next Sprint)
1. API de clima
2. Cotización de dólar
3. Sistema de favoritos
4. Testing unitario
5. Accesibilidad

**Tiempo total:** ~18-22 horas

### 🟢 Baja (Backlog)
1. Voice search
2. Bottom navigation mobile
3. Storybook
4. Refactoring a custom hooks
5. Caché de búsquedas

**Tiempo total:** ~16-20 horas

---

## 🎯 Next Steps Recomendados

**Esta semana:**
1. Conectar con API de búsqueda real (SmartSearchBar)
2. Implementar analytics básico (track de CTA y búsquedas)
3. Tests unitarios críticos (SmartSearchBar, UserMenu)

**Próxima semana:**
4. Sistema de notificaciones en tiempo real
5. API de clima + dólar
6. Testing de accesibilidad

**Mes siguiente:**
7. A/B testing del CTA
8. Voice search (mobile)
9. Optimizaciones de performance

---

## 📝 Notas Adicionales

### Consideraciones de Arquitectura
- El header actual está **desacoplado** del resto de la app (✅ bien)
- Usa **props drilling** para `onNavigate` (podría mejorarse con Context API)
- No tiene **estado persistente** entre navegaciones (considerar Redux/Zustand si crece)

### Performance Benchmarks
- **LCP:** Medir con Lighthouse (objetivo: < 2.5s)
- **FID:** Medir interacción con buscador (objetivo: < 100ms)
- **CLS:** Verificar que header no cause layout shift (objetivo: < 0.1)

### Browser Support
- Tested: Chrome ✅, Firefox ✅, Safari ✅, Edge ✅
- Pending: IE11 (deprecated), Samsung Internet, Opera

---

**Última actualización:** 12 Feb 2026  
**Responsable:** GitHub Copilot + Equipo Frontend  
**Review date:** 19 Feb 2026
