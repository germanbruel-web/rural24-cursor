/**
 * HeroCmsPanel - Panel CMS para el Hero (SuperAdmin)
 * 
 * Permite configurar:
 * - Video de YouTube (pegar link)
 * - Imagen de fondo (upload)
 * - Carousel de imágenes (gestionar hero_images)
 * - Textos del hero (título, subtítulo)
 * - Overlay (opacidad, color)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Video, Image, Type, Eye, Save, RefreshCw, Trash2, Upload,
  CheckCircle, AlertCircle, Play, Pause, Monitor, Smartphone,
  Layers, Settings2, RotateCcw, ExternalLink, Plus, GripVertical,
  ToggleLeft, ToggleRight,
} from 'lucide-react';
import {
  getHeroConfig,
  saveHeroConfig,
  resetHeroConfig,
  extractYouTubeId,
  buildYouTubeEmbedUrl,
  type HeroConfig,
  type HeroBackgroundType,
} from '../../services/heroCmsService';
import {
  getAllHeroImages,
  createHeroImage,
  updateHeroImage,
  deleteHeroImage,
  type HeroImage,
} from '../../services/heroImagesService';
import { uploadService } from '../../services/uploadService';

type TabType = 'background' | 'texts' | 'images';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const HeroCmsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('background');
  const [config, setConfig] = useState<HeroConfig | null>(null);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // ── Load data ────────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [heroConfig, images] = await Promise.all([
        getHeroConfig(),
        getAllHeroImages(),
      ]);
      setConfig(heroConfig);
      setHeroImages(images);
    } catch (error) {
      console.error('Error loading hero CMS data:', error);
      showToast('error', 'Error al cargar la configuración del Hero');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Toast ────────────────────────────────────────────────────────────
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Update config field ──────────────────────────────────────────────
  const updateField = useCallback(<K extends keyof HeroConfig>(key: K, value: HeroConfig[K]) => {
    setConfig(prev => prev ? { ...prev, [key]: value } : prev);
    setHasChanges(true);
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const result = await saveHeroConfig(config);
      if (result.success) {
        showToast('success', 'Hero actualizado correctamente');
        setHasChanges(false);
      } else {
        showToast('error', result.error || 'Error al guardar');
      }
    } catch (error) {
      showToast('error', 'Error inesperado al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────
  const handleReset = async () => {
    if (!confirm('¿Resetear la configuración del Hero a valores por defecto?')) return;
    setIsSaving(true);
    try {
      const result = await resetHeroConfig();
      if (result.success) {
        await loadData();
        showToast('success', 'Hero reseteado a valores por defecto');
        setHasChanges(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Image upload ─────────────────────────────────────────────────────
  const handleImageUpload = async (file: File) => {
    try {
      const result = await uploadService.uploadImage(file, 'hero');
      updateField('image_url', result.url);
      showToast('success', 'Imagen subida correctamente');
    } catch (error: any) {
      showToast('error', error.message || 'Error al subir imagen');
    }
  };

  // ── Hero images CRUD ─────────────────────────────────────────────────
  const handleAddHeroImage = async (file: File) => {
    try {
      const result = await uploadService.uploadImage(file, 'hero');
      const { image, error } = await createHeroImage({
        image_url: result.url,
        alt_text: file.name,
        display_order: heroImages.length,
      });
      if (error) throw error;
      setHeroImages(prev => [...prev, image!]);
      showToast('success', 'Imagen agregada al carousel');
    } catch (error: any) {
      showToast('error', error.message || 'Error al agregar imagen');
    }
  };

  const handleToggleHeroImage = async (id: string, isActive: boolean) => {
    const { error } = await updateHeroImage(id, { is_active: !isActive });
    if (!error) {
      setHeroImages(prev => prev.map(img => img.id === id ? { ...img, is_active: !isActive } : img));
    }
  };

  const handleDeleteHeroImage = async (id: string) => {
    if (!confirm('¿Eliminar esta imagen del carousel?')) return;
    const { error } = await deleteHeroImage(id);
    if (!error) {
      setHeroImages(prev => prev.filter(img => img.id !== id));
      showToast('success', 'Imagen eliminada');
    }
  };

  // ── Loading state ────────────────────────────────────────────────────
  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
        <span className="ml-3 text-gray-600">Cargando configuración del Hero...</span>
      </div>
    );
  }

  // ── Tabs ─────────────────────────────────────────────────────────────
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'background', label: 'Fondo', icon: <Layers className="w-4 h-4" /> },
    { id: 'texts', label: 'Textos', icon: <Type className="w-4 h-4" /> },
    { id: 'images', label: 'Imágenes Carousel', icon: <Image className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Hero CMS</h2>
              <p className="text-sm text-gray-500">Configurá el fondo, video e imágenes del Hero principal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
              title="Resetear a valores por defecto"
            >
              <RotateCcw className="w-4 h-4" />
              Resetear
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                hasChanges
                  ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Toast ───────────────────────────────────────────────────── */}
      {toast && (
        <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
          toast.type === 'success' ? 'bg-brand-50 text-brand-600 border border-brand-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="px-6 pt-4">
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────── */}
      <div className="p-6">
        {activeTab === 'background' && (
          <BackgroundTab config={config} updateField={updateField} onImageUpload={handleImageUpload} />
        )}
        {activeTab === 'texts' && (
          <TextsTab config={config} updateField={updateField} />
        )}
        {activeTab === 'images' && (
          <ImagesTab
            images={heroImages}
            onAddImage={handleAddHeroImage}
            onToggle={handleToggleHeroImage}
            onDelete={handleDeleteHeroImage}
          />
        )}
      </div>

      {/* ── Preview ─────────────────────────────────────────────────── */}
      <div className="px-6 pb-6">
        <PreviewSection config={config} previewMode={previewMode} setPreviewMode={setPreviewMode} />
      </div>
    </div>
  );
};

