// src/components/SearchResultsPageMinimal.tsx
// Página de resultados con FILTROS DINÁMICOS desde Backend
// ====================================================================
import React, { useState, useMemo, useEffect } from 'react';
import { X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Product, FilterOptions, SearchFilters } from '../../types';
import { HeroCategoryButtons } from './HeroCategoryButtons';
import { ProductCard } from './organisms/ProductCard';
import { useDynamicFilters, type FilterConfig, type FilterOption } from '../hooks/useDynamicFilters';
import { useCategories } from '../hooks/useCategories';
import { parseFilterParams, buildFilterUrl, toSlug } from '../utils/urlFilterUtils';
import { searchAdsFromBackend, type SearchFiltersParams } from '../services/adsService';

interface SearchResultsPageMinimalProps {
  results: Product[];
  searchQuery?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  onBack: () => void;
  onSearch: (filters: SearchFilters) => void;
  filterOptions: FilterOptions;
  onFilter: (filters: any) => void;
  onViewDetail?: (adId: string) => void;
}

export const SearchResultsPageMinimal: React.FC<SearchResultsPageMinimalProps> = ({
  results,
  searchQuery,
  categorySlug,
  subcategorySlug,
  onBack,
  onSearch,
  filterOptions,
  onFilter,
  onViewDetail,
}) => {
  // Estado para rastrear el hash de la URL (necesario para reactividad)
  const [hash, setHash] = useState(window.location.hash);
  
  // Escuchar cambios en el hash
  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  // Leer filtros activos desde la URL (GET params)
  const urlFilters = useMemo(() => parseFilterParams(), [hash]);
  
  // ============================================================
  // ESTADO: Ads cargados desde Backend
  // ============================================================
  const [backendAds, setBackendAds] = useState<Product[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [totalFromBackend, setTotalFromBackend] = useState(0);
  
  // ============================================================
  // CATEGORÍAS DESDE BACKEND (NO hardcodeadas)
  // ============================================================
  const { categories: backendCategories, loading: categoriesLoading } = useCategories();
  
  // ============================================================
  // FILTROS DINÁMICOS V2 - Con contadores desde backend
  // ============================================================
  const { 
    filters: backendFilters, 
    subcategories: backendSubcategories,
    category: resolvedCategory,
    subcategory: resolvedSubcategory,
    totalAds,
    loading: filtersLoading 
  } = useDynamicFilters({ 
    categorySlug: urlFilters.cat || categorySlug, 
    subcategorySlug: urlFilters.sub || subcategorySlug,
    provinceSlug: urlFilters.prov,
  });
  
  // ============================================================
  // CARGAR ADS DESDE BACKEND cuando cambian los filtros URL
  // ============================================================
  
  // Calcular un hash de todos los filtros URL para detectar cambios
  const urlFiltersHash = useMemo(() => JSON.stringify(urlFilters), [urlFilters]);
  
  useEffect(() => {
    const loadAds = async () => {
      setAdsLoading(true);
      console.log('🔍 Cargando ads desde backend con filtros:', urlFilters);
      
      // Pasar TODOS los filtros URL al backend (incluidos atributos dinámicos)
      const params: SearchFiltersParams = {
        ...urlFilters, // Incluye atributos dinámicos como marca, modelo, etc.
        limit: 100,
      };
      
      const result = await searchAdsFromBackend(params);
      console.log('✅ Ads cargados desde backend:', result.ads.length, 'de', result.total);
      
      setBackendAds(result.ads);
      setTotalFromBackend(result.total);
      setAdsLoading(false);
    };
    
    // Cargar si hay al menos un filtro activo
    const hasFilters = Object.keys(urlFilters).some(k => urlFilters[k]);
    if (hasFilters) {
      loadAds();
    } else {
      // Sin filtros: usar los results pasados como prop (comportamiento legacy)
      setBackendAds(results);
      setTotalFromBackend(results.length);
      setAdsLoading(false);
    }
  }, [urlFiltersHash, results]);
  
  // Estado para secciones colapsables
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['subcategoria', 'provincia', 'categoria'])
  );
  
  const [currentPage, setCurrentPage] = useState(1);
  const RESULTS_PER_PAGE = 20;
  
  // Toggle sección colapsable
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };
  
  // Generar link de filtro manteniendo otros filtros activos
  const getFilterLink = (key: string, value: string | undefined) => {
    const newFilters = { ...urlFilters, [key]: value };
    // Limpiar filtros dependientes
    if (key === 'cat' && !value) {
      delete newFilters.sub;
    }
    if (key === 'prov' && !value) {
      delete newFilters.city;
    }
    // Limpiar valores undefined
    Object.keys(newFilters).forEach(k => {
      if (!newFilters[k]) delete newFilters[k];
    });
    return buildFilterUrl('#/search', newFilters);
  };

  // Limpiar todos los filtros
  const clearFiltersUrl = buildFilterUrl('#/search', { q: urlFilters.q });

  // USAR ADS DESDE BACKEND (ya vienen filtrados)
  const filteredResults = backendAds;

  // Contar filtros activos
  const activeFilterCount = Object.keys(urlFilters).filter(k => k !== 'q').length;

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
      {/* Botones de categorías de homepage */}
      <div className="bg-gradient-to-br from-[#f0f9f4] to-[#e8f5ed] py-6 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <HeroCategoryButtons onSearch={onSearch} showCategoryButtons={false} />
        </div>
      </div>

      {/* Info de resultados */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-sm text-gray-600">
            {/* Mostrar categoría/subcategoría resuelta desde backend */}
            {resolvedCategory && (
              <span className="font-medium">{resolvedCategory.name}</span>
            )}
            {resolvedSubcategory && (
              <span className="font-medium"> › {resolvedSubcategory.name}</span>
            )}
            {searchQuery && !resolvedCategory && (
              <span className="font-medium">{searchQuery}</span>
            )}
            {(resolvedCategory || searchQuery) && ' · '}
            {adsLoading ? (
              <span className="text-gray-400">Cargando...</span>
            ) : (
              <span>{sortedResults.length} {sortedResults.length === 1 ? 'resultado' : 'resultados'}</span>
            )}
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Izquierda - 20% - Filtros + Banners */}
            <aside className="lg:w-[20%]">
              {/* Filtros como Links */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Filtros</h3>
                  {activeFilterCount > 0 && (
                    <a
                      href={clearFiltersUrl}
                      className="text-xs text-[#16a135] hover:text-[#138a2c] flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Limpiar ({activeFilterCount})
                    </a>
                  )}
                </div>

                {/* Loading state */}
                {filtersLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Cargando...</span>
                  </div>
                )}

                {!filtersLoading && (
                  <div className="space-y-4">
                    {/* CATEGORÍAS - Desde backend, siempre visible */}
                    <div>
                      <button
                        onClick={() => toggleSection('categoria')}
                        className="flex items-center justify-between w-full text-sm font-semibold text-gray-800 mb-2"
                      >
                        Categoría
                        {expandedSections.has('categoria') ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {expandedSections.has('categoria') && (
                        <ul className="space-y-1">
                          <li>
                            <a
                              href={getFilterLink('cat', undefined)}
                              className={`block px-2 py-1.5 text-sm rounded transition-colors ${
                                !urlFilters.cat
                                  ? 'bg-green-100 text-green-800 font-medium'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              Todas las categorías
                            </a>
                          </li>
                          {categoriesLoading ? (
                            <li className="text-sm text-gray-400 px-2 py-1">Cargando...</li>
                          ) : (
                            backendCategories.map((cat) => {
                              // Usar slug del backend directamente
                              const catSlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
                              const isActive = urlFilters.cat === catSlug || 
                                urlFilters.cat?.toLowerCase() === cat.name.toLowerCase();
                              return (
                                <li key={cat.id}>
                                  <a
                                    href={getFilterLink('cat', catSlug)}
                                    className={`block px-2 py-1.5 text-sm rounded transition-colors ${
                                      isActive
                                        ? 'bg-green-100 text-green-800 font-medium'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                  >
                                    {cat.display_name || cat.name}
                                  </a>
                                </li>
                              );
                            })
                          )}
                        </ul>
                      )}
                    </div>

                    {/* SUBCATEGORÍAS - Solo si hay categoría, CON CONTADORES del backend */}
                    {urlFilters.cat && backendSubcategories.length > 0 && (
                      <div className="border-t border-gray-100 pt-4">
                        <button
                          onClick={() => toggleSection('subcategoria')}
                          className="flex items-center justify-between w-full text-sm font-semibold text-gray-800 mb-2"
                        >
                          Subcategoría
                          {expandedSections.has('subcategoria') ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        {expandedSections.has('subcategoria') && (
                          <ul className="space-y-1">
                            <li>
                              <a
                                href={getFilterLink('sub', undefined)}
                                className={`block px-2 py-1.5 text-sm rounded transition-colors ${
                                  !urlFilters.sub
                                    ? 'bg-green-100 text-green-800 font-medium'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                Todas
                              </a>
                            </li>
                            {backendSubcategories
                              .filter((sub) => sub.count > 0) // Ocultar subcategorías sin avisos
                              .map((sub) => {
                              const isActive = urlFilters.sub === sub.slug;
                              return (
                                <li key={sub.id}>
                                  <a
                                    href={getFilterLink('sub', sub.slug)}
                                    className={`block px-2 py-1.5 text-sm rounded transition-colors ${
                                      isActive
                                        ? 'bg-green-100 text-green-800 font-medium'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                  >
                                    {sub.name}
                                    <span className={`ml-1 ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                      ({sub.count})
                                    </span>
                                  </a>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* FILTROS DINÁMICOS DEL BACKEND (Provincia, Localidad, Atributos) */}
                    {backendFilters.map((filter) => {
                      // Saltar filtros de precio (se manejan diferente) y filtros vacíos
                      if (filter.filter_type === 'range') return null;
                      if (filter.options.length === 0) return null;
                      
                      const sectionKey = filter.field_name;
                      const currentValue = urlFilters[filter.field_name];
                      
                      // Determinar si mostrar según visible_when
                      if (filter.visible_when.requires_subcategory && !urlFilters.sub) return null;
                      if (filter.visible_when.requires_province && !urlFilters.prov) return null;
                      
                      return (
                        <div key={filter.field_name} className="border-t border-gray-100 pt-4">
                          <button
                            onClick={() => toggleSection(sectionKey)}
                            className="flex items-center justify-between w-full text-sm font-semibold text-gray-800 mb-2"
                          >
                            <span className="flex items-center gap-1">
                              {filter.field_label}
                              {filter.is_dynamic && (
                                <span className="text-[10px] text-purple-500 font-normal">●</span>
                              )}
                            </span>
                            {expandedSections.has(sectionKey) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          {expandedSections.has(sectionKey) && (
                            <ul className="space-y-1 max-h-48 overflow-y-auto">
                              <li>
                                <a
                                  href={getFilterLink(filter.field_name, undefined)}
                                  className={`block px-2 py-1.5 text-sm rounded transition-colors ${
                                    !currentValue
                                      ? 'bg-green-100 text-green-800 font-medium'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  {filter.field_name === 'province' ? 'Todas las provincias' : 'Todos'}
                                </a>
                              </li>
                              {filter.options
                                .filter((opt) => opt.count > 0) // Ocultar opciones sin avisos
                                .map((opt) => {
                                const optSlug = toSlug(opt.value);
                                const isActive = currentValue === optSlug;
                                return (
                                  <li key={opt.value}>
                                    <a
                                      href={getFilterLink(filter.field_name, optSlug)}
                                      className={`block px-2 py-1.5 text-sm rounded transition-colors ${
                                        isActive
                                          ? 'bg-green-100 text-green-800 font-medium'
                                          : 'text-gray-600 hover:bg-gray-100'
                                      }`}
                                    >
                                      {opt.label}
                                      <span className={`ml-1 ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                        ({opt.count})
                                      </span>
                                    </a>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      );
                    })}

                    {/* RANGO DE PRECIO */}
                    {backendFilters.some(f => f.filter_type === 'range' && f.field_name === 'price' && f.range) && (
                      <div className="border-t border-gray-100 pt-4">
                        <button
                          onClick={() => toggleSection('precio')}
                          className="flex items-center justify-between w-full text-sm font-semibold text-gray-800 mb-2"
                        >
                          Precio
                          {expandedSections.has('precio') ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        {expandedSections.has('precio') && (() => {
                          const priceFilter = backendFilters.find(f => f.field_name === 'price');
                          if (!priceFilter?.range) return null;
                          return (
                            <div className="px-2 space-y-2">
                              <p className="text-xs text-gray-500">
                                Rango: ${priceFilter.range.min.toLocaleString()} - ${priceFilter.range.max.toLocaleString()}
                              </p>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  placeholder="Mín"
                                  className="w-1/2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                  defaultValue={urlFilters.priceMin}
                                />
                                <input
                                  type="number"
                                  placeholder="Máx"
                                  className="w-1/2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                  defaultValue={urlFilters.priceMax}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Contador de resultados */}
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
              {adsLoading ? (
                <div className="py-12 text-center bg-white rounded-lg">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#16a135] border-t-transparent mb-4"></div>
                  <p className="text-gray-600">Cargando resultados...</p>
                </div>
              ) : sortedResults.length === 0 ? (
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
                  
                  {/* Grid Responsive: Mobile 2, Tablet 3, Desktop 4 - Variante Compact */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {paginatedResults.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        variant="compact"
                        showBadges={false}
                        showLocation={true}
                        showProvince={true}
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
