/**
 * BannersPanel - Gestión Profesional de Banners Homepage
 * Diseño: Agrupado por cliente, filtros avanzados, UI/UX premium
 * Solo gestiona banners funcionales: BV y BC
 */

import { useState, useEffect } from 'react';
import { Upload, Trash2, Edit, Eye, EyeOff, Plus, Save, X, Star, Users, ExternalLink, Monitor, Smartphone } from 'lucide-react';
import { notify } from '../../utils/notifications';
import { uploadService } from '../../services/uploadService';
import * as bannersService from '../../services/bannersService';
import type { Banner, BannerType } from '../../../types';

// Configuración de tipos de banner
const BANNER_TYPES = {
  homepage_vip: {
    code: 'BV',
    label: 'Banner VIP Homepage',
    description: 'Buscador dinámico - Posición principal',
    dimensions: {
      desktop: '1200x200px',
      mobile: '480x100px',
    },
    color: 'from-purple-600 to-pink-600',
    icon: '⭐',
  },
  homepage_category: {
    code: 'BC',
    label: 'Banner Categorías Homepage',
    description: 'Carruseles por categoría',
    dimensions: {
      desktop: '650x120px',
      mobile: '480x100px',
    },
    color: 'from-green-600 to-emerald-600',
    icon: '🏷️',
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
  const [filterClient, setFilterClient] = useState<string>('all');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    type: 'homepage_vip' as BannerType,
    client_name: '',
    title: '',
    image_url: '',
    link_url: '',
    category: '',
    device_target: 'desktop' as 'desktop' | 'mobile',
    is_active: true,
    display_order: 0,
    is_priority: false,
    priority_weight: 0,
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
      notify.success('✅ Imagen subida correctamente');
    } catch (error) {
      notify.error('Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.client_name.trim()) {
      notify.error('El nombre del cliente es obligatorio');
      return;
    }

    if (!formData.title || !formData.image_url) {
      notify.error('Completá título e imagen');
      return;
    }

    if (formData.type === 'homepage_category' && !formData.category) {
      notify.error('Seleccioná una categoría para BC');
      return;
    }

    try {
      if (editingBanner) {
        const { error } = await bannersService.updateBanner(editingBanner.id, formData);
        if (error) throw error;
        notify.success('✅ Banner actualizado');
      } else {
        const { error } = await bannersService.createBanner(formData);
        if (error) throw error;
        notify.success('✅ Banner creado');
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

  const resetForm = () => {
    setFormData({
      type: 'homepage_vip',
      client_name: '',
      title: '',
      image_url: '',
      link_url: '',
      category: '',
      device_target: 'desktop',
      is_active: true,
      display_order: 0,
      is_priority: false,
      priority_weight: 0,
    });
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      type: banner.type,
      client_name: banner.client_name,
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      category: banner.category || '',
      device_target: banner.device_target,
      is_active: banner.is_active,
      display_order: banner.display_order,
      is_priority: banner.is_priority || false,
      priority_weight: banner.priority_weight || 0,
    });
    setPreviewUrl(banner.image_url);
    setShowAddModal(true);
  };

  const uniqueClients = Array.from(new Set(banners.map(b => b.client_name))).sort();

  const filteredBanners = banners.filter(b => {
    const matchesType = filterType === 'all' || b.type === filterType;
    const matchesClient = filterClient === 'all' || b.client_name === filterClient;
    return matchesType && matchesClient;
  });

  const bannersByClient = filteredBanners.reduce((acc, banner) => {
    const client = banner.client_name || 'Sin cliente';
    if (!acc[client]) acc[client] = [];
    acc[client].push(banner);
    return acc;
  }, {} as Record<string, Banner[]>);

  const getRequiredDimensions = () => {
    return BANNER_TYPES[formData.type].dimensions[formData.device_target];
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎯 Gestión de Banners Homepage</h1>
          <p className="text-gray-600 mt-1">Administra banners VIP y Categorías</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
        >
          <Plus className="w-5 h-5" />
          Nuevo Banner
        </button>
      </div>

      {/* Filtros Profesionales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por Tipo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Banner</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as BannerType | 'all')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos ({banners.length})</option>
              {Object.entries(BANNER_TYPES).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.icon} {info.label} ({banners.filter(b => b.type === key).length})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Cliente */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente</label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos los clientes</option>
              {uniqueClients.map(client => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
          </div>

          {/* Estadísticas */}
          <div className="flex items-end">
            <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="text-xs text-blue-600 font-medium mb-1">Total Banners</div>
              <div className="text-2xl font-bold text-blue-900">{filteredBanners.length}</div>
              <div className="text-xs text-blue-600 mt-1">
                {filteredBanners.filter(b => b.is_active).length} activos
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Banners Agrupados por Cliente */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando banners...</p>
        </div>
      ) : Object.keys(bannersByClient).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay banners</h3>
          <p className="text-gray-500 mb-4">
            {filterType === 'all' 
              ? 'Aún no hay banners creados' 
              : 'No hay banners de este tipo'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Crear Primer Banner
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(bannersByClient).map(([clientName, clientBanners]) => (
            <div key={clientName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Cliente Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-bold text-gray-900">{clientName}</h3>
                  <span className="text-sm text-gray-500">
                    {clientBanners.length} banner{clientBanners.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Banners del Cliente */}
              <div className="divide-y divide-gray-100">
                {clientBanners.map((banner) => {
                  const typeConfig = BANNER_TYPES[banner.type];
                  return (
                    <div key={banner.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex gap-6">
                        {/* Preview Image */}
                        <div className="w-64 flex-shrink-0">
                          <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 group">
                            <img
                              src={banner.image_url}
                              alt={banner.title}
                              className="w-full h-32 object-cover"
                            />
                            {banner.link_url && (
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ExternalLink className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-center text-gray-500">
                            {typeConfig.dimensions[banner.device_target]}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-lg font-bold text-gray-900 mb-2">{banner.title}</h4>
                              <div className="flex flex-wrap gap-2">
                                {/* Tipo Badge */}
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${typeConfig.color} text-white`}>
                                  {typeConfig.icon} {typeConfig.code}
                                </span>

                                {/* Dispositivo Badge */}
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                  {banner.device_target === 'desktop' ? (
                                    <><Monitor className="w-3 h-3" /> Desktop</>
                                  ) : (
                                    <><Smartphone className="w-3 h-3" /> Mobile</>
                                  )}
                                </span>

                                {/* Estado */}
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  banner.is_active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {banner.is_active ? '✓ Activo' : '○ Inactivo'}
                                </span>

                                {/* Prioridad */}
                                {banner.is_priority && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                    <Star className="w-3 h-3 fill-current" /> Prioridad
                                  </span>
                                )}

                                {/* Categoría (solo BC) */}
                                {banner.category && (
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                    📁 {banner.category}
                                  </span>
                                )}
                              </div>

                              {banner.link_url && (
                                <div className="mt-2 text-sm text-gray-600 flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" />
                                  <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 truncate">
                                    {banner.link_url}
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(banner)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleToggleActive(banner.id, banner.is_active)}
                                className={`p-2 rounded-lg transition-colors ${
                                  banner.is_active
                                    ? 'text-green-600 hover:bg-green-50'
                                    : 'text-gray-400 hover:bg-gray-50'
                                }`}
                                title={banner.is_active ? 'Desactivar' : 'Activar'}
                              >
                                {banner.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                              </button>
                              <button
                                onClick={() => handleDelete(banner.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex gap-6 text-xs text-gray-500 mt-3">
                            <div>👁️ {banner.impressions || 0} impresiones</div>
                            <div>🖱️ {banner.clicks || 0} clicks</div>
                            {banner.impressions && banner.clicks && (
                              <div>📊 {((banner.clicks / banner.impressions) * 100).toFixed(2)}% CTR</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingBanner ? '✏️ Editar Banner' : '➕ Nuevo Banner'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingBanner(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Tipo de Banner */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de Banner *</label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(BANNER_TYPES).map(([key, info]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: key as BannerType, category: '' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.type === key
                          ? `border-green-500 bg-gradient-to-br ${info.color} text-white shadow-lg`
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-3xl mb-2">{info.icon}</div>
                      <div className={`font-bold text-sm mb-1 ${formData.type === key ? 'text-white' : 'text-gray-900'}`}>
                        {info.label}
                      </div>
                      <div className={`text-xs ${formData.type === key ? 'text-white/90' : 'text-gray-500'}`}>
                        {info.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ej: JOHN DEERE Argentina"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Los banners se agruparán por este nombre en el dashboard
                </p>
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Título del Banner *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ej: Tractores Serie 6 - Promoción Verano 2026"
                />
              </div>

              {/* Dispositivo y Categoría (si BC) */}
              <div className="grid grid-cols-2 gap-4">
                {/* Dispositivo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dispositivo *
                  </label>
                  <select
                    value={formData.device_target}
                    onChange={(e) => setFormData({ ...formData, device_target: e.target.value as 'desktop' | 'mobile' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="desktop">💻 Desktop</option>
                    <option value="mobile">📱 Mobile</option>
                  </select>
                </div>

                {/* Categoría (solo para BC) */}
                {formData.type === 'homepage_category' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Categoría *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar...</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Dimensiones requeridas */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-sm">Dimensiones requeridas</span>
                </div>
                <p className="text-sm text-blue-700">
                  <strong>{getRequiredDimensions()}</strong> - Formato JPG o WebP
                </p>
              </div>

              {/* Imagen */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Imagen del Banner *
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.webp"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  {selectedFile && (
                    <button
                      onClick={handleUploadImage}
                      disabled={uploadingImage}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {uploadingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Subir Imagen
                        </>
                      )}
                    </button>
                  )}
                </div>
                {previewUrl && (
                  <div className="mt-4 rounded-xl overflow-hidden border-2 border-gray-200">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-auto"
                    />
                  </div>
                )}
              </div>

              {/* Link URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL de Destino (opcional)
                </label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://ejemplo.com/promo"
                />
              </div>

              {/* Opciones avanzadas */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Banner activo (visible en el sitio)
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_priority"
                    checked={formData.is_priority}
                    onChange={(e) => setFormData({ ...formData, is_priority: e.target.checked })}
                    className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
                  />
                  <label htmlFor="is_priority" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-600" />
                    Banner prioritario (se muestra primero)
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end rounded-b-2xl">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingBanner(null);
                  resetForm();
                }}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
              >
                <Save className="w-5 h-5" />
                {editingBanner ? 'Actualizar Banner' : 'Crear Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
