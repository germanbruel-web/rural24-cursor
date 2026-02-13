/**
 * AllAdsTab.tsx
 * Tab para gestionar todos los avisos (CRUD completo)
 * Integrado en SuperAdminFeaturedPanel
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Package,
  User,
  CheckCircle,
  X,
  Hash
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { notify } from '../../utils/notifications';
import { QuickEditAdModal } from './QuickEditAdModal';

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
  slug: string;
  price: number | null;
  currency: string;
  status: string;
  category_id: string;
  subcategory_id: string | null;
  created_at: string;
  user_id: string;
  images: string[];
  // JOINs
  seller_name?: string;
  seller_email?: string;
  category_name?: string;
  // Featured status (from featured_ads table)
  featured_ad_id?: string;
  featured_placement?: string;
  featured_status?: string;
  featured_expires_at?: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const RECORDS_PER_PAGE = 15;

// ============================================================
// COMPONENT
// ============================================================

export default function AllAdsTab() {
  // Filtros
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [titleFilter, setTitleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'featured'>('all');
  
  // Resultados
  const [ads, setAds] = useState<AdRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Modales
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [deletingAd, setDeletingAd] = useState<AdRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ============================================================
  // LOAD CATEGORIES
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
  // SEARCH ADS
  // ============================================================

  const handleSearch = useCallback(async (page = 1) => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      // Base query
      let countQuery = supabase
        .from('ads')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'deleted');
      
      let query = supabase
        .from('ads')
        .select('id, title, slug, price, currency, status, category_id, subcategory_id, created_at, user_id, images')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      // Apply filters
      if (selectedCategory) {
        countQuery = countQuery.eq('category_id', selectedCategory);
        query = query.eq('category_id', selectedCategory);
      }
      if (selectedSubcategory) {
        countQuery = countQuery.eq('subcategory_id', selectedSubcategory);
        query = query.eq('subcategory_id', selectedSubcategory);
      }
      if (statusFilter === 'active') {
        countQuery = countQuery.eq('status', 'active');
        query = query.eq('status', 'active');
      } else if (statusFilter === 'paused') {
        countQuery = countQuery.eq('status', 'paused');
        query = query.eq('status', 'paused');
      }

      // Count
      const { count } = await countQuery;
      setTotalRecords(count || 0);

      // Paginate
      const from = (page - 1) * RECORDS_PER_PAGE;
      const to = from + RECORDS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: adsData, error } = await query;
      if (error) throw error;

      // Load seller info
      const userIds = [...new Set((adsData || []).map(d => d.user_id).filter(Boolean))];
      let usersMap: Record<string, { name: string; email: string }> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds);
        (users || []).forEach((u: any) => {
          usersMap[u.id] = {
            name: u.full_name || u.email?.split('@')[0] || 'Usuario',
            email: u.email || ''
          };
        });
      }

      // Load category names
      const catIds = [...new Set((adsData || []).map(d => d.category_id).filter(Boolean))];
      let catsMap: Record<string, string> = {};
      if (catIds.length > 0) {
        const { data: cats } = await supabase
          .from('categories')
          .select('id, display_name')
          .in('id', catIds);
        (cats || []).forEach((c: any) => {
          catsMap[c.id] = c.display_name || c.id;
        });
      }

      // Load featured status from featured_ads table
      const adIds = (adsData || []).map(d => d.id);
      let featuredMap: Record<string, { id: string; placement: string; status: string; expires_at: string }> = {};
      if (adIds.length > 0) {
        const { data: featuredAds } = await supabase
          .from('featured_ads')
          .select('id, ad_id, placement, status, expires_at')
          .in('ad_id', adIds)
          .in('status', ['active', 'pending']);
        (featuredAds || []).forEach((f: any) => {
          featuredMap[f.ad_id] = {
            id: f.id,
            placement: f.placement,
            status: f.status,
            expires_at: f.expires_at
          };
        });
      }

      // Merge data
      const enrichedAds = (adsData || []).map(ad => ({
        ...ad,
        seller_name: usersMap[ad.user_id]?.name || 'Usuario',
        seller_email: usersMap[ad.user_id]?.email || '',
        category_name: catsMap[ad.category_id] || '',
        featured_ad_id: featuredMap[ad.id]?.id,
        featured_placement: featuredMap[ad.id]?.placement,
        featured_status: featuredMap[ad.id]?.status,
        featured_expires_at: featuredMap[ad.id]?.expires_at
      }));

      setAds(enrichedAds);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading ads:', err);
      notify.error('Error al cargar avisos');
    }
    
    setLoading(false);
  }, [selectedCategory, selectedSubcategory, statusFilter]);

  // ============================================================
  // FILTER BY FEATURED STATUS
  // ============================================================

  const filteredAds = useMemo(() => {
    let result = ads;
    
    // Filter by title
    if (titleFilter.trim()) {
      const search = titleFilter.toLowerCase();
      result = result.filter(ad => ad.title.toLowerCase().includes(search));
    }
    
    // Filter featured only
    if (statusFilter === 'featured') {
      result = result.filter(ad => ad.featured_status);
    }
    
    return result;
  }, [ads, titleFilter, statusFilter]);

  // ============================================================
  // ACTIONS
  // ============================================================

  const handleViewAd = (ad: AdRow) => {
    // Usar slug si existe, sino fallback a ID
    const identifier = ad.slug || ad.id;
    window.open(`/#/ad/${identifier}`, '_blank');
  };

  const handleEditAd = (ad: AdRow) => {
    setEditingAdId(ad.id);
  };

  const handleDeleteAd = (ad: AdRow) => {
    setDeletingAd(ad);
  };

  const confirmDelete = async () => {
    if (!deletingAd) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', deletingAd.id);

      if (error) throw error;

      notify.success(`Aviso "${deletingAd.title}" eliminado correctamente`);
      setDeletingAd(null);
      handleSearch(currentPage);
    } catch (error: any) {
      console.error('Error eliminando aviso:', error);
      notify.error(error.message || 'Error al eliminar el aviso');
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // PAGINATION
  // ============================================================

  const totalPages = Math.ceil(totalRecords / RECORDS_PER_PAGE);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex flex-wrap items-end gap-3">
          {/* Categoría */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.display_name || cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategoría */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Subcategoría
            </label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={!selectedCategory}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
            >
              <option value="">Todas</option>
              {subcategories.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.display_name || sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="paused">Pausados</option>
              <option value="featured">Destacados</option>
            </select>
          </div>

          {/* Buscar */}
          <button
            onClick={() => handleSearch(1)}
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Buscar
          </button>
        </div>
      </div>

      {/* Resultados */}
      {!hasSearched ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Usa los filtros para buscar avisos</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron avisos</p>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                placeholder="Filtrar por título..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <span className="text-sm text-gray-500">
              {totalRecords} aviso{totalRecords !== 1 ? 's' : ''} encontrados
            </span>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aviso
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    {/* Aviso */}
                    <td className="px-4 py-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[300px]">
                          {ad.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{ad.category_name}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {ad.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Vendedor */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-900">{ad.seller_name}</p>
                          <p className="text-xs text-gray-500">{ad.seller_email}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Estado */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ad.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : ad.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ad.status === 'active' ? 'Activo' : ad.status === 'paused' ? 'Pausado' : ad.status}
                      </span>
                    </td>
                    
                    {/* Acciones */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Ver */}
                        <button
                          onClick={() => handleViewAd(ad)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver aviso público"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {/* Editar */}
                        <button
                          onClick={() => handleEditAd(ad)}
                          className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Editar aviso"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        {/* Eliminar */}
                        <button
                          onClick={() => handleDeleteAd(ad)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar aviso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSearch(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSearch(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Editar */}
      {editingAdId && (
        <QuickEditAdModal
          adId={editingAdId}
          onClose={() => setEditingAdId(null)}
          onSuccess={() => {
            setEditingAdId(null);
            handleSearch(currentPage);
          }}
        />
      )}

      {/* Modal Confirmar Eliminación */}
      {deletingAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  ¿Eliminar aviso?
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Esta acción no se puede deshacer.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">{deletingAd.title}</p>
                  <p className="text-xs text-gray-500 mt-1">ID: {deletingAd.id.slice(0, 8)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingAd(null)}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
