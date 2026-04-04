import { useState, useEffect, useMemo } from 'react';
import { API_CONFIG } from '@/config/api';
import {
  getMyAds,
  getUserAdLimit,
} from '../../services/adsService';
import type { Ad } from '../../../types';
import { Edit, Trash2, Eye, Plus, Package, X, Zap, TrendingUp, Calendar, ExternalLink } from 'lucide-react';
import { notify } from '../../utils/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../../constants/defaultImages';
import { isSuperAdmin as checkIsSuperAdmin } from '../../utils/rolePermissions';
import { supabase } from '../../services/supabaseClient';
import BulkVisibilityModal from './BulkVisibilityModal';
import SuperAdminFeaturedPanel from './SuperAdminFeaturedPanel';
import EditarAviso from '../pages/EditarAviso';

import { cancelActiveFeaturedAd } from '../../services/userFeaturedService';
import { navigateTo } from '../../hooks/useNavigate';

/**
 * Extraer public_id de Cloudinary URL para borrado
 * https://res.cloudinary.com/xxx/image/upload/.../rural24/ads/abc123.jpg → rural24/ads/abc123
 */
function extractCloudinaryPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

const COMPLETENESS_TOTAL = 6;

function calcCompleteness(ad: Ad): number {
  let done = 0;
  if ((ad as any).subcategory_id) done++;
  if (ad.price && ad.price > 0) done++;
  if (ad.province) done++;
  if (ad.images && ad.images.length > 0) done++;
  if (ad.title && ad.title.length > 10 && (ad as any).description?.length > 20) done++;
  if (ad.status === 'active') done++;
  return done;
}

interface MyAdsPanelProps {}

/** Info de un featured activo/pendiente para un aviso */
interface FeaturedInfo {
  featured_id: string;
  placement: string;
  tier?: string;
  status: string;
  expires_at?: string;
}

