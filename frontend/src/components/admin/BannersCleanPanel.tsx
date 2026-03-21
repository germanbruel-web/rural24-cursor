import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Play,
  Pause,
  Image as ImageIcon,
  ExternalLink,
  AlertCircle,
  Eye,
  X,
  Loader2
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
  link_target: '_self' | '_blank';
  desktop_image_url: string;
  mobile_image_url: string;
  carousel_image_url: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
}

interface Toast {
  id: number;
  type: 'error' | 'success';
  message: string;
}

interface CategoryOption {
  value: string;
  label: string;
}

// ====================================
// CONSTANTES
// ====================================

const INITIAL_FORM: BannerFormData = {
  placement: 'hero_vip',
  category: 'all',
  client_name: '',
  link_url: '',
  link_target: '_blank',
  desktop_image_url: '',
  mobile_image_url: '',
  carousel_image_url: '',
  starts_at: '',
  expires_at: '',
  is_active: true
};

const ALL_categories_OPTION: CategoryOption = { value: 'all', label: 'Todas las Categorías' };

const PLACEMENTS = [
  { value: 'hero_vip' as BannerPlacement, label: 'Hero VIP', desc: '1 por categoría (Desktop 1100x200 + Mobile 480x100)' },
  { value: 'category_carousel' as BannerPlacement, label: 'Carrusel Categorías', desc: '4 por categoría (650x100 responsive)' },
  { value: 'results_intercalated' as BannerPlacement, label: 'Intercalado Resultados', desc: 'Entre productos cada 8 cards (650x100)' },
  { value: 'results_below_filter' as BannerPlacement, label: 'Debajo del Filtro', desc: 'Sticky bajo filtros (280x250)' }
];

// ====================================
// HELPERS
// ====================================

/** Inserta transformación Cloudinary para miniatura 100x50 */
function cloudinaryThumb(url: string): string {
  return url.replace('/upload/', '/upload/w_100,h_50,c_fill,g_auto,f_auto/');
}

/** Primer URL de imagen disponible en el banner */
function getBannerPreviewUrl(banner: BannerClean): string | null {
  return banner.desktop_image_url || banner.carousel_image_url || banner.mobile_image_url || null;
}

/** Todas las URLs de imágenes del banner (para quick view) */
function getBannerImages(banner: BannerClean): { label: string; url: string }[] {
  const imgs: { label: string; url: string }[] = [];
  if (banner.desktop_image_url) imgs.push({ label: 'Desktop', url: banner.desktop_image_url });
  if (banner.mobile_image_url) imgs.push({ label: 'Mobile', url: banner.mobile_image_url });
  if (banner.carousel_image_url) imgs.push({ label: 'Carousel', url: banner.carousel_image_url });
  return imgs;
}

/** UTC ISO → valor para datetime-local (TZ local del browser) */
function toLocalDatetimeInput(isoString: string | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

/** datetime-local value → UTC ISO para Supabase */
function fromLocalDatetimeInput(localStr: string): string | undefined {
  if (!localStr) return undefined;
  return new Date(localStr).toISOString();
}

type ExpiryStatus = 'expired' | 'warning' | null;

function getExpiryStatus(expires_at: string | undefined): ExpiryStatus {
  if (!expires_at) return null;
  const diffDays = (new Date(expires_at).getTime() - Date.now()) / 86_400_000;
  if (diffDays < 0) return 'expired';
  if (diffDays <= 7) return 'warning';
  return null;
}

let toastCounter = 0;

// ====================================
// SUBCOMPONENTE: TOAST
// ====================================

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium min-w-[260px] ${
            t.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-brand-600 text-white'
          }`}
        >
          {t.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="shrink-0 opacity-75 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ====================================
// SUBCOMPONENTE: EXPIRY BADGE
// ====================================

function ExpiryBadge({ expires_at }: { expires_at: string | undefined }) {
  const status = getExpiryStatus(expires_at);
  if (!status) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ml-1 ${
      status === 'expired'
        ? 'bg-red-100 text-red-700'
        : 'bg-amber-100 text-amber-700'
    }`}>
      <AlertCircle className="w-3 h-3" />
      {status === 'expired' ? 'Vencido' : 'Vence pronto'}
    </span>
  );
}

// ====================================
// SUBCOMPONENTE: QUICK VIEW MODAL
// ====================================

