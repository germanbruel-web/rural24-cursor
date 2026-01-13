// GET /api/config/filters?cat=X&sub=Y&prov=Z
// Retorna filtros dinámicos con CONTADORES reales desde ads
// ====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

// ====================================================================
// TIPOS
// ====================================================================

interface FilterOption {
  value: string;
  label: string;
  count: number;
  disabled: boolean;
}

interface FilterConfig {
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

interface SubcategoryInfo {
  id: string;
  name: string;
  slug: string;
  count: number;
}

interface FiltersResponse {
  category: { id: string; name: string; slug: string } | null;
  subcategory: { id: string; name: string; slug: string } | null;
  subcategories: SubcategoryInfo[];
  filters: FilterConfig[];
  total_ads: number;
  cached_at: string;
}

// ====================================================================
// HELPER: Contar ads agrupados por campo
// ====================================================================
function countByField(
  ads: any[], 
  fieldName: string, 
  isAttribute: boolean = false
): Map<string, number> {
  const counts = new Map<string, number>();
  
  for (const ad of ads) {
    let value: string | undefined;
    
    if (isAttribute) {
      value = ad.attributes?.[fieldName];
    } else {
      value = ad[fieldName];
    }
    
    if (value && typeof value === 'string') {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  
  return counts;
}

// ====================================================================
// HELPER: Convertir Map a FilterOptions ordenadas
// ====================================================================
function mapToOptions(counts: Map<string, number>): FilterOption[] {
  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: value,
      count,
      disabled: count === 0,
    }))
    .sort((a, b) => b.count - a.count); // Ordenar por cantidad descendente
}

