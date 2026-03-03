import { useState, useEffect } from 'react';
import {
  getMyAds,
  deleteAd,
  getUserAdLimit,
} from '../../services/adsService';
import type { Ad } from '../../../types';
import { Edit, Trash2, Eye, Plus, Package, X, Zap, Calendar, Star } from 'lucide-react';
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

interface Category {
  id: string;
  display_name: string;
}

/** Info de un featured activo/pendiente para un aviso */
interface FeaturedInfo {
  featured_id: string;
  placement: string;
  tier?: string;
  status: string;
  expires_at?: string;
}

const TIER_CHIPS: Array<{ tier: 'baja' | 'media' | 'alta'; label: string; icon?: React.ReactNode }> = [
  { tier: 'baja',  label: 'BAJA' },
  { tier: 'media', label: 'MEDIA', icon: <Star className="w-3 h-3" /> },
  { tier: 'alta',  label: 'ALTA',  icon: <Zap className="w-3 h-3" /> },
];

export default function MyAdsPanel({ onNavigate }: MyAdsPanelProps = {}) {
  const { profile } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [adLimit, setAdLimit] = useState({ limit: 0, current: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAdForView, setSelectedAdForView] = useState<Ad | null>(null);
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
    loadCategories();
  }, [profile]);

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('id, display_name')
        .eq('is_active', true)
        .order('display_name');
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

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

      {/* Cards de avisos â€" Mobile-first responsive grid */}
      {filteredAds.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Package className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No tienes avisos {filterStatus !== 'all' ? filterStatus : ''}
          </h3>
          <p className="text-gray-600 mb-6">
            {filterStatus === 'all' 
              ? 'PublicÃ¡ tu primer aviso para empezar a vender'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {filteredAds.map((ad) => {
            const adFeatureds = featuredMap[ad.id] || [];
            const isAdFeatured = adFeatureds.length > 0;
            const thumbnail = ad.images?.[0] || DEFAULT_PLACEHOLDER_IMAGE;

            return (
              <div
                key={ad.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* - ZONA IMAGEN - */}
                <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  <img
                    src={thumbnail}
                    alt={ad.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PLACEHOLDER_IMAGE; }}
                  />

                  {/* Status pill con glow — top left */}
                  <span className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    ad.status === 'active'
                      ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(52,211,153,0.75)]'
                      : 'bg-amber-400 text-amber-900'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${ad.status === 'active' ? 'bg-white/80' : 'bg-amber-700'}`} />
                    {ad.status === 'active' ? 'Activo' : 'Pausado'}
                  </span>

                  {/* Featured badges — top right (dorado/negro/gris) */}
                  {isAdFeatured && (
                    <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                      {adFeatureds.map((feat) => {
                        const t = feat.tier || (feat.placement === 'homepage' ? 'alta' : feat.placement === 'results' ? 'media' : 'baja');
                        const badgeCls = t === 'alta'
                          ? 'bg-amber-400/95 text-amber-900'
                          : t === 'media'
                          ? 'bg-gray-900/90 text-white'
                          : 'bg-gray-500/80 text-white';
                        const badgeLabel = t === 'alta' ? 'ALTO' : t === 'media' ? 'MEDIA' : 'BAJA';
                        return (
                          <span key={feat.featured_id}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm ${badgeCls} ${feat.status === 'pending' ? 'opacity-60' : ''}`}
                          >
                            {badgeLabel}{feat.status === 'pending' ? '…' : ''}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* - ZONA CONTENIDO DEL AVISO - */}
                <div className="px-3.5 pt-3 pb-2 flex flex-col gap-1.5 flex-1">
                  <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
                    {ad.title}
                  </h3>
                  {ad.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {ad.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1 mt-auto">
                    <span className="font-black text-brand-600 text-sm">
                      {ad.currency} {ad.price?.toLocaleString() || '0'}
                    </span>
                    <span className="text-[11px] text-gray-400 truncate max-w-[110px]">
                      {ad.category}
                    </span>
                  </div>
                </div>

                {/* - ZONA PUBLICIDAD / VISIBILIDAD - */}
                {canUseFeaturedFlow && (
                  <div className="px-3.5 pb-3">
                    {/* Featured activos: info por tier */}
                    {isAdFeatured && (
                      <div className="mb-2 space-y-1">
                        {adFeatureds.map((feat) => {
                          const t = feat.tier || (feat.placement === 'homepage' ? 'alta' : feat.placement === 'results' ? 'media' : 'baja');
                          const accentCls = t === 'alta' ? 'text-amber-600' : t === 'media' ? 'text-gray-700' : 'text-gray-500';
                          const icon = t === 'alta' ? '⚡' : t === 'media' ? '●' : '○';
                          return (
                            <div key={feat.featured_id} className="flex items-center justify-between text-xs">
                              <span className={`font-bold ${accentCls}`}>
                                {icon} {t === 'alta' ? 'ALTO' : t === 'media' ? 'MEDIA' : 'BAJA'}
                              </span>
                              <div className="flex items-center gap-1">
                                {feat.status === 'active' ? (
                                  <span className="text-gray-400 flex items-center gap-0.5">
                                    <Calendar className="w-3 h-3" />
                                    {formatExpiryDate(feat.expires_at)}
                                  </span>
                                ) : (
                                  <span className="text-amber-500 font-medium">En cola</span>
                                )}
                                {isSuperAdmin && (
                                  <button
                                    onClick={() => setCancelFeaturedTarget({ adTitle: ad.title, featured: feat })}
                                    className="p-0.5 text-red-300 hover:text-red-500 rounded"
                                    title="Cancelar destacado"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Tier chips */}
                    {ad.status === 'active' && (
                      <div className="flex items-center gap-1.5">
                        {!isAdFeatured && (
                          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                            Destacar:
                          </span>
                        )}
                        {TIER_CHIPS.map(({ tier, label }) => {
                          const alreadyFeatured = adFeatureds.some(
                            f => f.tier === tier || (!f.tier && tier === 'alta' && f.placement === 'homepage')
                          );
                          const activeCls = tier === 'alta'
                            ? 'bg-amber-400 hover:bg-amber-500 text-amber-900'
                            : tier === 'media'
                            ? 'bg-gray-800 hover:bg-gray-700 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700';
                          const doneCls = tier === 'alta'
                            ? 'bg-amber-100 text-amber-400'
                            : tier === 'media'
                            ? 'bg-gray-200 text-gray-400'
                            : 'bg-gray-100 text-gray-400';
                          return (
                            <button
                              key={tier}
                              onClick={() => !alreadyFeatured && handleStartCheckout(ad, tier)}
                              disabled={alreadyFeatured}
                              title={alreadyFeatured ? `Ya activo en ${label}` : `Destacar como ${label}`}
                              className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full transition-colors shadow-sm ${
                                alreadyFeatured ? `${doneCls} cursor-default` : `${activeCls} cursor-pointer`
                              }`}
                            >
                              {tier === 'alta' ? '⚡ ' : tier === 'media' ? '● ' : '○ '}{label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* - SUBFOOTER: CRUD + MÉTRICAS - */}
                <div className="border-t border-gray-100 px-3.5 py-2.5 flex items-center justify-between bg-gray-50/70">
                  {/* CRUD */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedAdForEdit(ad)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      title="Modificar aviso"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Modificar
                    </button>
                    <button
                      onClick={() => setSelectedAdForDelete(ad)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 bg-white border border-red-100 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
                      title="Eliminar aviso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>

                  {/* Métricas + estado */}
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {ad.views_count || 0}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-semibold ${
                      ad.status === 'active'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ad.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {ad.status === 'active' ? 'Activo' : 'Pausado'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Ver Detalle */}
      {selectedAdForView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Detalle del Aviso</h3>
              <button
                onClick={() => setSelectedAdForView(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <p className="text-gray-900">{selectedAdForView.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedAdForView.status === 'active' 
                        ? 'bg-brand-100 text-brand-700' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedAdForView.status === 'active' ? 'Activo' : 'Pausado'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">TÃ­tulo</label>
                <p className="text-gray-900 font-medium">{selectedAdForView.title}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">DescripciÃ³n</label>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedAdForView.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Precio</label>
                  <p className="font-bold text-brand-600">
                    {selectedAdForView.currency} {selectedAdForView.price?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Provincia</label>
                  <p className="text-gray-900">{selectedAdForView.province || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">CategorÃ­a</label>
                  <p className="text-gray-900">{selectedAdForView.category_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">SubcategorÃ­a</label>
                  <p className="text-gray-900">{selectedAdForView.subcategory_name || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Visitas</label>
                  <p className="text-gray-900">{selectedAdForView.views_count || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Creado</label>
                  <p className="text-gray-900">
                    {new Date(selectedAdForView.created_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border-t px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedAdForView(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quick Edit */}
      {selectedAdForEdit && (
        <QuickEditAdModal
          adId={selectedAdForEdit.id}
          onClose={() => setSelectedAdForEdit(null)}
          onSuccess={() => {
            loadData();
            notify.success('Aviso actualizado correctamente');
          }}
        />
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

