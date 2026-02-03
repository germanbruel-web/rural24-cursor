// SmartSearchInput - Buscador con autocompletado inteligente
// Muestra sugerencias de subcategorías y atributos mientras el usuario escribe
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Folder, Tag, ChevronRight, Loader2 } from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

interface SubcategorySuggestion {
  type: 'subcategory';
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  categorySlug: string;
  icon?: string;
}

interface AttributeSuggestion {
  type: 'attribute';
  fieldName: string;
  fieldLabel: string;
  value: string;
  subcategoryId: string;
  subcategoryName: string;
  subcategorySlug: string;
  categoryName: string;
  categorySlug: string;
}

interface SuggestionsResponse {
  query: string;
  subcategories: SubcategorySuggestion[];
  attributes: { [fieldLabel: string]: AttributeSuggestion[] };
  cached: boolean;
}

interface SmartSearchInputProps {
  placeholder?: string;
  initialValue?: string;
  onSearch?: (query: string) => void;
  className?: string;
  autoFocus?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// HOOK: useDebounce
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const SmartSearchInput: React.FC<SmartSearchInputProps> = ({
  placeholder = 'Buscar tractores, cosechadoras, hacienda...',
  initialValue = '',
  onSearch,
  className = '',
  autoFocus = false,
  size = 'md',
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Estados
  const [query, setQuery] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Debounce del query
  const debouncedQuery = useDebounce(query, 200);
  
  // ============================================================================
  // FETCH SUGERENCIAS
  // ============================================================================
  
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions(null);
      setIsOpen(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${apiUrl}/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      
      if (response.ok) {
        const data: SuggestionsResponse = await response.json();
        setSuggestions(data);
        
        // Abrir dropdown si hay resultados
        const hasResults = 
          data.subcategories.length > 0 || 
          Object.keys(data.attributes).length > 0;
        setIsOpen(hasResults || searchQuery.length >= 2);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Efecto para buscar cuando cambia el query debounced
  useEffect(() => {
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  // Obtener todas las sugerencias como array plano para navegación con teclado
  const getAllSuggestions = (): (SubcategorySuggestion | AttributeSuggestion | 'search')[] => {
    const items: (SubcategorySuggestion | AttributeSuggestion | 'search')[] = [];
    
    if (suggestions) {
      // Subcategorías primero
      items.push(...suggestions.subcategories);
      
      // Luego atributos por grupo
      Object.values(suggestions.attributes).forEach(attrs => {
        items.push(...attrs);
      });
    }
    
    // Siempre agregar opción de búsqueda libre al final
    if (query.length >= 2) {
      items.push('search');
    }
    
    return items;
  };
  
  const handleSelect = (item: SubcategorySuggestion | AttributeSuggestion | 'search') => {
    if (item === 'search') {
      // Búsqueda libre
      handleFreeSearch();
    } else if (item.type === 'subcategory') {
      // Navegar a subcategoría
      navigate(`/buscar?cat=${item.categorySlug}&sub=${item.slug}`);
      setQuery(item.name);
    } else {
      // Navegar a subcategoría con filtro de atributo
      const params = new URLSearchParams({
        cat: item.categorySlug,
        sub: item.subcategorySlug,
        [`attr_${item.fieldName}`]: item.value,
      });
      navigate(`/buscar?${params.toString()}`);
      setQuery(item.value);
    }
    
    setIsOpen(false);
    inputRef.current?.blur();
  };
  
  const handleFreeSearch = () => {
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        navigate(`/buscar?search=${encodeURIComponent(query.trim())}`);
      }
      setIsOpen(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = getAllSuggestions();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : items.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          handleSelect(items[selectedIndex]);
        } else {
          handleFreeSearch();
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };
  
  const handleClear = () => {
    setQuery('');
    setSuggestions(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };
  
  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base',
    lg: 'h-14 text-lg',
  };
  
  const allItems = getAllSuggestions();
  
  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (suggestions && query.length >= 2) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`
            w-full ${sizeClasses[size]} pl-10 pr-10
            bg-white border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-green-500 focus:border-green-500
            placeholder:text-gray-400
            transition-shadow
          `}
        />
        
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Dropdown de sugerencias */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
        >
          {/* Subcategorías */}
          {suggestions?.subcategories && suggestions.subcategories.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b flex items-center gap-1">
                <Folder className="w-3 h-3" />
                SUBCATEGORÍAS
              </div>
              {suggestions.subcategories.map((sub, idx) => {
                const itemIndex = idx;
                const isSelected = selectedIndex === itemIndex;
                
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelect(sub)}
                    className={`
                      w-full px-3 py-2 text-left flex items-center justify-between
                      hover:bg-green-50 transition-colors
                      ${isSelected ? 'bg-green-50' : ''}
                    `}
                  >
                    <div>
                      <span className="font-medium text-gray-900">{sub.name}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        en {sub.categoryName}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Atributos por grupo */}
          {suggestions?.attributes && Object.entries(suggestions.attributes).map(([label, attrs], groupIdx) => {
            if (attrs.length === 0) return null;
            
            // Calcular índice base para este grupo
            const baseIndex = (suggestions.subcategories?.length || 0) + 
              Object.entries(suggestions.attributes)
                .slice(0, groupIdx)
                .reduce((sum, [_, a]) => sum + a.length, 0);
            
            return (
              <div key={label}>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-t flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {label.toUpperCase()}
                </div>
                {attrs.map((attr, idx) => {
                  const itemIndex = baseIndex + idx;
                  const isSelected = selectedIndex === itemIndex;
                  
                  return (
                    <button
                      key={`${attr.subcategoryId}-${attr.value}`}
                      onClick={() => handleSelect(attr)}
                      className={`
                        w-full px-3 py-2 text-left flex items-center justify-between
                        hover:bg-green-50 transition-colors
                        ${isSelected ? 'bg-green-50' : ''}
                      `}
                    >
                      <div>
                        <span className="font-medium text-gray-900">{attr.value}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          en {attr.subcategoryName}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  );
                })}
              </div>
            );
          })}
          
          {/* Opción de búsqueda libre */}
          {query.length >= 2 && (
            <button
              onClick={() => handleSelect('search')}
              className={`
                w-full px-3 py-3 text-left flex items-center gap-2
                border-t hover:bg-gray-50 transition-colors
                ${selectedIndex === allItems.length - 1 ? 'bg-gray-50' : ''}
              `}
            >
              <Search className="w-4 h-4 text-green-600" />
              <span className="text-gray-700">
                Buscar <span className="font-semibold text-green-600">"{query}"</span> en todos los avisos
              </span>
            </button>
          )}
          
          {/* Sin resultados */}
          {suggestions && 
           suggestions.subcategories.length === 0 && 
           Object.keys(suggestions.attributes).length === 0 &&
           query.length >= 2 && (
            <div className="px-3 py-4 text-center text-gray-500">
              <p className="text-sm">No encontramos categorías o atributos que coincidan</p>
              <p className="text-xs mt-1">Presioná Enter para buscar en todos los avisos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearchInput;
