// src/hooks/useProducts.ts
// ⚡ OPTIMIZADO: No carga al montar — solo cuando se llama refetch()
// Elimina ~200 filas de Supabase en cada visita a homepage
import { useState, useCallback, useRef } from "react";
import { getProducts } from "../services/getProducts";
import type { FilterOptions } from "../../types";
import { PROVINCES } from "../constants/locations";
import { ALL_CATEGORIES, ALL_SUBCATEGORIES } from "../constants/categories";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loaded = useRef(false);

  const loadProducts = useCallback(async () => {
    // Si ya se cargaron, no volver a cargar
    if (loaded.current) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts();
      setProducts(data);
      loaded.current = true;
    } catch (err) {
      console.error('❌ Error loading products:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getFilterOptions = useCallback((): FilterOptions => {
    // Usar todas las categorías y provincias disponibles, no solo las que aparecen en productos
    const categories = ALL_CATEGORIES;
    const subcategories = ALL_SUBCATEGORIES;
    const provinces = [...PROVINCES];
    
    // Locations y tags sí vienen de los productos actuales
    const locations = [...new Set(products.map(p => p.location).filter(Boolean))] as string[];
    const tags = [...new Set(products.flatMap(p => p.tags || []))];
    
    const prices = products.map(p => p.price).filter(Boolean) as number[];
    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
    };

    return {
      categories,
      subcategories,
      locations,
      provinces,
      tags,
      priceRange,
    };
  }, [products]);

  return { 
    products, 
    isLoading: loading, 
    error,
    getFilterOptions,
    refetch: loadProducts
  };
}
