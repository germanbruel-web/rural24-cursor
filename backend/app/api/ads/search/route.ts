// GET /api/ads/search?cat=X&sub=Y&prov=Z&q=texto
// Buscar avisos con filtros por SLUG (no por ID)
// ====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

// ====================================================================
// TIPOS
// ====================================================================

interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  province: string;
  location: string;
  category: string;
  subcategory: string;
  images: any[];
  image_urls: string[];
  featured: boolean;
  created_at: string;
  brand?: string;
  model?: string;
  attributes?: Record<string, any>;
  user_id?: string;
  seller?: any;
}

// ====================================================================
// HELPER: Convertir texto a slug
// ====================================================================
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
// ====================================================================
// MAPEO DE SINÓNIMOS: Términos comunes que deben mapear a subcategorías
// ====================================================================
const SYNONYM_MAP: Record<string, string> = {
  // Bovinos
  'toro': 'bovinos',
  'toros': 'bovinos',
  'vaca': 'bovinos',
  'vacas': 'bovinos',
  'ternero': 'bovinos',
  'terneros': 'bovinos',
  'ternera': 'bovinos',
  'terneras': 'bovinos',
  'novillo': 'bovinos',
  'novillos': 'bovinos',
  'vaquillona': 'bovinos',
  'vaquillonas': 'bovinos',
  'ganado': 'bovinos',
  'hacienda': 'bovinos',
  // Equinos
  'caballo': 'equinos',
  'caballos': 'equinos',
  'yegua': 'equinos',
  'yeguas': 'equinos',
  'potrillo': 'equinos',
  'potrillos': 'equinos',
  'potro': 'equinos',
  'potros': 'equinos',
  // Ovinos
  'oveja': 'ovinos',
  'ovejas': 'ovinos',
  'carnero': 'ovinos',
  'carneros': 'ovinos',
  'cordero': 'ovinos',
  'corderos': 'ovinos',
  // Porcinos
  'cerdo': 'porcinos',
  'cerdos': 'porcinos',
  'chancho': 'porcinos',
  'chanchos': 'porcinos',
  'lechon': 'porcinos',
  'lechones': 'porcinos',
  // Caprinos
  'cabra': 'caprinos',
  'cabras': 'caprinos',
  'chivo': 'caprinos',
  'chivos': 'caprinos',
  // Aves
  'gallina': 'aves',
  'gallinas': 'aves',
  'pollo': 'aves',
  'pollos': 'aves',
  'gallo': 'aves',
  'gallos': 'aves',
  'pato': 'aves',
  'patos': 'aves',
  // Inmuebles Rurales
  'campo': 'campos',
  'estancia': 'campos',
  'estancias': 'campos',
  'quinta': 'quintas',
  'chacra': 'chacras',
  // Maquinarias - sinónimos adicionales
  'tractor': 'tractores',
  'cosechadora': 'cosechadoras',
  'pulverizadora': 'pulverizadoras',
  'sembradora': 'sembradoras',
  'rastra': 'rastras',
  'arado': 'arados',
  'fertilizadora': 'fertilizadoras',
  'tolva': 'tolvas',
};

function getSynonymSlug(term: string): string | null {
  const normalized = term.toLowerCase().trim();
  return SYNONYM_MAP[normalized] || null;
}

// ====================================================================
// HELPER: Buscar en atributos dinámicos (field_options)
// Retorna { subcategoryId, fieldName, fieldValue } si encuentra coincidencia
// ====================================================================
interface AttributeMatch {
  subcategory_id: string | null; // null si aparece en múltiples subcategorías
  category_id?: string | null;   // categoría común si todas las subcats son de la misma
  field_name: string;
  field_value: string;
  is_unique_subcategory: boolean; // true si solo aparece en una subcategoría
}

