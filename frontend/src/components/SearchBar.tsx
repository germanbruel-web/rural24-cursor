/**
 * @deprecated Este componente está deprecado.
 * Usar GlobalSearchBar en su lugar.
 * 
 * SearchBar.tsx contiene datos hardcodeados (POPULAR_SUGGESTIONS)
 * que ya no se mantienen actualizados.
 * 
 * Migración:
 * import { GlobalSearchBar } from './GlobalSearchBar';
 * <GlobalSearchBar onSearch={handleSearch} />
 * 
 * Pendiente de eliminación: Marzo 2026
 */

import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon } from './IconComponents';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const POPULAR_SUGGESTIONS = [
  'Tractor John Deere',
  'Vaquillonas Angus',
  'Semillas de Soja',
  'Campo en La Pampa',
  'Cosechadora Case',
  'Asesoramiento agronómico',
];

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = POPULAR_SUGGESTIONS.filter(suggestion =>
    suggestion.toLowerCase().includes(query.toLowerCase())
  );

  const handleSearch = (e: React.FormEvent | undefined, searchQuery: string) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setQuery(searchQuery.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(undefined, suggestion);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    // Escape special characters to prevent regex errors
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use 'g' flag for global search, but no 'i' for case-sensitivity
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'g'));
    
    return (
      <span>
        {parts.map((part, i) =>
          // Direct, case-sensitive comparison
          part === highlight ? (
            <strong key={i} className="font-bold text-brand-600">
              {part}
            </strong>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative" ref={searchContainerRef}>
      <form onSubmit={(e) => handleSearch(e, query)} className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-6 w-6 text-gray-400" />
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Ej: Tractor usado en Córdoba..."
          className="block w-full p-4 pl-12 text-lg text-gray-900 border border-gray-300 rounded-full bg-white focus:ring-brand-600 focus:border-brand-600 shadow-lg transition"
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          className="text-white absolute right-2.5 bottom-2.5 bg-brand-600 hover:bg-brand-500 focus:ring-4 focus:outline-none focus:ring-brand-300 font-medium rounded-full text-sm px-8 py-3 transition"
          disabled={isLoading}
        >
          Buscar
        </button>
      </form>
      
      {showSuggestions && query.length > 0 && filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-2xl mt-2 shadow-lg overflow-hidden text-left">
          {filteredSuggestions.map((suggestion, index) => (
            <li 
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-5 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              {getHighlightedText(suggestion, query)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};