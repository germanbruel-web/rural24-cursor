import { supabase } from './supabaseClient';

// =====================================================
// CATALOG - TABLAS INDEPENDIENTES POR CATEGORÍA
// =====================================================

/**
 * Obtener todas las categorías activas (tabla legacy aún existe)
 */
export const getCategories = async () => {
  console.log('🔍 Cargando categorías...');
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) {
    console.error('❌ Error cargando categorías:', error);
    throw error;
  }
  console.log('✅ Categorías cargadas:', data?.length || 0);
  return data || [];
};

// =====================================================
// MAQUINARIAS - Tablas independientes
// =====================================================

export const getMaquinariasSubcategories = async () => {
  console.log('🔍 Cargando subcategorías de maquinarias...');
  const { data, error } = await supabase
    .from('maquinarias_subcategorias')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) {
    console.error('❌ Error cargando subcategorías de maquinarias:', error);
    throw error;
  }
  console.log('✅ Subcategorías de maquinarias:', data?.length || 0);
  return data || [];
};

export const getMaquinariasBrands = async () => {
  console.log('🔍 Cargando marcas de maquinarias...');
  const { data, error } = await supabase
    .from('maquinarias_marcas')
    .select('*')
    .eq('is_active', true)
    .order('display_name');
  
  if (error) {
    console.error('❌ Error cargando marcas de maquinarias:', error);
    throw error;
  }
  console.log('✅ Marcas de maquinarias:', data?.length || 0);
  return data || [];
};

/**
 * Obtener marcas que tienen modelos para una subcategoría específica
 * Usa maquinarias_modelos como tabla puente
 */
export const getMaquinariasBrandsBySubcategory = async (subcategoryId: string) => {
  console.log('🔍 Cargando marcas de maquinarias para subcategoría:', subcategoryId);
  
  // Query que obtiene marcas únicas que tienen modelos en esta subcategoría
  const { data, error } = await supabase
    .from('maquinarias_modelos')
    .select(`
      marca_id,
      maquinarias_marcas!inner (
        id,
        name,
        display_name,
        is_active
      )
    `)
    .eq('subcategoria_id', subcategoryId)
    .eq('is_active', true)
    .eq('maquinarias_marcas.is_active', true);
  
  if (error) {
    console.error('❌ Error cargando marcas filtradas:', error);
    throw error;
  }
  
  // Extraer marcas únicas (un modelo puede repetir marca)
  const uniqueBrands = new Map();
  data?.forEach(item => {
    const brand = (item as any).maquinarias_marcas;
    if (brand && !uniqueBrands.has(brand.id)) {
      uniqueBrands.set(brand.id, brand);
    }
  });
  
  const brands = Array.from(uniqueBrands.values()).sort((a, b) => 
    a.display_name.localeCompare(b.display_name)
  );
  
  console.log(`✅ Marcas filtradas para subcategoría: ${brands.length}`);
  return brands;
};

export const getMaquinariasModels = async (brandId: string, subcategoryId?: string) => {
  console.log('🔍 Cargando modelos de maquinarias para marca:', brandId, subcategoryId ? `y subcategoría: ${subcategoryId}` : '');
  
  let query = supabase
    .from('maquinarias_modelos')
    .select('*')
    .eq('marca_id', brandId)
    .eq('is_active', true);
  
  // Si se proporciona subcategoryId, filtrar por ella también
  if (subcategoryId) {
    query = query.eq('subcategoria_id', subcategoryId);
  }
  
  const { data, error } = await query.order('display_name');
  
  if (error) {
    console.error('❌ Error cargando modelos de maquinarias:', error);
    throw error;
  }
  console.log('✅ Modelos de maquinarias:', data?.length || 0);
  return data || [];
};

// =====================================================
// GANADERÍA - Usa sistema unificado
// =====================================================

export const getGanaderiaSubcategories = async () => {
  console.log('🔍 Cargando subcategorías de ganadería desde sistema unificado...');
  
  // Obtener category_id de Ganadería
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'ganaderia')
    .single();
  
  if (categoryError || !categoryData) {
    console.error('❌ Error: Categoría Ganadería no encontrada');
    return [];
  }
  
  // Obtener subcategorías de Ganadería
  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', categoryData.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('❌ Error cargando subcategorías de ganadería:', error);
    throw error;
  }
  console.log('✅ Subcategorías de ganadería:', data?.length || 0);
  return data || [];
};

export const getGanaderiaRazas = async (subcategoryId: string) => {
  console.log('🔍 Cargando tipos/razas de ganadería desde sistema unificado para:', subcategoryId);
  const { data, error } = await supabase
    .from('category_types')
    .select('*')
    .eq('subcategory_id', subcategoryId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('❌ Error cargando tipos de ganadería:', error);
    throw error;
  }
  console.log('✅ Tipos de ganadería:', data?.length || 0);
  return data || [];
};

// =====================================================
// INSUMOS - Usa sistema unificado
// =====================================================

export const getInsumosSubcategories = async () => {
  console.log('🔍 Cargando subcategorías de insumos desde sistema unificado...');
  
  // Obtener category_id de Insumos
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'insumos')
    .single();
  
  if (categoryError || !categoryData) {
    console.error('❌ Error: Categoría Insumos no encontrada');
    return [];
  }
  
  // Obtener subcategorías de Insumos
  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', categoryData.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('❌ Error cargando subcategorías de insumos:', error);
    throw error;
  }
  console.log('✅ Subcategorías de insumos:', data?.length || 0);
  return data || [];
};

export const getInsumosBrands = async () => {
  console.log('🔍 Cargando marcas de insumos...');
  const { data, error } = await supabase
    .from('insumos_marcas')
    .select('*')
    .eq('is_active', true)
    .order('display_name');
  
  if (error) {
    console.error('❌ Error cargando marcas de insumos:', error);
    throw error;
  }
  console.log('✅ Marcas de insumos:', data?.length || 0);
  return data || [];
};

// =====================================================
// FUNCIONES LEGACY (Compatibilidad hacia atrás)
// =====================================================

/**
 * @deprecated Usar getMaquinariasSubcategories, getGanaderiaSubcategories, etc.
 */
export const getSubcategories = async (categoryId: string) => {
  console.warn('⚠️ getSubcategories es legacy, usar funciones específicas por categoría');
  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) throw error;
  return data || [];
};

/**
 * @deprecated Usar getMaquinariasBrands, getInsumosBrands directamente
 */
export const getBrandsBySubcategory = async (subcategoryId: string) => {
  console.warn('⚠️ getBrandsBySubcategory es legacy, usar funciones específicas');
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('subcategory_id', subcategoryId)
    .eq('is_active', true)
    .order('display_name');
  
  if (error) throw error;
  return data || [];
};

/**
 * @deprecated Usar getMaquinariasModels directamente
 */
export const getModels = async (brandId: string) => {
  console.warn('⚠️ getModels es legacy, usar getMaquinariasModels');
  return getMaquinariasModels(brandId);
};

export const getAllBrands = async () => {
  const { data, error } = await supabase.from('brands').select('*').eq('is_active', true).order('display_name');
  if (error) throw error;
  return data || [];
};

export const getAllModels = async () => {
  const { data, error } = await supabase.from('models').select('*').eq('is_active', true).order('display_name');
  if (error) throw error;
  return data || [];
};
