import { useState, useEffect } from 'react';
import { Upload, Trash2, Edit, Eye, EyeOff, Plus, Image as ImageIcon, Save, X, Star, Users, ExternalLink, ArrowUp, ArrowDown, Monitor, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
import { notify } from '../../utils/notifications';
import { uploadService } from '../../services/uploadService';
import * as bannersService from '../../services/bannersService';
import type { Banner, BannerType } from '../../../types';

// Configuración de tipos de banner (escalable para múltiples ubicaciones)
const BANNER_TYPES = {
  homepage_vip: {
    code: 'BV',
    label: 'Banner VIP Homepage',
    description: 'Hero principal - Rotación automática',
    dimensions: {
      desktop: '1200x200px',
      mobile: '480x100px',
    },
    location: 'homepage',
    color: 'from-purple-600 to-pink-600',
    icon: '⭐',
  },
  homepage_category: {
    code: 'BC',
    label: 'Banner Categorías Homepage',
    description: 'Carruseles por categoría - Secciones destacadas',
    dimensions: {
      desktop: '650x120px',
      mobile: '480x100px',
    },
    location: 'homepage',
    color: 'from-green-600 to-emerald-600',
    icon: '🏷️',
  },
  results_lateral: {
    code: 'RL',
    label: 'Banner Lateral Resultados',
    description: 'Sidebar sticky - Visible durante scroll',
    dimensions: {
      desktop: '300x600px',
      mobile: '320x100px',
    },
    location: 'results',
    color: 'from-blue-600 to-cyan-600',
    icon: '📌',
  },
  results_intercalated: {
    code: 'RI',
    label: 'Banner Intercalado Resultados',
    description: 'Entre cards - Cada 8 resultados (2 filas)',
    dimensions: {
      desktop: '648x100px',
      mobile: '320x100px',
    },
    location: 'results',
    color: 'from-orange-600 to-red-600',
    icon: '🔄',
  },
};

const CATEGORIES = [
  'Maquinarias',
  'Ganadería',
  'Insumos Agropecuarios',
  'Inmuebles Rurales',
  'Servicios Rurales',
];

export default function BannersPanel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'homepage' | 'results'>('homepage');
  const [filterType, setFilterType] = useState<BannerType | 'all'>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
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
    is_featured: false,
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

  // Función para extraer nombre del cliente desde filename
  const extractClientFromFilename = (filename: string): string => {
    // Remover extensión y limpiar caracteres especiales
    const cleanName = filename
      .replace(/\.[^/.]+$/, '') // Eliminar extensión
      .replace(/[-_]/g, ' ')    // Reemplazar guiones/underscores con espacios
      .replace(/\d+/g, '')      // Eliminar números (dimensiones, timestamps)
      .trim()
      .split(' ')
      .filter(word => word.length > 2) // Eliminar palabras muy cortas
      .slice(0, 3) // Tomar primeras 3 palabras
      .join(' ');
    
    return cleanName || 'Banner sin cliente';
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
    
    // Auto-poblar client_name desde filename
    const clientName = extractClientFromFilename(file.name);
    setFormData(prev => ({ ...prev, client_name: clientName }));
    
    console.log('📝 Cliente extraído del filename:', clientName);
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;

    setUploadingImage(true);
    try {
      const result = await uploadService.uploadImage(selectedFile, 'banners');
      const imageUrl = typeof result === 'string' ? result : result.url;
      console.log('📸 Imagen subida:', imageUrl);
      
      // Auto-generar title descriptivo: "[BV] Distribuidoraz - Desktop - 10/01/2026"
      const bannerTypeCode = BANNER_TYPES[formData.type].code;
      const deviceLabel = formData.device_target === 'desktop' ? 'Desktop' : 'Mobile';
      const dimensions = BANNER_TYPES[formData.type].dimensions[formData.device_target];
      const date = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const autoTitle = `[${bannerTypeCode}] ${formData.client_name} - ${deviceLabel} (${dimensions}) - ${date}`;
      
      setFormData(prev => {
        const updated = { 
          ...prev, 
          image_url: imageUrl,
          title: autoTitle // Auto-generar título
        };
        console.log('🔄 FormData actualizado:', updated);
        return updated;
      });
      notify.success('✅ Imagen subida a Cloudinary: Home/banners/');
    } catch (error) {
      console.error('❌ Error subiendo imagen:', error);
      notify.error('Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    // ✅ Validaciones profesionales y consistentes
    console.log('🔍 Validando formData:', formData);
    
    // 1. Tipo de banner (campo requerido por sistema)
    if (!formData.type) {
      notify.error('❌ El tipo de banner es obligatorio');
      return;
    }

    // 2. Nombre del cliente - AUTO-GENERADO (fallback si vacío)
    const finalClientName = formData.client_name.trim() || 'Banner sin cliente';
    
    // 3. Título descriptivo - AUTO-GENERADO (fallback si vacío)
    const finalTitle = formData.title.trim() || `Banner ${BANNER_TYPES[formData.type].label} - ${formData.device_target}`;

    // 4. Imagen (campo obligatorio NOT NULL en DB)
    console.log('📸 Validando image_url:', { 
      value: formData.image_url, 
      length: formData.image_url?.length,
      trimmed: formData.image_url?.trim()
    });
    if (!formData.image_url || !formData.image_url.trim()) {
      notify.error('❌ Debes subir una imagen para el banner');
      return;
    }

    // 5. Categoría OBLIGATORIA para todos los tipos
    if (!formData.category || !formData.category.trim()) {
      notify.error('❌ La categoría es obligatoria para todos los banners');
      return;
    }

    // 7. Validar formato de URL si está presente (opcional pero debe ser válida)
    if (formData.link_url && formData.link_url.trim()) {
      try {
        new URL(formData.link_url);
      } catch {
        notify.error('❌ La URL de destino no es válida (debe comenzar con http:// o https://)');
        return;
      }
    }

    // 8. Validar dimensiones según tipo y dispositivo
    const requiredDimensions = getRequiredDimensions();
    console.log(`📏 Dimensiones requeridas: ${requiredDimensions} para ${formData.type} (${formData.device_target})`);
    
    // Notificación informativa (no bloquea)
    if (!editingBanner) {
      notify.info(`📐 Asegúrate que la imagen tenga ${requiredDimensions}`, { duration: 5000 });
    }

    // Preparar datos finales con fallbacks
    const finalFormData = {
      ...formData,
      client_name: finalClientName,
      title: finalTitle,
      category: formData.category || null,
    };

    console.log('📤 Datos finales a enviar:', finalFormData);

    try {
      if (editingBanner) {
        const { error } = await bannersService.updateBanner(editingBanner.id, finalFormData);
        if (error) throw error;
        notify.success('✅ Banner actualizado correctamente');
      } else {
        const { error } = await bannersService.createBanner(finalFormData);
        if (error) throw error;
        notify.success('✅ Banner creado correctamente');
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
      
      // Confirmar si quiere desactivar otros banners prioritarios del mismo tipo
      let deselectOthers = false;
      if (newPriorityStatus) {
        const otherPriorityCount = banners.filter(
          b => b.type === banner.type && b.is_priority && b.id !== banner.id
        ).length;

        if (otherPriorityCount > 0) {
          deselectOthers = window.confirm(
            `Ya hay ${otherPriorityCount} banner(s) prioritario(s) de tipo ${BANNER_TYPES[banner.type].label}.\n\n` +
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

  // Obtener lista única de clientes para filtro
  const uniqueClients = Array.from(new Set(banners.map(b => b.client_name))).sort();

  // Filtrar banners por tab activo
  const bannersInActiveTab = banners.filter(b => {
    const location = BANNER_TYPES[b.type]?.location;
    return location === activeTab;
  });

  // Agrupar banners por tipo dentro del tab activo
  const bannersByType = bannersInActiveTab.reduce((acc, banner) => {
    if (!acc[banner.type]) {
      acc[banner.type] = [];
    }
    acc[banner.type].push(banner);
    return acc;
  }, {} as Record<string, Banner[]>);

  // Obtener dimensiones requeridas según tipo y dispositivo
  const getRequiredDimensions = () => {
    const config = BANNER_TYPES[formData.type];
    return config.dimensions[formData.device_target];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Banners</h1>
          <p className="text-gray-600 mt-1">Administra los banners del sitio por ubicación</p>
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

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('homepage')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'homepage'
                ? 'text-[#16a135] border-b-2 border-[#16a135] bg-green-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">🏠</span>
              <span>Homepage</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200">
                {banners.filter(b => BANNER_TYPES[b.type]?.location === 'homepage').length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'results'
                ? 'text-[#16a135] border-b-2 border-[#16a135] bg-green-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">📄</span>
              <span>Página Resultados</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200">
                {banners.filter(b => BANNER_TYPES[b.type]?.location === 'results').length}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Banners List by Groups */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a135] mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando banners...</p>
        </div>
      ) : bannersInActiveTab.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay banners en {activeTab === 'homepage' ? 'Homepage' : 'Página de Resultados'}</h3>
          <p className="text-gray-500 mb-4">
            Crea tu primer banner para esta ubicación
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
        <div className="space-y-6">
          {/* Renderizar grupos por tipo */}
          {Object.entries(bannersByType).map(([type, bannersOfType]) => {
            const typeConfig = BANNER_TYPES[type as BannerType];
            if (!typeConfig) return null;

            return (
              <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Group Header */}
                <div className={`bg-gradient-to-r ${typeConfig.color} px-6 py-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="text-2xl">{typeConfig.icon}</span>
                        {typeConfig.label}
                      </h2>
                      <p className="text-white/90 text-sm mt-1">{typeConfig.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{bannersOfType.length}</div>
                      <div className="text-sm text-white/90">banner{bannersOfType.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>

                {/* Banners Grid */}
                <div className="p-6 grid gap-4">
                  {bannersOfType.map((banner) => (
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
                    📏 Desktop: {BANNER_TYPES[banner.type].dimensions.desktop} • Mobile: {BANNER_TYPES[banner.type].dimensions.mobile}
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
              </div>
            );
          })}
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
              {/* Tipo de Banner - OBLIGATORIO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Banner <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value as BannerType;
                    // Auto-limpiar categoría si cambia a homepage_vip
                    if (newType === 'homepage_vip') {
                      setFormData({ ...formData, type: newType, category: '' });
                    } else {
                      setFormData({ ...formData, type: newType });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                  required
                >
                  {Object.entries(BANNER_TYPES).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.icon} {info.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {BANNER_TYPES[formData.type].description}
                </p>
              </div>

              {/* Nombre del Cliente - AUTO-GENERADO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent bg-gray-50"
                  placeholder="Se extrae automáticamente del nombre del archivo"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  🤖 Auto-extraído del filename al seleccionar imagen
                </p>
              </div>

              {/* Categoría - OBLIGATORIA para TODOS los tipos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  ✅ Requerida para segmentar por categoría (incluso Banner VIP)
                </p>
              </div>

              {/* Banner Destacado (Estrella) */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured || false}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-5 h-5 text-yellow-500 border-yellow-300 rounded focus:ring-2 focus:ring-yellow-400"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <span className="text-xl">⭐</span>
                      <span>Banner Destacado</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Aparece predeterminadamente en la sección correspondiente
                    </p>
                  </div>
                </label>
              </div>

              {/* Dispositivo Objetivo - OBLIGATORIO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dispositivo Objetivo <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, device_target: 'desktop' })}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.device_target === 'desktop'
                        ? 'border-[#16a135] bg-green-50 text-[#16a135] font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Monitor className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-sm">Desktop</div>
                    <div className="text-xs text-gray-500">{BANNER_TYPES[formData.type].dimensions.desktop}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, device_target: 'mobile' })}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.device_target === 'mobile'
                        ? 'border-[#16a135] bg-green-50 text-[#16a135] font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-sm">Mobile</div>
                    <div className="text-xs text-gray-500">{BANNER_TYPES[formData.type].dimensions.mobile}</div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  📐 Cada dispositivo requiere dimensiones específicas
                </p>
              </div>

              {/* Imagen - OBLIGATORIA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen del Banner <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.webp"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#16a135] file:text-white hover:file:bg-[#0e7d25] file:cursor-pointer"
                  />
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleUploadImage}
                      disabled={uploadingImage}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingImage ? 'Subiendo imagen...' : 'Subir Imagen a Cloudinary'}
                    </button>
                  )}
                </div>
                {previewUrl && (
                  <div className="mt-4 border-2 border-gray-200 rounded-lg p-2">
                    <p className="text-xs text-gray-600 mb-2">Vista previa:</p>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Link URL - OPCIONAL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Destino <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                  placeholder="https://ejemplo.com/landing-page"
                />
                <p className="text-xs text-gray-500 mt-1">
                  🔗 Página donde se redirige al hacer clic (opcional)
                </p>
              </div>

              {/* Estado Activo */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-[#16a135] rounded focus:ring-[#16a135]"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                  ✅ Banner activo y visible en el sitio
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