async function findAttributeMatch(
  supabase: ReturnType<typeof createClient>,
  searchTerm: string
): Promise<AttributeMatch | null> {
  const searchLower = searchTerm.toLowerCase().trim();
  
  // Buscar en dynamic_attributes donde field_options contenga el término
  // field_options es un array de strings o array de {value, label}
  const { data: attributes, error } = await supabase
    .from('dynamic_attributes')
    .select('subcategory_id, field_name, field_options')
    .eq('is_active', true)
    .not('field_options', 'is', null);
  
  if (error || !attributes) {
    console.log('⚠️ Error buscando en atributos dinámicos:', error);
    return null;
  }
  
  // Recolectar TODAS las coincidencias para ver si el valor está en múltiples subcategorías
  const matches: { subcategory_id: string; field_name: string; field_value: string }[] = [];
  
  // Buscar en cada atributo si el término coincide con alguna opción
  for (const attr of attributes) {
    if (!attr.field_options) continue;
    
    const options = attr.field_options as any[];
    for (const opt of options) {
      // Las opciones pueden ser strings o {value, label}
      const optValue = typeof opt === 'string' ? opt : (opt.value || opt.label || '');
      const optLabel = typeof opt === 'string' ? opt : (opt.label || opt.value || '');
      
      const valueLower = optValue.toLowerCase();
      const labelLower = optLabel.toLowerCase();
      
      // Coincidencia exacta o singular/plural
      const searchSingular = searchLower.replace(/s$/, '');
      const valueSingular = valueLower.replace(/s$/, '');
      
      if (
        valueLower === searchLower ||
        labelLower === searchLower ||
        valueSingular === searchSingular ||
        valueLower === searchSingular ||
        valueSingular === searchLower
      ) {
        matches.push({
          subcategory_id: attr.subcategory_id,
          field_name: attr.field_name,
          field_value: optValue // Valor original (con mayúsculas correctas)
        });
      }
    }
  }
  
  if (matches.length === 0) {
    return null;
  }
  
  // Obtener subcategorías únicas
  const uniqueSubcategoryIds = [...new Set(matches.map(m => m.subcategory_id))];
  const firstMatch = matches[0];
  
  if (uniqueSubcategoryIds.length === 1) {
    // Solo aparece en una subcategoría - asignar subcategoría
    console.log('✅ Atributo encontrado (subcategoría única):', {
      field_name: firstMatch.field_name,
      matched_value: firstMatch.field_value,
      subcategory_id: firstMatch.subcategory_id,
      from_search: searchTerm
    });
    
    return {
      subcategory_id: firstMatch.subcategory_id,
      field_name: firstMatch.field_name,
      field_value: firstMatch.field_value,
      is_unique_subcategory: true
    };
  }
  
  // Aparece en múltiples subcategorías - ver si son de la misma categoría
  const { data: subcats } = await supabase
    .from('subcategories')
    .select('id, category_id')
    .in('id', uniqueSubcategoryIds);
  
  const uniqueCategoryIds = subcats ? [...new Set(subcats.map(s => s.category_id))] : [];
  
  console.log('✅ Atributo encontrado (múltiples subcategorías):', {
    field_name: firstMatch.field_name,
    matched_value: firstMatch.field_value,
    subcategory_count: uniqueSubcategoryIds.length,
    category_count: uniqueCategoryIds.length,
    from_search: searchTerm
  });
  
  return {
    subcategory_id: null, // No restringir a subcategoría
    category_id: uniqueCategoryIds.length === 1 ? uniqueCategoryIds[0] : null,
    field_name: firstMatch.field_name,
    field_value: firstMatch.field_value,
    is_unique_subcategory: false
  };
  
  return null;
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
    
    // Parámetros de entrada
    const categorySlug = searchParams.get('cat');
    const subcategorySlug = searchParams.get('sub');
    const provinceSlug = searchParams.get('prov');
    const searchQuery = searchParams.get('search') || searchParams.get('q');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    
    // Paginación: soportar tanto page/limit como offset/limit
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20'); // Reducido de 50 a 20 para mejor UX
    const offset = searchParams.get('offset') 
      ? parseInt(searchParams.get('offset'))
      : (page - 1) * limit;
    
    // Extraer filtros de atributos dinámicos (prefijo attr_)
    const attributeFilters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith('attr_')) {
        const attrName = key.replace('attr_', '');
        attributeFilters[attrName] = value;
      }
    });
    
    console.log('🔍 /api/ads/search - Attribute filters:', attributeFilters);

    console.log('🔍 /api/ads/search - Params:', { 
      categorySlug, subcategorySlug, provinceSlug, searchQuery 
    });

    // ============================================================
    // 1. RESOLVER SLUGS A IDs (búsqueda flexible)
    // ============================================================
    let categoryId: string | null = null;
    let subcategoryId: string | null = null;
    let categoryName: string | null = null;
    let subcategoryName: string | null = null;
    let detectedFromSearch = false; // Flag para saber si se detectó automáticamente
    let detectedAttribute: { field_name: string; field_value: string } | null = null; // Atributo detectado

    // ============================================================
    // 1.1 DETECCIÓN INTELIGENTE: Si hay searchQuery sin categoría/subcategoría,
    //     intentar detectar si coincide con alguna subcategoría o sinónimo
    // ============================================================
    if (searchQuery && !categorySlug && !subcategorySlug) {
      const searchSlug = toSlug(searchQuery);
      const searchLower = searchQuery.toLowerCase().trim();
      // Obtener forma singular (quitar 's' final) y plural (agregar 's')
      const searchSingular = searchLower.replace(/s$/, '');
      const searchPlural = searchLower.endsWith('s') ? searchLower : `${searchLower}s`;
      
      // Primero: buscar en el mapa de sinónimos
      const synonymSlug = getSynonymSlug(searchLower);
      
      console.log('🔎 Intentando detectar subcategoría desde búsqueda:', { 
        original: searchQuery, 
        singular: searchSingular, 
        plural: searchPlural,
        synonymSlug 
      });
      
      // Construir query con sinónimos incluidos
      let orConditions = `slug.eq.${searchSlug},slug.eq.${searchSingular},slug.eq.${searchPlural},name.ilike.%${searchSingular}%,display_name.ilike.%${searchSingular}%`;
      if (synonymSlug) {
        orConditions += `,slug.eq.${synonymSlug}`;
      }
      
      // Buscar subcategoría que coincida con el texto de búsqueda (flexible singular/plural + sinónimos)
      const { data: matchingSubcats } = await supabase
        .from('subcategories')
        .select('id, name, display_name, slug, category_id')
        .or(orConditions)
        .limit(3);
      
      if (matchingSubcats && matchingSubcats.length > 0) {
        // Preferir match por sinónimo si existe
        let matchedSub = matchingSubcats[0];
        if (synonymSlug) {
          const synonymMatch = matchingSubcats.find(s => s.slug === synonymSlug);
          if (synonymMatch) matchedSub = synonymMatch;
        }
        
        subcategoryId = matchedSub.id;
        subcategoryName = matchedSub.display_name || matchedSub.name;
        detectedFromSearch = true;
        
        console.log('✅ Subcategoría detectada automáticamente:', { 
          subcategoryId, 
          subcategoryName,
          fromSearch: searchQuery,
          viaSynonym: synonymSlug ? true : false
        });
        
        // También resolver la categoría padre
        const { data: parentCat } = await supabase
          .from('categories')
          .select('id, name, display_name, slug')
          .eq('id', matchedSub.category_id)
          .single();
        
        if (parentCat) {
          categoryId = parentCat.id;
          categoryName = parentCat.display_name || parentCat.name;
          console.log('✅ Categoría padre resuelta:', { categoryId, categoryName });
        }
      }
      
      // Si no se encontró subcategoría, buscar en atributos dinámicos
      if (!subcategoryId) {
        const attrMatch = await findAttributeMatch(supabase, searchQuery);
        
        if (attrMatch) {
          // Guardar info del atributo detectado para la respuesta
          detectedAttribute = {
            field_name: attrMatch.field_name,
            field_value: attrMatch.field_value
          };
          detectedFromSearch = true;
          
          if (attrMatch.is_unique_subcategory && attrMatch.subcategory_id) {
            // El atributo solo existe en una subcategoría - restringir búsqueda
            attributeFilters[attrMatch.field_name] = attrMatch.field_value;
            
            // Resolver la subcategoría desde el atributo
            const { data: subData } = await supabase
              .from('subcategories')
              .select('id, name, display_name, slug, category_id')
              .eq('id', attrMatch.subcategory_id)
              .single();
            
            if (subData) {
              subcategoryId = subData.id;
              subcategoryName = subData.display_name || subData.name;
              
              console.log('✅ Subcategoría detectada via atributo (única):', { 
                subcategoryId, 
                subcategoryName,
                attributeField: attrMatch.field_name,
                attributeValue: attrMatch.field_value,
                fromSearch: searchQuery
              });
              
              // Resolver categoría padre
              const { data: parentCatFromAttr } = await supabase
                .from('categories')
                .select('id, name, display_name, slug')
                .eq('id', subData.category_id)
                .single();
              
              if (parentCatFromAttr) {
                categoryId = parentCatFromAttr.id;
                categoryName = parentCatFromAttr.display_name || parentCatFromAttr.name;
                console.log('✅ Categoría padre resuelta via atributo:', { categoryId, categoryName });
              }
            }
          } else {
            // El atributo existe en múltiples subcategorías
            // NO restringir subcategoría, solo categoría si todas son de la misma
            console.log('✅ Atributo detectado en múltiples subcategorías - NO restringir sub:', { 
              attributeField: attrMatch.field_name,
              attributeValue: attrMatch.field_value,
              fromSearch: searchQuery,
              categoryId: attrMatch.category_id
            });
            
            if (attrMatch.category_id) {
              // Todas las subcategorías son de la misma categoría
              const { data: parentCatFromAttr } = await supabase
                .from('categories')
                .select('id, name, display_name, slug')
                .eq('id', attrMatch.category_id)
                .single();
              
              if (parentCatFromAttr) {
                categoryId = parentCatFromAttr.id;
                categoryName = parentCatFromAttr.display_name || parentCatFromAttr.name;
                console.log('✅ Categoría resuelta (múltiples subcats):', { categoryId, categoryName });
              }
            }
            // NO agregar el filtro de atributo aquí porque el campo puede tener distinto nombre en cada subcat
          }
        }
      }
    }

    if (categorySlug) {
      // Normalizar slug: quitar 's' final para buscar singular/plural
      const normalizedSlug = categorySlug.replace(/s$/, '');
      
      // Buscar por slug exacto, slug sin 's', o name similar
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, display_name, slug')
        .or(`slug.eq.${categorySlug},slug.eq.${normalizedSlug},name.ilike.%${normalizedSlug}%,display_name.ilike.%${normalizedSlug}%`)
        .limit(5);
      
      if (categories && categories.length > 0) {
        // Preferir match exacto de slug, luego por nombre
        const exactMatch = categories.find(c => c.slug === categorySlug || c.slug === normalizedSlug);
        const catData = exactMatch || categories[0];
        categoryId = catData.id;
        categoryName = catData.display_name || catData.name;
        console.log('✅ Categoría encontrada:', { categoryId, categoryName, slug: catData.slug });
      } else {
        console.warn('⚠️ Categoría no encontrada para slug:', categorySlug);
      }
    }

    if (subcategorySlug && categoryId) {
      // Normalizar slug para subcategoría también
      const normalizedSubSlug = subcategorySlug.replace(/s$/, '');
      
      const { data: subcategories } = await supabase
        .from('subcategories')
        .select('id, name, display_name, slug')
        .eq('category_id', categoryId)
        .or(`slug.eq.${subcategorySlug},slug.eq.${normalizedSubSlug},name.ilike.%${normalizedSubSlug}%`)
        .limit(5);
      
      if (subcategories && subcategories.length > 0) {
        const exactMatch = subcategories.find(s => s.slug === subcategorySlug || s.slug === normalizedSubSlug);
        const subData = exactMatch || subcategories[0];
        subcategoryId = subData.id;
        subcategoryName = subData.display_name || subData.name;
        console.log('✅ Subcategoría encontrada:', { subcategoryId, subcategoryName, slug: subData.slug });
      } else {
        console.warn('⚠️ Subcategoría no encontrada para slug:', subcategorySlug);
      }
    }

    // ============================================================
    // 2. CONSTRUIR QUERY DE ADS (sin JOINs para evitar errores de FK)
    // ============================================================
    let query = supabase
      .from('ads')
      .select(`
        id,
        slug,
        short_id,
        title,
        description,
        price,
        currency,
        province,
        location,
        images,
        featured,
        created_at,
        attributes,
        user_id,
        category_id,
        subcategory_id,
        status,
        approval_status,
        condition
      `, { count: 'exact' })
      .eq('status', 'active')
      .eq('approval_status', 'approved');

    // Filtrar por categoría
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Filtrar por subcategoría
    if (subcategoryId) {
      query = query.eq('subcategory_id', subcategoryId);
    }

    // Filtrar por provincia (texto exacto o similar)
    if (provinceSlug) {
      // Buscar provincia por slug
      const provinceName = provinceSlug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      query = query.ilike('province', `%${provinceName}%`);
    }

    // Búsqueda por texto
    // ✅ FIX: No aplicar búsqueda de texto si ya se detectó subcategoría automáticamente
    // EXCEPCIÓN: Si se detectó atributo pero NO subcategoría, SÍ buscar por texto para filtrar
    const shouldApplyTextSearch = searchQuery && (
      !detectedFromSearch || // No se detectó nada automáticamente
      (detectedAttribute && !subcategoryId) // Se detectó atributo pero no subcategoría específica
    );
    
    if (shouldApplyTextSearch) {
      // Buscar en título, descripción Y atributos JSONB
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,attributes.cs.{"marca":"${searchQuery}"},attributes.cs.{"brand":"${searchQuery}"}`);
    }

    // Filtros de precio
    if (minPrice) {
      query = query.gte('price', parseInt(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice));
    }
    
    // Campos que son columnas directas de la tabla (no atributos JSONB)
    const directColumns = ['province', 'location', 'city', 'condition', 'price', 'currency'];
    
    // Filtros de atributos dinámicos (JSONB contains)
    for (const [attrName, attrValue] of Object.entries(attributeFilters)) {
      // Convertir slug a texto con mayúsculas
      const searchValue = attrValue
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      
      console.log(`  📦 Filtrando por atributo: ${attrName} = ${attrValue} (buscando: ${searchValue})`);
      
      // Si es columna directa, filtrar directamente
      if (directColumns.includes(attrName)) {
        query = query.ilike(attrName, `%${searchValue}%`);
      } else {
        // Atributo JSONB: filtrar usando ->> y ilike para flexibilidad
        query = query.or(`attributes->>${attrName}.ilike.%${searchValue}%,attributes->>${attrName}.ilike.%${attrValue}%`);
      }
    }

    // Ordenar: primero destacados, luego por fecha
    query = query
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: ads, error, count } = await query;

    if (error) {
      console.error('❌ Error en query de ads:', error);
      return NextResponse.json(
        { error: 'Error buscando avisos', details: error.message },
        { status: 500 }
      );
    }

    // ============================================================
    // 3. TRANSFORMAR RESPONSE
    // ============================================================
    const transformedAds = (ads || []).map((ad: any) => {
      // Extraer imagen principal del array images
      const images = ad.images || [];
      const imageUrls: string[] = images.map((img: any) => {
        if (typeof img === 'string') return img;
        if (img?.url) return img.url;
        if (img?.path) return img.path;
        return '';
      }).filter(Boolean);
      
      // Extraer marca y modelo de attributes si existen
      const attrs = ad.attributes || {};
      
      return {
        id: ad.id,
        title: ad.title,
        description: ad.description,
        price: ad.price,
        currency: ad.currency || 'ARS',
        province: ad.province,
        location: ad.location,
        images: images,
        image_urls: imageUrls,
        featured: ad.featured || false,
        created_at: ad.created_at,
        condition: ad.condition,
        brand: attrs.brand || attrs.marca || null,
        model: attrs.model || attrs.modelo || null,
        attributes: attrs,
        user_id: ad.user_id,
        // Usar los nombres resueltos previamente (sin JOINs)
        category: categoryName || 'Sin categoría',
        subcategory: subcategoryName || '',
        category_slug: categorySlug || '',
        subcategory_slug: subcategorySlug || '',
      };
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ /api/ads/search - ${transformedAds.length} avisos en ${elapsed}ms`);

    return NextResponse.json({
      success: true,
      data: transformedAds,
      pagination: {
        page,
        limit,
        offset,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (count || 0) > offset + limit,
        showing: transformedAds.length,
      },
      meta: {
        category: categoryName,
        subcategory: subcategoryName,
        // IDs para que el frontend pueda cargar filtros dinámicos
        category_id: categoryId,
        subcategory_id: subcategoryId,
        // Incluir flag de detección automática para que el frontend pueda actualizar la URL
        detected_from_search: detectedFromSearch,
        detected_category_slug: categoryId ? toSlug(categoryName || '') : null,
        detected_subcategory_slug: subcategoryId ? toSlug(subcategoryName || '') : null,
        // Atributo detectado automáticamente (ej: tipobovino=Toro)
        detected_attribute: detectedAttribute,
        elapsed_ms: elapsed,
      }
    });

  } catch (error) {
    console.error('❌ Error en /api/ads/search:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
