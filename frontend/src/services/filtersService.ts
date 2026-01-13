// ====================================================================
// FILTERS SERVICE - Obtener filtros dinámicos desde Backend BFF
// ====================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ====================================================================
// TIPOS V2 - Con contadores y estructura jerárquica
// ====================================================================

export interface FilterOption {
  value: string;
  label: string;
  count: number;
  disabled: boolean;
}

export interface FilterConfig {
  field_name: string;
  field_label: string;
  filter_type: 'select' | 'range' | 'checkbox' | 'chips' | 'links';
  filter_order: number;
  is_dynamic: boolean;
  visible_when: {
    always?: boolean;
    requires_category?: boolean;
    requires_subcategory?: boolean;
    requires_province?: boolean;
  };
  options: FilterOption[];
  range?: { min: number; max: number };
}

export interface SubcategoryInfo {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface FiltersResponse {
  category: { id: string; name: string; slug: string } | null;
  subcategory: { id: string; name: string; slug: string } | null;
  subcategories: SubcategoryInfo[];
  filters: FilterConfig[];
  total_ads: number;
  cached_at: string;
}

/**
 * Obtiene los filtros dinámicos configurados para una categoría/subcategoría
 * Incluye contadores reales de ads
 */
export async function getFiltersConfig(params: {
  categoryId?: string;
  subcategoryId?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  provinceSlug?: string;
}): Promise<FiltersResponse> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.categoryId) searchParams.set('category_id', params.categoryId);
    if (params.subcategoryId) searchParams.set('subcategory_id', params.subcategoryId);
    if (params.categorySlug) searchParams.set('cat', params.categorySlug);
    if (params.subcategorySlug) searchParams.set('sub', params.subcategorySlug);
    if (params.provinceSlug) searchParams.set('prov', params.provinceSlug);

    const response = await fetch(`${API_URL}/api/config/filters?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error obteniendo filtros:', error);
    
    // Retornar respuesta vacía en caso de error
    return {
      category: null,
      subcategory: null,
      subcategories: [],
      filters: [],
      total_ads: 0,
      cached_at: new Date().toISOString(),
    };
  }
}

/**
 * Aplica filtros a una lista de productos (filtrado local)
 */
export function applyFilters(
  products: any[],
  filters: Record<string, any>,
  filterConfigs: FilterConfig[]
): any[] {
  return products.filter(product => {
    for (const config of filterConfigs) {
      const filterValue = filters[config.field_name];
      
      if (filterValue === undefined || filterValue === null || filterValue === '') {
        continue; // No hay filtro aplicado para este campo
      }

      const productValue = config.field_name === 'province' 
        ? product.province 
        : config.field_name === 'price'
          ? product.price
          : config.field_name === 'city'
            ? product.city
            : product.attributes?.[config.field_name];

      switch (config.filter_type) {
        case 'select':
        case 'links':
          if (productValue !== filterValue) return false;
          break;
          
        case 'checkbox':
        case 'chips':
          // filterValue es array de valores seleccionados
          if (Array.isArray(filterValue) && filterValue.length > 0) {
            if (!filterValue.includes(productValue)) return false;
          }
          break;
          
        case 'range':
          // filterValue es {min, max}
          if (typeof filterValue === 'object') {
            if (filterValue.min !== undefined && productValue < filterValue.min) return false;
            if (filterValue.max !== undefined && productValue > filterValue.max) return false;
          }
          break;
      }
    }
    
    return true;
  });
}
