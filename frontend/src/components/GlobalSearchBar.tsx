/**
 * GlobalSearchBar.tsx
 * Buscador global inteligente con sugerencias desde BD
 * Design System RURAL24 - Mobile First
 * 
 * Features:
 * - Sugerencias en tiempo real desde API
 * - Historial de búsquedas (localStorage)
 * - Navegación por teclado (↑↓, Enter, Esc)
 * - Highlight de coincidencias
 * - Links prearmados con filtros
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import { searchAnalytics } from '../services/searchAnalytics';

interface GlobalSearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  onSearch,
  placeholder = 'Tractores, campos, semillas...',
  autoFocus = false,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hook para obtener sugerencias
  const { suggestions, loading, searchHistory, clearHistory } = useSearchSuggestions(query, {
    debounceMs: 300,
    minChars: 2,
    limit: 5,
  });

  // Lista combinada: historial + sugerencias
  const displayItems = query.trim()
    ? suggestions
    : searchHistory.map((term, idx) => ({
        type: 'history' as const,
        id: `history-${idx}`,
        title: term,
        subtitle: 'Búsqueda reciente',
        icon: '🕐',
      }));

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Keyboard shortcuts: "/" para focus, Esc para cerrar
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Navegación por teclado en dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || displayItems.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < displayItems.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && displayItems[selectedIndex]) {
          handleSelectItem(displayItems[selectedIndex]);
        } else if (query.trim()) {
          handleSubmit(e as any);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Seleccionar sugerencia
  const handleSelectItem = useCallback(
    (item: typeof displayItems[0]) => {
      // Track en analytics
      searchAnalytics.trackSearch({
        query: item.title,
        source: 'header',
        filters: item.type === 'subcategory' ? { type: item.type } : undefined,
      });

      if (item.type === 'history') {
        setQuery(item.title);
        setShowDropdown(false);
        if (onSearch) {
          onSearch(item.title);
        } else {
          // Navegar a búsqueda genérica
          window.location.hash = `#/search?q=${encodeURIComponent(item.title)}`;
        }
      } else {
        // Navegar a URL prearmada con filtros
        if (item.url) {
          window.location.hash = item.url.replace('/#/', '');
        }
        setShowDropdown(false);
        setQuery('');
      }
      setSelectedIndex(-1);
    },
    [onSearch]
  );

  // Submit del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // Track en analytics
    searchAnalytics.trackSearch({
      query: trimmed,
      source: 'header',
    });

    // Guardar en historial (lo hace el hook automáticamente)
    setShowDropdown(false);

    if (onSearch) {
      onSearch(trimmed);
    } else {
      // Navegar a página de búsqueda
      window.location.hash = `#/search?q=${encodeURIComponent(trimmed)}`;
    }

    setQuery('');
    setSelectedIndex(-1);
  };

  // Limpiar input
  const handleClear = () => {
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Highlight de texto (XSS-safe: usa React text nodes, no innerHTML)
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;

    try {
      // Escapar caracteres especiales de regex para prevenir ReDoS
      const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
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
    } catch {
      return text;
    }
  };

  return (
    <div className={`relative flex-1 max-w-2xl ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Input con ícono de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full pl-10 pr-32 py-2.5 text-sm border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-[#16a135]/20 focus:border-[#16a135]
                     transition-all bg-gray-50 hover:bg-white
                     placeholder:text-gray-400"
            autoComplete="off"
          />

          {/* Botón limpiar */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-24 top-1/2 -translate-y-1/2 p-1 
                       text-gray-400 hover:text-gray-600 hover:bg-gray-200 
                       rounded-full transition-colors"
              tabIndex={-1}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="absolute right-24 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-[#16a135] animate-spin" />
            </div>
          )}

          {/* Botón Buscar - Minimalista con leve verde */}
          <button
            type="submit"
            disabled={!query.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 
                     px-4 py-1.5 
                     bg-gradient-to-b from-gray-50 to-gray-100 
                     hover:from-[#16a135]/5 hover:to-[#16a135]/10
                     border border-gray-200
                     text-[#16a135] font-medium text-sm 
                     rounded-md 
                     transition-all duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed
                     disabled:text-gray-400
                     shadow-sm hover:shadow"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Dropdown de sugerencias */}
      {showDropdown && displayItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 
                   bg-white rounded-lg shadow-xl border border-gray-200 
                   py-2 z-50 max-h-96 overflow-y-auto"
        >
          {/* Header según contexto */}
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
              {query.trim() ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5" />
                  Sugerencias
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  Búsquedas recientes
                </>
              )}
            </div>

            {/* Botón limpiar historial */}
            {!query.trim() && searchHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Lista de sugerencias */}
          {displayItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleSelectItem(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left
                       transition-colors group
                       ${
                         selectedIndex === index
                           ? 'bg-green-50 text-green-900'
                           : 'hover:bg-gray-50 text-gray-900'
                       }`}
            >
              {/* Icono */}
              <span className="text-lg flex-shrink-0">{item.icon}</span>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {query.trim() && item.type !== 'history'
                    ? highlightText(item.title, query)
                    : item.title}
                </div>
                {item.subtitle && (
                  <div className="text-xs text-gray-500 truncate">
                    {item.subtitle}
                  </div>
                )}
              </div>

              {/* Flecha */}
              <ChevronRight
                className={`w-4 h-4 flex-shrink-0 transition-transform
                         ${
                           selectedIndex === index
                             ? 'text-green-600 translate-x-0.5'
                             : 'text-gray-300 group-hover:text-gray-400'
                         }`}
              />
            </button>
          ))}

          {/* Footer hint */}
          <div className="px-4 py-2 mt-1 border-t border-gray-100">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span>Usa</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                ↑↓
              </kbd>
              <span>para navegar,</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                Enter
              </kbd>
              <span>para buscar</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
