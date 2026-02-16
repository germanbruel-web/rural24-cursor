/**
 * SuperAdminFeaturedPanel.tsx
 * Panel de administración completo para Featured Ads (SuperAdmin only)
 * 
 * Tabs:
 * 1. Lista - Tabla con filtros, paginación, acciones
 * 2. Calendario - Vista de ocupación mensual
 * 3. Estadísticas - Dashboard con métricas
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  TrendingUp,
  List,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Home,
  Search as SearchIcon,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  Users,
  CreditCard,
  Loader2,
  Edit2,
  Zap
} from 'lucide-react';
import {
  getAdminFeaturedAds,
  cancelFeaturedAd,
  getAdminFeaturedStats,
  getFeaturedAudit,
  getOccupancyGrid,
  getStatusBadge,
  getPlacementLabel,
  getCreditCost,
  formatFeaturedDate,
  formatDateRange,
  type AdminFeaturedAd,
  type AdminFeaturedFilters,
  type AdminFeaturedStats,
  type FeaturedAuditEntry,
  type OccupancyGridDay,
} from '../../services/adminFeaturedService';
import type { FeaturedPlacement, FeaturedStatus } from '../../services/userFeaturedService';
import EditFeaturedModal from './EditFeaturedModal';
import CancelFeaturedModal from './CancelFeaturedModal';
import CreateFeaturedModal from './CreateFeaturedModal';
import AllAdsTab from './AllAdsTab';
import { Package } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

type TabView = 'all-ads' | 'list' | 'calendar' | 'stats';

export default function SuperAdminFeaturedPanel() {
  // Estado de tabs - Por defecto mostrar todos los avisos
  const [activeTab, setActiveTab] = useState<TabView>('all-ads');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Gestión de Avisos y Destacados
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              CRUD completo, destacados con calendario y estadísticas
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('all-ads')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'all-ads'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-5 h-5" />
            Todos los Avisos
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'list'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <List className="w-5 h-5" />
            Destacados
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'calendar'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Calendario
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'stats'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Estadísticas
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'all-ads' && <AllAdsTab />}
        {activeTab === 'list' && <ListTab />}
        {activeTab === 'calendar' && <CalendarTab />}
        {activeTab === 'stats' && <StatsTab />}
      </div>
    </div>
  );
}

// ============================================================================
// TAB 1: DESTACADOS — Modelo filtros AllAdsTab + columna PUBLICIDAD
// ============================================================================

interface ListCategory {
  id: string;
  name: string;
  display_name?: string;
}

interface ListSubcategory {
  id: string;
  name: string;
  display_name?: string;
  category_id: string;
}

interface ListAdRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  category_id: string;
  user_id: string;
  images: string[];
  seller_name: string;
  seller_email: string;
  category_name: string;
}

interface ListFeaturedEntry {
  id: string;
  ad_id: string;
  user_id: string;
  placement: FeaturedPlacement;
  status: FeaturedStatus;
  scheduled_start: string;
  actual_start: string | null;
  expires_at: string | null;
  duration_days: number;
  category_id: string;
  priority: number | null;
  credit_consumed: boolean;
  is_manual: boolean;
  refunded: boolean;
  cancelled_by: string | null;
  cancelled_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  transaction_id: string | null;
  requires_payment: boolean;
  admin_notes: string | null;
  manual_activated_by: string | null;
  manual_activator_email: string | null;
  manual_activator_name: string | null;
}

const RECORDS_PER_PAGE_LIST = 15;

function ListTab() {
  // Filtros (Modelo A — Categoría, Subcategoría, Estado)
  const [categories, setCategories] = useState<ListCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ListSubcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

  // Resultados
  const [ads, setAds] = useState<ListAdRow[]>([]);
  const [featuredMap, setFeaturedMap] = useState<Record<string, ListFeaturedEntry[]>>({});
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals Featured
  const [selectedFeatured, setSelectedFeatured] = useState<AdminFeaturedAd | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ── Load categories ──
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, display_name')
        .eq('is_active', true)
        .order('display_name');
      setCategories(data || []);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedCategory) { setSubcategories([]); setSelectedSubcategory(''); return; }
    const load = async () => {
      const { data } = await supabase
        .from('subcategories')
        .select('id, name, display_name, category_id')
        .eq('category_id', selectedCategory)
        .eq('is_active', true)
        .order('display_name');
      setSubcategories(data || []);
      setSelectedSubcategory('');
    };
    load();
  }, [selectedCategory]);

  // ── Search ──
  const handleSearch = useCallback(async (page = 1) => {
    setLoading(true);
    setHasSearched(true);
    try {
      // Count
      let countQ = supabase.from('ads').select('id', { count: 'exact', head: true }).neq('status', 'deleted');
      let dataQ = supabase.from('ads').select('id, title, slug, status, category_id, user_id, images').neq('status', 'deleted').order('created_at', { ascending: false });

      if (selectedCategory) { countQ = countQ.eq('category_id', selectedCategory); dataQ = dataQ.eq('category_id', selectedCategory); }
      if (selectedSubcategory) { countQ = countQ.eq('subcategory_id', selectedSubcategory); dataQ = dataQ.eq('subcategory_id', selectedSubcategory); }
      if (statusFilter === 'active') { countQ = countQ.eq('status', 'active'); dataQ = dataQ.eq('status', 'active'); }
      else if (statusFilter === 'paused') { countQ = countQ.eq('status', 'paused'); dataQ = dataQ.eq('status', 'paused'); }

      const { count } = await countQ;
      setTotalRecords(count || 0);

      const from = (page - 1) * RECORDS_PER_PAGE_LIST;
      dataQ = dataQ.range(from, from + RECORDS_PER_PAGE_LIST - 1);
      const { data: adsData, error } = await dataQ;
      if (error) throw error;

      // Enrich: users
      const userIds = [...new Set((adsData || []).map(a => a.user_id).filter(Boolean))];
      let usersMap: Record<string, { name: string; email: string }> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, full_name, email').in('id', userIds);
        (users || []).forEach((u: any) => { usersMap[u.id] = { name: u.full_name || u.email?.split('@')[0] || 'Usuario', email: u.email || '' }; });
      }

      // Enrich: category names
      const catIds = [...new Set((adsData || []).map(a => a.category_id).filter(Boolean))];
      let catsMap: Record<string, string> = {};
      if (catIds.length > 0) {
        const { data: cats } = await supabase.from('categories').select('id, display_name').in('id', catIds);
        (cats || []).forEach((c: any) => { catsMap[c.id] = c.display_name || c.id; });
      }

      // Enrich: featured entries (ALL active/pending per ad, multiple placements)
      const adIds = (adsData || []).map(a => a.id);
      const newFeaturedMap: Record<string, ListFeaturedEntry[]> = {};
      if (adIds.length > 0) {
        const { data: featAds } = await supabase
          .from('featured_ads')
          .select('*')
          .in('ad_id', adIds)
          .in('status', ['active', 'pending']);
        (featAds || []).forEach((f: any) => {
          if (!newFeaturedMap[f.ad_id]) newFeaturedMap[f.ad_id] = [];
          newFeaturedMap[f.ad_id].push(f);
        });
      }
      setFeaturedMap(newFeaturedMap);

      const enriched: ListAdRow[] = (adsData || []).map(a => ({
        ...a,
        seller_name: usersMap[a.user_id]?.name || 'Usuario',
        seller_email: usersMap[a.user_id]?.email || '',
        category_name: catsMap[a.category_id] || '',
      }));

      setAds(enriched);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading ads:', err);
    }
    setLoading(false);
  }, [selectedCategory, selectedSubcategory, statusFilter]);

  // ── Helpers ──
  const getRemainingDays = (expiresAt?: string | null): number => {
    if (!expiresAt) return 0;
    const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getPlacementShort = (p: string) => ({ homepage: 'ALTO', results: 'MEDIO', detail: 'BÁSICO' }[p] || p);

  const buildAdminFeaturedAd = (ad: ListAdRow, feat: ListFeaturedEntry): AdminFeaturedAd => ({
    ...feat,
    ad_title: ad.title,
    ad_slug: ad.slug,
    ad_images: ad.images || [],
    ad_price: 0,
    ad_currency: 'ARS',
    ad_status: ad.status,
    user_email: ad.seller_email,
    user_full_name: ad.seller_name,
    user_role: '',
    category_name: ad.category_name,
    category_slug: '',
  });

  const handleEditFeatured = (ad: ListAdRow, feat: ListFeaturedEntry) => {
    setSelectedFeatured(buildAdminFeaturedAd(ad, feat));
    setShowEditModal(true);
  };

  const handleCancelFeatured = (ad: ListAdRow, feat: ListFeaturedEntry) => {
    setSelectedFeatured(buildAdminFeaturedAd(ad, feat));
    setShowCancelModal(true);
  };

  const totalPages = Math.ceil(totalRecords / RECORDS_PER_PAGE_LIST);

  return (
    <div className="space-y-4">
      {/* Filtros — Modelo A (Categoría, Subcategoría, Estado) */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
              <option value="">Todas las categorías</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.display_name || c.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Subcategoría</label>
            <select value={selectedSubcategory} onChange={e => setSelectedSubcategory(e.target.value)} disabled={!selectedCategory}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100">
              <option value="">Todas</option>
              {subcategories.map(s => <option key={s.id} value={s.id}>{s.display_name || s.name}</option>)}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="paused">Pausados</option>
            </select>
          </div>
          <button onClick={() => handleSearch(1)} disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-medium rounded-lg flex items-center gap-2 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </button>
          <button onClick={() => setShowCreateModal(true)}
            className="px-5 py-2 bg-[#386539] hover:bg-[#2d5230] text-white font-medium rounded-lg flex items-center gap-2 transition-colors">
            <Zap className="w-4 h-4" />
            Destacar Aviso
          </button>
        </div>
      </div>

      {/* Resultados */}
      {!hasSearched ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Usá los filtros para buscar avisos y ver su publicidad</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron avisos</p>
        </div>
      ) : (
        <>
          {/* Info */}
          <div className="flex items-center justify-end">
            <span className="text-sm text-gray-500">{totalRecords} aviso{totalRecords !== 1 ? 's' : ''} encontrados</span>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aviso</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publicidad</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ads.map((ad) => {
                  const feats = featuredMap[ad.id] || [];
                  return (
                    <tr key={ad.id} className="hover:bg-gray-50">
                      {/* Aviso */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[260px]">{ad.title}</p>
                        <p className="text-xs text-gray-500">{ad.category_name}</p>
                      </td>
                      {/* Vendedor */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{ad.seller_name}</p>
                        <p className="text-xs text-gray-500">{ad.seller_email}</p>
                      </td>
                      {/* Estado */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ad.status === 'active' ? 'bg-green-100 text-green-800' : ad.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {ad.status === 'active' ? 'Activo' : ad.status === 'paused' ? 'Pausado' : ad.status}
                        </span>
                      </td>
                      {/* PUBLICIDAD */}
                      <td className="px-4 py-3">
                        {ad.status !== 'active' ? (
                          <span className="text-gray-400 text-sm">—</span>
                        ) : feats.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">Sin destacar</span>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {feats.map((f) => {
                              const remaining = getRemainingDays(f.expires_at);
                              const tierColor = f.placement === 'homepage'
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : f.placement === 'results'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200';
                              return (
                                <div key={f.id} className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border ${tierColor}`}>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-bold">
                                      {getPlacementShort(f.placement)}
                                    </span>
                                    {f.status === 'active' ? (
                                      <span className="text-[10px] font-medium opacity-75">
                                        {remaining}d
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-yellow-600 font-medium">pendiente</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-0.5">
                                    <button onClick={() => handleEditFeatured(ad, f)} className="p-0.5 opacity-60 hover:opacity-100 transition-opacity" title="Editar destacado">
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => handleCancelFeatured(ad, f)} className="p-0.5 text-red-500 opacity-60 hover:opacity-100 transition-opacity" title="Cancelar destacado">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      {/* Acciones */}
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => window.open(`/#/ad/${ad.slug || ad.id}`, '_blank')}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver aviso">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-600">Página {currentPage} de {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => handleSearch(currentPage - 1)} disabled={currentPage === 1 || loading}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => handleSearch(currentPage + 1)} disabled={currentPage === totalPages || loading}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showEditModal && selectedFeatured && (
        <EditFeaturedModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setSelectedFeatured(null); }}
          featured={selectedFeatured}
          onSuccess={() => { handleSearch(currentPage); }}
        />
      )}
      {showCancelModal && selectedFeatured && (
        <CancelFeaturedModal
          isOpen={showCancelModal}
          onClose={() => { setShowCancelModal(false); setSelectedFeatured(null); }}
          featured={selectedFeatured}
          onSuccess={() => { handleSearch(currentPage); }}
        />
      )}
      {showCreateModal && (
        <CreateFeaturedModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); handleSearch(currentPage); }}
        />
      )}
    </div>
  );
}

