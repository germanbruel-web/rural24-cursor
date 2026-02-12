/**
 * useSearchSuggestions.ts
 * Hook para obtener sugerencias de búsqueda desde la API
 * Conecta con /api/search/suggestions (datos reales de BD)
 */

import { useState, useEffect, useRef, useCallback } from 'react';

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

export interface SearchSuggestion {
  type: 'subcategory' | 'attribute' | 'history';
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  url?: string;
  category?: string;
}

interface UseSearchSuggestionsOptions {
  debounceMs?: number;
  minChars?: number;
  limit?: number;
}

interface UseSearchSuggestionsReturn {
  suggestions: SearchSuggestion[];
  loading: boolean;
  error: string | null;
  searchHistory: string[];
  clearHistory: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function useSearchSuggestions(
  query: string,
  options: UseSearchSuggestionsOptions = {}
): UseSearchSuggestionsReturn {
  const {
    debounceMs = 300,
    minChars = 2,
    limit = 5,
  } = options;

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Cargar historial de búsquedas al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem('rural24_search_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSearchHistory(Array.isArray(parsed) ? parsed.slice(0, 5) : []);
      }
    } catch (err) {
      console.warn('Error cargando historial:', err);
    }
  }, []);

  // Guardar búsqueda en historial
  const saveToHistory = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setSearchHistory((prev) => {
      const filtered = prev.filter((h) => h !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, 5);
      
      try {
        localStorage.setItem('rural24_search_history', JSON.stringify(updated));
      } catch (err) {
        console.warn('Error guardando historial:', err);
      }
      
      return updated;
    });
  }, []);

  // Limpiar historial
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('rural24_search_history');
    } catch (err) {
      console.warn('Error limpiando historial:', err);
    }
  }, []);

  // Fetcher de sugerencias
  const fetchSuggestions = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < minChars) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      // Cancelar request anterior si existe
      if (abortController.current) {
        abortController.current.abort();
      }

      abortController.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const url = `${API_BASE_URL}/api/search/suggestions?q=${encodeURIComponent(
          searchQuery
        )}&limit=${limit}`;

        const response = await fetch(url, {
          signal: abortController.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Transformar respuesta de API en formato unificado
        const transformed: SearchSuggestion[] = [];

        // 1. Subcategorías
        if (data.subcategories && Array.isArray(data.subcategories)) {
          data.subcategories.forEach((sub: SubcategorySuggestion) => {
            transformed.push({
              type: 'subcategory',
              id: sub.id,
              title: sub.name,
              subtitle: sub.categoryName,
              icon: sub.icon || '📂',
              url: `/#/search?cat=${sub.categorySlug}&sub=${sub.slug}`,
              category: sub.categoryName,
            });
          });
        }

        // 2. Atributos (marcas, razas, etc.)
        if (data.attributes && typeof data.attributes === 'object') {
          Object.entries(data.attributes).forEach(([fieldLabel, items]) => {
            if (Array.isArray(items)) {
              items.forEach((attr: AttributeSuggestion, index: number) => {
                transformed.push({
                  type: 'attribute',
                  id: `${attr.fieldName}-${attr.value}-${index}`,
                  title: attr.value,
                  subtitle: `${fieldLabel} en ${attr.subcategoryName}`,
                  icon: getIconForFieldName(attr.fieldName),
                  url: `/#/search?cat=${attr.categorySlug}&sub=${attr.subcategorySlug}&${attr.fieldName}=${encodeURIComponent(attr.value)}`,
                  category: attr.categoryName,
                });
              });
            }
          });
        }

        setSuggestions(transformed.slice(0, limit * 2)); // Mostrar más resultados
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching suggestions:', err);
          setError('Error al cargar sugerencias');
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [minChars, limit]
  );

  // Efecto con debounce
  useEffect(() => {
    // Limpiar timer anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query || query.length < minChars) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Nuevo timer
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(query);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [query, debounceMs, minChars, fetchSuggestions]);

  return {
    suggestions,
    loading,
    error,
    searchHistory,
    clearHistory,
  };
}

// Helper: Obtener icono según tipo de campo
function getIconForFieldName(fieldName: string): string {
  const iconMap: Record<string, string> = {
    marca: '🏷️',
    brand: '🏷️',
    modelo: '🔧',
    model: '🔧',
    raza: '🐄',
    tipobovino: '🐄',
    tipoequino: '🐴',
    tipoovino: '🐑',
    tipoporcino: '🐷',
    provincia: '📍',
    province: '📍',
    location: '📍',
  };

  return iconMap[fieldName.toLowerCase()] || '🔍';
}