function QuickViewModal({ banner, onClose }: { banner: BannerClean; onClose: () => void }) {
  const images = getBannerImages(banner);
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{banner.client_name}</h3>
            <p className="text-sm text-gray-500">
              {PLACEMENTS.find(p => p.value === banner.placement)?.label} — {banner.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {images.length === 0 && (
            <p className="text-gray-500 text-sm text-center">Sin imágenes cargadas</p>
          )}
          {images.map(img => (
            <div key={img.label}>
              <p className="text-xs font-medium text-gray-500 mb-2">{img.label}</p>
              <img
                src={img.url}
                alt={img.label}
                className="w-full rounded border object-contain max-h-60"
              />
            </div>
          ))}
          {banner.link_url && (
            <div className="pt-2 border-t">
              <a
                href={banner.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Ver destino del link
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [categories, setCategories] = useState<CategoryOption[]>([ALL_categories_OPTION]);
  const [isSaving, setIsSaving] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<BannerClean | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Filtros
  const [filterPlacement, setFilterPlacement] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // ---- Toast helpers ----
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = ++toastCounter;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ---- Validación derivada ----
  const isFormValid = useMemo(() => {
    if (!formData.client_name.trim()) return false;
    if (formData.placement === 'hero_vip') {
      return !!(formData.desktop_image_url && formData.mobile_image_url);
    }
    if (formData.placement === 'category_carousel') {
      return !!formData.carousel_image_url;
    }
    return !!formData.desktop_image_url;
  }, [formData]);

  // ---- Cargar categorías desde DB ----
  useEffect(() => {
    supabase
      .from('categories')
      .select('slug, display_name')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data?.length) {
          setCategories([
            ALL_categories_OPTION,
            ...data.map(c => ({ value: c.slug, label: c.display_name })),
          ]);
        }
      });
  }, []);

  // ---- Cargar banners ----
  useEffect(() => {
    loadBanners();
  }, []);

  // ---- Aplicar filtros ----
  useEffect(() => {
    let filtered = [...banners];
    if (filterPlacement !== 'all') filtered = filtered.filter(b => b.placement === filterPlacement);
    if (filterCategory !== 'all') filtered = filtered.filter(b => b.category === filterCategory);
    if (filterStatus === 'active') filtered = filtered.filter(b => b.is_active);
    else if (filterStatus === 'paused') filtered = filtered.filter(b => !b.is_active);
    setFilteredBanners(filtered);
  }, [banners, filterPlacement, filterCategory, filterStatus]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await getAllBannersClean();
      setBanners(data);
    } catch (error) {
      console.error('Error cargando banners:', error);
      addToast('error', 'Error cargando banners');
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
      link_target: banner.link_target || '_blank',
      desktop_image_url: banner.desktop_image_url || '',
      mobile_image_url: banner.mobile_image_url || '',
      carousel_image_url: banner.carousel_image_url || '',
      starts_at: toLocalDatetimeInput(banner.starts_at),
      expires_at: toLocalDatetimeInput(banner.expires_at),
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
      addToast('error', 'Error eliminando banner');
    }
  };

  const handleToggleActive = async (banner: BannerClean) => {
    try {
      await toggleBannerCleanActive(banner.id, !banner.is_active);
      await loadBanners();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      addToast('error', 'Error cambiando estado');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSaving(true);
    try {
      const input: CreateBannerCleanInput = {
        placement: formData.placement,
        category: formData.category,
        client_name: formData.client_name,
        link_url: formData.link_url || undefined,
        link_target: formData.link_target || undefined,
        desktop_image_url: formData.desktop_image_url || undefined,
        mobile_image_url: formData.mobile_image_url || undefined,
        carousel_image_url: formData.carousel_image_url || undefined,
        starts_at: fromLocalDatetimeInput(formData.starts_at),
        expires_at: fromLocalDatetimeInput(formData.expires_at),
        is_active: formData.is_active
      };

      if (editingBanner) {
        await updateBannerClean(editingBanner.id, input);
        addToast('success', 'Banner actualizado');
      } else {
        await createBannerClean(input);
        addToast('success', 'Banner creado');
      }

      setShowModal(false);
      await loadBanners();
    } catch (error) {
      console.error('Error guardando:', error);
      addToast('error', 'Error guardando banner');
    } finally {
      setIsSaving(false);
    }
  };

  // ====================================
  // RENDER
  // ====================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestor de Banners</h1>
              <p className="text-gray-600 mt-1">Sistema limpio y profesional</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Banner
            </button>
          </div>

          {/* Filtros — responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Banner</label>
              <select
                value={filterPlacement}
                onChange={(e) => setFilterPlacement(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">Todos</option>
                {PLACEMENTS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
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
            <button onClick={handleCreate} className="mt-4 text-brand-600 hover:underline">
              Crear el primer banner
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vista</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Categoría</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cliente</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vencimiento</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stats</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBanners.map(banner => {
                  const thumbUrl = getBannerPreviewUrl(banner);
                  return (
                    <tr key={banner.id} className="hover:bg-gray-50">
                      {/* Miniatura + Quick View */}
                      <td className="px-4 py-3">
                        {thumbUrl ? (
                          <button
                            onClick={() => setPreviewBanner(banner)}
                            className="relative group block"
                            title="Vista rápida"
                          >
                            <img
                              src={cloudinaryThumb(thumbUrl)}
                              alt="miniatura"
                              className="w-[100px] h-[50px] object-cover rounded border"
                            />
                            <span className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </span>
                          </button>
                        ) : (
                          <div className="w-[100px] h-[50px] bg-gray-100 rounded border flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          banner.placement === 'hero_vip'
                            ? 'bg-purple-100 text-purple-700'
                            : banner.placement === 'category_carousel'
                            ? 'bg-blue-100 text-blue-700'
                            : banner.placement === 'results_intercalated'
                            ? 'bg-brand-100 text-brand-600'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {PLACEMENTS.find(p => p.value === banner.placement)?.label || banner.placement}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-900">
                        {categories.find(c => c.value === banner.category)?.label || banner.category}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {banner.client_name}
                        {banner.link_url && (
                          <a
                            href={banner.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1.5 text-gray-400 hover:text-brand-600 inline-flex items-center"
                            title="Ver sitio"
                            onClick={e => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </td>

                      {/* Vencimiento + badge */}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {banner.expires_at ? (
                          <span className="inline-flex items-center gap-1">
                            {new Date(banner.expires_at).toLocaleDateString('es-AR')}
                            <ExpiryBadge expires_at={banner.expires_at} />
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          banner.is_active
                            ? 'bg-brand-100 text-brand-600'
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
                            onClick={() => setPreviewBanner(banner)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                            title="Vista rápida"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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
                                : 'text-brand-600 hover:bg-brand-50'
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {previewBanner && (
        <QuickViewModal banner={previewBanner} onClose={() => setPreviewBanner(null)} />
      )}

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
                      <label
                        key={place.value}
                        className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Cliente *
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

                {/* Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link (opcional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
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
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Ver en sitio"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Imágenes según tipo */}
                {formData.placement === 'hero_vip' ? (
                  <div className="space-y-4">
                    <ImageUploader
                      value={formData.desktop_image_url}
                      onChange={(url) => setFormData({ ...formData, desktop_image_url: url })}
                      label="Imagen Desktop *"
                      requiredWidth={1100}
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
                ) : formData.placement === 'category_carousel' ? (
                  <ImageUploader
                    value={formData.carousel_image_url}
                    onChange={(url) => setFormData({ ...formData, carousel_image_url: url })}
                    label="Imagen Carousel *"
                    requiredWidth={650}
                    requiredHeight={100}
                    maxSizeMB={2}
                  />
                ) : formData.placement === 'results_intercalated' ? (
                  <ImageUploader
                    value={formData.desktop_image_url}
                    onChange={(url) => setFormData({ ...formData, desktop_image_url: url })}
                    label="Imagen Intercalado * (650x100)"
                    requiredWidth={650}
                    requiredHeight={100}
                    maxSizeMB={2}
                  />
                ) : formData.placement === 'results_below_filter' ? (
                  <ImageUploader
                    value={formData.desktop_image_url}
                    onChange={(url) => setFormData({ ...formData, desktop_image_url: url })}
                    label="Imagen Debajo Filtro * (280x250)"
                    requiredWidth={280}
                    requiredHeight={250}
                    maxSizeMB={2}
                  />
                ) : null}

                {/* Fechas — con conversión TZ */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                    <input
                      type="datetime-local"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Expiración</label>
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
                  disabled={isSaving}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
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
