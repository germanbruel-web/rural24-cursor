/**
 * SitemapSeoPanel - Panel de Gestión de Sitemap SEO
 * Rural24 - Dashboard Admin
 * 
 * Permite:
 * - Ver avisos en sitemap
 * - Agregar/quitar avisos del sitemap
 * - Operaciones masivas
 * - Exportar a CSV
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Globe, 
  Search, 
  Download, 
  Plus, 
  Minus, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Star,
  Crown,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = 'http://localhost:3001/api';

interface Ad {
  id: string;
  title: string;
  slug: string;
  short_id: string;
  status: string;
  is_premium: boolean;
  featured: boolean;
  in_sitemap: boolean;
  sitemap_added_at: string | null;
  created_at: string;
  category: { name: string; slug: string } | null;
  subcategory: { name: string; slug: string } | null;
  user: { email: string; company_name: string | null } | null;
}

interface Summary {
  total: number;
  inSitemap: number;
  premium: number;
  featured: number;
}

export default function SitemapSeoPanel() {
  const { session } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({ total: 0, inSitemap: 0, premium: 0, featured: 0 });
  const [filter, setFilter] = useState<'all' | 'in_sitemap' | 'not_in_sitemap'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAds = useCallback(async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        filter,
        search,
        page: page.toString(),
        limit: '20'
      });
      
      const response = await fetch(`${API_BASE}/admin/sitemap?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAds(data.ads || []);
        setSummary(data.summary || { total: 0, inSitemap: 0, premium: 0, featured: 0 });
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching sitemap data:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, filter, search, page]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleToggleSitemap = async (adId: string, currentValue: boolean) => {
    if (!session?.access_token) return;
    
    setActionLoading(true);
    try {
      const method = currentValue ? 'DELETE' : 'POST';
      const url = currentValue 
        ? `${API_BASE}/admin/sitemap?adId=${adId}`
        : `${API_BASE}/admin/sitemap`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: method === 'POST' ? JSON.stringify({ adId }) : undefined
      });
      
      if (response.ok) {
        fetchAds();
      }
    } catch (error) {
      console.error('Error toggling sitemap:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action: 'add' | 'remove') => {
    if (!session?.access_token || selectedIds.size === 0) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/sitemap/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          adIds: Array.from(selectedIds)
        })
      });
      
      if (response.ok) {
        setSelectedIds(new Set());
        fetchAds();
      }
    } catch (error) {
      console.error('Error bulk action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    if (!session?.access_token) return;
    
    window.open(`${API_BASE}/admin/sitemap/export?format=csv`, '_blank');
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === ads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ads.map(a => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-xl">
            <Globe className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sitemap SEO</h1>
            <p className="text-sm text-gray-500">Gestiona qué avisos aparecen en Google</p>
          </div>
        </div>
        
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
          <div className="text-sm text-gray-500">Avisos activos</div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <div className="text-2xl font-bold text-green-600">{summary.inSitemap}</div>
          <div className="text-sm text-green-700">En Sitemap</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{summary.premium}</div>
          <div className="text-sm text-yellow-700">Premium</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{summary.featured}</div>
          <div className="text-sm text-purple-700">Destacados</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value as any); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todos</option>
              <option value="in_sitemap">En Sitemap</option>
              <option value="not_in_sitemap">No en Sitemap</option>
            </select>
          </div>
          
          {/* Refresh */}
          <button
            onClick={fetchAds}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedIds.size} seleccionados
            </span>
            <button
              onClick={() => handleBulkAction('add')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar al Sitemap
            </button>
            <button
              onClick={() => handleBulkAction('remove')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
            >
              <Minus className="w-4 h-4" />
              Quitar del Sitemap
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === ads.length && ads.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Aviso</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Sitemap</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Cargando...
                  </td>
                </tr>
              ) : ads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No se encontraron avisos
                  </td>
                </tr>
              ) : (
                ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(ad.id)}
                        onChange={() => toggleSelect(ad.id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 truncate">{ad.title}</div>
                        <div className="text-xs text-gray-500">{ad.short_id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{ad.category?.name || '-'}</div>
                      <div className="text-xs text-gray-500">{ad.subcategory?.name || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700 truncate max-w-[150px]">
                        {ad.user?.company_name || ad.user?.email || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {ad.is_premium && (
                          <span title="Premium" className="p-1 bg-yellow-100 rounded">
                            <Crown className="w-3 h-3 text-yellow-600" />
                          </span>
                        )}
                        {ad.featured && (
                          <span title="Destacado" className="p-1 bg-purple-100 rounded">
                            <Star className="w-3 h-3 text-purple-600" />
                          </span>
                        )}
                        {!ad.is_premium && !ad.featured && (
                          <span className="text-xs text-gray-400">Free</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ad.in_sitemap ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                          <XCircle className="w-3 h-3" />
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleSitemap(ad.id, ad.in_sitemap)}
                          disabled={actionLoading}
                          className={`p-1.5 rounded-lg transition-colors ${
                            ad.in_sitemap 
                              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                          title={ad.in_sitemap ? 'Quitar del sitemap' : 'Agregar al sitemap'}
                        >
                          {ad.in_sitemap ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                        <a
                          href={`http://localhost:3001/aviso/${ad.slug || ad.short_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Ver página SSR"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
