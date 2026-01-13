// ====================================================================
// USE DYNAMIC FILTERS HOOK V2
// Carga filtros con CONTADORES desde backend según contexto
// ====================================================================

import { useState, useEffect, useCallback } from 'react';
import { 
  getFiltersConfig, 
  type FilterConfig, 
  type FiltersResponse,
  type SubcategoryInfo,
  type FilterOption 
} from '../services/filtersService';
import { PROVINCES } from '../constants/locations';

// ====================================================================
// TIPOS EXPORTADOS
// ====================================================================

export interface DynamicFiltersState {
  filters: FilterConfig[];
  subcategories: SubcategoryInfo[];
  category: { id: string; name: string; slug: string } | null;
  subcategory: { id: string; name: string; slug: string } | null;
  totalAds: number;
  loading: boolean;
  error: string | null;
}

interface UseDynamicFiltersParams {
  categorySlug?: string;
  subcategorySlug?: string;
  provinceSlug?: string;
  categoryId?: string;
  subcategoryId?: string;
}

// Re-exportar tipos útiles
export type { FilterConfig, FilterOption, SubcategoryInfo };

// ====================================================================
// HOOK PRINCIPAL
// ====================================================================

export function useDynamicFilters(params: UseDynamicFiltersParams) {
  const [state, setState] = useState<DynamicFiltersState>({
    filters: [],
    subcategories: [],
    category: null,
    subcategory: null,
    totalAds: 0,
    loading: false,
    error: null,
  });

  const loadFilters = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await getFiltersConfig({
        categorySlug: params.categorySlug,
        subcategorySlug: params.subcategorySlug,
        provinceSlug: params.provinceSlug,
        categoryId: params.categoryId,
        subcategoryId: params.subcategoryId,
      });

      // Si no hay datos del backend para provincias, usar constante local
      const filtersWithFallback = response.filters.map(filter => {
        if (filter.field_name === 'province' && filter.options.length === 0) {
          return {
            ...filter,
            options: PROVINCES.map(prov => ({
              value: prov,
              label: prov,
              count: 0,
              disabled: false,
            })),
          };
        }
        return filter;
      });

      setState({
        filters: filtersWithFallback,
        subcategories: response.subcategories || [],
        category: response.category,
        subcategory: response.subcategory,
        totalAds: response.total_ads || 0,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error cargando filtros:', error);
      setState({
        filters: getDefaultFilters(),
        subcategories: [],
        category: null,
        subcategory: null,
        totalAds: 0,
        loading: false,
        error: 'Error cargando filtros',
      });
    }
  }, [
    params.categorySlug, 
    params.subcategorySlug, 
    params.provinceSlug,
    params.categoryId, 
    params.subcategoryId
  ]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  return {
    ...state,
    reload: loadFilters,
  };
}

// ====================================================================
// FILTROS POR DEFECTO (Fallback)
// ====================================================================

function getDefaultFilters(): FilterConfig[] {
  return [
    {
      field_name: 'province',
      field_label: 'Provincia',
      filter_type: 'links',
      filter_order: 1,
      is_dynamic: false,
      visible_when: { always: true },
      options: PROVINCES.map(prov => ({
        value: prov,
        label: prov,
        count: 0,
        disabled: false,
      })),
    },
  ];
}