export default function MyAdsPanel() {
  const { profile } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [adLimit, setAdLimit] = useState({ limit: 0, current: 0 });
  const [selectedAdForViews, setSelectedAdForViews] = useState<Ad | null>(null);
  const [selectedAdForDelete, setSelectedAdForDelete] = useState<Ad | null>(null);
  const [showBulkVisibility, setShowBulkVisibility] = useState(false);
  const [featuredMap, setFeaturedMap] = useState<Record<string, FeaturedInfo[]>>({});

  // Edit drawer
  const [editingAdId, setEditingAdId] = useState<string | null>(null);

  // Cancel featured
  const [cancelFeaturedTarget, setCancelFeaturedTarget] = useState<{ adTitle: string; featured: FeaturedInfo } | null>(null);
  const [cancellingFeatured, setCancellingFeatured] = useState(false);
  
  // Determinar permisos según rol
  const isSuperAdmin = checkIsSuperAdmin(profile?.role);
  const canUseFeaturedFlow = Boolean(profile?.id);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('active');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Solo cargar avisos propios del usuario actual
      const adsData = await getMyAds();
      setAds(adsData);
      await loadFeaturedStatus(adsData);
      
      // Get user limits
      const limit = await getUserAdLimit(profile?.id);
      setAdLimit(limit);
    } catch (error) {
      console.error('Error loading ads:', error);
      notify.error('Error al cargar avisos');
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedStatus = async (adsData: Ad[]) => {
    try {
      const adIds = adsData.map(ad => ad.id).filter(Boolean);
      if (adIds.length === 0) {
        setFeaturedMap({});
        return;
      }

      const { data, error } = await supabase
        .from('featured_ads')
        .select('id, ad_id, placement, tier, status, expires_at')
        .in('ad_id', adIds)
        .in('status', ['active', 'pending']);

      if (error) {
        console.error('Error loading featured status:', error);
        return;
      }

      const nextMap: Record<string, FeaturedInfo[]> = {};
      (data || []).forEach((item: any) => {
        if (item?.ad_id) {
          if (!nextMap[item.ad_id]) nextMap[item.ad_id] = [];
          nextMap[item.ad_id].push({
            featured_id: item.id,
            placement: item.placement,
            tier: item.tier || undefined,
            status: item.status,
            expires_at: item.expires_at || undefined,
          });
        }
      });
      setFeaturedMap(nextMap);
    } catch (error) {
      console.error('Error loading featured status:', error);
    }
  };


  /** Navega a FeaturedCheckoutPage con el aviso y tier pre-seleccionado */
  const handleStartCheckout = (ad: Ad, tier: 'alta' | 'media' | 'baja') => {
    sessionStorage.setItem('featured_checkout_data', JSON.stringify({
      ad_id: ad.id,
      title: ad.title,
      category_id: ad.category_id || '',
      subcategory_id: ad.subcategory_id || '',
      images: ad.images || [],
      preselected_tier: tier,
    }));
    window.location.hash = '#/featured-checkout';
  };

  const confirmCancelFeatured = async () => {
    if (!cancelFeaturedTarget) return;
    setCancellingFeatured(true);
    try {
      if (!isSuperAdmin) {
        notify.error('Solo SuperAdmin puede cancelar destacados');
        return;
      }
      const { featured } = cancelFeaturedTarget;
      const result = await cancelActiveFeaturedAd(featured.featured_id);
      if (result.success) {
        notify.success('Destacado cancelado correctamente');
        setCancelFeaturedTarget(null);
        loadData();
      } else {
        notify.error(result.error?.message || 'Error al cancelar destacado');
      }
    } catch (error) {
      console.error('Error cancelling featured:', error);
      notify.error('Error al cancelar destacado');
    } finally {
      setCancellingFeatured(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedAdForDelete) return;

    try {
      const adId = selectedAdForDelete.id;
      
      // PASO 1: Obtener todas las imágenes asociadas (soporta ambos sistemas)
      const imageUrls: string[] = [];
      
      // Sistema nuevo: tabla ad_images
      const { data: adImages } = await supabase
        .from('ad_images')
        .select('url')
        .eq('ad_id', adId);
      
      if (adImages && adImages.length > 0) {
        imageUrls.push(...adImages.map(img => img.url));
      }
      
      // Sistema antiguo: campo images[] en ads
      const { data: adData } = await supabase
        .from('ads')
        .select('images')
        .eq('id', adId)
        .single();
      
      if (adData?.images && Array.isArray(adData.images)) {
        imageUrls.push(...adData.images);
      }
      
      // PASO 2: Eliminar imágenes de Cloudinary (si existen)
      if (imageUrls.length > 0) {
        const publicIds = imageUrls
          .map(extractCloudinaryPublicId)
          .filter(Boolean) as string[];
        
        if (publicIds.length > 0) {
          try {
            // Llamar al backend API para eliminar de Cloudinary
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/uploads/delete`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ urls: imageUrls })
            });
            
            if (!response.ok) {
              if (import.meta.env.DEV) console.warn('Error al eliminar imágenes de Cloudinary:', response.status);
            } else {
              const result = await response.json();
              if (import.meta.env.DEV) console.log('Cloudinary cleanup completado');
            }
          } catch (cloudinaryError) {
            if (import.meta.env.DEV) console.warn('No se pudieron eliminar las imágenes de Cloudinary:', cloudinaryError);
            // Continuamos con el delete del aviso aunque falle Cloudinary
          }
        }
      }
      
      // PASO 3: Hard delete del aviso en Supabase (CASCADE eliminará ad_images automáticamente)
      const { error: deleteError } = await supabase
        .from('ads')
        .delete()
        .eq('id', adId);
      
      if (deleteError) throw deleteError;

      notify.success('Aviso e imágenes eliminados correctamente');
      setSelectedAdForDelete(null);
      loadData();
    } catch (error: any) {
      console.error('Error deleting ad:', error);
      notify.error('Error al eliminar aviso');
    }
  };


  const availableCategories = useMemo(() => {
    const seen = new Set<string>();
    const cats: { id: string; name: string }[] = [];
    for (const ad of ads) {
      const key = ad.category_id || ad.category || '';
      if (key && !seen.has(key)) {
        seen.add(key);
        cats.push({ id: key, name: ad.category || key });
      }
    }
    return cats.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [ads]);

  const filteredAds = useMemo(() => {
    let result = ads;
    if (filterStatus !== 'all') result = result.filter(ad => ad.status === filterStatus);
    if (filterCategory !== 'all') result = result.filter(ad =>
      (ad.category_id || ad.category) === filterCategory
    );
    return result;
  }, [ads, filterStatus, filterCategory]);

  const totalPages = Math.ceil(filteredAds.length / PAGE_SIZE);
  const paginatedAds = filteredAds.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  /** Label corto del placement */
  const getPlacementShort = (placement: string): string => {
    const labels: Record<string, string> = {
      homepage: 'ALTO',
      results: 'MEDIO',
      detail: 'BÁSICO',
    };
    return labels[placement] || placement;
  };

  const formatExpiryDate = (expiresAt?: string): string => {
    if (!expiresAt) return 'Sin vencimiento';
    return new Date(expiresAt).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus avisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header simple */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-950">Mis Avisos</h2>
          {!isSuperAdmin && (
            <p className="text-sm text-gray-600 mt-1">
              Estás usando <span className="font-bold text-brand-600">{adLimit.current}</span> de{' '}
              <span className="font-bold">{adLimit.limit}</span> avisos disponibles
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isSuperAdmin && (
            <button
              onClick={() => setShowBulkVisibility(true)}
              className="bg-white border border-brand-600 text-brand-700 px-4 py-3 rounded-xl font-bold hover:bg-brand-50 transition-colors"
            >
              Visibilidad Bulk
            </button>
          )}
          <button
            onClick={() => navigateTo('/publicar')}
            disabled={!isSuperAdmin && adLimit.current >= adLimit.limit}
            className="hidden sm:flex bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-600 hover:to-brand-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Plus className="w-5 h-5" />
            Crear Nuevo Aviso
          </button>
        </div>
      </div>

      {/* Limit Warning */}
      {!isSuperAdmin && adLimit.current >= adLimit.limit && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">
            Has alcanzado el límite de avisos de tu plan. Para publicar más avisos, 
            elimina o pausa algunos existentes.
          </p>
        </div>
      )}


      {/* Barra de filtros */}
      {ads.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setFilterStatus('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${filterStatus === 'all' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            Todos
          </button>
          <button
            onClick={() => { setFilterStatus('active'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${filterStatus === 'active' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            Activos
          </button>
          <button
            onClick={() => { setFilterStatus('paused'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${filterStatus === 'paused' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            Pausados
          </button>
          {availableCategories.length > 1 && (
            <select
              value={filterCategory}
              onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Todas las categorías</option>
              {availableCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Lista de avisos — rows horizontales */}
      {filteredAds.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Package className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No tenés avisos {filterStatus !== 'all' ? filterStatus + 's' : ''}
          </h3>
          <p className="text-gray-600 mb-6">
            {filterStatus === 'all'
              ? 'Publicá tu primer aviso para empezar a vender'
              : `No hay avisos con estado "${filterStatus}"`}
          </p>
          {filterStatus === 'all' && adLimit.current < adLimit.limit && (
            <button
              onClick={() => navigateTo('/publicar')}
              className="px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Publicar Aviso
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {paginatedAds.map((ad) => {
            const adFeatureds = featuredMap[ad.id] || [];
            const isAdFeatured = adFeatureds.length > 0;
            const thumbnail = ad.images?.[0] || DEFAULT_PLACEHOLDER_IMAGE;
            return (
              <div
                key={ad.id}
                className="bg-white rounded-2xl border transition-all duration-150 flex gap-4 p-4 border-gray-200 hover:border-gray-300 hover:shadow-sm"
              >
                {/* Thumbnail */}
                <div className="relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={thumbnail}
                    alt={ad.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PLACEHOLDER_IMAGE; }}
                  />
                  <span className={`absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    ad.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                  {/* Fila superior: título + precio */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
                        {ad.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {isSuperAdmin ? (
                          // Admin: taxonomía completa + localidad + provincia
                          <>
                            <span className="text-xs text-gray-500 font-medium">{ad.category}</span>
                            {(ad as any).subcategory_parent_name && (
                              <>
                                <span className="text-xs text-gray-300">›</span>
                                <span className="text-xs text-gray-500">{(ad as any).subcategory_parent_name}</span>
                              </>
                            )}
                            {ad.subcategory && (
                              <>
                                <span className="text-xs text-gray-300">›</span>
                                <span className="text-xs text-gray-500">{ad.subcategory}</span>
                              </>
                            )}
                            {(ad.location || ad.province) && (
                              <span className="text-xs text-gray-400">
                                · {[ad.location, ad.province].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </>
                        ) : (
                          // Usuario: tipo · categoría › subcategoría · lugar
                          <>
                            {(ad as any).ad_type === 'company' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-900 text-white mr-1">
                                {(ad as any).business_profile_id ? 'EMPRESA' : 'SERVICIO'}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">{ad.category}</span>
                            {ad.subcategory && (
                              <>
                                <span className="text-xs text-gray-300">›</span>
                                <span className="text-xs text-gray-500">{ad.subcategory}</span>
                              </>
                            )}
                            {(ad.location || ad.province) && (
                              <span className="text-xs text-gray-400">· {ad.location || ad.province}</span>
                            )}
                          </>
                        )}
                        <span className={`text-xs font-semibold ${
                          ad.status === 'active' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          · {ad.status === 'active' ? 'Activo' : 'Pausado'}
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-brand-600 text-base tabular-nums whitespace-nowrap flex-shrink-0">
                      {ad.price ? `${ad.currency} ${ad.price.toLocaleString('es-AR')}` : '—'}
                    </span>
                  </div>

                  {/* Featured badges */}
                  {isAdFeatured && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {adFeatureds.map((feat) => {
                        const t = feat.tier || (feat.placement === 'homepage' ? 'alta' : feat.placement === 'results' ? 'media' : 'baja');
                        const badgeCls = t === 'alta'
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : t === 'media'
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200';
                        const tierLabel = t === 'alta' ? 'ALTA' : t === 'media' ? 'MEDIA' : 'BAJA';
                        return (
                          <span
                            key={feat.featured_id}
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${badgeCls} ${feat.status === 'pending' ? 'opacity-60' : ''}`}
                          >
                            <Zap className="w-3 h-3" />
                            {tierLabel}
                            {feat.status === 'pending'
                              ? ' · en cola'
                              : feat.expires_at
                              ? ` · vence ${formatExpiryDate(feat.expires_at)}`
                              : ''}
                            {isSuperAdmin && feat.status !== 'pending' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setCancelFeaturedTarget({ adTitle: ad.title, featured: feat }); }}
                                className="ml-1 text-red-300 hover:text-red-500"
                                title="Cancelar destacado"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Barra de completitud — solo borradores */}
                  {ad.status === 'draft' && (() => {
                    const done = calcCompleteness(ad);
                    const pct = Math.round((done / COMPLETENESS_TOTAL) * 100);
                    return (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-gray-400 font-medium">
                            Completado {done} de {COMPLETENESS_TOTAL} pasos
                          </span>
                          <span className="text-[11px] font-bold text-amber-600">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Fila de acciones */}
                  <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-gray-100">
                    <button
                      onClick={() => setEditingAdId(ad.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        ad.status === 'draft'
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'text-gray-500 hover:text-brand-600 hover:bg-brand-50'
                      }`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {ad.status === 'draft'
                        ? `Continuar editando ${calcCompleteness(ad)} de ${COMPLETENESS_TOTAL}`
                        : 'Modificar'}
                    </button>

                    {canUseFeaturedFlow && ad.status === 'active' && !isAdFeatured && (
                      <button
                        onClick={() => handleStartCheckout(ad, 'alta')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Destacar
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedAdForViews(ad)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Vistas
                      <span className="tabular-nums">{ad.views_count || 0}</span>
                    </button>

                    <button
                      onClick={() => setSelectedAdForDelete(ad)}
                      className="ml-auto p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar aviso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-500 font-medium">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* === Drawer Vistas === */}
      {selectedAdForViews && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedAdForViews(null)} />
          <div className="drawer-enter fixed inset-y-0 right-0 z-50 w-[90vw] sm:w-1/2 max-w-lg flex flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b bg-white">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-gray-900">Estadísticas</h3>
              </div>
              <button onClick={() => setSelectedAdForViews(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Titulo del aviso */}
              <p className="text-sm font-semibold text-gray-800 leading-snug">{selectedAdForViews.title}</p>

              {/* Vistas — número grande */}
              <div className="bg-brand-50 rounded-2xl px-6 py-5 text-center">
                <p className="text-5xl font-black tabular-nums text-brand-600">{selectedAdForViews.views_count || 0}</p>
                <p className="text-sm text-brand-700 font-medium mt-1">visitas totales</p>
              </div>

              {/* Datos del aviso */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">Estado</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    selectedAdForViews.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedAdForViews.status === 'active' ? 'Activo' : 'Pausado'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">Precio</span>
                  <span className="text-sm font-black text-brand-600">
                    {selectedAdForViews.price ? `${selectedAdForViews.currency} ${selectedAdForViews.price.toLocaleString('es-AR')}` : '—'}
                  </span>
                </div>
                {selectedAdForViews.category && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500 font-medium">Categoría</span>
                    <span className="text-xs text-gray-700">{selectedAdForViews.category}</span>
                  </div>
                )}
                {selectedAdForViews.province && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500 font-medium">Provincia</span>
                    <span className="text-xs text-gray-700">{selectedAdForViews.province}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Publicado
                  </span>
                  <span className="text-xs text-gray-700">
                    {new Date(selectedAdForViews.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Ver aviso público */}
              {selectedAdForViews.slug && (
                <a
                  href={`#/aviso/${selectedAdForViews.slug}`}
                  onClick={() => setSelectedAdForViews(null)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-brand-200 text-brand-600 text-sm font-semibold hover:bg-brand-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver aviso público
                </a>
              )}
            </div>
          </div>
        </>
      )}


      {isSuperAdmin && showBulkVisibility && (
        <BulkVisibilityModal
          isOpen={showBulkVisibility}
          onClose={() => setShowBulkVisibility(false)}
          ads={ads}
          featuredMap={featuredMap}
          onApplied={() => { loadData(); }}
        />
      )}

      {/* Modal Confirmar Eliminación */}
      {selectedAdForDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                ¿Eliminar aviso?
              </h3>
              
              <p className="text-gray-600 text-center mb-1">
                Estás por eliminar el aviso:
              </p>
              <p className="text-gray-900 font-medium text-center mb-4">
                "{selectedAdForDelete.title}"
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-red-800 text-sm text-center font-medium">
                  Esta acción es PERMANENTE y no se puede deshacer
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedAdForDelete(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Cancelar Destacado */}
      {isSuperAdmin && cancelFeaturedTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
                <X className="w-6 h-6 text-yellow-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                ¿Cancelar destacado?
              </h3>
              
              <p className="text-gray-600 text-center mb-1">
                Aviso: <span className="font-medium text-gray-900">"{cancelFeaturedTarget.adTitle}"</span>
              </p>
              <p className="text-gray-600 text-center mb-4">
                Placement: <span className="font-bold text-brand-700">
                  {getPlacementShort(cancelFeaturedTarget.featured.placement)}
                </span>
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-yellow-800 text-sm text-center font-medium">
                  No hay reembolso por cancelación de destacado
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelFeaturedTarget(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={confirmCancelFeatured}
                  disabled={cancellingFeatured}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
                >
                  {cancellingFeatured ? 'Cancelando...' : 'Sí, Cancelar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === Drawer Editar Aviso === */}
      {editingAdId && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setEditingAdId(null)} />
          <div className="drawer-enter fixed inset-y-0 right-0 z-50 w-[95vw] sm:w-[60vw] flex flex-col bg-gray-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-white border-b">
              <h3 className="text-base font-bold text-gray-900">Modificar aviso</h3>
              <button
                onClick={() => setEditingAdId(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 p-4">
              <EditarAviso
                adId={editingAdId}
                isSuperadmin={isSuperAdmin}
                onBack={() => { setEditingAdId(null); loadData(); }}
              />
            </div>
          </div>
        </>
      )}

      {/* SuperAdmin: panel completo de gestión de avisos y destacados */}
      {isSuperAdmin && (
        <div className="mt-4">
          <SuperAdminFeaturedPanel />
        </div>
      )}

    </div>
  );
}

