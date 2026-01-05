import { useState, useEffect } from 'react';
import {
  getMyAds,
  getAllAdsByRole,
  deleteAd,
  toggleAdStatus,
  toggleFeatured,
  getUserAdLimit,
} from '../../services/adsService';
import type { Ad } from '../../../types';
import { Edit, Trash2, Eye, EyeOff, ExternalLink, Plus, Image as ImageIcon } from 'lucide-react';
import { notify } from '../../utils/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { isSuperAdmin as checkIsSuperAdmin, isFreeUser as checkIsFreeUser } from '../../utils/rolePermissions';
import { getFirstImage } from '../../utils/imageHelpers';

interface MyAdsPanelProps {
  onNavigate?: (page: string) => void;
}

export default function MyAdsPanel({ onNavigate }: MyAdsPanelProps = {}) {
  const { profile } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [adLimit, setAdLimit] = useState({ limit: 0, current: 0 });
  
  // Determinar permisos según rol
  const isSuperAdmin = checkIsSuperAdmin(profile?.role);
  const isFreeUser = checkIsFreeUser(profile?.role);
  // Todos los usuarios pueden pausar/activar sus propios avisos
  const canManageAdStatus = true;
  
  const [previewAd, setPreviewAd] = useState<Ad | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'expired'>('all');
  
  // Sistema de pestañas para SuperAdmin (FREE vs Premium vs Propios)
  const [activeTab, setActiveTab] = useState<'mine' | 'free' | 'premium'>('mine');
  
  useEffect(() => {
    loadData();
  }, [profile, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      let adsData: Ad[];
      
      if (isSuperAdmin) {
        if (activeTab === 'mine') {
          // SuperAdmin: Sus propios avisos
          adsData = await getMyAds();
          console.log('📋 Mis avisos (SuperAdmin):', adsData.length);
        } else {
          // SuperAdmin: Cargar avisos según la pestaña activa (free o premium)
          adsData = await getAllAdsByRole({ userRole: activeTab });
          console.log(`📋 Avisos ${activeTab.toUpperCase()} cargados en MyAdsPanel:`, adsData.length);
        }
      } else {
        // Usuario Free/Normal: Solo sus propios avisos (máximo 10)
        adsData = await getMyAds();
        console.log('📋 Mis avisos personales:', adsData);
        console.log('🔍 Primer aviso approval_status:', adsData[0]?.approval_status);
        console.log('🖼️ Primer aviso images:', adsData[0]?.images);
        console.log('🖼️ Primer aviso tipo images:', typeof adsData[0]?.images, Array.isArray(adsData[0]?.images));
      }
      
      setAds(adsData);
      
      // Get user limits
      const limit = await getUserAdLimit(profile?.id);
      setAdLimit(limit);
      
      console.log(`📊 Límite de avisos: ${limit.current}/${limit.limit}`);
    } catch (error) {
      console.error('Error loading ads:', error);
      notify.error('Error al cargar avisos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const { error } = await toggleAdStatus(id);
      if (error) throw new Error(error.message);
      notify.success('Estado del aviso actualizado');
      loadData();
    } catch (error: any) {
      notify.error(error.message || 'Error al cambiar estado');
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      const { error } = await toggleFeatured(id);
      if (error) throw new Error(error.message);
      notify.success('Estado de destacado actualizado');
      loadData();
    } catch (error: any) {
      notify.error(error.message || 'Error al cambiar featured');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este aviso? Esta acción no se puede deshacer.')) return;
    
    try {
      const { error } = await deleteAd(id);
      if (error) throw new Error(error.message);
      notify.success('Aviso eliminado correctamente');
      loadData();
    } catch (error: any) {
      notify.error(error.message || 'Error al eliminar aviso');
    }
  };

  // Filter ads by status
  const filteredAds = filterStatus === 'all' 
    ? ads 
    : ads.filter(ad => {
        if (filterStatus === 'expired') {
          return ad.expires_at && new Date(ad.expires_at) < new Date();
        }
        return ad.status === filterStatus;
      });

  // Stats
  const stats = {
    total: ads.length,
    active: ads.filter(a => a.status === 'active').length,
    paused: ads.filter(a => a.status === 'paused').length,
    expired: ads.filter(a => a.expires_at && new Date(a.expires_at) < new Date()).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a135] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus avisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con título simple */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1b2f23]">
            {isSuperAdmin && activeTab !== 'mine' 
              ? `Avisos de usuarios ${activeTab === 'free' ? 'Free' : 'Premium'}`
              : 'Mis Avisos'}
          </h2>
          {!isSuperAdmin && (
            <p className="text-sm text-gray-600 mt-1">
              Estás usando <span className="font-bold text-[#16a135]">{adLimit.current}</span> de{' '}
              <span className="font-bold">{adLimit.limit}</span> avisos disponibles
            </p>
          )}
        </div>
        {(activeTab === 'mine' || !isSuperAdmin) && (
          <button
            onClick={() => window.location.hash = '#/publicar-v2'}
            disabled={!isSuperAdmin && adLimit.current >= adLimit.limit}
            className="bg-gradient-to-r from-[#16a135] to-[#138a2c] hover:from-[#138a2c] hover:to-[#0e7d25] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Plus className="w-6 h-6" />
            Crear Nuevo Aviso
          </button>
        )}
      </div>

      {/* Tabs para SuperAdmin */}
      {isSuperAdmin && (
        <div className="bg-white rounded-lg p-1 inline-flex gap-1">
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'mine'
                ? 'bg-[#16a135] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Mis Avisos
          </button>
          <button
            onClick={() => setActiveTab('free')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'free'
                ? 'bg-[#16a135] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Avisos Free
          </button>
          <button
            onClick={() => setActiveTab('premium')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'premium'
                ? 'bg-[#16a135] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Avisos Premium
          </button>
        </div>
      )}

      {/* Limit Warning (Solo para usuarios no-admin) */}
      {!isSuperAdmin && adLimit.current >= adLimit.limit && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">
            ⚠️ Has alcanzado el límite de avisos de tu plan. Para publicar más avisos, 
            elimina o pausa algunos existentes, o actualiza tu plan.
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
                ? 'bg-[#16a135] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' && `Todos (${stats.total})`}
            {status === 'active' && `Activos (${stats.active})`}
            {status === 'paused' && `Pausados (${stats.paused})`}
          </button>
        ))}
      </div>

      {/* Ads Grid - Catálogo de cards */}
      {filteredAds.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <ImageIcon className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No tienes avisos {filterStatus !== 'all' ? filterStatus : ''}
          </h3>
          <p className="text-gray-600 mb-6">
            {filterStatus === 'all' 
              ? 'Publicá tu primer aviso para empezar a vender'
              : `No hay avisos con estado "${filterStatus}"`}
          </p>
          {filterStatus === 'all' && adLimit.current < adLimit.limit && (
            <button
              onClick={() => window.location.hash = '#/publicar-v2'}
              className="px-6 py-3 bg-[#16a135] text-white rounded-xl hover:bg-[#0e7d25] transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Publicar Aviso
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAds.map((ad) => {
            const isExpired = ad.expires_at && new Date(ad.expires_at) < new Date();
            
            return (
              <div
                key={ad.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
              >
                {/* Imagen - mismo diseño que UnifiedAdCard */}
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={getFirstImage(ad.images)}
                    alt={ad.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/preview-image.webp';
                    }}
                  />
                  
                  {/* Badge de categoría en esquina superior izquierda - igual que frontend */}
                  {ad.category && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wide">
                        {ad.category}
                      </span>
                    </div>
                  )}

                  {/* Status Badge - superpuesto en esquina superior derecha */}
                  <div className="absolute top-3 right-3">
                    {ad.approval_status === 'pending' && ad.status !== 'active' && (
                      <span className="px-2 py-1 bg-orange-500 text-white text-[10px] font-bold rounded shadow">
                        En Revisión
                      </span>
                    )}
                    {ad.approval_status === 'rejected' && (
                      <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded shadow">
                        Rechazado
                      </span>
                    )}
                    {(ad.approval_status !== 'pending' || ad.status === 'active') && ad.approval_status !== 'rejected' && (
                      <>
                        {ad.status === 'active' && !isExpired && (
                          <span className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded shadow">
                            Activo
                          </span>
                        )}
                        {ad.status === 'paused' && (
                          <span className="px-2 py-1 bg-yellow-500 text-white text-[10px] font-bold rounded shadow">
                            Pausado
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2 py-1 bg-gray-500 text-white text-[10px] font-bold rounded shadow">
                            Expirado
                          </span>
                        )}
                      </>
                    )}
                    {ad.featured && (
                      <span className="ml-1 px-2 py-1 bg-[#f0bf43] text-white text-[10px] font-bold rounded shadow">
                        🏆
                      </span>
                    )}
                  </div>
                </div>

                {/* Content - mismo estilo que UnifiedAdCard */}
                <div className="p-4 flex flex-col flex-grow">
                  {/* Título */}
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-base leading-tight">
                    {ad.title}
                  </h3>

                  {/* Ubicación */}
                  {ad.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                      <svg className="w-4 h-4 text-[#16a135]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="line-clamp-1">{ad.location}{ad.province ? `, ${ad.province}` : ''}</span>
                    </div>
                  )}

                  {/* Descripción */}
                  {ad.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow">
                      {ad.description}
                    </p>
                  )}

                  {/* Precio */}
                  <div className="mb-3">
                    <p className="text-2xl font-bold text-[#16a135]">
                      {ad.currency} {ad.price?.toLocaleString() || '0'}
                    </p>
                    {ad.views_count !== undefined && (
                      <div className="text-xs text-gray-400 mt-1">
                        <span>👁️ {ad.views_count}</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons - todos en una fila */}
                  <div className="flex gap-2">
                    {/* Ver Detalle Completo */}
                    <button
                      onClick={() => window.location.hash = `#/ad/${ad.id}`}
                      className="flex-1 py-2 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors flex items-center justify-center gap-1 font-medium"
                      title="Ver detalle completo con atributos dinámicos"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Detalle
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => {
                        console.log('🔵 Click Editar - Ad ID:', ad.id);
                        console.log('🔵 Nueva URL:', `#/edit/${ad.id}`);
                        window.location.hash = `#/edit/${ad.id}`;
                        console.log('🔵 URL actual después del cambio:', window.location.hash);
                      }}
                      className="flex-1 py-2 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors flex items-center justify-center gap-1 font-medium"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Editar
                    </button>

                    {/* Pausar/Publicar */}
                    {canManageAdStatus && (
                      <button
                        onClick={() => handleToggleStatus(ad.id)}
                        className={`flex-1 py-2 text-xs rounded-lg transition-colors flex items-center justify-center gap-1 font-medium ${
                          ad.status === 'active'
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        title={ad.status === 'active' ? 'Pausar' : 'Publicar'}
                      >
                        {ad.status === 'active' ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            Publicar
                          </>
                        )}
                      </button>
                    )}

                    {/* Borrar */}
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="flex-1 py-2 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors flex items-center justify-center gap-1 font-medium"
                      title="Borrar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Borrar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edición movida a página completa */}

      {/* Preview Modal */}
      {previewAd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Vista Previa del Aviso</h3>
                <button
                  onClick={() => setPreviewAd(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Images */}
              <div className="mb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {previewAd.images && previewAd.images.length > 0 ? (
                    previewAd.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${previewAd.title} - ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/preview-image.webp';
                        }}
                      />
                    ))
                  ) : (
                    <img
                      src="/images/preview-image.webp"
                      alt={previewAd.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-4">{previewAd.title}</h2>
              
              {previewAd.price && (
                <div className="text-3xl font-bold text-[#16a135] mb-4">
                  {previewAd.currency} {previewAd.price.toLocaleString()}
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Categoría:</span>
                    <span className="ml-2 font-medium">{previewAd.category}</span>
                  </div>
                  {previewAd.subcategory && (
                    <div>
                      <span className="text-gray-600">Subcategoría:</span>
                      <span className="ml-2 font-medium">{previewAd.subcategory}</span>
                    </div>
                  )}
                  {previewAd.location && (
                    <div>
                      <span className="text-gray-600">Ubicación:</span>
                      <span className="ml-2 font-medium">{previewAd.location}</span>
                    </div>
                  )}
                  {previewAd.province && (
                    <div>
                      <span className="text-gray-600">Provincia:</span>
                      <span className="ml-2 font-medium">{previewAd.province}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Descripción</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{previewAd.description}</p>
              </div>

              {previewAd.tags && previewAd.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">Etiquetas</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewAd.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(previewAd.contact_phone || previewAd.contact_email) && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-2">Contacto</h4>
                  {previewAd.contact_phone && (
                    <p className="text-gray-700">📱 {previewAd.contact_phone}</p>
                  )}
                  {previewAd.contact_email && (
                    <p className="text-gray-700">✉️ {previewAd.contact_email}</p>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <button
                onClick={() => setPreviewAd(null)}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Ya no se usa modal AdForm, se navega a #/publicar-v2 */}
    </div>
  );
}
