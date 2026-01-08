import { useState, useEffect } from 'react';
import { Upload, Trash2, Edit, Eye, EyeOff, Plus, Image as ImageIcon, Save, X, ArrowUp, ArrowDown, Star } from 'lucide-react';
import { notify } from '../../utils/notifications';
import { uploadService } from '../../services/uploadService';
import * as bannersService from '../../services/bannersService';
import type { Banner, BannerType, BannerPosition } from '../../../types';

const BANNER_TYPES = {
  homepage_search: {
    label: 'Banner Buscador Dinámico',
    description: 'Homepage - Posición 1 - 6 categorías',
    dimensions: '1200x200',
    formats: 'jpg / webp',
  },
  homepage_carousel: {
    label: 'Banner Categoría Carrusel',
    description: 'Homepage - Posición 2 - 6 categorías',
    dimensions: '648x100',
    formats: 'jpg / webp',
  },
  results_intercalated: {
    label: 'Banner Resultados Intercalado',
    description: 'Resultados - Posición 3 - Cada 5 resultados (Random)',
    dimensions: '648x100',
    formats: 'jpg / webp',
  },
  results_lateral: {
    label: 'Banner Lateral Rotativo',
    description: 'Resultados - Posición 4 - Lateral derecho A-B-C-D',
    dimensions: 'Variable',
    formats: 'jpg / webp',
  },
};

const CATEGORIES = [
  'Maquinarias',
  'Ganadería',
  'Insumos Agropecuarios',
  'Inmuebles Rurales',
  'Guía del Campo',
];

