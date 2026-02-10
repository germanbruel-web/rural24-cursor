import { useState, useEffect } from 'react';
import {
  getMyAds,
  deleteAd,
  getUserAdLimit,
} from '../../services/adsService';
import type { Ad } from '../../../types';
import { Edit, Trash2, Eye, Plus, Package, X, Star, Zap } from 'lucide-react';
import { notify } from '../../utils/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { isSuperAdmin as checkIsSuperAdmin } from '../../utils/rolePermissions';
import { supabase } from '../../services/supabaseClient';
import { QuickEditAdModal } from './QuickEditAdModal';
import { FeaturedAdModal } from '../dashboard';
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

interface MyAdsPanelProps {
  onNavigate?: (page: string) => void;
}

interface Category {
  id: string;
  display_name: string;
}

export default function MyAdsPanel({ onNavigate }: MyAdsPanelProps = {}) {
  const { profile } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [adLimit, setAdLimit] = useState({ limit: 0, current: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAdForView, setSelectedAdForView] = useState<Ad | null>(null);
  const [selectedAdForEdit, setSelectedAdForEdit] = useState<Ad | null>(null);
  const [selectedAdForDelete, setSelectedAdForDelete] = useState<Ad | null>(null);
  const [selectedAdForFeatured, setSelectedAdForFeatured] = useState<Ad | null>(null);
  const [featuredMap, setFeaturedMap] = useState<Record<string, { placement: string; expires_at?: string }>>({});
  
  // Determinar permisos según rol
  const isSuperAdmin = checkIsSuperAdmin(profile?.role);
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('all');
  
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
      console.log('🔍 [MyAdsPanel] Avisos cargados:', adsData.length, adsData);
      setAds(adsData);
      await loadFeaturedStatus(adsData);
      
      // Get user limits
      const limit = await getUserAdLimit(profile?.id);
      setAdLimit(limit);
      
      console.log(`📊 Mis avisos: ${adsData.length} | Límite: ${limit.current}/${limit.limit}`);
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
        .select('ad_id, placement, status, expires_at')
        .in('ad_id', adIds)
        .eq('status', 'active');

      if (error) {
        console.error('Error loading featured status:', error);
        return;
      }

      const nextMap: Record<string, { placement: string; expires_at?: string }> = {};
      (data || []).forEach((item: any) => {
        if (item?.ad_id) {
          nextMap[item.ad_id] = {
            placement: item.placement,
            expires_at: item.expires_at || undefined,
          };
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
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/uploads/delete`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ urls: imageUrls })
            });
            
            if (!response.ok) {
              console.warn('⚠️ Error al eliminar imágenes de Cloudinary:', await response.text());
            } else {
              const result = await response.json();
              console.log(`✅ Cloudinary cleanup: ${result.success}/${publicIds.length} imágenes eliminadas`);
            }
          } catch (cloudinaryError) {
            console.warn('⚠️ No se pudieron eliminar las imágenes de Cloudinary:', cloudinaryError);
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
      {/* Header simple */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1b2f23]">Mis Avisos</h2>
          {!isSuperAdmin && (
            <p className="text-sm text-gray-600 mt-1">
              Estás usando <span className="font-bold text-[#16a135]">{adLimit.current}</span> de{' '}
              <span className="font-bold">{adLimit.limit}</span> avisos disponibles
            </p>
          )}
        </div>
        <button
          onClick={() => navigateTo('/publicar-v2')}
          disabled={!isSuperAdmin && adLimit.current >= adLimit.limit}
          className="bg-gradient-to-r from-[#16a135] to-[#138a2c] hover:from-[#138a2c] hover:to-[#0e7d25] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <Plus className="w-5 h-5" />
          Crear Nuevo Aviso
        </button>
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

      {/* Tabla compacta SIN fotos (optimizado para performance) */}
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
              ? 'Publicá tu primer aviso para empezar a vender'
              : `No hay avisos con estado "${filterStatus}"`}
          </p>
          {filterStatus === 'all' && adLimit.current < adLimit.limit && (
            <button
              onClick={() => navigateTo('/publicar-v2')}
              className="px-6 py-3 bg-[#16a135] text-white rounded-xl hover:bg-[#0e7d25] transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Publicar Aviso
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vistas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 line-clamp-2">{ad.title}</div>
                      {ad.location && (
                        <div className="text-xs text-gray-500 mt-1">{ad.location}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {ad.category}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-[#16a135]">
                        {ad.currency} {ad.price?.toLocaleString() || '0'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ad.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ad.status === 'active' ? 'Activo' : 'Pausado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {ad.views_count || 0} vistas
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Ver Detalle */}
                        <button
                          onClick={() => setSelectedAdForView(ad)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => setSelectedAdForEdit(ad)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Destacar */}
                        {ad.status === 'active' && (
                          <button
                            onClick={() => setSelectedAdForFeatured(ad)}
                            className={`p-2 rounded-lg transition-colors ${
                              featuredMap[ad.id]
                                ? 'text-amber-700 bg-amber-100'
                                : 'text-amber-600 hover:bg-amber-50'
                            }`}
                            title={
                              featuredMap[ad.id]
                                ? `Destacado (${featuredMap[ad.id].placement})`
                                : 'Destacar aviso'
                            }
                          >
                            <Star className={`w-4 h-4 ${featuredMap[ad.id] ? 'fill-current' : ''}`} />
                          </button>
                        )}

                        {/* Eliminar */}
                        <button
                          onClick={() => setSelectedAdForDelete(ad)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
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
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedAdForView.status === 'active' ? 'Activo' : 'Pausado'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Título</label>
                <p className="text-gray-900 font-medium">{selectedAdForView.title}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Descripción</label>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedAdForView.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Precio</label>
                  <p className="font-bold text-[#16a135]">
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
                  <label className="text-sm font-medium text-gray-500">Categoría</label>
                  <p className="text-gray-900">{selectedAdForView.category_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Subcategoría</label>
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

      {/* Modal Destacar Aviso */}
      {selectedAdForFeatured && (
        <FeaturedAdModal
          isOpen={true}
          onClose={() => setSelectedAdForFeatured(null)}
          ad={{
            id: selectedAdForFeatured.id,
            title: selectedAdForFeatured.title,
            category_id: selectedAdForFeatured.category_id || '',
            subcategory_id: selectedAdForFeatured.subcategory_id || '',
            category_name: selectedAdForFeatured.category_name || selectedAdForFeatured.category,
            images: selectedAdForFeatured.images
          }}
          onSuccess={() => {
            setSelectedAdForFeatured(null);
            notify.success('¡Aviso destacado exitosamente!');
            loadData();
          }}
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
    </div>
  );
}
