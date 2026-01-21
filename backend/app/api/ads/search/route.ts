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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
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

    // ============================================================
    // 1.1 DETECCIÓN INTELIGENTE: Si hay searchQuery sin categoría/subcategoría,
    //     intentar detectar si coincide con alguna subcategoría
    // ============================================================
    if (searchQuery && !categorySlug && !subcategorySlug) {
      const searchSlug = toSlug(searchQuery);
      const searchLower = searchQuery.toLowerCase();
      // Obtener forma singular (quitar 's' final) y plural (agregar 's')
      const searchSingular = searchLower.replace(/s$/, '');
      const searchPlural = searchLower.endsWith('s') ? searchLower : `${searchLower}s`;
      
      console.log('🔎 Intentando detectar subcategoría desde búsqueda:', { 
        original: searchQuery, 
        singular: searchSingular, 
        plural: searchPlural 
      });
      
      // Buscar subcategoría que coincida con el texto de búsqueda (flexible singular/plural)
      const { data: matchingSubcats } = await supabase
        .from('subcategories')
        .select('id, name, display_name, slug, category_id')
        .or(`slug.eq.${searchSlug},slug.eq.${searchSingular},slug.eq.${searchPlural},name.ilike.%${searchSingular}%,display_name.ilike.%${searchSingular}%`)
        .limit(3);
      
      if (matchingSubcats && matchingSubcats.length > 0) {
        // Usar la primera coincidencia
        const matchedSub = matchingSubcats[0];
        subcategoryId = matchedSub.id;
        subcategoryName = matchedSub.display_name || matchedSub.name;
        detectedFromSearch = true;
        
        console.log('✅ Subcategoría detectada automáticamente:', { 
          subcategoryId, 
          subcategoryName,
          fromSearch: searchQuery 
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
    // porque el usuario ya encontró lo que buscaba (ej: "tractores" -> subcategoría Tractores)
    if (searchQuery && !detectedFromSearch) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
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
        total: count || transformedAds.length,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
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
