import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // Check brands table
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('*')
      .limit(5);
    
    // Check models table
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('*')
      .limit(5);
    
    // Check subcategory_brands relation
    const { data: subcatBrands, error: subBrandsError } = await supabase
      .from('subcategory_brands')
      .select(`
        *,
        brands:brand_id(name, slug),
        subcategories:subcategory_id(name, display_name)
      `)
      .limit(10);
    
    // Check if there's a dynamic_attributes table
    const { data: attributes, error: attrError } = await supabase
      .from('dynamic_attributes')
      .select('*')
      .limit(5);
    
    // Check ads table structure
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .limit(3);
    
    // Check images table structure
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('*')
      .limit(3);
    
    return NextResponse.json({
      brands: {
        count: brands?.length || 0,
        sample: brands,
        error: brandsError?.message || null,
      },
      models: {
        count: models?.length || 0,
        sample: models,
        error: modelsError?.message || null,
      },
      subcategory_brands: {
        count: subcatBrands?.length || 0,
        sample: subcatBrands,
        error: subBrandsError?.message || null,
        note: "Relación muchos a muchos entre subcategorías y marcas"
      },
      dynamic_attributes: {
        count: attributes?.length || 0,
        sample: attributes,
        error: attrError?.message || null,
        note: "Atributos específicos por subcategoría (ej: potencia para tractores)"
      },
      ads: {
        count: ads?.length || 0,
        sample: ads,
        error: adsError?.message || null,
        note: "Tabla principal de avisos"
      },
      images: {
        count: images?.length || 0,
        sample: images,
        error: imagesError?.message || null,
        note: "Tabla de imágenes asociadas a avisos"
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
