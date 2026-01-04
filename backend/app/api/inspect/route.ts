import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // 1. CATEGORÍAS - Con conteo de subcategorías
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        display_name,
        slug,
        icon,
        sort_order,
        is_active,
        subcategories:subcategories(count)
      `)
      .order('sort_order', { ascending: true });
    
    // 2. SUBCATEGORÍAS - Con relaciones y flags
    const { data: subcategories, error: subError } = await supabase
      .from('subcategories')
      .select(`
        id,
        name,
        display_name,
        slug,
        category_id,
        has_brands,
        has_models,
        has_year,
        has_condition,
        sort_order,
        categories:category_id(name, display_name)
      `)
      .order('sort_order', { ascending: true });
    
    // 3. TIPOS/ATRIBUTOS DINÁMICOS - Estructura de category_types
    const { data: types, error: typesError } = await supabase
      .from('category_types')
      .select(`
        id,
        name,
        display_name,
        slug,
        subcategory_id,
        category_id,
        sort_order,
        subcategories:subcategory_id(name, display_name)
      `)
      .order('sort_order', { ascending: true })
      .limit(20);
    
    // 4. MARCAS - Con conteo de modelos
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select(`
        id,
        name,
        slug,
        models:models(count)
      `)
      .order('name', { ascending: true })
      .limit(20);
    
    // ANÁLISIS: Contar subcategorías por categoría
    const subcatByCategory = subcategories?.reduce((acc: any, sub: any) => {
      const catName = sub.categories?.name || 'unknown';
      acc[catName] = (acc[catName] || 0) + 1;
      return acc;
    }, {});
    
    return NextResponse.json({
      summary: {
        totalCategories: categories?.length || 0,
        totalSubcategories: subcategories?.length || 0,
        totalTypes: types?.length || 0,
        totalBrands: brands?.length || 0,
        subcategoriesPerCategory: subcatByCategory,
      },
      categories: {
        count: categories?.length || 0,
        data: categories || [],
        error: catError?.message || null,
      },
      subcategories: {
        count: subcategories?.length || 0,
        withBrands: subcategories?.filter((s: any) => s.has_brands).length || 0,
        withModels: subcategories?.filter((s: any) => s.has_models).length || 0,
        withYear: subcategories?.filter((s: any) => s.has_year).length || 0,
        data: subcategories || [],
        error: subError?.message || null,
      },
      types: {
        count: types?.length || 0,
        data: types || [],
        error: typesError?.message || null,
        note: "Estos son atributos dinámicos (3er nivel) que se generan manualmente"
      },
      brands: {
        count: brands?.length || 0,
        sample: brands || [],
        error: brandsError?.message || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
