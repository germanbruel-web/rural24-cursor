// src/components/SearchResultsPageMinimal.tsx
// Página de resultados con layout de 3 columnas y filtros laterales
import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import type { Product, FilterOptions, SearchFilters } from '../../types';
import { HeroSearchBarClon } from './HeroSearchBarClon';
import { ProductCard } from './organisms/ProductCard';

interface SearchResultsPageMinimalProps {
  results: Product[];
  searchQuery?: string;
  onBack: () => void;
  onSearch: (filters: SearchFilters) => void;
  filterOptions: FilterOptions;
  onFilter: (filters: any) => void;
  onViewDetail?: (adId: string) => void;
}

export const SearchResultsPageMinimal: React.FC<SearchResultsPageMinimalProps> = ({
  results,
  searchQuery,
  onBack,
  onSearch,
  filterOptions,
  onFilter,
  onViewDetail,
}) => {
  // Detectar categoría actual de los resultados
  const currentCategory = results.length > 0 ? results[0].category : '';
  
  const [activeFilters, setActiveFilters] = useState<any>({
    category: currentCategory || undefined
  });
  const [pendingFilters, setPendingFilters] = useState<any>({
    category: currentCategory || undefined
  });
  const [currentPage, setCurrentPage] = useState(1);
  const RESULTS_PER_PAGE = 20;
  
  // Obtener subcategorías únicas de los resultados filtrados por categoría
  const availableSubcategories = useMemo(() => {
    const subs = new Set<string>();
    results.forEach(product => {
      // Si hay categoría seleccionada, filtrar subcategorías de esa categoría
      if (pendingFilters.category) {
        if (product.category === pendingFilters.category && product.subcategory) {
          subs.add(product.subcategory);
        }
      } else {
        // Sin categoría, mostrar todas las subcategorías disponibles
        if (product.subcategory) {
          subs.add(product.subcategory);
        }
      }
    });
    const sorted = Array.from(subs).sort();
    console.log('🔍 Available subcategories for category:', pendingFilters.category, sorted);
    return sorted;
  }, [results, pendingFilters.category]);
  
  // Obtener condiciones únicas disponibles
  const availableConditions = useMemo(() => {
    const conds = new Set<string>();
    results.forEach(product => {
      if ((product as any).condicion) {
        conds.add((product as any).condicion);
      }
    });
    return Array.from(conds).sort();
  }, [results]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...pendingFilters, [key]: value };
    
    // Si cambia la categoría, resetear subcategoría
    if (key === 'category') {
      newFilters.subcategory = undefined;
    }
    
    setPendingFilters(newFilters);
  };
  
  const applyFilters = () => {
    console.log('🔍 Aplicando filtros:', pendingFilters);
    setActiveFilters(pendingFilters);
    setCurrentPage(1); // Reset a página 1 al aplicar filtros
  };

  const clearFilters = () => {
    const resetFilters = { category: currentCategory || undefined };
    setActiveFilters(resetFilters);
    setPendingFilters(resetFilters);
    setCurrentPage(1);
  };

  // Aplicar filtros locales
  const filteredResults = results.filter((product) => {
    // Filtro por categoría
    if (activeFilters.category && product.category !== activeFilters.category) {
      return false;
    }
    
    // Filtro por subcategoría
    if (activeFilters.subcategory && product.subcategory !== activeFilters.subcategory) {
      return false;
    }
    
    // Filtro por provincia
    if (activeFilters.province) {
      // Usar campo province directo con manejo defensivo
      if (!product.province || product.province !== activeFilters.province) {
        return false;
      }
    }
    
    // Filtro por condición (Nuevo/Usado)
    if (activeFilters.condicion && (product as any).condicion !== activeFilters.condicion) {
      return false;
    }
    
    return true;
  });
  
  // DEBUG: Log detallado de filtros
  console.log('🔍 FILTER DEBUG:', {
    totalResults: results.length,
    filteredResults: filteredResults.length,
    activeFilters,
    sampleProduct: results[0] ? {
      id: results[0].id,
      title: results[0].title,
      category: results[0].category,
      subcategory: results[0].subcategory,
      province: results[0].province,
    } : null,
  });
  
  console.log(`📊 Filtros aplicados: ${filteredResults.length} de ${results.length} avisos`);

  // JERARQUÍA DE AVISOS:
  // 1. Avisos Destacados (featured: true)
  // 2. Avisos Manuales por Fecha (usuarios de la plataforma)
  
  const featuredAds = filteredResults.filter(ad => ad.featured === true);
  const manualAds = filteredResults.filter(ad => !ad.featured);
  
  // Ordenar cada grupo por fecha (más recientes primero)
  const sortByDate = (a: Product, b: Product) => {
    const aDate = new Date(a.createdAt || 0).getTime();
    const bDate = new Date(b.createdAt || 0).getTime();
    return bDate - aDate;
  };
  
  featuredAds.sort(sortByDate);
  manualAds.sort(sortByDate);
  
  // Combinar en orden jerárquico
  const sortedResults = [...featuredAds, ...manualAds];

  // Paginación
  const totalPages = Math.ceil(sortedResults.length / RESULTS_PER_PAGE);
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
  const endIndex = startIndex + RESULTS_PER_PAGE;
  const paginatedResults = sortedResults.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (price === undefined || price === null) return 'Consultar';
    
    // Si el precio es 0 o negativo, mostrar "Consultar"
    if (price <= 0) return 'Consultar';
    
    // Formatear solo el número con separadores de miles
    const formattedNumber = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    
    // Determinar símbolo según moneda
    const symbol = currency === 'USD' ? 'USD' : '$';
    
    return `${symbol} ${formattedNumber}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Buscador de homepage */}
      <div className="bg-gradient-to-br from-[#f0f9f4] to-[#e8f5ed] py-6 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <HeroSearchBarClon onSearch={onSearch} showCategoryButtons={false} />
        </div>
      </div>

      {/* Info de resultados */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-sm text-gray-600">
            {searchQuery && <span className="font-medium">{searchQuery}</span>}
            {searchQuery && ' · '}
            {sortedResults.length} {sortedResults.length === 1 ? 'resultado' : 'resultados'}
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Izquierda - 20% - Filtros + Banners */}
            <aside className="lg:w-[20%]">
              {/* Filtros */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Filtros</h3>
                  {(activeFilters.province || activeFilters.subcategory || activeFilters.condicion || (activeFilters.category && activeFilters.category !== currentCategory)) && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-[#16a135] hover:text-[#138a2c] flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Filtro por Provincia */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provincia
                  </label>
                  <select
                    value={pendingFilters.province || ''}
                    onChange={(e) => handleFilterChange('province', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                  >
                    <option value="">Todas las provincias</option>
                    {filterOptions.provinces?.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Categoría */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={pendingFilters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                  >
                    <option value="">Todas las categorías</option>
                    {filterOptions.categories?.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Filtro por Subcategoría - Dinámico según categoría */}
                {availableSubcategories.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subcategoría
                    </label>
                    <select
                      value={pendingFilters.subcategory || ''}
                      onChange={(e) => handleFilterChange('subcategory', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                    >
                      <option value="">Todas las subcategorías</option>
                      {availableSubcategories.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Filtro por Condición (Nuevo/Usado) */}
                {availableConditions.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condición
                    </label>
                    <select
                      value={pendingFilters.condicion || ''}
                      onChange={(e) => handleFilterChange('condicion', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                    >
                      <option value="">Todas</option>
                      {availableConditions.map((cond) => (
                        <option key={cond} value={cond}>
                          {cond}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Botón APLICAR */}
                <button
                  onClick={applyFilters}
                  className="w-full bg-[#16a135] hover:bg-[#138a2c] text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  APLICAR FILTROS
                </button>

                {/* Contador de resultados filtrados */}
                <div className="pt-3 border-t border-gray-200 mt-4">
                  <p className="text-xs text-gray-500">
                    {filteredResults.length} {filteredResults.length === 1 ? 'aviso' : 'avisos'}
                  </p>
                </div>
              </div>

              {/* Banners debajo de filtros */}
              <div className="space-y-6">
                {/* Banner 1 */}
                <div 
                  id="banner-results-top"
                  className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                  style={{ height: '250px' }}
                >
                  <div className="text-center">
                    <p className="text-sm text-gray-500 font-medium">Banner 300x250</p>
                    <p className="text-xs text-gray-400 mt-1">Espacio publicitario</p>
                  </div>
                </div>

                {/* Banner 2 */}
                <div 
                  id="banner-results-middle"
                  className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                  style={{ height: '250px' }}
                >
                  <div className="text-center">
                    <p className="text-sm text-gray-500 font-medium">Banner 300x250</p>
                    <p className="text-xs text-gray-400 mt-1">Espacio publicitario</p>
                  </div>
                </div>

                {/* Banner 3 */}
                <div 
                  id="banner-results-bottom"
                  className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                  style={{ height: '600px' }}
                >
                  <div className="text-center">
                    <p className="text-sm text-gray-500 font-medium">Banner 300x600</p>
                    <p className="text-xs text-gray-400 mt-1">Espacio publicitario</p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Grid de Resultados Derecha - 80% - Cards en 4 columnas */}
            <div className="lg:w-[80%]">
              {sortedResults.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-lg">
                  <p className="text-gray-600 mb-4">No se encontraron resultados para tu búsqueda.</p>
                  <button
                    onClick={onBack}
                    className="text-[#16a135] hover:underline"
                  >
                    Volver al inicio
                  </button>
                </div>
              ) : (
                <>
                  {/* Info de paginación */}
                  <div className="text-sm text-gray-600 mb-4">
                    Mostrando {startIndex + 1}-{Math.min(endIndex, sortedResults.length)} de {sortedResults.length} resultados
                  </div>
                  
                  {/* Grid Responsive: Mobile 1, Tablet 2, Desktop 4 - Variante Compact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {paginatedResults.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        variant="compact"
                        showBadges={false}
                        showLocation={true}
                        showShareButton={true}
                        onViewDetail={onViewDetail}
                      />
                    ))}
                  </div>

                  {/* Paginación funcional */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      {/* Botón anterior */}
                      <button 
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        ‹ Anterior
                      </button>
                      
                      {/* Páginas */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-colors ${
                              currentPage === pageNum
                                ? 'bg-[#16a135] text-white'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      {/* Botón siguiente */}
                      <button 
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Siguiente ›
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
