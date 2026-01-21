import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Play, 
  Pause, 
  Image as ImageIcon,
  ExternalLink,
  Calendar,
  User
} from 'lucide-react';
import type { BannerClean, CreateBannerCleanInput, BannerPlacement } from '@/types';
import {
  getAllBannersClean,
  createBannerClean,
  updateBannerClean,
  deleteBannerClean,
  toggleBannerCleanActive
} from '@/services/bannersCleanService';
import { supabase } from '@/services/supabaseClient';
import { ImageUploader } from './ImageUploader';

// ====================================
// TIPOS LOCALES
// ====================================

interface BannerFormData {
  placement: BannerPlacement;
  category: string;
  client_name: string;
  link_url: string;
  desktop_image_url: string;
  mobile_image_url: string;
  carousel_image_url: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
}

const INITIAL_FORM: BannerFormData = {
  placement: 'hero_vip',
  category: 'all',
  client_name: '',
  link_url: '',
  desktop_image_url: '',
  mobile_image_url: '',
  carousel_image_url: '',
  starts_at: '',
  expires_at: '',
  is_active: true
};

// Categorías reales del sistema (SINCRONIZADO con tabla categories en BD)
// Los values deben coincidir EXACTAMENTE con los nombres en la BD
const CATEGORIES = [
  { value: 'all', label: 'Todas las Categorías' },
  { value: 'MAQUINARIAS AGRICOLAS', label: 'Maquinarias Agrícolas' },
  { value: 'GANADERIA', label: 'Ganadería' },
  { value: 'INSUMOS AGROPECUARIOS', label: 'Insumos Agropecuarios' },
  { value: 'INMUEBLES RURALES', label: 'Inmuebles Rurales' },
  { value: 'SERVICIOS RURALES', label: 'Servicios Rurales' }
];

const PLACEMENTS = [
  { value: 'hero_vip' as BannerPlacement, label: 'Hero VIP', desc: '1 por categoría (Desktop 1200x200 + Mobile 480x100)' },
  { value: 'category_carousel' as BannerPlacement, label: 'Carrusel Categorías', desc: '4 por categoría (650x100 responsive)' }
];

// ====================================
// COMPONENTE PRINCIPAL
// ====================================

