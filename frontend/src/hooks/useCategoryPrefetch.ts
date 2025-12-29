/**
 * Hook de Pre-fetch Inteligente
 * Carga datos en segundo plano para que estén disponibles
 * cuando el usuario los necesite
 */

import { useState, useEffect } from 'react';
import { useCategories } from '../contexts/CategoryContext';

interface PrefetchConfig {
  enabled?: boolean;
  popularCategories?: string[];
  popularSubcategories?: string[];
  delayMs?: number;
}

const DEFAULT_CONFIG: PrefetchConfig = {
  enabled: true,
  // IDs de las categorías más populares (basado en analytics)
  popularCategories: ['maquinarias', 'ganaderia'],
  // IDs de las subcategorías más populares
  popularSubcategories: ['tractores', 'cosechadoras', 'sembradoras'],
  delayMs: 1000, // Esperar 1 segundo antes de pre-cargar
};

export function useCategoryPrefetch(config: PrefetchConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [isPreloading, setIsPreloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preloadedItems, setPreloadedItems] = useState({
    categories: false,
    subcategories: 0,
    brands: 0,
  });

  const {
    categories,
    loadCategories,
    loadSubcategories,
    loadBrands,
  } = useCategories();

  useEffect(() => {
    if (!mergedConfig.enabled) return;

    const prefetchData = async () => {
      setIsPreloading(true);
      setProgress(0);

      try {
        console.log('🚀 Iniciando pre-fetch inteligente...');

        // Paso 1: Asegurar que categorías están cargadas (10%)
        if (categories.length === 0) {
          await loadCategories();
        }
        setPreloadedItems(prev => ({ ...prev, categories: true }));
        setProgress(10);

        // Paso 2: Pre-cargar subcategorías populares (40%)
        if (mergedConfig.popularCategories && mergedConfig.popularCategories.length > 0) {
          const categoryPromises = mergedConfig.popularCategories.map(async (catName) => {
            const category = categories.find(c => 
              c.name.toLowerCase() === catName.toLowerCase() ||
              c.slug === catName
            );
            
            if (category) {
              return loadSubcategories(category.id);
            }
            return [];
          });

          await Promise.all(categoryPromises);
          setPreloadedItems(prev => ({ 
            ...prev, 
            subcategories: mergedConfig.popularCategories!.length 
          }));
          setProgress(50);
        }

        // Paso 3: Pre-cargar marcas de subcategorías populares (90%)
        if (mergedConfig.popularSubcategories && mergedConfig.popularSubcategories.length > 0) {
          // Buscar IDs de subcategorías por nombre
          const subcategoryIds: string[] = [];
          
          for (const subName of mergedConfig.popularSubcategories) {
            for (const category of categories) {
              const subs = await loadSubcategories(category.id);
              const found = subs.find(s => 
                s.name.toLowerCase() === subName.toLowerCase() ||
                s.display_name.toLowerCase().includes(subName.toLowerCase())
              );
              if (found) {
                subcategoryIds.push(found.id);
                break;
              }
            }
          }

          const brandPromises = subcategoryIds.map(subId => loadBrands(subId));
          await Promise.all(brandPromises);
          
          setPreloadedItems(prev => ({ 
            ...prev, 
            brands: subcategoryIds.length 
          }));
          setProgress(100);
        }

        console.log('✅ Pre-fetch completado:', preloadedItems);

      } catch (error) {
        console.error('❌ Error en pre-fetch:', error);
      } finally {
        setIsPreloading(false);
      }
    };

    // Ejecutar pre-fetch en idle time o con delay
    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(
        () => {
          setTimeout(prefetchData, mergedConfig.delayMs);
        },
        { timeout: 5000 }
      );

      return () => window.cancelIdleCallback(handle);
    } else {
      const timeout = setTimeout(prefetchData, mergedConfig.delayMs);
      return () => clearTimeout(timeout);
    }
  }, [
    mergedConfig.enabled,
    mergedConfig.delayMs,
    categories.length,
    loadCategories,
    loadSubcategories,
    loadBrands,
  ]);

  return {
    isPreloading,
    progress,
    preloadedItems,
  };
}

/**
 * Hook simplificado que pre-carga con configuración por defecto
 */
export function useSmartPrefetch() {
  return useCategoryPrefetch({
    enabled: true,
    popularCategories: ['maquinarias', 'ganaderia'],
    popularSubcategories: ['tractores', 'cosechadoras', 'sembradoras'],
  });
}
