/**
 * AdsManagementPanel - Panel Minimalista de Gestión de Avisos
 * 
 * UX Flow:
 * 1. Seleccionar Categoría Principal
 * 2. Seleccionar Subcategoría
 * 3. Click BUSCAR → Carga avisos paginados (10 por página)
 * 4. Filtro interno por título (autocomplete local)
 * 5. Marcar/Desmarcar destacado con fecha
 * 6. PUBLICAR CAMBIOS → Refresh en Homepage
 * 
 * AHORRO DE RECURSOS: No carga avisos hasta que se hace click en BUSCAR
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Star, StarOff, RefreshCw, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { notify } from '../../utils/notifications';

// ============================================================
// TYPES
// ============================================================

interface Category {
  id: string;
  name: string;
  display_name?: string;
}

interface Subcategory {
  id: string;
  name: string;
  display_name?: string;
  category_id: string;
}

interface AdRow {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  status: string;
  featured: boolean;
  featured_until: string | null;
  created_at: string;
  user_id: string;
  seller_name?: string;
  seller_email?: string;
}

interface PendingChange {
  ad_id: string;
  action: 'feature' | 'unfeature';
  featured_until?: string;
}

interface SellerEdit {
  user_id: string;
  new_name: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const RECORDS_PER_PAGE = 10;

// ============================================================
// COMPONENT
// ============================================================

export default function AdsManagementPanel() {
  // === STEP 1 & 2: Filtros de selección ===
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  
  // === STEP 3: Resultados ===
  const [ads, setAds] = useState<AdRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // === Paginación ===
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // === STEP 4: Filtro por título (local) ===
  const [titleFilter, setTitleFilter] = useState('');
  
  // === STEP 5 & 6: Cambios pendientes ===
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map());
  const [publishing, setPublishing] = useState(false);
  
  // === Fecha destacado temporal ===
  const [editingFeaturedId, setEditingFeaturedId] = useState<string | null>(null);
  const [tempFeaturedDate, setTempFeaturedDate] = useState('');
  
  // === Edición de vendedor ===
  const [editingSellerUserId, setEditingSellerUserId] = useState<string | null>(null);
  const [tempSellerName, setTempSellerName] = useState('');
  const [savingSeller, setSavingSeller] = useState(false);

  // ============================================================
  // LOAD CATEGORIES & SUBCATEGORIES
  // ============================================================

  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, display_name')
        .eq('is_active', true)
        .order('display_name');
      setCategories(data || []);
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      setSelectedSubcategory('');
      return;
    }
    
    const loadSubcategories = async () => {
      const { data } = await supabase
        .from('subcategories')
        .select('id, name, display_name, category_id')
        .eq('category_id', selectedCategory)
        .eq('is_active', true)
        .order('display_name');
      setSubcategories(data || []);
      setSelectedSubcategory('');
    };
    loadSubcategories();
  }, [selectedCategory]);

  // ============================================================
  // STEP 3: BUSCAR (Solo cuando se hace click)
  // ============================================================

  const handleSearch = useCallback(async (page = 1) => {
    if (!selectedCategory) {
      notify.warning('Selecciona una categoría');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setTitleFilter(''); // Reset filtro de título
    
    try {
      // Count total
      let countQuery = supabase
        .from('ads')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', selectedCategory)
        .neq('status', 'deleted');
      
      if (selectedSubcategory) {
        countQuery = countQuery.eq('subcategory_id', selectedSubcategory);
      }

      const { count } = await countQuery;
      setTotalRecords(count || 0);

      // Fetch ads
      const from = (page - 1) * RECORDS_PER_PAGE;
      const to = from + RECORDS_PER_PAGE - 1;

      let query = supabase
        .from('ads')
        .select('id, title, price, currency, status, featured, featured_until, created_at, user_id')
        .eq('category_id', selectedCategory)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (selectedSubcategory) {
        query = query.eq('subcategory_id', selectedSubcategory);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Cargar nombres de vendedores
      const userIds = [...new Set((data || []).map(d => d.user_id).filter(Boolean))];

      let usersMap: Record<string, { name: string; email: string }> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds);
        (users || []).forEach((u: any) => {
          usersMap[u.id] = {
            name: u.full_name || u.email?.split('@')[0] || 'Sin nombre',
            email: u.email || ''
          };
        });
      }

      const adsWithSellers = (data || []).map(ad => ({
        ...ad,
        seller_name: usersMap[ad.user_id]?.name || 'Sin nombre',
        seller_email: usersMap[ad.user_id]?.email || ''
      }));

      setAds(adsWithSellers);
      setCurrentPage(page);
      setPendingChanges(new Map()); // Reset cambios pendientes
    } catch (err) {
      console.error('Error loading ads:', err);
      notify.error('Error al cargar avisos');
    }
    
    setLoading(false);
  }, [selectedCategory, selectedSubcategory]);

  // ============================================================
  // EDIT SELLER NAME
  // ============================================================

  const startEditingSeller = (userId: string, currentName: string) => {
    setEditingSellerUserId(userId);
    setTempSellerName(currentName === 'Sin nombre' ? '' : currentName);
  };

  const cancelEditingSeller = () => {
    setEditingSellerUserId(null);
    setTempSellerName('');
  };

  const saveSeller = async (userId: string) => {
    if (!tempSellerName.trim()) {
      notify.warning('Ingresa un nombre');
      return;
    }

    setSavingSeller(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: tempSellerName.trim() })
        .eq('id', userId);

      if (error) throw error;

      // Actualizar localmente
      setAds(prev => prev.map(ad => 
        ad.user_id === userId 
          ? { ...ad, seller_name: tempSellerName.trim() }
          : ad
      ));

      notify.success('Nombre actualizado');
      setEditingSellerUserId(null);
      setTempSellerName('');
    } catch (err) {
      console.error('Error updating seller:', err);
      notify.error('Error al actualizar nombre');
    }
    setSavingSeller(false);
  };

  // ============================================================
  // STEP 4: Filtro por título (LOCAL - sin nueva query)
  // ============================================================

  const filteredAds = useMemo(() => {
    if (!titleFilter.trim()) return ads;
    
    const search = titleFilter.toLowerCase();
    return ads.filter(ad => ad.title.toLowerCase().includes(search));
  }, [ads, titleFilter]);

  // Títulos para autocomplete
  const titleSuggestions = useMemo(() => {
    if (titleFilter.length < 1) return [];
    const search = titleFilter.toLowerCase();
    return ads
      .filter(ad => ad.title.toLowerCase().includes(search))
      .map(ad => ad.title)
      .slice(0, 5);
  }, [ads, titleFilter]);

  // ============================================================
  // STEP 5: Toggle Destacado
  // ============================================================

  const toggleFeatured = (adId: string, currentFeatured: boolean) => {
    const newChanges = new Map(pendingChanges);
    
    if (currentFeatured) {
      // Quitar destacado
      newChanges.set(adId, { ad_id: adId, action: 'unfeature' });
    } else {
      // Abrir selector de fecha
      setEditingFeaturedId(adId);
      setTempFeaturedDate('');
    }
    
    setPendingChanges(newChanges);
  };

  const confirmFeatured = (adId: string) => {
    const newChanges = new Map(pendingChanges);
    newChanges.set(adId, { 
      ad_id: adId, 
      action: 'feature',
      featured_until: tempFeaturedDate || undefined
    });
    setPendingChanges(newChanges);
    setEditingFeaturedId(null);
    setTempFeaturedDate('');
  };

  const cancelFeatured = () => {
    setEditingFeaturedId(null);
    setTempFeaturedDate('');
  };

  // Estado efectivo de un aviso (considerando cambios pendientes)
  const getEffectiveFeatured = (ad: AdRow): boolean => {
    const change = pendingChanges.get(ad.id);
    if (change) {
      return change.action === 'feature';
    }
    return ad.featured;
  };

  // ============================================================
  // STEP 6: PUBLICAR CAMBIOS
  // ============================================================

  const publishChanges = async () => {
    if (pendingChanges.size === 0) {
      notify.info('No hay cambios pendientes');
      return;
    }

    setPublishing(true);
    
    try {
      const changes = Array.from(pendingChanges.values());
      
      for (const change of changes) {
        if (change.action === 'feature') {
          await supabase
            .from('ads')
            .update({ 
              featured: true,
              featured_until: change.featured_until || null 
            })
            .eq('id', change.ad_id);
        } else {
          await supabase
            .from('ads')
            .update({ 
              featured: false,
              featured_until: null 
            })
            .eq('id', change.ad_id);
        }
      }

      notify.success(`${changes.length} cambio(s) publicados. Homepage actualizada.`);
      setPendingChanges(new Map());
      
      // Recargar datos
      await handleSearch(currentPage);
    } catch (err) {
      console.error('Error publishing changes:', err);
      notify.error('Error al publicar cambios');
    }
    
    setPublishing(false);
  };

  // ============================================================
  // PAGINATION
  // ============================================================

  const totalPages = Math.ceil(totalRecords / RECORDS_PER_PAGE);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Avisos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Selecciona categoría → subcategoría → BUSCAR
          </p>
        </div>

        {/* === FILTROS: Paso 1, 2, 3 === */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <div className="flex flex-wrap items-end gap-3">
            
            {/* Paso 1: Categoría */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                1. Categoría Principal
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">-- Seleccionar --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.display_name || cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Paso 2: Subcategoría */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                2. Subcategoría
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                disabled={!selectedCategory}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Todas --</option>
                {subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.display_name || sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Paso 3: Botón BUSCAR */}
            <button
              onClick={() => handleSearch(1)}
              disabled={!selectedCategory || loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              BUSCAR
            </button>
          </div>
        </div>

        {/* === RESULTADOS === */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            
            {/* Toolbar: Filtro por título + Publicar */}
            <div className="px-4 py-3 border-b bg-gray-50 flex flex-wrap items-center justify-between gap-3">
              
              {/* Paso 4: Filtro por título */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={titleFilter}
                  onChange={(e) => setTitleFilter(e.target.value)}
                  placeholder="Filtrar por título..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  list="title-suggestions"
                />
                <datalist id="title-suggestions">
                  {titleSuggestions.map((title, i) => (
                    <option key={i} value={title} />
                  ))}
                </datalist>
              </div>

              <div className="flex items-center gap-3">
                {/* Contador */}
                <span className="text-sm text-gray-500">
                  {totalRecords} aviso{totalRecords !== 1 ? 's' : ''}
                </span>

                {/* Paso 6: Botón PUBLICAR CAMBIOS */}
                {pendingChanges.size > 0 && (
                  <button
                    onClick={publishChanges}
                    disabled={publishing}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg flex items-center gap-2 transition-colors animate-pulse"
                  >
                    {publishing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    PUBLICAR CAMBIOS ({pendingChanges.size})
                  </button>
                )}
              </div>
            </div>

            {/* Tabla tipo Excel */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600 w-12"><Star className="w-4 h-4" /></th>
                    <th className="px-4 py-3 font-medium text-gray-600">TÍTULO</th>
                    <th className="px-4 py-3 font-medium text-gray-600 w-28">PRECIO</th>
                    <th className="px-4 py-3 font-medium text-gray-600 w-24">ESTADO</th>
                    <th className="px-4 py-3 font-medium text-gray-600 w-40">VENDEDOR</th>
                    <th className="px-4 py-3 font-medium text-gray-600 w-36">DESTACADO HASTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Cargando...
                      </td>
                    </tr>
                  ) : filteredAds.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        No se encontraron avisos
                      </td>
                    </tr>
                  ) : (
                    filteredAds.map(ad => {
                      const isFeatured = getEffectiveFeatured(ad);
                      const hasPendingChange = pendingChanges.has(ad.id);
                      const isEditing = editingFeaturedId === ad.id;
                      
                      return (
                        <tr 
                          key={ad.id} 
                          className={`hover:bg-gray-50 ${hasPendingChange ? 'bg-yellow-50' : ''}`}
                        >
                          {/* Columna Destacado */}
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => confirmFeatured(ad.id)}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                                  title="Confirmar"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelFeatured}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded text-xs"
                                  title="Cancelar"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => toggleFeatured(ad.id, isFeatured)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isFeatured 
                                    ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' 
                                    : 'text-gray-300 hover:text-yellow-500 hover:bg-gray-100'
                                }`}
                                title={isFeatured ? 'Quitar destacado' : 'Destacar'}
                              >
                                {isFeatured ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                              </button>
                            )}
                          </td>

                          {/* Título */}
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900 line-clamp-1">
                              {ad.title}
                            </span>
                          </td>

                          {/* Precio */}
                          <td className="px-4 py-3 text-gray-600">
                            {ad.price ? `${ad.currency || '$'} ${ad.price.toLocaleString()}` : '-'}
                          </td>

                          {/* Estado */}
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                              ad.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {ad.status === 'active' ? 'Activo' : ad.status}
                            </span>
                          </td>

                          {/* Vendedor */}
                          <td className="px-4 py-3 text-gray-600 truncate max-w-[160px]">
                            {ad.seller_name}
                          </td>

                          {/* Fecha destacado */}
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="date"
                                value={tempFeaturedDate}
                                onChange={(e) => setTempFeaturedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-2 py-1 border rounded text-xs"
                                autoFocus
                              />
                            ) : (
                              <span className="text-xs text-gray-500">
                                {ad.featured_until
                                  ? new Date(ad.featured_until).toLocaleDateString('es-AR')
                                  : isFeatured ? 'Permanente' : '-'
                                }
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleSearch(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </button>
                  <button
                    onClick={() => handleSearch(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado inicial */}
        {!hasSearched && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Selecciona los filtros y haz click en BUSCAR
            </h3>
            <p className="text-sm text-gray-400">
              Los avisos no se cargan automáticamente para ahorrar recursos
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
