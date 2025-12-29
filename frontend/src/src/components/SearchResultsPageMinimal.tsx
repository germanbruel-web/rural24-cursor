// src/components/SearchResultsPageMinimal.tsx
// Página de resultados con layout de 3 columnas y filtros laterales
import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Product, FilterOptions, SearchFilters } from '../../types';
import { HeroSearchBarClon } from './HeroSearchBarClon';
import { UnifiedAdCard } from './UnifiedAdCard';

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
  const [currentPage, setCurrentPage] = useState(1);
  const RESULTS_PER_PAGE = 20;

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    setCurrentPage(1); // Reset a página 1 al filtrar
  };

  const clearFilters = () => {
    setActiveFilters({ category: currentCategory || undefined });
    setCurrentPage(1);
  };

  // Aplicar filtros locales
  const filteredResults = results.filter((product) => {
    // Filtro por categoría
    if (activeFilters.category && product.category !== activeFilters.category) {
      return false;
    }
    
    // Filtro por provincia
    if (activeFilters.province && product.location) {
      // Buscar provincia en el campo location (ej: "Buenos Aires", "Córdoba, Argentina")
      const locationLower = product.location.toLowerCase();
      const provinceLower = activeFilters.province.toLowerCase();
      if (!locationLower.includes(provinceLower)) {
        return false;
      }
    }
    
    return true;
  });

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
                  {(activeFilters.province || (activeFilters.category && activeFilters.category !== currentCategory)) && (
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
                    value={activeFilters.province || ''}
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
                    value={activeFilters.category || ''}
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

                {/* Contador de resultados filtrados */}
                <div className="pt-3 border-t border-gray-200">
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
                  
                  {/* SECCIÓN 1: Avisos Destacados */}
                  {featuredAds.length > 0 && startIndex < featuredAds.length && (
                    <div className="mb-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl shadow-lg">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-bold text-sm">Avisos Destacados</span>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedResults.filter(ad => ad.featured).map((product) => (
                          <UnifiedAdCard
                            key={product.id}
                            product={product}
                            onViewDetail={onViewDetail}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN 2: Avisos Manuales por Fecha */}
                  {manualAds.length > 0 && (startIndex < featuredAds.length + manualAds.length) && (
                    <div className="mb-10">
                      {featuredAds.length > 0 && startIndex < featuredAds.length && (
                        <div className="flex items-center gap-3 mb-6">
                          <div className="flex items-center gap-2 bg-gradient-to-r from-[#16a135] to-[#138a2c] text-white px-4 py-2 rounded-xl shadow-lg">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="font-bold text-sm">Resultados de la búsqueda</span>
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedResults.filter(ad => !ad.featured).map((product) => (
                          <UnifiedAdCard
                            key={product.id}
                            product={product}
                            onViewDetail={onViewDetail}
                          />
                        ))}
                      </div>
                    </div>
                  )}

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
