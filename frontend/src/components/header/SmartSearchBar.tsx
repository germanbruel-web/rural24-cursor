/**
 * @deprecated Este componente está deprecado.
 * Usar GlobalSearchBar en su lugar.
 * 
 * SmartSearchBar.tsx contiene:
 * - Datos hardcodeados (POPULAR_SEARCHES)
 * - Lógica duplicada de búsqueda
 * - Mock de API en lugar de llamadas reales
 * 
 * Migración:
 * import { GlobalSearchBar } from '../GlobalSearchBar';
 * <GlobalSearchBar onSearch={handleSearch} />
 * 
 * Pendiente de eliminación: Marzo 2026
 */

/**
 * SmartSearchBar.tsx
 * Buscador inteligente con autocompletado - Design System RURAL24
 * 
 * Características:
 * - Autocompletado desde primer carácter (debounce 200ms)
 * - Búsqueda híbrida: productos + categorías + ubicaciones
 * - Skeleton loading mientras busca
 * - Highlight de coincidencias
 * - Shortcuts de teclado (/ para focus, Esc para cerrar)
 * - Historial de búsquedas
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, ChevronDown, Loader2, X, Clock, TrendingUp } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  type: 'product' | 'category' | 'brand' | 'location';
  count?: number;
  highlight?: string;
}

interface SmartSearchBarProps {
  onSearch: (query: string, location?: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

// Sugerencias populares (en producción vendrían de analytics)
const POPULAR_SEARCHES = [
  { text: 'Tractores John Deere', type: 'brand' as const, count: 234 },
  { text: 'Campos en venta', type: 'category' as const, count: 1456 },
  { text: 'Cosechadoras usadas', type: 'product' as const, count: 89 },
  { text: 'Semillas de Soja', type: 'product' as const, count: 567 },
  { text: 'Vaquillonas Angus', type: 'product' as const, count: 123 },
];

// Ubicaciones (provincias principales)
const LOCATIONS = [
  'Todo el país',
  'Buenos Aires',
  'Córdoba',
  'Santa Fe',
  'La Pampa',
  'Entre Ríos',
  'San Luis',
];

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  onSearch,
  placeholder = 'Tractores, semillas, campos en venta...',
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Todo el país');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Cargar historial de localStorage
  useEffect(() => {
    const history = localStorage.getItem('search_history');
    if (history) {
      setSearchHistory(JSON.parse(history).slice(0, 3));
    }
  }, []);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: "/" para focus en búsqueda
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Simular búsqueda con debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 300));

    // En producción, llamar a la API de búsqueda
    // const results = await smartSearch(searchQuery);
    
    // Mock de resultados
    const mockResults: SearchResult[] = POPULAR_SEARCHES
      .filter(s => s.text.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((s, index) => ({
        id: `result-${index}`,
        title: s.text,
        type: s.type,
        count: s.count,
        highlight: searchQuery,
      }));

    setSuggestions(mockResults);
    setIsSearching(false);
  }, []);

  // Manejar cambio en el input con debounce
  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(true);

    // Limpiar timer anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Nuevo timer con debounce de 200ms
    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, 200);
  };

  // Manejar submit del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Guardar en historial
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));

    // Ejecutar búsqueda
    onSearch(query, location !== 'Todo el país' ? location : undefined);
    setShowSuggestions(false);
  };

  // Seleccionar sugerencia
  const handleSelectSuggestion = (suggestion: SearchResult) => {
    setQuery(suggestion.title);
    onSearch(suggestion.title, location !== 'Todo el país' ? location : undefined);
    setShowSuggestions(false);
  };

  // Highlight de texto
  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <strong key={i} className="font-semibold text-green-600">
              {part}
            </strong>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Obtener icono por tipo de resultado
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'category':
        return '📂';
      case 'brand':
        return '🏷️';
      case 'location':
        return '📍';
      default:
        return '🔍';
    }
  };

  return (
    <div ref={searchBarRef} className="relative flex-1 max-w-[700px]">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        {/* Input principal */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full h-12 pl-12 pr-4 text-base text-gray-900 placeholder-gray-400 
                     border-2 border-gray-300 rounded-l-lg
                     focus:outline-none focus:border-green-500 focus:ring-0
                     transition-all duration-200
                     hover:border-gray-400"
          />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 
                       text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                       rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Loading indicator */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Selector de ubicación */}
        <div ref={locationRef} className="relative">
          <button
            type="button"
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            className="h-12 px-4 flex items-center gap-2 
                     bg-white border-2 border-l-0 border-gray-300
                     text-sm text-gray-700 font-medium
                     hover:bg-gray-50 transition-colors
                     focus:outline-none focus:border-green-500"
          >
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">{location}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Location Dropdown */}
          {showLocationDropdown && (
            <div className="absolute right-0 top-full mt-1 w-56 
                          bg-white rounded-lg shadow-xl border border-gray-200 
                          py-2 z-50 max-h-80 overflow-y-auto">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    setLocation(loc);
                    setShowLocationDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm 
                           hover:bg-gray-50 transition-colors
                           ${location === loc ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}
                >
                  {loc === 'Todo el país' && '🇦🇷 '}
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botón de búsqueda */}
        <button
          type="submit"
          disabled={!query.trim()}
          className="h-12 px-6 bg-gradient-to-r from-green-600 to-green-700
                   text-white font-semibold rounded-r-lg
                   hover:from-green-700 hover:to-green-800
                   disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                   transition-all duration-200
                   shadow-md hover:shadow-lg
                   transform hover:scale-[1.02] active:scale-100"
        >
          <span className="hidden sm:inline">Buscar</span>
          <Search className="w-5 h-5 sm:hidden" />
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 
                      bg-white rounded-lg shadow-2xl border border-gray-200 
                      py-2 z-50 max-h-96 overflow-y-auto">
          
          {/* Historial de búsquedas */}
          {!query && searchHistory.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">
                Búsquedas recientes
              </div>
              {searchHistory.map((term, index) => (
                <button
                  key={`history-${index}`}
                  onClick={() => {
                    setQuery(term);
                    onSearch(term, location !== 'Todo el país' ? location : undefined);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 
                           hover:bg-gray-50 transition-colors text-left"
                >
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{term}</span>
                </button>
              ))}
              <div className="h-px bg-gray-200 my-2" />
            </>
          )}

          {/* Sugerencias populares (cuando no hay query) */}
          {!query && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Búsquedas populares
              </div>
              {POPULAR_SEARCHES.map((search, index) => (
                <button
                  key={`popular-${index}`}
                  onClick={() => handleSelectSuggestion({
                    id: `popular-${index}`,
                    title: search.text,
                    type: search.type,
                    count: search.count,
                  })}
                  className="w-full px-4 py-3 flex items-center justify-between gap-3 
                           hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getTypeIcon(search.type)}</span>
                    <span className="text-sm text-gray-700">{search.text}</span>
                  </div>
                  <span className="text-xs text-gray-400">{search.count} anuncios</span>
                </button>
              ))}
            </>
          )}

          {/* Resultados de búsqueda */}
          {query && suggestions.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">
                Resultados
              </div>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-4 py-3 flex items-center justify-between gap-3 
                           hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
                    <span className="text-sm text-gray-700">
                      {highlightText(suggestion.title, suggestion.highlight || '')}
                    </span>
                  </div>
                  {suggestion.count && (
                    <span className="text-xs text-gray-400">{suggestion.count} resultados</span>
                  )}
                </button>
              ))}
            </>
          )}

          {/* Sin resultados */}
          {query && suggestions.length === 0 && !isSearching && (
            <div className="px-4 py-8 text-center text-gray-500">
              <p className="text-sm">No encontramos sugerencias para "{query}"</p>
              <p className="text-xs mt-1">Presiona Enter para buscar de todas formas</p>
            </div>
          )}

          {/* Tip de teclado */}
          <div className="px-4 py-2 mt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              💡 Tip: Presiona <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">/</kbd> para enfocar la búsqueda
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSearchBar;
