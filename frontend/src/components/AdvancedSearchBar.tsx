/**
 * @deprecated Este componente está deprecado.
 * Usar GlobalSearchBar con useDynamicFilters en su lugar.
 * 
 * AdvancedSearchBar.tsx contiene lógica hardcodeada de filtros
 * que ya no se sincroniza con la base de datos.
 * 
 * Migración:
 * import { GlobalSearchBar } from './GlobalSearchBar';
 * import { useDynamicFilters } from '../hooks/useDynamicFilters';
 * 
 * Pendiente de eliminación: Marzo 2026
 */

import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon } from './IconComponents';
import type { SearchFilters } from '../../types';

interface AdvancedSearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading: boolean;
  availableCategories: string[];
  availableProvinces: string[];
  availableTags: string[];
}

export const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  onSearch,
  isLoading,
  availableCategories,
  availableProvinces,
  availableTags,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sugerencias populares predefinidas
  const POPULAR_SEARCHES = [
    'Tractor',
    'Tractor John Deere',
    'Cosechadora',
    'Sembradora',
    'Vaquillonas',
    'Campo en venta',
    'Pulverizadora',
    'Semillas de soja',
    'Fertilizantes',
    'Alquiler de maquinaria',
  ];

  // Sugerencias inteligentes mejoradas
  const getSmartSuggestions = () => {
    if (!query.trim()) return [];
    
    const queryLower = query.toLowerCase();
    const suggestions: { text: string; type: 'tag' | 'category' | 'province' | 'popular' }[] = [];

    // 1. Buscar en búsquedas populares (prioridad alta)
    POPULAR_SEARCHES.forEach(search => {
      if (search.toLowerCase().includes(queryLower)) {
        suggestions.push({ text: search, type: 'popular' });
      }
    });

    // 2. Buscar en categorías
    availableCategories.forEach(cat => {
      if (cat.toLowerCase().includes(queryLower)) {
        suggestions.push({ text: cat, type: 'category' });
      }
    });

    // 3. Buscar en provincias
    availableProvinces.forEach(prov => {
      if (prov.toLowerCase().includes(queryLower)) {
        suggestions.push({ text: prov, type: 'province' });
      }
    });

    // 4. Buscar en tags
    availableTags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        suggestions.push({ text: tag, type: 'tag' });
      }
    });

    // Eliminar duplicados y limitar a 8 resultados
    const uniqueSuggestions = suggestions.filter((item, index, self) =>
      index === self.findIndex((t) => t.text === item.text)
    );

    return uniqueSuggestions.slice(0, 8);
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const filters: SearchFilters = {
      query: query.trim() || undefined,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      provinces: selectedProvinces.length > 0 ? selectedProvinces : undefined,
      subcategories: selectedSubcategories.length > 0 ? selectedSubcategories : undefined,
    };

    onSearch(filters);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const suggestions = getSmartSuggestions();
    
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          setQuery(suggestions[selectedIndex].text);
          setShowSuggestions(false);
          setSelectedIndex(-1);
          handleSearch();
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleProvince = (province: string) => {
    setSelectedProvinces(prev =>
      prev.includes(province)
        ? prev.filter(p => p !== province)
        : [...prev, province]
    );
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedCategories([]);
    setSelectedProvinces([]);
    setSelectedSubcategories([]);
    onSearch({});
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowCategoryDropdown(false);
        setShowProvinceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const smartSuggestions = getSmartSuggestions();

  return (
    <div className="w-full max-w-4xl mx-auto relative" ref={searchContainerRef}>
      <form onSubmit={handleSearch} className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-6 w-6 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Ej: Tractor en Buenos Aires..."
          className="block w-full p-4 pl-12 text-lg text-gray-900 border border-gray-300 bg-white focus:ring-brand-600 focus:border-brand-600 shadow-lg transition"
          style={{ borderRadius: '12px' }}
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          className="text-white absolute right-2.5 bottom-2.5 bg-brand-600 hover:bg-brand-500 focus:ring-4 focus:outline-none focus:ring-brand-300 font-medium text-sm px-8 py-3 transition"
          style={{ borderRadius: '8px' }}
          disabled={isLoading}
        >
          {isLoading ? 'Buscando...' : 'Buscar'}
        </button>

        {/* Sugerencias inteligentes */}
        {showSuggestions && smartSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto">
            {smartSuggestions.map((suggestion, idx) => {
              const getBadgeStyle = () => {
                switch (suggestion.type) {
                  case 'popular':
                    return 'bg-orange-100 text-orange-700';
                  case 'category':
                    return 'bg-brand-100 text-brand-600';
                  case 'province':
                    return 'bg-blue-100 text-blue-700';
                  case 'tag':
                    return 'bg-purple-100 text-purple-700';
                  default:
                    return 'bg-gray-100 text-gray-700';
                }
              };

              const getBadgeLabel = () => {
                switch (suggestion.type) {
                  case 'popular':
                    return '🔥 Popular';
                  case 'category':
                    return '📁 Categoría';
                  case 'province':
                    return '📍 Provincia';
                  case 'tag':
                    return '🏷️ Tag';
                  default:
                    return 'Sugerencia';
                }
              };

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(suggestion.text);
                    setShowSuggestions(false);
                    setSelectedIndex(-1);
                    handleSearch();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                    selectedIndex === idx 
                      ? 'bg-brand-600 text-white' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    selectedIndex === idx 
                      ? 'bg-white/20 text-white' 
                      : getBadgeStyle()
                  }`}>
                    {getBadgeLabel()}
                  </span>
                  <span className={`font-medium ${
                    selectedIndex === idx ? 'text-white' : 'text-gray-700'
                  }`}>
                    {suggestion.text}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </form>

      {/* Botones de categorías rápidas */}
      <div className="mt-6 grid grid-cols-3 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
        {[
          { name: 'Maquinaria', icon: 'icon-1.png', id: 'maquinaria' },
          { name: 'Ganadería', icon: 'icon-2.png', id: 'ganaderia' },
          { name: 'Insumos', icon: 'icon-3.png', id: 'insumos' },
          { name: 'Inmuebles', icon: 'icon-4.png', id: 'inmuebles' },
          { name: 'Servicios', icon: 'icon-5.png', id: 'servicios' },
          { name: 'Equipos', icon: 'icon-6.png', id: 'equipos' }
        ].map((cat) => (
          <a
            key={cat.id}
            href={`#${cat.id}`}
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById(cat.id);
              if (element) {
                const headerOffset = 100; // Altura del header sticky + espacio
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
              }
            }}
            className="rounded-lg p-4 transition-all duration-300 border-3 hover:border-white/30 hover:scale-105 shadow-lg flex flex-col items-center gap-2 aspect-square justify-center backdrop-blur-md relative overflow-hidden group"
            style={{ 
              border: '3px solid rgb(var(--color-brand-500))',
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Efecto de brillo en hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            
            <img 
              src={`/images/icons/${cat.icon}`} 
              alt={cat.name}
              className="w-14 h-14 object-contain relative z-10"
            />
            <span className="text-white text-sm font-medium text-center relative z-10">{cat.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
