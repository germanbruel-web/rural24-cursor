// GET /api/search/suggestions?q=texto
// Retorna sugerencias de subcategorías y atributos para autocompletado
// ====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

// ====================================================================
// TIPOS
// ====================================================================

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
  attributes: {
    [fieldLabel: string]: AttributeSuggestion[];
  };
  cached: boolean;
}

// ====================================================================
// CACHE EN MEMORIA (para desarrollo, en producción usar Redis/KV)
// ====================================================================
let cachedData: {
  subcategories: any[];
  attributes: any[];
  cachedAt: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function getCachedData(supabase: any) {
  const now = Date.now();
  
  if (cachedData && (now - cachedData.cachedAt) < CACHE_TTL) {
    return cachedData;
  }
  
  // 1. Cargar subcategorías con sus categorías padre (single-level join)
  const { data: subcategories, error: subError } = await supabase
    .from('subcategories')
    .select(`
      id,
      name,
      display_name,
      slug,
      category_id,
      categories (
        id,
        name,
        display_name,
        slug,
        icon
      )
    `)
    .eq('is_active', true)
    .order('sort_order');
  
  if (subError) {
    console.error('❌ Error loading subcategories for suggestions:', subError.message);
  }

  // Build category lookup from subcategories (avoid nested joins)
  const categoryBySubId: Record<string, any> = {};
  for (const sub of (subcategories || [])) {
    if (sub.categories) {
      categoryBySubId[sub.id] = sub.categories;
    }
  }

  // 2. Cargar atributos dinámicos (single-level join, no nested)
  let attributes: any[] = [];
  try {
    const { data: attrs, error: attrError } = await supabase
      .from('dynamic_attributes')
      .select(`
        id,
        field_name,
        field_label,
        field_options,
        subcategory_id
      `)
      .eq('is_active', true)
      .not('field_options', 'is', null);
    
    if (attrError) {
      console.error('❌ Error loading attributes for suggestions:', attrError.message);
    } else {
      // Enrich attributes with subcategory/category info from lookup
      attributes = (attrs || []).map((attr: any) => {
        const sub = (subcategories || []).find((s: any) => s.id === attr.subcategory_id);
        const cat = sub ? categoryBySubId[sub.id] : null;
        return {
          ...attr,
          subcategories: sub ? {
            id: sub.id,
            name: sub.name,
            display_name: sub.display_name,
            slug: sub.slug,
            category_id: sub.category_id,
            categories: cat,
          } : null,
        };
      }).filter((a: any) => a.subcategories !== null);
    }
  } catch (e) {
    console.error('❌ Exception loading attributes:', e);
  }
  
  cachedData = {
    subcategories: subcategories || [],
    attributes,
    cachedAt: now,
  };
  
  return cachedData;
}

// ====================================================================
// HELPER: Normalizar texto para comparación
// ====================================================================
function normalize(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .trim();
}

// ====================================================================
// HELPER: Verificar si hay match
// ====================================================================
function matches(text: string, query: string): boolean {
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  
  // Match al inicio (más relevante)
  if (normalizedText.startsWith(normalizedQuery)) return true;
  
  // Match parcial
  if (normalizedText.includes(normalizedQuery)) return true;
  
  // Match singular/plural
  const querySingular = normalizedQuery.replace(/s$/, '');
  const textSingular = normalizedText.replace(/s$/, '');
  if (textSingular.startsWith(querySingular)) return true;
  
  return false;
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
    
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5');
    
    // Mínimo 2 caracteres para buscar
    if (query.length < 2) {
      return NextResponse.json({
        query,
        subcategories: [],
        attributes: {},
        cached: false,
      });
    }
    
    // Obtener datos cacheados
    const data = await getCachedData(supabase);
    const wasCached = (Date.now() - data.cachedAt) < 1000; // Recién cacheado = no era cache hit
    
    // ============================================================
    // 1. BUSCAR SUBCATEGORÍAS QUE COINCIDAN
    // ============================================================
    const matchingSubcategories: SubcategorySuggestion[] = [];
    
    for (const sub of data.subcategories) {
      const subName = sub.display_name || sub.name || '';
      const cat = sub.categories as any;
      if (!cat) continue; // Skip subcategories without valid category
      
      if (matches(subName, query) || matches(sub.slug, query)) {
        matchingSubcategories.push({
          type: 'subcategory',
          id: sub.id,
          name: subName,
          slug: sub.slug,
          categoryName: cat.display_name || cat.name || '',
          categorySlug: cat.slug || '',
          icon: cat.icon,
        });
        
        if (matchingSubcategories.length >= limit) break;
      }
    }
    
    // ============================================================
    // 2. BUSCAR ATRIBUTOS QUE COINCIDAN
    // ============================================================
    const matchingAttributes: { [fieldLabel: string]: AttributeSuggestion[] } = {};
    
    // Campos que queremos indexar (los más útiles para búsqueda)
    const searchableFields = ['marca', 'raza', 'tipobovino', 'tipoequino', 'tipoovino', 'tipoporcino', 'modelo'];
    
    for (const attr of data.attributes) {
      // Solo buscar en campos relevantes
      const fieldName = (attr.field_name || '').toLowerCase();
      if (!fieldName || !searchableFields.includes(fieldName)) continue;
      
      const options = attr.field_options as any[];
      if (!options || !Array.isArray(options)) continue;
      
      const sub = attr.subcategories as any;
      const cat = sub?.categories as any;
      if (!sub || !cat) continue;
      
      const fieldLabel = attr.field_label || attr.field_name;
      
      for (const opt of options) {
        const optValue = typeof opt === 'string' ? opt : (opt.value || opt.label || '');
        
        if (matches(optValue, query)) {
          if (!matchingAttributes[fieldLabel]) {
            matchingAttributes[fieldLabel] = [];
          }
          
          // Evitar duplicados del mismo valor
          const exists = matchingAttributes[fieldLabel].some(
            a => a.value === optValue && a.subcategoryId === sub.id
          );
          
          if (!exists && matchingAttributes[fieldLabel].length < limit) {
            matchingAttributes[fieldLabel].push({
              type: 'attribute',
              fieldName: attr.field_name,
              fieldLabel,
              value: optValue,
              subcategoryId: sub.id,
              subcategoryName: sub.display_name || sub.name,
              subcategorySlug: sub.slug,
              categoryName: cat.display_name || cat.name,
              categorySlug: cat.slug,
            });
          }
        }
      }
    }
    
    const elapsed = Date.now() - startTime;
    // Performance log — dev only
    if (process.env.NODE_ENV !== 'production') console.log(`/api/search/suggestions - "${query}" en ${elapsed}ms (cached: ${wasCached})`);
    
    return NextResponse.json({
      query,
      subcategories: matchingSubcategories,
      attributes: matchingAttributes,
      cached: wasCached,
      elapsed_ms: elapsed,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60', // Cache en CDN por 1 minuto
      },
    });

  } catch (error) {
    console.error('❌ Error en /api/search/suggestions:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