// ====================================================================
// MAIN HANDLER
// ====================================================================
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase no configurado' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(request.url);
    
    // Parámetros de entrada (soporta slugs y IDs)
    const categorySlug = searchParams.get('cat') || searchParams.get('category');
    const subcategorySlug = searchParams.get('sub') || searchParams.get('subcategory');
    const provinceSlug = searchParams.get('prov') || searchParams.get('province');
    const categoryId = searchParams.get('category_id');
    const subcategoryId = searchParams.get('subcategory_id');

    // ================================================================
    // 1. RESOLVER CATEGORÍA
    // ================================================================
    let categoryInfo: { id: string; name: string; slug: string } | null = null;
    
    if (categoryId) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('id', categoryId)
        .single();
      categoryInfo = cat;
    } else if (categorySlug) {
      // Intentar búsqueda exacta primero
      let { data: cat } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('slug', categorySlug)
        .single();
      
      // Si no encuentra, buscar case-insensitive
      if (!cat) {
        const { data: catIlike } = await supabase
          .from('categories')
          .select('id, name, slug')
          .ilike('slug', categorySlug)
          .single();
        cat = catIlike;
      }
      
      // Si aún no encuentra, buscar por nombre similar
      if (!cat) {
        const { data: catByName } = await supabase
          .from('categories')
          .select('id, name, slug')
          .ilike('name', `%${categorySlug.replace(/-/g, '%')}%`)
          .single();
        cat = catByName;
      }
      
      categoryInfo = cat;
    }

    // ================================================================
    // 2. RESOLVER SUBCATEGORÍA
    // ================================================================
    let subcategoryInfo: { id: string; name: string; slug: string } | null = null;
    
    if (subcategoryId) {
      const { data: sub } = await supabase
        .from('subcategories')
        .select('id, name, slug, category_id')
        .eq('id', subcategoryId)
        .single();
      subcategoryInfo = sub;
      
      // Si no teníamos categoría, obtenerla
      if (!categoryInfo && sub?.category_id) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id, name, slug')
          .eq('id', sub.category_id)
          .single();
        categoryInfo = cat;
      }
    } else if (subcategorySlug && categoryInfo) {
      const { data: sub } = await supabase
        .from('subcategories')
        .select('id, name, slug')
        .eq('slug', subcategorySlug)
        .eq('category_id', categoryInfo.id)
        .single();
      subcategoryInfo = sub;
    }

    // ================================================================
    // 3. OBTENER ADS FILTRADOS PARA CONTEOS
    // ================================================================
    let adsQuery = supabase
      .from('ads')
      .select('id, category_id, subcategory_id, province, city, attributes, price, currency')
      .eq('status', 'active');

    // Aplicar filtros actuales para conteos contextuales
    if (categoryInfo) {
      adsQuery = adsQuery.eq('category_id', categoryInfo.id);
    }
    if (subcategoryInfo) {
      adsQuery = adsQuery.eq('subcategory_id', subcategoryInfo.id);
    }
    if (provinceSlug) {
      // Convertir slug a nombre (básico)
      const provinceName = provinceSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      adsQuery = adsQuery.eq('province', provinceName);
    }

    const { data: ads, error: adsError } = await adsQuery;

    if (adsError) {
      console.error('Error obteniendo ads para conteo:', adsError);
    }

    const filteredAds = ads || [];
    const totalAds = filteredAds.length;

    // ================================================================
    // 4. OBTENER SUBCATEGORÍAS CON CONTEO (solo si hay categoría)
    // ================================================================
    let subcategoriesWithCount: SubcategoryInfo[] = [];
    
    if (categoryInfo) {
      // Obtener todas las subcategorías de esta categoría
      const { data: allSubs } = await supabase
        .from('subcategories')
        .select('id, name, slug')
        .eq('category_id', categoryInfo.id)
        .eq('is_active', true)
        .order('sort_order');

      // Obtener conteos de ads agrupados por subcategory_id
      const { data: adsForSubCount } = await supabase
        .from('ads')
        .select('subcategory_id')
        .eq('status', 'active')
        .eq('category_id', categoryInfo.id);

      // Contar por subcategory_id
      const subCounts = new Map<string, number>();
      for (const ad of adsForSubCount || []) {
        if (ad.subcategory_id) {
          subCounts.set(ad.subcategory_id, (subCounts.get(ad.subcategory_id) || 0) + 1);
        }
      }

      subcategoriesWithCount = (allSubs || []).map(sub => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-'),
        count: subCounts.get(sub.id) || 0,
      }));
    }

    // ================================================================
    // 5. CONSTRUIR FILTROS FIJOS (Provincia, Localidad, Precio)
    // ================================================================
    const filters: FilterConfig[] = [];

    // 5a. Filtro de Provincia (siempre visible)
    const provinceCounts = countByField(filteredAds, 'province');
    filters.push({
      field_name: 'province',
      field_label: 'Provincia',
      filter_type: 'links',
      filter_order: 1,
      is_dynamic: false,
      visible_when: { always: true },
      options: mapToOptions(provinceCounts),
    });

    // 5b. Filtro de Localidad (visible cuando hay provincia)
    if (provinceSlug) {
      const cityCounts = countByField(filteredAds, 'city');
      if (cityCounts.size > 0) {
        filters.push({
          field_name: 'city',
          field_label: 'Localidad',
          filter_type: 'links',
          filter_order: 2,
          is_dynamic: false,
          visible_when: { requires_province: true },
          options: mapToOptions(cityCounts),
        });
      }
    }

    // 5c. Filtro de Precio (siempre visible)
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    filteredAds.forEach(ad => {
      if (typeof ad.price === 'number' && ad.price > 0) {
        minPrice = Math.min(minPrice, ad.price);
        maxPrice = Math.max(maxPrice, ad.price);
      }
    });

    if (minPrice !== Infinity && maxPrice !== -Infinity) {
      filters.push({
        field_name: 'price',
        field_label: 'Precio',
        filter_type: 'range',
        filter_order: 3,
        is_dynamic: false,
        visible_when: { always: true },
        options: [],
        range: { min: Math.floor(minPrice), max: Math.ceil(maxPrice) },
      });
    }

    // ================================================================
    // 6. OBTENER ATRIBUTOS DINÁMICOS (solo si hay subcategoría)
    // ================================================================
    if (subcategoryInfo) {
      const { data: dynamicAttrs } = await supabase
        .from('dynamic_attributes')
        .select('field_name, field_label, field_type, field_options, filter_type, filter_order, min_value, max_value')
        .eq('subcategory_id', subcategoryInfo.id)
        .eq('is_filterable', true)
        .eq('is_active', true)
        .order('filter_order', { ascending: true });

      for (const attr of dynamicAttrs || []) {
        const filterType = (attr.filter_type || 'select') as FilterConfig['filter_type'];
        
        if (filterType === 'range') {
          // Calcular rango desde los ads
          let attrMin = Infinity;
          let attrMax = -Infinity;
          
          filteredAds.forEach(ad => {
            const value = ad.attributes?.[attr.field_name];
            const numValue = typeof value === 'number' ? value : parseFloat(value);
            if (!isNaN(numValue)) {
              attrMin = Math.min(attrMin, numValue);
              attrMax = Math.max(attrMax, numValue);
            }
          });

          if (attrMin !== Infinity) {
            filters.push({
              field_name: attr.field_name,
              field_label: attr.field_label,
              filter_type: 'range',
              filter_order: 10 + (attr.filter_order || 99),
              is_dynamic: true,
              visible_when: { requires_subcategory: true },
              options: [],
              range: {
                min: attr.min_value ? Number(attr.min_value) : Math.floor(attrMin),
                max: attr.max_value ? Number(attr.max_value) : Math.ceil(attrMax),
              },
            });
          }
        } else {
          // select, checkbox, chips - obtener opciones con conteo
          let options: FilterOption[] = [];

          if (attr.field_options && Array.isArray(attr.field_options) && attr.field_options.length > 0) {
            // Usar opciones predefinidas y calcular conteos
            const attrCounts = countByField(filteredAds, attr.field_name, true);
            options = attr.field_options.map((opt: string) => ({
              value: opt,
              label: opt,
              count: attrCounts.get(opt) || 0,
              disabled: (attrCounts.get(opt) || 0) === 0,
            }));
          } else {
            // Obtener valores únicos desde ads
            const attrCounts = countByField(filteredAds, attr.field_name, true);
            options = mapToOptions(attrCounts);
          }

          if (options.length > 0) {
            filters.push({
              field_name: attr.field_name,
              field_label: attr.field_label,
              filter_type: filterType,
              filter_order: 10 + (attr.filter_order || 99),
              is_dynamic: true,
              visible_when: { requires_subcategory: true },
              options,
            });
          }
        }
      }
      
      // ================================================================
      // 6b. FALLBACK: Inferir filtros de atributos comunes si no hay dynamic_attributes
      // ================================================================
      const commonAttrNames = ['marca', 'brand', 'modelo', 'model', 'año', 'year', 'anio', 'condicion', 'estado'];
      const existingAttrFilters = filters.filter(f => f.is_dynamic).map(f => f.field_name);
      
      // Recolectar todos los atributos únicos de los ads
      const allAttrKeys = new Set<string>();
      filteredAds.forEach(ad => {
        if (ad.attributes && typeof ad.attributes === 'object') {
          Object.keys(ad.attributes).forEach(key => allAttrKeys.add(key));
        }
      });
      
      // Para cada atributo común que exista en los ads pero no tenga filtro
      for (const attrName of commonAttrNames) {
        if (existingAttrFilters.includes(attrName)) continue;
        if (!allAttrKeys.has(attrName)) continue;
        
        const attrCounts = countByField(filteredAds, attrName, true);
        const options = mapToOptions(attrCounts);
        
        if (options.length > 0) {
          // Determinar label bonito
          const labelMap: Record<string, string> = {
            'marca': 'Marca',
            'brand': 'Marca', 
            'modelo': 'Modelo',
            'model': 'Modelo',
            'año': 'Año',
            'year': 'Año',
            'anio': 'Año',
            'condicion': 'Condición',
            'estado': 'Estado',
          };
          
          filters.push({
            field_name: attrName,
            field_label: labelMap[attrName] || attrName,
            filter_type: 'links',
            filter_order: 20 + commonAttrNames.indexOf(attrName),
            is_dynamic: true,
            visible_when: { requires_subcategory: true },
            options,
          });
          
          console.log(`✅ Filtro inferido: ${attrName} con ${options.length} opciones`);
        }
      }
    }

    // Ordenar filtros por filter_order
    filters.sort((a, b) => a.filter_order - b.filter_order);

    // ================================================================
    // 7. CONSTRUIR RESPUESTA
    // ================================================================
    const response: FiltersResponse = {
      category: categoryInfo,
      subcategory: subcategoryInfo,
      subcategories: subcategoriesWithCount,
      filters,
      total_ads: totalAds,
      cached_at: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;

    return NextResponse.json(response, {
      headers: {
        'X-Response-Time': `${duration}ms`,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });

  } catch (error) {
    console.error('Error en /api/config/filters:', error);
    return NextResponse.json(
      { error: 'Error interno', details: String(error) },
      { status: 500 }
    );
  }
}
