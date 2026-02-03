// src/components/SearchResultsPageMinimal.tsx
// Página de resultados con FILTROS DINÁMICOS desde Backend
// ====================================================================
import React, { useState, useMemo, useEffect } from 'react';
import { X, Loader2, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import type { Product, FilterOptions, SearchFilters } from '../../types';
import { ProductCard } from './organisms/ProductCard';
import { ResultsBannerIntercalated } from './banners/ResultsBannerIntercalated';
import { ResultsBannerBelowFilter } from './banners/ResultsBannerBelowFilter';
import { SmartBreadcrumb } from './SmartBreadcrumb';
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
  // ESTADO PARA IDs DETECTADOS AUTOMÁTICAMENTE
  // Cuando el backend detecta subcategoría desde búsqueda, guardamos los IDs
  // para cargar los filtros dinámicos correctos
  // ============================================================
  const [detectedIds, setDetectedIds] = useState<{
    categoryId?: string;
    subcategoryId?: string;
  }>({});
  
  // ============================================================
  // FILTROS DINÁMICOS V2 - Con contadores desde backend
  // Usa slugs de URL O IDs detectados automáticamente
  // ============================================================
  const { 
    filters: backendFilters, 
    subcategories: backendSubcategories,
    category: resolvedCategory,
    subcategory: resolvedSubcategory,
    totalAds,
    loading: filtersLoading,
    reload: reloadFilters
  } = useDynamicFilters({ 
    categorySlug: urlFilters.cat || categorySlug, 
    subcategorySlug: urlFilters.sub || subcategorySlug,
    provinceSlug: urlFilters.prov,
    // ✅ FIX: Pasar IDs detectados para cargar atributos dinámicos
    categoryId: detectedIds.categoryId,
    subcategoryId: detectedIds.subcategoryId,
  });
  
  // ============================================================
  // CARGAR ADS DESDE BACKEND cuando cambian los filtros URL
  // ============================================================
  
  // Estado para metadata de detección automática
  const [detectedMeta, setDetectedMeta] = useState<{
    category?: string;
    subcategory?: string;
    category_id?: string;
    subcategory_id?: string;
    detected_from_search?: boolean;
    detected_category_slug?: string;
    detected_subcategory_slug?: string;
  } | null>(null);
  
  // Calcular un hash de todos los filtros URL para detectar cambios
  const urlFiltersHash = useMemo(() => JSON.stringify(urlFilters), [urlFilters]);
  
  // Estado para secciones colapsables
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['subcategoria', 'provincia', 'categoria'])
  );
  
  // Estado para mostrar/ocultar filtros en mobile
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  // 20 resultados = mejor balance entre carga y UX
  const RESULTS_PER_PAGE = 20;
  
  // Resetear página cuando cambian los filtros (excepto la primera carga)
  useEffect(() => {
    setCurrentPage(1);
  }, [urlFiltersHash]);
  
  useEffect(() => {
    const loadAds = async () => {
      setAdsLoading(true);
      console.log('🔍 Cargando ads desde backend con filtros:', urlFilters);
      
      // Pasar TODOS los filtros URL al backend (incluidos atributos dinámicos)
      const params: SearchFiltersParams = {
        ...urlFilters, // Incluye atributos dinámicos como marca, modelo, etc.
        page: currentPage, // Usar paginación por página
        limit: RESULTS_PER_PAGE, // 16 resultados por página
      };
      
      const result = await searchAdsFromBackend(params);
      console.log('✅ Ads cargados desde backend:', result.ads.length, 'de', result.total);
      
      setBackendAds(result.ads);
      setTotalFromBackend(result.total);
      
      // Guardar metadata de detección
      if (result.meta) {
        setDetectedMeta(result.meta);
        
        // ✅ FIX: Si detectó subcategoría, guardar IDs para cargar filtros dinámicos
        if (result.meta.detected_from_search && result.meta.category_id && result.meta.subcategory_id) {
          console.log('🎯 Subcategoría detectada automáticamente:', result.meta.subcategory);
          console.log('📦 Guardando IDs para filtros dinámicos:', { 
            categoryId: result.meta.category_id, 
            subcategoryId: result.meta.subcategory_id 
          });
          
          // Guardar IDs para que useDynamicFilters cargue los atributos
          setDetectedIds({
            categoryId: result.meta.category_id,
            subcategoryId: result.meta.subcategory_id,
          });
          
          // Actualizar URL sin recargar (replace para no llenar historial)
          if (result.meta.detected_category_slug && result.meta.detected_subcategory_slug) {
            const newUrl = `#/search?cat=${result.meta.detected_category_slug}&sub=${result.meta.detected_subcategory_slug}`;
            window.history.replaceState(null, '', newUrl);
          }
        }
      } else {
        // Limpiar IDs si no hay detección
        setDetectedIds({});
      }
      
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
      setDetectedMeta(null);
      setDetectedIds({});
      setAdsLoading(false);
    }
  }, [urlFiltersHash, results, currentPage]); // Agregar currentPage a dependencias
  
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

  // USAR ADS DESDE BACKEND (ya vienen filtrados y paginados)
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

  // Paginación server-side: el backend ya envía la página correcta
  const paginatedResults = sortedResults;
  const totalPages = Math.ceil(totalFromBackend / RESULTS_PER_PAGE);

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
      {/* Breadcrumb y contador de resultados */}
      <div className="border-b bg-white">
        <div className="max-w-[1400px] mx-auto px-4 py-4">
          <SmartBreadcrumb
            searchQuery={!detectedMeta?.category ? (urlFilters.q || searchQuery) : undefined}
            categoryName={resolvedCategory?.name || detectedMeta?.category}
            categorySlug={urlFilters.cat || detectedMeta?.detected_category_slug}
            subcategoryName={resolvedSubcategory?.name || detectedMeta?.subcategory}
            subcategorySlug={urlFilters.sub || detectedMeta?.detected_subcategory_slug}
            resultCount={totalFromBackend}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Botón para abrir filtros en mobile */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filtros</span>
                {activeFilterCount > 0 && (
                  <span className="bg-[#16a135] text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                {showMobileFilters ? (
                  <ChevronUp className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                )}
              </button>
            </div>

            {/* Sidebar Izquierda - 20% - Filtros + Banners */}
            {/* En mobile: solo visible cuando showMobileFilters=true */}
            {/* En desktop (lg+): siempre visible */}
            <aside className={`lg:w-[20%] ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
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
                  <div className="space-y-2">
                    {/* CATEGORÍAS - Solo mostrar si NO hay detección automática de búsqueda */}
                    {!detectedMeta?.detected_from_search && (
                    <div>
                      <button
                        onClick={() => toggleSection('categoria')}
                        className="flex items-center justify-between w-full text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1"
                      >
                        Categoría
                        {expandedSections.has('categoria') ? (
                          <ChevronUp className="w-3 h-3 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                      {expandedSections.has('categoria') && (
                        <div className="space-y-0">
                          <a
                            href={getFilterLink('cat', undefined)}
                            className={`block py-1 text-[13px] border-l-2 pl-2 transition-all ${
                              !urlFilters.cat
                                ? 'border-primary-500 text-primary-600 font-semibold bg-primary-50/50'
                                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'
                            }`}
                          >
                            Todas
                          </a>
                          {categoriesLoading ? (
                            <span className="text-xs text-gray-400 pl-2">Cargando...</span>
                          ) : (
                            backendCategories.map((cat) => {
                              const catSlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
                              const isActive = urlFilters.cat === catSlug || 
                                urlFilters.cat?.toLowerCase() === cat.name.toLowerCase();
                              return (
                                <a
                                  key={cat.id}
                                  href={getFilterLink('cat', catSlug)}
                                  className={`block py-1 text-[13px] border-l-2 pl-2 transition-all ${
                                    isActive
                                      ? 'border-primary-500 text-primary-600 font-semibold bg-primary-50/50'
                                      : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'
                                  }`}
                                >
                                  {cat.display_name || cat.name}
                                </a>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                    )}

                    {/* SUBCATEGORÍAS - Solo si hay categoría Y NO hay detección automática */}
                    {!detectedMeta?.detected_from_search && (urlFilters.cat || detectedIds.categoryId) && backendSubcategories.length > 0 && (
                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={() => toggleSection('subcategoria')}
                          className="flex items-center justify-between w-full text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1"
                        >
                          Subcategoría
                          {expandedSections.has('subcategoria') ? (
                            <ChevronUp className="w-3 h-3 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                        {expandedSections.has('subcategoria') && (
                          <div className="space-y-0">
                            <a
                              href={getFilterLink('sub', undefined)}
                              className={`block py-1 text-[13px] border-l-2 pl-2 transition-all ${
                                !urlFilters.sub
                                  ? 'border-primary-500 text-primary-600 font-semibold bg-primary-50/50'
                                  : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'
                              }`}
                            >
                              Todas
                            </a>
                            {backendSubcategories
                              .filter((sub) => sub.count > 0)
                              .map((sub) => {
                              const isActive = urlFilters.sub === sub.slug;
                              return (
                                <a
                                  key={sub.id}
                                  href={getFilterLink('sub', sub.slug)}
                                  className={`flex items-center justify-between py-1 text-[13px] border-l-2 pl-2 pr-1 transition-all ${
                                    isActive
                                      ? 'border-primary-500 text-primary-600 font-semibold bg-primary-50/50'
                                      : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'
                                  }`}
                                >
                                  <span>{sub.name}</span>
                                  <span className={`text-[10px] ${isActive ? 'text-primary-400' : 'text-gray-400'}`}>
                                    {sub.count}
                                  </span>
                                </a>
                              );
                            })}
                          </div>
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
                      if (filter.visible_when.requires_subcategory && !urlFilters.sub && !detectedIds.subcategoryId) return null;
                      if (filter.visible_when.requires_province && !urlFilters.prov) return null;
                      
                      // Filtrar opciones con avisos
                      const validOptions = filter.options.filter((opt) => opt.count > 0);
                      if (validOptions.length === 0) return null;
                      
                      return (
                        <div key={filter.field_name} className="border-t border-gray-100 pt-2">
                          {/* Header ultra-compacto */}
                          <button
                            onClick={() => toggleSection(sectionKey)}
                            className="flex items-center justify-between w-full text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1"
                          >
                            <span className="flex items-center gap-1">
                              {filter.field_label}
                              {filter.is_dynamic && (
                                <span className="w-1 h-1 bg-primary-500 rounded-full" />
                              )}
                            </span>
                            {expandedSections.has(sectionKey) ? (
                              <ChevronUp className="w-3 h-3 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                          
                          {expandedSections.has(sectionKey) && (
                            <div className="space-y-0">
                              {/* Link "Todos" */}
                              <a
                                href={getFilterLink(filter.field_name, undefined)}
                                className={`block py-1 text-[13px] border-l-2 pl-2 transition-all ${
                                  !currentValue
                                    ? 'border-primary-500 text-primary-600 font-semibold bg-primary-50/50'
                                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'
                                }`}
                              >
                                Todos
                              </a>
                              
                              {/* Opciones como links apilados */}
                              {validOptions.map((opt) => {
                                const optSlug = toSlug(opt.value);
                                const isActive = currentValue === optSlug;
                                return (
                                  <a
                                    key={opt.value}
                                    href={getFilterLink(filter.field_name, optSlug)}
                                    className={`flex items-center justify-between py-1 text-[13px] border-l-2 pl-2 pr-1 transition-all ${
                                      isActive
                                        ? 'border-primary-500 text-primary-600 font-semibold bg-primary-50/50'
                                        : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'
                                    }`}
                                  >
                                    <span className="truncate">{opt.label}</span>
                                    <span className={`text-[10px] flex-shrink-0 ${isActive ? 'text-primary-400' : 'text-gray-400'}`}>
                                      {opt.count}
                                    </span>
                                  </a>
                                );
                              })}
                            </div>
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

              {/* Banners debajo de filtros - Solo visible en desktop o cuando filtros están abiertos en mobile */}
              <div className="mt-6 hidden lg:block">
                <ResultsBannerBelowFilter category={urlFilters.cat || detectedMeta?.detected_category_slug || categorySlug} />
              </div>
              {showMobileFilters && (
                <div className="mt-6 lg:hidden">
                  <ResultsBannerBelowFilter category={urlFilters.cat || detectedMeta?.detected_category_slug || categorySlug} />
                </div>
              )}
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
                    Mostrando {((currentPage - 1) * RESULTS_PER_PAGE) + 1}-{Math.min(currentPage * RESULTS_PER_PAGE, totalFromBackend)} de {totalFromBackend} resultados
                  </div>
                  
                  {/* Grid Responsive: Mobile 2, Tablet 3, Desktop 4 - Variante Compact */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {paginatedResults.map((product, index) => (
                      <React.Fragment key={product.id}>
                        <ProductCard
                          product={product}
                          variant="compact"
                          showBadges={false}
                          showLocation={true}
                          showProvince={true}
                          onViewDetail={onViewDetail}
                        />
                        {/* Banner intercalado cada 8 productos */}
                        {(index + 1) % 8 === 0 && (
                          <ResultsBannerIntercalated 
                            category={urlFilters.cat || detectedMeta?.detected_category_slug || categorySlug} 
                            position={index + 1}
                          />
                        )}
                      </React.Fragment>
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
