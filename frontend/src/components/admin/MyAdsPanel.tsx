import { useState, useEffect } from 'react';
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
import { QuickEditAdModal } from './QuickEditAdModal';
import BulkVisibilityModal from './BulkVisibilityModal';
import SuperAdminFeaturedPanel from './SuperAdminFeaturedPanel';

import { cancelActiveFeaturedAd } from '../../services/userFeaturedService';
import { navigateTo } from '../../hooks/useNavigate';

/**
 * Extraer public_id de Cloudinary URL para borrado
 * https://res.cloudinary.com/xxx/image/upload/.../rural24/ads/abc123.jpg â†’ rural24/ads/abc123
 */
function extractCloudinaryPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

interface MyAdsPanelProps {
  onNavigate?: (page: string) => void;
}

/** Info de un featured activo/pendiente para un aviso */
interface FeaturedInfo {
  featured_id: string;
  placement: string;
  tier?: string;
  status: string;
  expires_at?: string;
}

export default function MyAdsPanel({ onNavigate }: MyAdsPanelProps = {}) {
  const { profile } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [adLimit, setAdLimit] = useState({ limit: 0, current: 0 });
  const [selectedAdForViews, setSelectedAdForViews] = useState<Ad | null>(null);
  const [selectedAdForEdit, setSelectedAdForEdit] = useState<Ad | null>(null);
  const [selectedAdForDelete, setSelectedAdForDelete] = useState<Ad | null>(null);
  const [showBulkVisibility, setShowBulkVisibility] = useState(false);
  const [featuredMap, setFeaturedMap] = useState<Record<string, FeaturedInfo[]>>({});

  // Cancel featured
  const [cancelFeaturedTarget, setCancelFeaturedTarget] = useState<{ adTitle: string; featured: FeaturedInfo } | null>(null);
  const [cancellingFeatured, setCancellingFeatured] = useState(false);
  
  // Determinar permisos segÃºn rol
  const isSuperAdmin = checkIsSuperAdmin(profile?.role);
  const canUseFeaturedFlow = Boolean(profile?.id);
  const [superAdminView, setSuperAdminView] = useState<'mine' | 'clients'>('mine');
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('active');
  
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

  const handleSaveEdit = async (updatedData: Partial<Ad>) => {
    if (!selectedAdForEdit) return;

    try {
      const { error } = await supabase
        .from('ads')
        .update(updatedData)
        .eq('id', selectedAdForEdit.id);

      if (error) throw error;

      notify.success('Aviso actualizado correctamente');
      setSelectedAdForEdit(null);
      loadData();
    } catch (error) {
      console.error('Error updating ad:', error);
      notify.error('Error al actualizar aviso');
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
      
      // PASO 1: Obtener todas las imÃ¡genes asociadas (soporta ambos sistemas)
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
      
      // PASO 2: Eliminar imÃ¡genes de Cloudinary (si existen)
      if (imageUrls.length > 0) {
        const publicIds = imageUrls
          .map(extractCloudinaryPublicId)
          .filter(Boolean) as string[];
        
        if (publicIds.length > 0) {
          try {
            // Llamar al backend API para eliminar de Cloudinary
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/uploads/delete`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ urls: imageUrls })
            });
            
            if (!response.ok) {
              console.warn('âš ï¸ Error al eliminar imÃ¡genes de Cloudinary:', await response.text());
            } else {
              const result = await response.json();
              console.log(`âœ… Cloudinary cleanup: ${result.success}/${publicIds.length} imÃ¡genes eliminadas`);
            }
          } catch (cloudinaryError) {
            console.warn('âš ï¸ No se pudieron eliminar las imÃ¡genes de Cloudinary:', cloudinaryError);
            // Continuamos con el delete del aviso aunque falle Cloudinary
          }
        }
      }
      
      // PASO 3: Hard delete del aviso en Supabase (CASCADE eliminarÃ¡ ad_images automÃ¡ticamente)
      const { error: deleteError } = await supabase
        .from('ads')
        .delete()
        .eq('id', adId);
      
      if (deleteError) throw deleteError;

      notify.success('Aviso e imÃ¡genes eliminados correctamente');
      setSelectedAdForDelete(null);
      loadData();
    } catch (error: any) {
      console.error('Error deleting ad:', error);
      notify.error('Error al eliminar aviso');
    }
  };


  // Filter ads by status
  const filteredAds = filterStatus === 'all' 
    ? ads 
    : ads.filter(ad => ad.status === filterStatus);

  // Stats
  const stats = {
    total: ads.length,
    active: ads.filter(a => a.status === 'active').length,
    paused: ads.filter(a => a.status === 'paused').length,
  };

  /** Calcular dÃ­as restantes de un featured */
  const getRemainingDays = (expiresAt?: string): number => {
    if (!expiresAt) return 0;
    const now = new Date();
    const exp = new Date(expiresAt);
    const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  /** Label corto del placement */
  const getPlacementShort = (placement: string): string => {
    const labels: Record<string, string> = {
      homepage: 'ALTO',
      results: 'MEDIO',
      detail: 'BÃSICO',
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

  if (isSuperAdmin && superAdminView === 'clients') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSuperAdminView('mine')}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Mis Avisos
          </button>
          <button
            onClick={() => setSuperAdminView('clients')}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-brand-600 bg-brand-600 text-white"
          >
            Avisos Clientes
          </button>
        </div>
        <SuperAdminFeaturedPanel />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isSuperAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSuperAdminView('mine')}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-brand-600 bg-brand-600 text-white"
          >
            Mis Avisos
          </button>
          <button
            onClick={() => setSuperAdminView('clients')}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Avisos Clientes
          </button>
        </div>
      )}
      {/* Header simple */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-950">Mis Avisos</h2>
          {!isSuperAdmin && (
            <p className="text-sm text-gray-600 mt-1">
              EstÃ¡s usando <span className="font-bold text-brand-600">{adLimit.current}</span> de{' '}
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
            className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-600 hover:to-brand-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            Has alcanzado el lÃ­mite de avisos de tu plan. Para publicar mÃ¡s avisos, 
            elimina o pausa algunos existentes.
          </p>
        </div>
      )}

      {/* Filtros simples */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'active', 'paused'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
              filterStatus === status
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' && `Todos (${stats.total})`}
            {status === 'active' && `Activos (${stats.active})`}
            {status === 'paused' && `Pausados (${stats.paused})`}
          </button>
        ))}
      </div>

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
        <div className="space-y-2">
          {filteredAds.map((ad) => {
            const adFeatureds = featuredMap[ad.id] || [];
            const isAdFeatured = adFeatureds.length > 0;
            const thumbnail = ad.images?.[0] || DEFAULT_PLACEHOLDER_IMAGE;
            const isSelected = selectedAdForEdit?.id === ad.id;

            return (
              <div
                key={ad.id}
                className={`bg-white rounded-2xl border transition-all duration-150 flex gap-4 p-4 ${
                  isSelected
                    ? 'border-brand-400 shadow-md ring-1 ring-brand-200'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
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
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500">{ad.category}</span>
                        {ad.province && (
                          <span className="text-xs text-gray-400">· {ad.province}</span>
                        )}
                        <span className={`text-xs font-semibold ${
                          ad.status === 'active' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          · {ad.status === 'active' ? 'Activo' : 'Pausado'}
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-brand-600 text-base tabular-nums whitespace-nowrap flex-shrink-0">
                      {ad.currency} {ad.price?.toLocaleString('es-AR') || 'Consultar'}
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

                  {/* Fila de acciones */}
                  <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedAdForEdit(isSelected ? null : ad)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'text-brand-600 bg-brand-50'
                          : 'text-gray-500 hover:text-brand-600 hover:bg-brand-50'
                      }`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Modificar
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
                    {selectedAdForViews.currency} {selectedAdForViews.price?.toLocaleString('es-AR') || 'Consultar'}
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

      {/* Drawer lateral — Editar aviso (desktop: panel derecho; mobile: full screen) */}
      {selectedAdForEdit && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setSelectedAdForEdit(null)}
          />
          {/* Panel lateral */}
          <div className="drawer-enter fixed inset-y-0 right-0 z-50 w-[90vw] sm:w-1/2 max-w-2xl flex flex-col shadow-2xl">
            <QuickEditAdModal
              adId={selectedAdForEdit.id}
              mode="drawer"
              onClose={() => setSelectedAdForEdit(null)}
              onSuccess={() => {
                loadData();
                setSelectedAdForEdit(null);
              }}
            />
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

      {/* Modal Confirmar EliminaciÃ³n */}
      {selectedAdForDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                Â¿Eliminar aviso?
              </h3>
              
              <p className="text-gray-600 text-center mb-1">
                EstÃ¡s por eliminar el aviso:
              </p>
              <p className="text-gray-900 font-medium text-center mb-4">
                "{selectedAdForDelete.title}"
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-red-800 text-sm text-center font-medium">
                  Esta acciÃ³n es PERMANENTE y no se puede deshacer
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
                  SÃ­, Eliminar
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
                Â¿Cancelar destacado?
              </h3>
              
              <p className="text-gray-600 text-center mb-1">
                Aviso: <span className="font-medium text-gray-900">"{cancelFeaturedTarget.adTitle}"</span>
              </p>
              <p className="text-gray-600 text-center mb-4">
                Placement: <span className="font-bold text-[#169834]">
                  {getPlacementShort(cancelFeaturedTarget.featured.placement)}
                </span>
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-yellow-800 text-sm text-center font-medium">
                  No hay reembolso por cancelaciÃ³n de destacado
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
                  {cancellingFeatured ? 'Cancelando...' : 'SÃ­, Cancelar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

