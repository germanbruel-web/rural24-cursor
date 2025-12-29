import { useState, useEffect } from 'react';
import {
  getAllAdsByRole,
  deleteAd,
  toggleAdStatus,
  toggleFeatured,
} from '../../services/adsService';
import type { Ad } from '../../../types';
import { Edit, Trash2, Eye, EyeOff, Star, StarOff } from 'lucide-react';
import { notify } from '../../utils/notifications';

export default function PremiumAdsPanel() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = ['all', 'Maquinaria', 'Ganadería', 'Insumos', 'Inmuebles', 'Servicios', 'Equipos'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const adsData = await getAllAdsByRole({ userRole: 'premium' });
      console.log('📋 Avisos PREMIUM cargados:', adsData.length);
      setAds(adsData);
    } catch (error) {
      console.error('Error loading premium ads:', error);
      notify.error('Error al cargar avisos Premium');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este aviso Premium?')) return;
    
    try {
      const { error } = await deleteAd(id);
      if (error) throw new Error(error);
      notify.success('Aviso eliminado');
      loadData();
    } catch (error: any) {
      notify.error(error.message || 'Error al eliminar');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const { error } = await toggleAdStatus(id);
      if (error) throw new Error(error.message);
      notify.success('Estado actualizado');
      loadData();
    } catch (error: any) {
      notify.error(error.message || 'Error al cambiar estado');
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      const { error } = await toggleFeatured(id);
      if (error) throw new Error(error.message);
      notify.success('Destacado actualizado');
      loadData();
    } catch (error: any) {
      notify.error(error.message || 'Error al cambiar featured');
    }
  };

  const filteredAds = categoryFilter === 'all' 
    ? ads 
    : ads.filter(ad => ad.category === categoryFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a135] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando avisos Premium...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#1b2f23]">AVISOS PREMIUM</h2>
        <p className="text-sm text-gray-600 mt-1">
          Gestión de avisos de usuarios Premium ({filteredAds.length} avisos)
        </p>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por categoría</label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'Todas las categorías' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Ads List */}
      {filteredAds.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">No hay avisos Premium {categoryFilter !== 'all' && `en la categoría ${categoryFilter}`}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAds.map((ad) => (
            <div key={ad.id} className="bg-white rounded-lg shadow-sm border-2 border-yellow-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* Image */}
                {ad.images?.[0] && (
                  <img
                    src={ad.images[0]}
                    alt={ad.title}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{ad.title}</h3>
                        <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded text-xs font-bold">
                          ⭐ PREMIUM
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {ad.category || 'Sin categoría'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          ad.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {ad.status === 'active' ? 'Activo' : 'Pausado'}
                        </span>
                        {ad.featured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                            🏆 Destacado en Homepage
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ad.description}</p>
                      <div className="text-sm text-gray-500">
                        {ad.location && <span>📍 {ad.location}</span>}
                        {ad.price && <span className="ml-4">💰 ${ad.price.toLocaleString()}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleToggleStatus(ad.id)}
                        className="p-2 text-gray-600 hover:text-[#16a135] hover:bg-gray-100 rounded-lg transition-colors"
                        title={ad.status === 'active' ? 'Pausar' : 'Activar'}
                      >
                        {ad.status === 'active' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleToggleFeatured(ad.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          ad.featured 
                            ? 'text-yellow-600 hover:bg-yellow-50' 
                            : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                        }`}
                        title={ad.featured ? 'Quitar de homepage' : 'Destacar en homepage'}
                      >
                        {ad.featured ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => window.location.hash = `#/publicar-v2?edit=${ad.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de edición removido - ahora se navega a #/publicar-v2?edit={id} */}
    </div>
  );
}
