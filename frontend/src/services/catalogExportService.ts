/**
 * Servicio para exportar catálogo completo a JSON
 * Genera archivo estático para optimizar carga del frontend
 * VERSIÓN 2.0 - Usa tablas independientes por categoría
 */

import { supabase } from './supabaseClient';
import {
  getMaquinariasSubcategories,
  getMaquinariasBrands,
  getMaquinariasModels,
  getGanaderiaSubcategories,
  getGanaderiaRazas,
  getInsumosSubcategories,
  getInsumosBrands
} from './catalogServiceClean';

export interface CatalogJSON {
  version: string;
  timestamp: string;
  expiresAt: string; // TTL: 7 días por defecto
  categories: CategoryNode[];
}

export interface CategoryNode {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  subcategories: SubcategoryNode[];
}

export interface SubcategoryNode {
  id: string;
  category_id: string;
  name: string;
  display_name: string;
  sort_order: number;
  is_active: boolean;
  brands: BrandNode[];
}

export interface BrandNode {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  models: ModelNode[];
}

export interface ModelNode {
  id: string;
  brand_id: string;
  name: string;
  display_name: string;
  year?: number;
  technical_specs?: Record<string, any>;
  is_active: boolean;
}

/**
 * Genera el JSON completo del catálogo
 * VERSIÓN 2.0 - Usa tablas independientes por categoría
 * Incluye todas las relaciones optimizadas
 */
export async function generateCatalogJSON(): Promise<CatalogJSON> {
  console.log('🏗️ Generando JSON del catálogo (v2.0 - Tablas Independientes)...');
  
  try {
    // 1. Cargar todas las categorías principales
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (catError) throw catError;

    const categoriesWithData: CategoryNode[] = [];

    // 2. Procesar cada categoría con sus tablas específicas
    for (const category of categories || []) {
      console.log(`📦 Procesando categoría: ${category.name}`);
      
      const subcategoriesWithData: SubcategoryNode[] = [];

      // ============================================
      // MAQUINARIAS
      // ============================================
      if (category.name === 'maquinarias') {
        const subs = await getMaquinariasSubcategories();
        const allBrands = await getMaquinariasBrands();

        for (const sub of subs) {
          // Obtener marcas únicas que tienen modelos en esta subcategoría
          const { data: modelLinks } = await supabase
            .from('maquinarias_modelos')
            .select('marca_id')
            .eq('subcategoria_id', sub.id)
            .eq('is_active', true);

          const brandIds = [...new Set((modelLinks || []).map(m => m.marca_id))];
          const brandsForSub = allBrands.filter(b => brandIds.includes(b.id));

          const brandsWithModels: BrandNode[] = [];
          for (const brand of brandsForSub) {
            const models = await getMaquinariasModels(brand.id, sub.id);
            brandsWithModels.push({
              ...brand,
              models: models.map(m => ({ ...m, brand_id: brand.id }))
            });
          }

          subcategoriesWithData.push({
            ...sub,
            category_id: category.id,
            brands: brandsWithModels
          });
        }
      }
      // ============================================
      // GANADERÍA
      // ============================================
      else if (category.name === 'ganaderia') {
        const subs = await getGanaderiaSubcategories();

        for (const sub of subs) {
          const razas = await getGanaderiaRazas(sub.id);
          
          // Mapear razas como "brands" para uniformidad
          const razasAsBrands: BrandNode[] = razas.map(raza => ({
            id: raza.id,
            name: raza.name,
            display_name: raza.display_name,
            is_active: raza.is_active,
            models: [] // Ganadería no tiene modelos
          }));

          subcategoriesWithData.push({
            ...sub,
            category_id: category.id,
            brands: razasAsBrands
          });
        }
      }
      // ============================================
      // INSUMOS
      // ============================================
      else if (category.name === 'insumos') {
        const subs = await getInsumosSubcategories();
        const allBrands = await getInsumosBrands();

        for (const sub of subs) {
          // Para insumos, todas las marcas aplican a todas las subcategorías
          const brandsWithoutModels: BrandNode[] = allBrands.map(brand => ({
            ...brand,
            models: [] // Insumos no tiene modelos
          }));

          subcategoriesWithData.push({
            ...sub,
            category_id: category.id,
            brands: brandsWithoutModels
          });
        }
      }
      // ============================================
      // OTRAS CATEGORÍAS (legacy o sin implementar)
      // ============================================
      else {
        console.warn(`⚠️ Categoría ${category.name} sin tablas independientes - omitida`);
        continue;
      }

      categoriesWithData.push({
        ...category,
        subcategories: subcategoriesWithData,
      });
    }

    // 3. Generar JSON final con metadata
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 días

    const catalog: CatalogJSON = {
      version: '2.0.0',
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      categories: categoriesWithData,
    };

    // 4. Log de estadísticas
    const stats = {
      categories: catalog.categories.length,
      subcategories: catalog.categories.reduce((sum, c) => sum + c.subcategories.length, 0),
      brands: catalog.categories.reduce((sum, c) => 
        sum + c.subcategories.reduce((subSum, s) => subSum + s.brands.length, 0), 0
      ),
      models: catalog.categories.reduce((sum, c) => 
        sum + c.subcategories.reduce((subSum, s) => 
          subSum + s.brands.reduce((brandSum, b) => brandSum + b.models.length, 0), 0
        ), 0
      ),
      sizeKB: (JSON.stringify(catalog).length / 1024).toFixed(2)
    };

    console.log('✅ JSON generado exitosamente:', stats);

    return catalog;

  } catch (error) {
    console.error('❌ Error generando JSON del catálogo:', error);
    throw error;
  }
}

/**
 * Descarga el JSON como archivo
 * Para uso en desarrollo/producción local
 */
export function downloadCatalogJSON(catalog: CatalogJSON) {
  const jsonString = JSON.stringify(catalog, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `catalog-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('💾 JSON descargado:', link.download);
}

/**
 * Carga el JSON desde /public/catalog.json
 */
export async function loadCatalogFromJSON(): Promise<CatalogJSON | null> {
  try {
    const response = await fetch('/catalog.json');
    
    if (!response.ok) {
      console.warn('⚠️ No se encontró catalog.json en /public');
      return null;
    }
    
    const catalog: CatalogJSON = await response.json();
    
    // Verificar si está expirado
    const expiresAt = new Date(catalog.expiresAt);
    const now = new Date();
    
    if (now > expiresAt) {
      console.warn('⏰ catalog.json expirado, usando Supabase');
      return null;
    }
    
    console.log('✅ Catálogo cargado desde JSON estático');
    return catalog;
    
  } catch (error) {
    console.warn('⚠️ Error cargando catalog.json:', error);
    return null;
  }
}

/**
 * Estadísticas del catálogo
 */
export function getCatalogStats(catalog: CatalogJSON) {
  const stats = {
    version: catalog.version,
    timestamp: catalog.timestamp,
    expiresAt: catalog.expiresAt,
    isExpired: new Date() > new Date(catalog.expiresAt),
    categories: catalog.categories.length,
    subcategories: 0,
    brands: 0,
    models: 0,
    totalSize: JSON.stringify(catalog).length,
    sizeKB: (JSON.stringify(catalog).length / 1024).toFixed(2),
  };

  catalog.categories.forEach(cat => {
    stats.subcategories += cat.subcategories.length;
    cat.subcategories.forEach(sub => {
      stats.brands += sub.brands.length;
      sub.brands.forEach(brand => {
        stats.models += brand.models.length;
      });
    });
  });

  return stats;
}
