/**
 * React Context para Estado Global de Categorías
 * Evita requests duplicados y mantiene datos sincronizados
 * en toda la aplicación
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { categoryCache, cacheKeys } from '../utils/categoryCache';

const isDev = import.meta.env.DEV;
import { 
  getCategories,
  getMaquinariasSubcategories,
  getMaquinariasBrands,
  getMaquinariasBrandsBySubcategory,
  getMaquinariasModels,
  getGanaderiaSubcategories,
  getGanaderiaRazas,
  getInsumosSubcategories,
  getInsumosBrands
} from '../services/catalogService';

// =====================================================
// TIPOS
// =====================================================

interface Category {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  display_name: string;
  sort_order: number;
  is_active: boolean;
}

interface Brand {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
}

interface Model {
  id: string;
  brand_id: string;
  name: string;
  display_name: string;
  is_active: boolean;
}

interface CategoryContextType {
  // Estados
  categories: Category[];
  subcategories: Subcategory[]; // Array plano de subcategorías actuales
  brands: Brand[]; // Array plano de marcas actuales
  models: Model[]; // Array plano de modelos actuales
  subcategoriesByCategory: Record<string, Subcategory[]>;
  brandsBySubcategory: Record<string, Brand[]>;
  modelsByBrand: Record<string, Model[]>;
  isLoading: boolean;
  error: string | null;

  // Métodos de carga
  loadCategories: () => Promise<void>;
  loadSubcategories: (categoryId: string) => Promise<Subcategory[]>;
  loadBrands: (subcategoryId: string) => Promise<Brand[]>;
  loadModels: (brandId: string, subcategoryId?: string) => Promise<Model[]>;

  // Métodos auxiliares
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
  getBrandById: (id: string) => Brand | undefined;
  getModelById: (id: string) => Model | undefined;
  getSubcategoriesForCategory: (categoryId: string) => Subcategory[];
  getBrandsForSubcategory: (subcategoryId: string) => Brand[];
  getModelsForBrand: (brandId: string) => Model[];

  // Control de caché
  invalidateCache: (scope?: 'all' | 'categories' | 'subcategories' | 'brands' | 'models') => void;
  refreshCategories: () => Promise<void>;
}

// =====================================================
// CONTEXT
// =====================================================

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

// =====================================================
// PROVIDER
// =====================================================

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState<Record<string, Subcategory[]>>({});
  const [brandsBySubcategory, setBrandsBySubcategory] = useState<Record<string, Brand[]>>({});
  const [modelsByBrand, setModelsByBrand] = useState<Record<string, Model[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // CARGA DE CATEGORÍAS
  // =====================================================

  const loadCategories = useCallback(async () => {
    // Si ya están cargadas, no hacer nada
    if (categories.length > 0) {
      isDev && console.log('📦 Categorías ya cargadas en memoria');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ==========================================
      // CARGAR DESDE SUPABASE CON CACHÉ
      // ==========================================
      isDev && console.log('🔍 Cargando categorías desde Supabase...');
      
      // Verificar cache primero
      const cached = categoryCache.get<Category[]>(cacheKeys.categories());
      
      if (cached) {
        isDev && console.log('✅ Categorías cargadas desde caché');
        setCategories(cached);
        setIsLoading(false);
        return;
      }

      // Cargar desde Supabase
      const data = await getCategories() as Category[];
      
      // Guardar en estado y caché
      setCategories(data);
      categoryCache.set(cacheKeys.categories(), data, 1000 * 60 * 30); // 30 minutos
      
      isDev && console.log('✅ Categorías cargadas exitosamente:', data.length);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar categorías';
      setError(message);
      console.error('❌ Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [categories.length]);

  // =====================================================
  // CARGA DE SUBCATEGORÍAS
  // =====================================================

  const loadSubcategories = useCallback(async (categoryId: string): Promise<Subcategory[]> => {
    // Si ya están cargadas, retornarlas
    if (subcategoriesByCategory[categoryId]) {
      isDev && console.log(`📦 Subcategorías de ${categoryId} ya cargadas`);
      return subcategoriesByCategory[categoryId];
    }

    // Intentar obtener del caché
    const cacheKey = cacheKeys.subcategories(categoryId);
    const cached = categoryCache.get<Subcategory[]>(cacheKey);
    
    if (cached) {
      setSubcategoriesByCategory(prev => ({ ...prev, [categoryId]: cached }));
      return cached;
    }

    // Determinar categoría por ID o nombre
    const category = categories.find(c => c.id === categoryId);
    const categoryName = category?.name || '';
    
    isDev && console.log(`🔍 Cargando subcategorías para ${categoryName}...`);
    
    let data: Subcategory[] = [];
    
    // Usar tablas independientes según categoría
    if (categoryName === 'maquinarias') {
      const subs = await getMaquinariasSubcategories();
      data = subs.map(s => ({ ...s, category_id: categoryId }));
    } else if (categoryName === 'ganaderia') {
      const subs = await getGanaderiaSubcategories();
      data = subs.map(s => ({ ...s, category_id: categoryId }));
    } else if (categoryName === 'insumos') {
      const subs = await getInsumosSubcategories();
      data = subs.map(s => ({ ...s, category_id: categoryId }));
    } else {
      // Fallback a tablas viejas para otras categorías
      isDev && console.warn(`⚠️ Categoría ${categoryName} aún usa tablas legacy`);
      data = [] as Subcategory[];
    }
    
    // Guardar en estado y caché
    setSubcategoriesByCategory(prev => ({ ...prev, [categoryId]: data }));
    categoryCache.set(cacheKey, data, 1000 * 60 * 20); // 20 minutos
    
    return data;
  }, [subcategoriesByCategory, categories]);

  // =====================================================
  // CARGA DE MARCAS
  // =====================================================

  const loadBrands = useCallback(async (subcategoryId: string): Promise<Brand[]> => {
    // Si ya están cargadas, retornarlas
    if (brandsBySubcategory[subcategoryId]) {
      isDev && console.log(`📦 Marcas/Razas de ${subcategoryId} ya cargadas`);
      return brandsBySubcategory[subcategoryId];
    }

    // Intentar obtener del caché
    const cacheKey = cacheKeys.brands(subcategoryId);
    const cached = categoryCache.get<Brand[]>(cacheKey);
    
    if (cached) {
      setBrandsBySubcategory(prev => ({ ...prev, [subcategoryId]: cached }));
      return cached;
    }

    // Determinar categoría de esta subcategoría
    const subcategory = Object.values(subcategoriesByCategory)
      .flat()
      .find(s => s.id === subcategoryId);
    
    const category = categories.find(c => c.id === subcategory?.category_id);
    const categoryName = category?.name || '';
    
    isDev && console.log(`🔍 Cargando marcas/razas para ${categoryName} - ${subcategoryId}...`);
    
    let data: Brand[] = [];
    
    // Usar tablas independientes según categoría
    if (categoryName === 'maquinarias') {
      // Filtrar marcas que tienen modelos para esta subcategoría
      data = await getMaquinariasBrandsBySubcategory(subcategoryId);
    } else if (categoryName === 'ganaderia') {
      const razas = await getGanaderiaRazas(subcategoryId);
      data = razas.map(r => ({ id: r.id, name: r.name, display_name: r.display_name, is_active: r.is_active }));
    } else if (categoryName === 'insumos') {
      data = await getInsumosBrands();
    } else {
      isDev && console.warn(`⚠️ Categoría ${categoryName} aún usa tablas legacy`);
      data = [];
    }
    
    // Guardar en estado y caché
    setBrandsBySubcategory(prev => ({ ...prev, [subcategoryId]: data }));
    categoryCache.set(cacheKey, data, 1000 * 60 * 20); // 20 minutos
    
    return data;
  }, [brandsBySubcategory, subcategoriesByCategory, categories]);

  // =====================================================
  // CARGA DE MODELOS
  // =====================================================

  const loadModels = useCallback(async (brandId: string, subcategoryId?: string): Promise<Model[]> => {
    // Crear cache key que incluya subcategoryId si está presente
    const cacheKey = subcategoryId 
      ? `${cacheKeys.models(brandId)}_${subcategoryId}`
      : cacheKeys.models(brandId);
    
    // Si ya están cargados, retornarlos
    if (modelsByBrand[cacheKey]) {
      isDev && console.log(`📦 Modelos de ${brandId} ya cargados`);
      return modelsByBrand[cacheKey];
    }

    // Intentar obtener del caché
    const cached = categoryCache.get<Model[]>(cacheKey);
    
    if (cached) {
      setModelsByBrand(prev => ({ ...prev, [cacheKey]: cached }));
      return cached;
    }

    // Cargar modelos para maquinarias (con o sin filtro de subcategoría)
    isDev && console.log(`🔍 Cargando modelos para marca ${brandId}${subcategoryId ? ` y subcategoría ${subcategoryId}` : ''}...`);
    const data = await getMaquinariasModels(brandId, subcategoryId) as Model[];
    
    // Guardar en estado y caché
    setModelsByBrand(prev => ({ ...prev, [cacheKey]: data }));
    categoryCache.set(cacheKey, data, 1000 * 60 * 20); // 20 minutos
    
    return data;
  }, [modelsByBrand]);

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  const getCategoryById = useCallback((id: string) => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  const getSubcategoryById = useCallback((id: string) => {
    for (const subs of Object.values(subcategoriesByCategory)) {
      const found = subs.find(sub => sub.id === id);
      if (found) return found;
    }
    return undefined;
  }, [subcategoriesByCategory]);

  const getBrandById = useCallback((id: string) => {
    for (const brands of Object.values(brandsBySubcategory)) {
      const found = brands.find(brand => brand.id === id);
      if (found) return found;
    }
    return undefined;
  }, [brandsBySubcategory]);

  const getModelById = useCallback((id: string) => {
    for (const models of Object.values(modelsByBrand)) {
      const found = models.find(model => model.id === id);
      if (found) return found;
    }
    return undefined;
  }, [modelsByBrand]);

  // Helpers para obtener arrays por ID
  const getSubcategoriesForCategory = useCallback((categoryId: string): Subcategory[] => {
    return subcategoriesByCategory[categoryId] || [];
  }, [subcategoriesByCategory]);

  const getBrandsForSubcategory = useCallback((subcategoryId: string): Brand[] => {
    return brandsBySubcategory[subcategoryId] || [];
  }, [brandsBySubcategory]);

  const getModelsForBrand = useCallback((brandId: string): Model[] => {
    return modelsByBrand[brandId] || [];
  }, [modelsByBrand]);

  // Arrays planos combinados (para compatibilidad con código existente)
  const subcategories = Object.values(subcategoriesByCategory).flat();
  const brands = Object.values(brandsBySubcategory).flat();
  const models = Object.values(modelsByBrand).flat();

  // =====================================================
  // CONTROL DE CACHÉ
  // =====================================================

  const invalidateCache = useCallback((scope: 'all' | 'categories' | 'subcategories' | 'brands' | 'models' = 'all') => {
    isDev && console.log(`🗑️ Invalidando caché: ${scope}`);
    
    switch (scope) {
      case 'categories':
        categoryCache.invalidate(cacheKeys.categories());
        setCategories([]);
        break;
      case 'subcategories':
        categoryCache.invalidatePattern('subcategories:');
        setSubcategoriesByCategory({});
        break;
      case 'brands':
        categoryCache.invalidatePattern('brands:');
        setBrandsBySubcategory({});
        break;
      case 'models':
        categoryCache.invalidatePattern('models:');
        setModelsByBrand({});
        break;
      case 'all':
        categoryCache.clear();
        setCategories([]);
        setSubcategoriesByCategory({});
        setBrandsBySubcategory({});
        setModelsByBrand({});
        break;
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    isDev && console.log('🔄 Refrescando categorías...');
    invalidateCache('categories');
    await loadCategories();
  }, [invalidateCache, loadCategories]);

  // =====================================================
  // CARGA INICIAL AUTOMÁTICA
  // =====================================================

  useEffect(() => {
    isDev && console.log('🎯 CategoryContext montado - iniciando carga automática');
    loadCategories();
  }, []); // Sin dependencias para que solo se ejecute una vez

  // =====================================================
  // LOG DE ESTADÍSTICAS (solo en desarrollo)
  // =====================================================

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        categoryCache.logStats();
      }, 1000 * 60); // Cada minuto

      return () => clearInterval(interval);
    }
  }, []);

  // =====================================================
  // PROVIDER VALUE
  // =====================================================

  const value: CategoryContextType = {
    categories,
    subcategories,
    brands,
    models,
    subcategoriesByCategory,
    brandsBySubcategory,
    modelsByBrand,
    isLoading,
    error,
    loadCategories,
    loadSubcategories,
    loadBrands,
    loadModels,
    getCategoryById,
    getSubcategoryById,
    getBrandById,
    getModelById,
    getSubcategoriesForCategory,
    getBrandsForSubcategory,
    getModelsForBrand,
    invalidateCache,
    refreshCategories,
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

// =====================================================
// HOOK PERSONALIZADO
// =====================================================

export const useCategories = () => {
  const context = useContext(CategoryContext);
  
  if (!context) {
    throw new Error('useCategories debe usarse dentro de CategoryProvider');
  }
  
  return context;
};

// =====================================================
// EXPORT TYPES
// =====================================================

export type { Category, Subcategory, Brand, Model };
