// src/components/SearchResultsPage.tsx
import React, { useState } from 'react';
import { DynamicFilterPanel } from './filters/DynamicFilterPanel';
import { ResultsBannerIntercalated } from './banners/ResultsBannerIntercalated';
import { ResultsBannerLateral } from './banners/ResultsBannerLateral';
import { ProductCard } from './ProductCard';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import type { Product, FilterOptions } from '../../types';

interface SearchResultsPageProps {
  results: Product[];
  searchQuery?: string;
  categoryId?: string;
  onBack: () => void;
  filterOptions: FilterOptions;
  onFilter: (filters: any) => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  results,
  searchQuery,
  categoryId,
  onBack,
  filterOptions,
  onFilter,
}) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const handleFilterChange = (filters: Record<string, any>) => {
    setActiveFilters(filters);
    onFilter(filters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de resultados */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-[#16a135] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Volver</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {searchQuery ? `Resultados para "${searchQuery}"` : 'Todos los productos'}
                </h1>
                <p className="text-sm text-gray-600">
                  {results.length} {results.length === 1 ? 'resultado' : 'resultados'} encontrados
                </p>
              </div>
            </div>

            {/* Botón filtros móvil */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#138a2e] transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar de filtros - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-28 bg-white rounded-lg shadow-sm p-4">
              <DynamicFilterPanel
                categoryId={categoryId}
                onFilterChange={handleFilterChange}
                activeFilters={activeFilters}
              />
            </div>
          </aside>

          {/* Sidebar de filtros - Mobile (overlay) */}
          {showMobileFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileFilters(false)}>
              <div 
                className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="text-lg font-bold">Filtros</h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4">
                  <DynamicFilterPanel
                    categoryId={categoryId}
                    onFilterChange={(filters) => {
                      handleFilterChange(filters);
                      setShowMobileFilters(false);
                    }}
                    activeFilters={activeFilters}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Grid de productos con banners intercalados */}
          <main className="flex-1">
            {results.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  No se encontraron resultados
                </h2>
                <p className="text-gray-600 mb-6">
                  Intenta con otros términos de búsqueda o ajusta los filtros
                </p>
                <button
                  onClick={onBack}
                  className="px-6 py-3 bg-[#16a135] text-white rounded-lg hover:bg-[#138a2e] transition-colors font-medium"
                >
                  Volver al inicio
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {results.map((product, index) => (
                  <React.Fragment key={product.id}>
                    <ProductCard product={product} />
                    
                    {/* Banner intercalado cada 5 productos */}
                    {(index + 1) % 5 === 0 && (
                      <ResultsBannerIntercalated 
                        category={categoryId} 
                        position={index + 1}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Paginación (placeholder para futuro) */}
            {results.length > 0 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50" disabled>
                    Anterior
                  </button>
                  <button className="px-4 py-2 bg-[#16a135] text-white rounded-lg font-medium">
                    1
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    2
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    3
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Banners laterales - Desktop */}
          <ResultsBannerLateral category={categoryId} />
        </div>
      </div>
    </div>
  );
};
 
                className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="text-lg font-bold">Filtros</h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4">
                  <FilterSidebar
                    filterOptions={filterOptions}
                    onFilterChange={(filters) => {
                      onFilter(filters);
                      setShowMobileFilters(false);
                    }}
                    activeFilters={{}}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Grid de productos */}
          <main className="flex-1">
            {results.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  No se encontraron resultados
                </h2>
                <p className="text-gray-600 mb-6">
                  Intenta con otros términos de búsqueda o ajusta los filtros
                </p>
                <button
                  onClick={onBack}
                  className="px-6 py-3 bg-[#16a135] text-white rounded-lg hover:bg-[#138a2e] transition-colors font-medium"
                >
                  Volver al inicio
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Paginación (placeholder para futuro) */}
            {results.length > 0 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50" disabled>
                    Anterior
                  </button>
                  <button className="px-4 py-2 bg-[#16a135] text-white rounded-lg font-medium">
                    1
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    2
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    3
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

