// src/services/smartSearch.ts
import type { Product, SearchFilters } from '../../types';

// Sinónimos simples para mejorar búsquedas
const SYNONYMS: Record<string, string[]> = {
  'tractor': ['tractores', 'maquinaria agrícola'],
  'vaca': ['vacas', 'vaquillonas', 'ganado', 'bovinos'],
  'campo': ['campos', 'hectáreas', 'ha', 'terreno', 'tierra'],
  'soja': ['semillas de soja', 'grano', 'soya'],
  'maíz': ['semillas de maíz', 'grano de maíz', 'choclo'],
  'cosechadora': ['cosechadoras', 'máquina cosechadora'],
  'sembradora': ['sembradoras', 'máquina sembradora'],
};

/**
 * Calcula score de relevancia para un producto basado en coincidencias
 */
function calculateRelevanceScore(product: Product, query: string): number {
  let score = 0;
  const queryLower = query.toLowerCase();
  const titleLower = product.title.toLowerCase();
  const descLower = product.description.toLowerCase();

  // Coincidencia exacta en título (máxima prioridad)
  if (titleLower === queryLower) score += 100;
  
  // Coincidencia parcial en título
  if (titleLower.includes(queryLower)) score += 50;
  
  // Coincidencia en descripción
  if (descLower.includes(queryLower)) score += 20;
  
  // Coincidencia en tags
  if (product.tags) {
    product.tags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) score += 30;
    });
  }

  // Coincidencia en categoría
  if (product.category?.toLowerCase().includes(queryLower)) score += 25;

  // Bonus por productos premium
  if (product.isPremium) score += 10;

  // Bonus por productos recientes (últimos 30 días)
  if (product.updatedAt) {
    const daysSinceUpdate = (Date.now() - new Date(product.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) score += 5;
  }

  return score;
}

/**
 * Busca sinónimos y términos relacionados
 */
function expandQueryWithSynonyms(query: string): string[] {
  const queryLower = query.toLowerCase();
  const expanded = [queryLower];

  Object.entries(SYNONYMS).forEach(([key, synonyms]) => {
    if (queryLower.includes(key)) {
      expanded.push(...synonyms);
    }
    synonyms.forEach(synonym => {
      if (queryLower.includes(synonym)) {
        expanded.push(key, ...synonyms);
      }
    });
  });

  return [...new Set(expanded)];
}

/**
 * Aplica filtros avanzados a los productos
 */
export function smartSearch(products: Product[], filters: SearchFilters): Product[] {
  let filtered = [...products];

  // Filtrar por categorías
  if (filters.categories && filters.categories.length > 0) {
    filtered = filtered.filter(p => 
      filters.categories!.some(cat => p.category?.toLowerCase().includes(cat.toLowerCase()))
    );
  }

  // Filtrar por subcategorías
  if (filters.subcategories && filters.subcategories.length > 0) {
    filtered = filtered.filter(p => 
      filters.subcategories!.some(sub => p.subcategory?.toLowerCase().includes(sub.toLowerCase()))
    );
  }

  // Filtrar por provincias
  if (filters.provinces && filters.provinces.length > 0) {
    filtered = filtered.filter(p => 
      filters.provinces!.some(prov => p.province?.toLowerCase().includes(prov.toLowerCase()))
    );
  }

  // Filtrar por ubicaciones
  if (filters.locations && filters.locations.length > 0) {
    filtered = filtered.filter(p => 
      filters.locations!.some(loc => p.location?.toLowerCase().includes(loc.toLowerCase()))
    );
  }

  // Filtrar por premium
  if (filters.isPremium !== undefined) {
    filtered = filtered.filter(p => p.isPremium === filters.isPremium);
  }

  // Filtrar por tipo de usuario
  if (filters.userType) {
    filtered = filtered.filter(p => p.userType === filters.userType);
  }

  // Búsqueda inteligente por query
  if (filters.query && filters.query.trim()) {
    const expandedQueries = expandQueryWithSynonyms(filters.query);
    
    // Calcular score para cada producto
    const productsWithScore = filtered.map(product => {
      let maxScore = 0;
      
      expandedQueries.forEach(query => {
        const score = calculateRelevanceScore(product, query);
        maxScore = Math.max(maxScore, score);
      });

      return {
        ...product,
        relevanceScore: maxScore,
      };
    });

    // Filtrar solo los que tienen algún match (score > 0)
    filtered = productsWithScore.filter(p => p.relevanceScore && p.relevanceScore > 0);

    // Ordenar por relevancia
    filtered.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  } else {
    // Sin query, ordenar por fecha de actualización y premium
    filtered.sort((a, b) => {
      // Primero premium
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      
      // Luego por fecha
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  return filtered;
}

/**
 * Agrupa productos por categoría
 */
export function groupByCategory(products: Product[]): Record<string, Product[]> {
  const grouped: Record<string, Product[]> = {};

  products.forEach(product => {
    const category = product.category || 'Sin categoría';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(product);
  });

  return grouped;
}

/**
 * Filtra productos premium ordenados por relevancia y fecha
 */
export function getPremiumProducts(products: Product[]): Product[] {
  return products
    .filter(p => p.isPremium)
    .sort((a, b) => {
      // Ordenar por relevance score si existe
      if (a.relevanceScore && b.relevanceScore) {
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
      }
      
      // Luego por fecha de actualización
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
}
