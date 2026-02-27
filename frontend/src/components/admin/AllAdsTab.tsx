import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  Loader2,
  Package,
  Search,
  Star,
  Trash2,
  User,
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { notify } from '../../utils/notifications';
import { QuickEditAdModal } from './QuickEditAdModal';
import CreateFeaturedModal from './CreateFeaturedModal';

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
  updated_at: string;
  user_id: string;
  seller_name?: string;
  seller_email?: string;
  category_name?: string;
  featured_status?: string;
  featured_placement?: string;
  featured_expires_at?: string;
}

const RECORDS_PER_PAGE = 20;

type StatusFilter = 'all' | 'active' | 'paused' | 'draft' | 'sold' | 'deleted' | 'featured';

export default function AllAdsTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [titleFilter, setTitleFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [ads, setAds] = useState<AdRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [deletingAd, setDeletingAd] = useState<AdRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [featuredModalAd, setFeaturedModalAd] = useState<AdRow | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, display_name')
        .eq('is_active', true)
        .order('display_name');
      setCategories(data || []);
    };
    void loadCategories();
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
    void loadSubcategories();
  }, [selectedCategory]);

  const handleSearch = useCallback(async (page = 1) => {
    setLoading(true);
    setHasSearched(true);

    try {
      let countQuery = supabase.from('ads').select('id', { count: 'exact', head: true });
      let query = supabase
        .from('ads')
        .select('id, title, slug, price, currency, status, category_id, subcategory_id, created_at, updated_at, user_id')
        .order('created_at', { ascending: sortOrder === 'asc' });

      if (selectedCategory) {
        countQuery = countQuery.eq('category_id', selectedCategory);
        query = query.eq('category_id', selectedCategory);
      }
      if (selectedSubcategory) {
        countQuery = countQuery.eq('subcategory_id', selectedSubcategory);
        query = query.eq('subcategory_id', selectedSubcategory);
      }
      if (statusFilter !== 'all' && statusFilter !== 'featured') {
        countQuery = countQuery.eq('status', statusFilter);
        query = query.eq('status', statusFilter);
      }
      if (titleFilter.trim()) {
        countQuery = countQuery.ilike('title', `%${titleFilter.trim()}%`);
        query = query.ilike('title', `%${titleFilter.trim()}%`);
      }

      const { count } = await countQuery;
      setTotalRecords(count || 0);

      const from = (page - 1) * RECORDS_PER_PAGE;
      const to = from + RECORDS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: adsData, error } = await query;
      if (error) throw error;

      const userIds = [...new Set((adsData || []).map((row) => row.user_id).filter(Boolean))];
      const usersMap: Record<string, { name: string; email: string }> = {};
      if (userIds.length) {
        const { data: users } = await supabase.from('users').select('id, full_name, email').in('id', userIds);
        (users || []).forEach((u: any) => {
          usersMap[u.id] = { name: u.full_name || 'Usuario', email: u.email || '' };
        });
      }

      const catIds = [...new Set((adsData || []).map((row) => row.category_id).filter(Boolean))];
      const catsMap: Record<string, string> = {};
      if (catIds.length) {
        const { data: cats } = await supabase.from('categories').select('id, display_name').in('id', catIds);
        (cats || []).forEach((c: any) => {
          catsMap[c.id] = c.display_name || '';
        });
      }

      const adIds = (adsData || []).map((row) => row.id);
      const featuredMap: Record<string, { status: string; placement: string; expires_at?: string }> = {};
      if (adIds.length) {
        const { data: featured } = await supabase
          .from('featured_ads')
          .select('ad_id, status, placement, expires_at')
          .in('ad_id', adIds)
          .in('status', ['active', 'pending']);
        (featured || []).forEach((f: any) => {
          featuredMap[f.ad_id] = { status: f.status, placement: f.placement, expires_at: f.expires_at };
        });
      }

      let enriched = (adsData || []).map((ad: any) => ({
        ...ad,
        seller_name: usersMap[ad.user_id]?.name || 'Usuario',
        seller_email: usersMap[ad.user_id]?.email || '',
        category_name: catsMap[ad.category_id] || '',
        featured_status: featuredMap[ad.id]?.status,
        featured_placement: featuredMap[ad.id]?.placement,
        featured_expires_at: featuredMap[ad.id]?.expires_at,
      })) as AdRow[];

      if (statusFilter === 'featured') {
        enriched = enriched.filter((row) => Boolean(row.featured_status));
      }

      setAds(enriched);
      setCurrentPage(page);
    } catch (err) {
      console.error(err);
      notify.error('Error al cargar avisos');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSubcategory, statusFilter, titleFilter, sortOrder]);

  const totalPages = Math.ceil(totalRecords / RECORDS_PER_PAGE);

  const filteredSubcategories = useMemo(
    () => subcategories.filter((sub) => sub.category_id === selectedCategory),
    [subcategories, selectedCategory]
  );

  const handleViewAd = (ad: AdRow) => {
    const identifier = ad.slug || ad.id;
    window.open(`/#/ad/${identifier}`, '_blank');
  };

  const confirmDelete = async () => {
    if (!deletingAd) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('ads').delete().eq('id', deletingAd.id);
      if (error) throw error;
      notify.success('Aviso eliminado');
      setDeletingAd(null);
      void handleSearch(currentPage);
    } catch (error: any) {
      notify.error(error.message || 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[170px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.display_name || cat.name}</option>
              ))}
            </select>
          </div>

          <div className="min-w-[170px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Subcategoría</label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={!selectedCategory}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
            >
              <option value="">Todas</option>
              {filteredSubcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.display_name || sub.name}</option>
              ))}
            </select>
          </div>

          <div className="min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Todos</option>
              <option value="active">Activo</option>
              <option value="paused">Pausado</option>
              <option value="draft">Borrador</option>
              <option value="sold">Vendido</option>
              <option value="deleted">Eliminado</option>
              <option value="featured">Destacado</option>
            </select>
          </div>

          <div className="min-w-[220px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Buscar título</label>
            <input
              type="text"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              placeholder="Título..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 inline-flex items-center gap-2"
          >
            {sortOrder === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
            {sortOrder === 'desc' ? 'Reciente' : 'Antiguo'}
          </button>

          <button
            onClick={() => handleSearch(1)}
            disabled={loading}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-gray-300 text-white rounded-lg inline-flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </button>
        </div>
      </div>

      {!hasSearched ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          Buscar avisos de clientes para administrar.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          Sin resultados para esos filtros.
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-500">{totalRecords} avisos encontrados</div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">ID Aviso</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Fechas</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Aviso</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Titular</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Destacado</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs font-mono text-gray-700">{ad.id}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      <p>Alta: {new Date(ad.created_at).toLocaleDateString('es-AR')}</p>
                      <p>Upd: {new Date(ad.updated_at).toLocaleDateString('es-AR')}</p>
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-sm font-medium text-gray-900 max-w-[320px] truncate">{ad.title}</p>
                      <p className="text-xs text-gray-500">
                        {ad.category_name || 'Sin categoría'}
                        {ad.featured_status ? ` • Destacado ${ad.featured_placement || ''}` : ''}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <div className="inline-flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-900">{ad.seller_name || 'Usuario'}</p>
                          <p className="text-xs text-gray-500">{ad.seller_email || ad.user_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {ad.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {ad.featured_status ? (
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
                            ad.featured_status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {ad.featured_status === 'active' ? 'Activo' : 'Pendiente'}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">{ad.featured_placement}</span>
                          {ad.featured_expires_at && (
                            <span className="text-xs text-gray-400">
                              Vence {new Date(ad.featured_expires_at).toLocaleDateString('es-AR')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleViewAd(ad)} className="p-2 rounded hover:bg-blue-50 text-gray-500 hover:text-blue-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingAdId(ad.id)} className="p-2 rounded hover:bg-brand-50 text-gray-500 hover:text-brand-600">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setFeaturedModalAd(ad)}
                          className="p-2 rounded hover:bg-amber-50 text-gray-500 hover:text-amber-500"
                          title="Destacar aviso"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeletingAd(ad)} className="p-2 rounded hover:bg-red-50 text-gray-500 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Página {currentPage} de {totalPages}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSearch(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-2 border border-gray-300 rounded disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSearch(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="px-3 py-2 border border-gray-300 rounded disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {editingAdId && (
        <QuickEditAdModal
          adId={editingAdId}
          onClose={() => setEditingAdId(null)}
          onSuccess={() => {
            setEditingAdId(null);
            void handleSearch(currentPage);
          }}
        />
      )}

      {featuredModalAd && (
        <CreateFeaturedModal
          isOpen={true}
          onClose={() => setFeaturedModalAd(null)}
          onSuccess={() => {
            setFeaturedModalAd(null);
            void handleSearch(currentPage);
          }}
          preSelectedAd={{
            id: featuredModalAd.id,
            title: featuredModalAd.title,
            price: featuredModalAd.price,
            currency: featuredModalAd.currency,
            category_name: featuredModalAd.category_name || '',
            user_name: featuredModalAd.seller_name || 'Usuario',
          }}
        />
      )}

      {deletingAd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar aviso</h3>
            <p className="text-sm text-gray-600 mb-4">Esta acción no se puede deshacer.</p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">{deletingAd.title}</p>
              <p className="text-xs text-gray-500 mt-1">{deletingAd.id}</p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeletingAd(null)} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