// ============================================================================
// TAB 2: CALENDARIO
// ============================================================================

function CalendarTab() {
  const [selectedPlacement, setSelectedPlacement] = useState<FeaturedPlacement | 'all'>('all');
  const [ads, setAds] = useState<AdminFeaturedAd[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadActiveAds();
  }, [selectedPlacement]);

  const loadActiveAds = async () => {
    setLoading(true);
    try {
      const filters: AdminFeaturedFilters = {
        status: ['active' as FeaturedStatus],
        ...(selectedPlacement !== 'all' && { placement: selectedPlacement as FeaturedPlacement })
      };
      
      const { data } = await getAdminFeaturedAds(filters, 100, 0);
      setAds(data || []);
    } catch (error) {
      console.error('Error loading active featured ads:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Avisos Destacados Activos</h3>
          <p className="text-sm text-gray-600 mt-1">Vista de lectura de todos los destacados actualmente publicados</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPlacement('all')}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              selectedPlacement === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({ads.length})
          </button>
          <button
            onClick={() => setSelectedPlacement('homepage')}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              selectedPlacement === 'homepage'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Home className="w-4 h-4 inline mr-2" />
            Destacado ALTO
          </button>
          <button
            onClick={() => setSelectedPlacement('results')}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              selectedPlacement === 'results'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <SearchIcon className="w-4 h-4 inline mr-2" />
            Destacado MEDIO
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            {selectedPlacement === 'all' 
              ? 'No hay avisos destacados activos' 
              : `No hay avisos con ${selectedPlacement === 'homepage' ? 'Destacado ALTO' : 'Destacado MEDIO'}`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aviso
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inicio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expira
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créditos
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-gray-50">
                  {/* Aviso */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[300px]">
                          {ad.ad_title}
                        </p>
                        <p className="text-xs text-gray-500">{ad.category_name}</p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Ubicación */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      ad.placement === 'homepage' 
                        ? 'bg-purple-100 text-purple-800' 
                        : ad.placement === 'results'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ad.placement === 'homepage' ? (
                        <><Home className="w-3 h-3" /> ALTO</>
                      ) : ad.placement === 'results' ? (
                        <><SearchIcon className="w-3 h-3" /> MEDIO</>
                      ) : (
                        <>BÁSICO</>
                      )}
                    </span>
                  </td>
                  
                  {/* Usuario */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900">{ad.user_full_name || ad.user_email?.split('@')[0] || 'Usuario'}</p>
                        <p className="text-xs text-gray-500">{ad.user_email}</p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Inicio */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      {ad.actual_start 
                        ? new Date(ad.actual_start).toLocaleDateString('es-AR', { 
                            day: '2-digit', 
                            month: 'short',
                            year: 'numeric'
                          })
                        : new Date(ad.scheduled_start).toLocaleDateString('es-AR', { 
                            day: '2-digit', 
                            month: 'short',
                            year: 'numeric'
                          })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {ad.actual_start ? 'Activado' : 'Programado'}
                    </div>
                  </td>
                  
                  {/* Expira */}
                  <td className="px-4 py-3">
                    {ad.expires_at ? (
                      <div className="text-sm text-gray-900">
                        {new Date(ad.expires_at).toLocaleDateString('es-AR', { 
                          day: '2-digit', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Sin fecha</span>
                    )}
                  </td>
                  
                  {/* Créditos */}
                  <td className="px-4 py-3 text-center">
                    {ad.credit_consumed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <CreditCard className="w-3 h-3" />
                        Usuario
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Zap className="w-3 h-3" />
                        SuperAdmin
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Summary */}
      {!loading && ads.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Total destacados activos: {ads.length}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Vista en modo lectura. Para editar o cancelar, ir al tab "Destacados".
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TAB 3: ESTADÍSTICAS
// ============================================================================

function StatsTab() {
  const [stats, setStats] = useState<AdminFeaturedStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const loadStats = async () => {
    setLoading(true);
    const { data } = await getAdminFeaturedStats(dateRange.start, dateRange.end);
    setStats(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No hay estadísticas disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <button
          onClick={loadStats}
          className="mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          Aplicar
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<CheckCircle className="w-8 h-8 text-green-600" />}
          label="Activos"
          value={stats.total_active}
          color="green"
        />
        <KPICard
          icon={<Clock className="w-8 h-8 text-yellow-600" />}
          label="Pendientes"
          value={stats.total_pending}
          color="yellow"
        />
        <KPICard
          icon={<CreditCard className="w-8 h-8 text-emerald-600" />}
          label="Créditos consumidos"
          value={stats.total_credits_consumed}
          color="emerald"
        />
        <KPICard
          icon={<TrendingUp className="w-8 h-8 text-blue-600" />}
          label="Ingreso neto"
          value={stats.net_revenue}
          suffix=" créditos"
          color="blue"
        />
      </div>

      {/* By Placement */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Ubicación</h3>
        <div className="space-y-3">
          {stats.by_placement && Object.entries(stats.by_placement).map(([placement, data]) => (
            <div key={placement} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {placement === 'homepage' ? <Home className="w-5 h-5" /> : <SearchIcon className="w-5 h-5" />}
                <span className="font-medium">{getPlacementLabel(placement as FeaturedPlacement)}</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{data.count} destacados</p>
                <p className="text-xs text-gray-500">{data.revenue} créditos</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categorías</h3>
        <div className="space-y-2">
          {stats.top_categories?.slice(0, 10).map((cat, idx) => (
            <div key={cat.category_slug} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 w-6">#{idx + 1}</span>
                <span className="text-sm font-medium">{cat.category_name}</span>
              </div>
              <span className="text-sm text-gray-600">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Occupancy */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ocupación Promedio</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-500"
              style={{ width: `${stats.avg_occupancy_percent}%` }}
            />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {stats.avg_occupancy_percent}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

function StatusBadge({ status }: { status: FeaturedStatus }) {
  const badge = getStatusBadge(status);
  const Icon = status === 'active' ? CheckCircle :
                status === 'pending' ? Clock :
                status === 'expired' ? AlertCircle : XCircle;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color} ${badge.bgColor}`}>
      <Icon className="w-3 h-3" />
      {badge.label}
    </span>
  );
}

function PlacementBadge({ placement }: { placement: FeaturedPlacement }) {
  const Icon = placement === 'homepage' ? Home : SearchIcon;
  const color = placement === 'homepage' ? 'text-purple-700 bg-purple-50' : 'text-blue-700 bg-blue-50';
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {getPlacementLabel(placement)}
    </span>
  );
}

function KPICard({ icon, label, value, suffix = '', color }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {suffix}
      </p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}

// ============================================================================
// ============================================================================
// MODAL DE CANCELACIÓN
// ============================================================================

function CancelModal({ ad, onClose, onSuccess }: any) {
  const [reason, setReason] = useState('');
  const [refund, setRefund] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError('Debes ingresar una razón');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await cancelFeaturedAd(ad.id, reason, refund);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Error al cancelar');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cancelar Destacado</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Aviso: {ad.ad_title}</p>
          <p className="text-sm text-gray-600">Usuario: {ad.user_email}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Razón de cancelación *
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ej: Contenido inapropiado, Solicitud del usuario..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
            rows={3}
          />
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={refund}
              onChange={e => setRefund(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span className="text-sm text-gray-700">
              Reembolsar {getCreditCost(ad.placement)} crédito(s) al usuario
            </span>
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL DE AUDITORÍA
// ============================================================================

function AuditModal({ ad, onClose }: any) {
  const [audit, setAudit] = useState<FeaturedAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    const { data } = await getFeaturedAudit(ad.id);
    setAudit(data);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Historial de Auditoría</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Aviso: {ad.ad_title}</p>
          <p className="text-sm text-gray-600">ID: {ad.id}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : audit.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No hay registros de auditoría</p>
        ) : (
          <div className="space-y-3">
            {audit.map(entry => (
              <div key={entry.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {entry.action}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatFeaturedDate(entry.created_at)}
                  </span>
                </div>
                {entry.performer_name && (
                  <p className="text-sm text-gray-600">
                    Por: {entry.performer_name} ({entry.performer_email})
                  </p>
                )}
                {entry.reason && (
                  <p className="text-sm text-gray-600 mt-1">Razón: {entry.reason}</p>
                )}
                {entry.metadata && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">
                      Ver metadata
                    </summary>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