// ============================================================================
// TAB: FONDO (Video / Imagen)
// ============================================================================

interface BackgroundTabProps {
  config: HeroConfig;
  updateField: <K extends keyof HeroConfig>(key: K, value: HeroConfig[K]) => void;
  onImageUpload: (file: File) => void;
}

const BackgroundTab: React.FC<BackgroundTabProps> = ({ config, updateField, onImageUpload }) => {
  const bgTypes: { value: HeroBackgroundType; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'video', label: 'Video YouTube', icon: <Video className="w-5 h-5" />, desc: 'Video de fondo desde YouTube' },
    { value: 'image', label: 'Imagen Estática', icon: <Image className="w-5 h-5" />, desc: 'Una imagen de fondo fija' },
    { value: 'carousel', label: 'Carousel', icon: <Layers className="w-5 h-5" />, desc: 'Rotación automática de imágenes' },
  ];

  return (
    <div className="space-y-6">
      {/* Tipo de fondo */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Fondo del Hero</label>
        <p className="text-xs text-gray-500 mb-3">Elegí UNA opción. Solo una puede estar activa a la vez.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {bgTypes.map(type => {
            const isActive = config.background_type === type.value;
            return (
              <button
                key={type.value}
                onClick={() => updateField('background_type', type.value)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  isActive
                    ? 'border-brand-400 bg-brand-50 shadow-md ring-1 ring-brand-200'
                    : 'border-gray-200 hover:border-gray-300 bg-white opacity-60 hover:opacity-90'
                }`}
              >
                {/* Badge ACTIVO */}
                {isActive && (
                  <span className="absolute -top-2 -right-2 bg-brand-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    ACTIVO
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1">
                  {/* Radio visual */}
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'border-brand-400' : 'border-gray-300'
                  }`}>
                    {isActive && <div className="w-2 h-2 rounded-full bg-brand-400" />}
                  </div>
                  <div className={isActive ? 'text-brand-500' : 'text-gray-400'}>
                    {type.icon}
                  </div>
                  <span className={`font-medium text-sm ${
                    isActive ? 'text-brand-600' : 'text-gray-600'
                  }`}>
                    {type.label}
                  </span>
                </div>
                <p className={`text-xs ml-6 ${isActive ? 'text-brand-500' : 'text-gray-400'}`}>{type.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Video YouTube Config */}
      {config.background_type === 'video' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Video className="w-4 h-4 text-red-500" />
            Configuración de Video YouTube
          </h3>

          <div>
            <label className="block text-sm text-gray-600 mb-1">URL o ID del Video</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.video_url}
                onChange={(e) => updateField('video_url', e.target.value)}
                placeholder="Pegá cualquier link de YouTube (navegador, compartir, embed...)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
              />
              {config.video_url && extractYouTubeId(config.video_url) && (
                <a
                  href={`https://youtube.com/watch?v=${extractYouTubeId(config.video_url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title="Ver en YouTube"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            {config.video_url && (
              <div className="mt-2 space-y-2">
                {extractYouTubeId(config.video_url) ? (
                  <>
                    <p className="text-xs text-brand-500 flex items-center gap-1">
                      ✓ ID detectado: <code className="bg-brand-50 px-1.5 py-0.5 rounded font-mono">{extractYouTubeId(config.video_url)}</code>
                    </p>
                    <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black">
                      <img
                        src={`https://img.youtube.com/vi/${extractYouTubeId(config.video_url)}/hqdefault.jpg`}
                        alt="Video thumbnail"
                        className="w-full h-36 object-cover opacity-90"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                          <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-white ml-1" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-amber-600">⚠ No se pudo detectar un ID de video válido. Verificá la URL.</p>
                )}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Formatos aceptados: youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/..., youtube.com/embed/..., o solo el ID de 11 caracteres
            </p>
          </div>

          {/* Video options */}
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'video_autoplay' as const, label: 'Autoplay' },
              { key: 'video_muted' as const, label: 'Sin Sonido' },
              { key: 'video_loop' as const, label: 'Loop' },
            ]).map(opt => (
              <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config[opt.key] as boolean}
                  onChange={(e) => updateField(opt.key, e.target.checked)}
                  className="w-4 h-4 text-brand-500 rounded focus:ring-brand-400"
                />
                <span className="text-sm text-gray-600">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Imagen estática Config */}
      {config.background_type === 'image' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Image className="w-4 h-4 text-blue-500" />
            Imagen de Fondo
          </h3>

          {config.image_url && (
            <div className="relative rounded-lg overflow-hidden border border-gray-200">
              <img
                src={config.image_url}
                alt={config.image_alt || 'Hero background'}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => updateField('image_url', '')}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-1">URL de imagen</label>
            <input
              type="text"
              value={config.image_url}
              onChange={(e) => updateField('image_url', e.target.value)}
              placeholder="https://... o subí una imagen"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Texto alternativo (alt)</label>
            <input
              type="text"
              value={config.image_alt}
              onChange={(e) => updateField('image_alt', e.target.value)}
              placeholder="Descripción de la imagen para SEO"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <label className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-brand-50 transition-colors">
            <Upload className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Subir imagen desde tu PC</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImageUpload(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      )}

      {/* Carousel notice */}
      {config.background_type === 'carousel' && (
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Modo Carousel:</strong> Las imágenes se gestionan desde la pestaña "Imágenes Carousel".
            El hero rotará entre las imágenes activas.
          </p>
        </div>
      )}

      {/* Overlay settings */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-purple-500" />
          Overlay (Capa oscura)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Opacidad: <strong>{config.overlay_opacity}%</strong>
            </label>
            <input
              type="range"
              min="0"
              max="80"
              value={config.overlay_opacity}
              onChange={(e) => updateField('overlay_opacity', parseInt(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Transparente</span>
              <span>Oscuro</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Color del overlay</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.overlay_color}
                onChange={(e) => updateField('overlay_color', e.target.value)}
                className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.overlay_color}
                onChange={(e) => updateField('overlay_color', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TAB: TEXTOS
// ============================================================================

interface TextsTabProps {
  config: HeroConfig;
  updateField: <K extends keyof HeroConfig>(key: K, value: HeroConfig[K]) => void;
}

const TextsTab: React.FC<TextsTabProps> = ({ config, updateField }) => {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Type className="w-4 h-4 text-indigo-500" />
          Textos del Hero
        </h3>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Título Principal</label>
          <input
            type="text"
            value={config.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Encontrá lo que necesitás para tu campo"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-400"
          />
          <p className="text-xs text-gray-400 mt-1">{config.title.length}/80 caracteres</p>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Subtítulo</label>
          <textarea
            value={config.subtitle}
            onChange={(e) => updateField('subtitle', e.target.value)}
            placeholder="Miles de productos agrícolas, maquinarias y servicios..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-400 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{config.subtitle.length}/160 caracteres</p>
        </div>
      </div>

      {/* Live preview of texts */}
      <div className="p-6 bg-black rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
        <div className="relative z-10 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
            {config.title || 'Título del Hero'}
          </h1>
          <p className="text-sm md:text-base text-white/90 font-medium drop-shadow-md">
            {config.subtitle || 'Subtítulo del Hero'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TAB: IMÁGENES CAROUSEL
// ============================================================================

interface ImagesTabProps {
  images: HeroImage[];
  onAddImage: (file: File) => void;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

const ImagesTab: React.FC<ImagesTabProps> = ({ images, onAddImage, onToggle, onDelete }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    try {
      await onAddImage(file);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Imágenes del Carousel</h3>
          <p className="text-xs text-gray-500">
            {images.filter(i => i.is_active).length} activas de {images.length} total
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <label className={`flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
        isUploading ? 'border-green-400 bg-brand-50' : 'border-gray-300 hover:border-green-400 hover:bg-brand-50/50'
      }`}>
        {isUploading ? (
          <>
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
            <span className="text-sm text-brand-500 font-medium">Subiendo...</span>
          </>
        ) : (
          <>
            <Plus className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-600">Agregar imagen al carousel</span>
            <span className="text-xs text-gray-400">JPG, PNG, WebP - Máx 5MB</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isUploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = '';
          }}
        />
      </label>

      {/* Images list */}
      {images.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Image className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay imágenes en el carousel</p>
          <p className="text-xs">Subí una imagen para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`rounded-xl border-2 overflow-hidden transition-all ${
                image.is_active ? 'border-green-300 bg-brand-50/30' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="relative aspect-video">
                <img
                  src={image.image_url}
                  alt={image.alt_text || `Hero image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    image.is_active ? 'bg-brand-400 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    #{index + 1}
                  </span>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <button
                  onClick={() => onToggle(image.id, image.is_active)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors ${
                    image.is_active
                      ? 'text-brand-600 bg-brand-100 hover:bg-brand-200'
                      : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {image.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  {image.is_active ? 'Activa' : 'Inactiva'}
                </button>
                <button
                  onClick={() => onDelete(image.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Eliminar imagen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PREVIEW SECTION
// ============================================================================

interface PreviewSectionProps {
  config: HeroConfig;
  previewMode: 'desktop' | 'mobile';
  setPreviewMode: (mode: 'desktop' | 'mobile') => void;
}

const PreviewSection: React.FC<PreviewSectionProps> = ({ config, previewMode, setPreviewMode }) => {
  const videoId = extractYouTubeId(config.video_url);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Vista Previa
        </h3>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setPreviewMode('desktop')}
            className={`p-1.5 rounded-md transition-colors ${
              previewMode === 'desktop' ? 'bg-white shadow text-brand-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`p-1.5 rounded-md transition-colors ${
              previewMode === 'mobile' ? 'bg-white shadow text-brand-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`rounded-xl overflow-hidden border border-gray-200 shadow-sm mx-auto ${
        previewMode === 'mobile' ? 'max-w-sm' : 'w-full'
      }`}>
        <div className="relative bg-black" style={{ paddingBottom: previewMode === 'mobile' ? '75%' : '35%' }}>
          {/* Background */}
          {config.background_type === 'video' && videoId ? (
            <div className="absolute inset-0">
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
              </div>
            </div>
          ) : config.background_type === 'image' && config.image_url ? (
            <img
              src={config.image_url}
              alt={config.image_alt}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-700 to-emerald-900" />
          )}

          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: config.overlay_color,
              opacity: config.overlay_opacity / 100,
            }}
          />

          {/* Texts */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
            <h1 className={`font-bold text-white text-center drop-shadow-lg ${
              previewMode === 'mobile' ? 'text-lg' : 'text-2xl'
            }`}>
              {config.title}
            </h1>
            <p className={`text-white/90 text-center mt-1 drop-shadow-md ${
              previewMode === 'mobile' ? 'text-xs' : 'text-sm'
            }`}>
              {config.subtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCmsPanel;