export default function BannersPanel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<BannerType | 'all'>('all');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'homepage_search' as BannerType,
    title: '',
    image_url: '',
    link_url: '',
    category: '',
    position: null as BannerPosition,
    device_target: 'desktop' as 'desktop' | 'mobile',
    is_active: true,
    display_order: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await bannersService.getBanners();
      setBanners(data);
    } catch (error) {
      console.error('Error cargando banners:', error);
      notify.error('Error al cargar banners');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar formato
    if (!file.type.match(/image\/(jpeg|jpg|webp)/)) {
      notify.error('Solo se permiten imágenes JPG o WEBP');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;

    setUploadingImage(true);
    try {
      const result = await uploadService.uploadImage(selectedFile, 'banners');
      const imageUrl = typeof result === 'string' ? result : result.url;
      setFormData({ ...formData, image_url: imageUrl });
      notify.success('Imagen subida correctamente');
    } catch (error) {
      notify.error('Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.image_url) {
      notify.error('Completá los campos obligatorios');
      return;
    }

    // Validación de posición para banners laterales
    if (formData.type === 'results_lateral' && !formData.position) {
      notify.error('Seleccioná una posición (A-B-C-D) para banners laterales');
      return;
    }

    try {
      if (editingBanner) {
        const { error } = await bannersService.updateBanner(editingBanner.id, formData);
        if (error) throw error;
        notify.success('Banner actualizado');
      } else {
        const { error } = await bannersService.createBanner(formData);
        if (error) throw error;
        notify.success('Banner creado');
      }
      
      setShowAddModal(false);
      setEditingBanner(null);
      resetForm();
      loadBanners();
    } catch (error) {
      console.error('Error al guardar banner:', error);
      notify.error('Error al guardar banner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este banner?')) return;

    try {
      const { error } = await bannersService.deleteBanner(id);
      if (error) throw error;
      notify.success('Banner eliminado');
      loadBanners();
    } catch (error) {
      console.error('Error al eliminar banner:', error);
      notify.error('Error al eliminar banner');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await bannersService.toggleBannerStatus(id, !currentStatus);
      if (error) throw error;
      notify.success(currentStatus ? 'Banner desactivado' : 'Banner activado');
      loadBanners();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      notify.error('Error al cambiar estado');
    }
  };

  const handleChangeOrder = async (id: string, direction: 'up' | 'down') => {
    try {
      const banner = banners.find(b => b.id === id);
      if (!banner) return;

      const newOrder = direction === 'up' ? banner.display_order - 1 : banner.display_order + 1;
      const { error } = await bannersService.updateBannerOrder(id, newOrder);
      if (error) throw error;
      
      notify.success('Orden actualizado');
      loadBanners();
    } catch (error) {
      console.error('Error al cambiar orden:', error);
      notify.error('Error al cambiar orden');
    }
  };

  const handleTogglePriority = async (banner: Banner) => {
    try {
      const newPriorityStatus = !banner.is_priority;
      
      // Confirmar si quiere desactivar otros banners prioritarios de la misma posición
      let deselectOthers = false;
      if (newPriorityStatus) {
        const otherPriorityCount = banners.filter(
          b => b.position === banner.position && b.is_priority && b.id !== banner.id
        ).length;

        if (otherPriorityCount > 0) {
          deselectOthers = window.confirm(
            `Ya hay ${otherPriorityCount} banner(s) prioritario(s) en esta posición.\n\n` +
            `¿Deseas desactivar los otros y dejar solo este como prioritario?\n\n` +
            `• SÍ = Solo este banner será prioritario (recomendado)\n` +
            `• NO = Múltiples banners prioritarios competirán por prioridad`
          );
        }
      }

      const { error } = await bannersService.toggleBannerPriority(
        banner.id, 
        newPriorityStatus,
        100, // Priority weight por defecto
        deselectOthers
      );

      if (error) throw error;

      notify.success(
        newPriorityStatus 
          ? '⭐ Banner marcado como PRIORITARIO - Se mostrará primero en homepage'
          : 'Banner desmarcado como prioritario - Rotación random activada'
      );
      loadBanners();
    } catch (error) {
      console.error('Error al cambiar prioridad:', error);
      notify.error('Error al cambiar prioridad');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'homepage_search',
      title: '',
      image_url: '',
      link_url: '',
      category: '',
      position: null,
      device_target: 'desktop',
      is_active: true,
      display_order: 0,
    });
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      type: banner.type,
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      category: banner.category || '',
      position: banner.position || null,
      device_target: (banner.device_target === 'both' ? 'desktop' : banner.device_target) || 'desktop',
      is_active: banner.is_active,
      display_order: banner.display_order,
    });
    setPreviewUrl(banner.image_url);
    setShowAddModal(true);
  };

  const filteredBanners = filterType === 'all' 
    ? banners 
    : banners.filter(b => b.type === filterType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Banners</h1>
          <p className="text-gray-600 mt-1">Administra los banners del sitio</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#0e7d25] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Banner
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por tipo:</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-[#16a135] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({banners.length})
          </button>
          {Object.entries(BANNER_TYPES).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setFilterType(key as BannerType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === key
                  ? 'bg-[#16a135] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {info.label} ({banners.filter(b => b.type === key).length})
            </button>
          ))}
        </div>
      </div>

      {/* Banners List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a135] mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando banners...</p>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay banners</h3>
          <p className="text-gray-500 mb-4">
            {filterType === 'all' 
              ? 'Aún no hay banners creados. ¡Crea el primero!' 
              : 'No hay banners de este tipo.'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#0e7d25] transition-colors"
          >
            Crear Banner
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBanners.map((banner) => (
            <div
              key={banner.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="w-48 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{banner.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {BANNER_TYPES[banner.type].label}
                        </span>
                        {banner.category && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            {banner.category}
                          </span>
                        )}
                        {banner.position && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                            Pos. {banner.position}
                          </span>
                        )}
                        {banner.is_priority && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            PRIORITARIO
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          banner.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {banner.is_active ? '✓ Activo' : '✗ Inactivo'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePriority(banner)}
                        className={`p-2 rounded-lg transition-colors ${
                          banner.is_priority
                            ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-yellow-600'
                        }`}
                        title={banner.is_priority ? 'Desmarcar como prioritario' : 'Marcar como prioritario (se mostrará primero)'}
                      >
                        <Star className={`w-4 h-4 ${banner.is_priority ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleChangeOrder(banner.id, 'up')}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Subir orden"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleChangeOrder(banner.id, 'down')}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Bajar orden"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(banner.id, banner.is_active)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={banner.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {banner.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(banner)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {BANNER_TYPES[banner.type].description}
                  </p>
                  <p className="text-xs text-gray-500">
                    📏 {BANNER_TYPES[banner.type].dimensions} • {BANNER_TYPES[banner.type].formats}
                  </p>
                  {banner.link_url && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      🔗 {banner.link_url}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingBanner ? 'Editar Banner' : 'Nuevo Banner'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingBanner(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipo de Banner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Banner *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as BannerType })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                >
                  {Object.entries(BANNER_TYPES).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.label} - {info.dimensions}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {BANNER_TYPES[formData.type].description}
                </p>
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                  placeholder="Nombre descriptivo del banner"
                />
              </div>

              {/* Categoría (opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría (opcional)
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                >
                  <option value="">Todas las categorías</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Posición (solo para lateral) */}
              {formData.type === 'results_lateral' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posición Lateral *
                  </label>
                  <select
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value as BannerPosition })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                  >
                    <option value="">Seleccionar posición</option>
                    <option value="A">A - Primera posición</option>
                    <option value="B">B - Segunda posición</option>
                    <option value="C">C - Tercera posición</option>
                    <option value="D">D - Cuarta posición</option>
                  </select>
                </div>
              )}

              {/* Dispositivo Objetivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dispositivo Objetivo *
                </label>
                <select
                  value={formData.device_target}
                  onChange={(e) => setFormData({ ...formData, device_target: e.target.value as 'desktop' | 'mobile' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                >
                  <option value="desktop">💻 Desktop (1200x200px)</option>
                  <option value="mobile">📱 Mobile (480x100px)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Desktop y Mobile requieren tamaños de imagen diferentes
                </p>
              </div>

              {/* Imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen * ({BANNER_TYPES[formData.type].dimensions} - {BANNER_TYPES[formData.type].formats})
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.webp"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  {selectedFile && (
                    <button
                      onClick={handleUploadImage}
                      disabled={uploadingImage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? 'Subiendo...' : 'Subir Imagen'}
                    </button>
                  )}
                </div>
                {previewUrl && (
                  <div className="mt-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>

              {/* Link URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de destino (opcional)
                </label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              {/* Estado activo */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#16a135] rounded focus:ring-[#16a135]"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Banner activo
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingBanner(null);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#0e7d25] transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingBanner ? 'Actualizar' : 'Crear'} Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