export default function BannersCleanPanel() {
  const [banners, setBanners] = useState<BannerClean[]>([]);
  const [filteredBanners, setFilteredBanners] = useState<BannerClean[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerClean | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(INITIAL_FORM);

  // Filtros
  const [filterPlacement, setFilterPlacement] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Cargar banners
  useEffect(() => {
    loadBanners();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...banners];

    if (filterPlacement !== 'all') {
      filtered = filtered.filter(b => b.placement === filterPlacement);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(b => b.category === filterCategory);
    }

    if (filterStatus === 'active') {
      filtered = filtered.filter(b => b.is_active);
    } else if (filterStatus === 'paused') {
      filtered = filtered.filter(b => !b.is_active);
    }

    setFilteredBanners(filtered);
  }, [banners, filterPlacement, filterCategory, filterStatus]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await getAllBannersClean();
      setBanners(data);
    } catch (error) {
      console.error('Error cargando banners:', error);
      alert('Error cargando banners');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBanner(null);
    setFormData(INITIAL_FORM);
    setShowModal(true);
  };

  const handleEdit = (banner: BannerClean) => {
    setEditingBanner(banner);
    
    setFormData({
      placement: banner.placement,
      category: banner.category,
      client_name: banner.client_name || '',
      link_url: banner.link_url || '',
      desktop_image_url: banner.desktop_image_url || '',
      mobile_image_url: banner.mobile_image_url || '',
      carousel_image_url: banner.carousel_image_url || '',
      starts_at: banner.starts_at || '',
      expires_at: banner.expires_at || '',
      is_active: banner.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (banner: BannerClean) => {
    if (!confirm(`¿Eliminar banner de "${banner.client_name}"?`)) return;

    try {
      await deleteBannerClean(banner.id);
      await loadBanners();
    } catch (error) {
      console.error('Error eliminando:', error);
      alert('Error eliminando banner');
    }
  };

  const handleToggleActive = async (banner: BannerClean) => {
    try {
      await toggleBannerCleanActive(banner.id, !banner.is_active);
      await loadBanners();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error cambiando estado');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.client_name.trim()) {
      alert('El nombre del cliente es requerido');
      return;
    }

    if (formData.placement === 'hero_vip') {
      if (!formData.desktop_image_url.trim() || !formData.mobile_image_url.trim()) {
        alert('Hero VIP requiere imagen Desktop (1200x200) y Mobile (480x100)');
        return;
      }
    } else {
      if (!formData.carousel_image_url.trim()) {
        alert('Carrusel requiere imagen (650x100)');
        return;
      }
    }

    try {
      const input: CreateBannerCleanInput = {
        placement: formData.placement,
        category: formData.category,
        client_name: formData.client_name,
        link_url: formData.link_url || undefined,
        desktop_image_url: formData.desktop_image_url || undefined,
        mobile_image_url: formData.mobile_image_url || undefined,
        carousel_image_url: formData.carousel_image_url || undefined,
        starts_at: formData.starts_at || undefined,
        expires_at: formData.expires_at || undefined,
        is_active: formData.is_active
      };

      if (editingBanner) {
        await updateBannerClean(editingBanner.id, input);
      } else {
        await createBannerClean(input);
      }

      setShowModal(false);
      await loadBanners();
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error guardando banner');
    }
  };

  // ====================================
  // RENDER
  // ====================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestor de Banners</h1>
              <p className="text-gray-600 mt-1">Sistema limpio y profesional</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-[#16a135] text-white px-4 py-2 rounded-lg hover:bg-[#138a2c] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Banner
            </button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Banner
              </label>
              <select
                value={filterPlacement}
                onChange={(e) => setFilterPlacement(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">Todos</option>
                <option value="hero_vip">Hero VIP</option>
                <option value="category_carousel">Carrusel Categorías</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="paused">Pausados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600">Cargando banners...</p>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay banners creados</p>
            <button
              onClick={handleCreate}
              className="mt-4 text-[#16a135] hover:underline"
            >
              Crear el primer banner
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Categoría</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cliente</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Imágenes</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stats</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBanners.map(banner => (
                  <tr key={banner.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {banner.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        banner.placement === 'hero_vip' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {banner.placement === 'hero_vip' ? 'Hero VIP' : 'Carrusel'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {CATEGORIES.find(c => c.value === banner.category)?.label || banner.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {banner.client_name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-1">
                        {banner.desktop_image_url && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            Desktop
                          </span>
                        )}
                        {banner.mobile_image_url && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            Mobile
                          </span>
                        )}
                        {banner.carousel_image_url && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            Carousel
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        banner.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {banner.is_active ? 'Activo' : 'Pausado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {banner.impressions || 0} imp / {banner.clicks || 0} clicks
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(banner)}
                          className={`p-1.5 rounded transition-colors ${
                            banner.is_active
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={banner.is_active ? 'Pausar' : 'Activar'}
                        >
                          {banner.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(banner)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
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
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="border-b p-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingBanner ? 'Editar Banner' : 'Crear Nuevo Banner'}
                </h2>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Tipo de Banner */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Banner *
                  </label>
                  <div className="space-y-2">
                    {PLACEMENTS.map(place => (
                      <label key={place.value} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="placement"
                          value={place.value}
                          checked={formData.placement === place.value}
                          onChange={(e) => setFormData({ ...formData, placement: e.target.value as BannerPlacement })}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{place.label}</div>
                          <div className="text-sm text-gray-600">{place.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Ej: Concesionario Rural24"
                    required
                  />
                </div>

                {/* URL Externa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Externa (opcional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="https://ejemplo.com"
                    />
                    {formData.link_url && (
                      <a
                        href={formData.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Probar link"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                  {formData.link_url && (
                    <p className="mt-2 text-xs text-gray-500">
                      🌐 El banner redirigirá a: <span className="font-mono text-blue-600">{formData.link_url}</span>
                    </p>
                  )}
                </div>

                {/* Imágenes según tipo - PROFESIONAL */}
                {formData.placement === 'hero_vip' ? (
                  <div className="space-y-4">
                    <ImageUploader
                      value={formData.desktop_image_url}
                      onChange={(url) => setFormData({ ...formData, desktop_image_url: url })}
                      label="Imagen Desktop *"
                      requiredWidth={1200}
                      requiredHeight={200}
                      maxSizeMB={2}
                    />
                    <ImageUploader
                      value={formData.mobile_image_url}
                      onChange={(url) => setFormData({ ...formData, mobile_image_url: url })}
                      label="Imagen Mobile *"
                      requiredWidth={480}
                      requiredHeight={100}
                      maxSizeMB={2}
                    />
                  </div>
                ) : (
                  <ImageUploader
                    value={formData.carousel_image_url}
                    onChange={(url) => setFormData({ ...formData, carousel_image_url: url })}
                    label="Imagen Carousel *"
                    requiredWidth={650}
                    requiredHeight={100}
                    maxSizeMB={2}
                  />
                )}

                {/* Fechas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Inicio
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Expiración
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                {/* Estado */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Banner activo</span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t p-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#138a2c]"
                >
                  {editingBanner ? 'Guardar Cambios' : 'Crear Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
