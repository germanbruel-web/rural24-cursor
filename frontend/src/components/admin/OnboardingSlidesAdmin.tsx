/**
 * OnboardingSlidesAdmin — CMS para gestionar los slides del onboarding.
 * Accesible en #/onboarding-cms (solo superadmin).
 *
 * Permite: crear, editar, reordenar y eliminar slides con imagen, título y descripción.
 */

import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, ImageIcon, X, Check, Settings2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { uploadsApi } from '../../services/api/uploads';
import { updateSetting, updateImageSetting, getSetting } from '../../services/siteSettingsService';
import { invalidateSiteSetting } from '../../hooks/useSiteSetting';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const BG_PRESETS = ['#14532d', '#1e3a5f', '#1a1a1a', '#374151', '#7f1d1d', '#f8fafc'];

interface Slide {
  id: string;
  sort_order: number;
  title: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  target_device: 'desktop' | 'mobile' | 'both';
  bg_color: string;
  image_fit: 'cover' | 'contain';
}

interface SlideFormData {
  title: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  target_device: 'desktop' | 'mobile' | 'both';
  bg_color: string;
  image_fit: 'cover' | 'contain';
}

const EMPTY_FORM: SlideFormData = {
  title: '', description: '', image_url: '', sort_order: 0, is_active: true, target_device: 'both',
  bg_color: '#14532d', image_fit: 'cover',
};

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export default function OnboardingSlidesAdmin() {
  const [slides, setSlides]         = useState<Slide[]>([]);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState<string | null>(null);
  const [form, setForm]             = useState<SlideFormData>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const fileRef                     = useRef<HTMLInputElement>(null);

  // Panel settings (logo + slogan)
  const [panelOpen, setPanelOpen]       = useState(false);
  const [logoUrl, setLogoUrl]           = useState('');
  const [slogan, setSlogan]             = useState('');
  const [savingPanel, setSavingPanel]   = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [panelMsg, setPanelMsg]         = useState<string | null>(null);
  const logoFileRef                     = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE}/api/admin/onboarding/slides`, { headers });
    const data = await res.json();
    setSlides(data.slides ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    Promise.all([
      getSetting('carousel_logo_url'),
      getSetting('carousel_slogan'),
    ]).then(([logo, slog]) => {
      setLogoUrl(logo ?? '');
      setSlogan(slog ?? 'Clasificados Agrarios');
    }).catch(() => {});
  }, []);

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    setPanelMsg(null);
    const ok = await updateImageSetting('carousel_logo_url', file);
    if (ok) {
      const url = await getSetting('carousel_logo_url');
      setLogoUrl(url ?? '');
      invalidateSiteSetting('carousel_logo_url');
      setPanelMsg('Logo actualizado ✓');
    } else {
      setPanelMsg('Error al subir logo');
    }
    setUploadingLogo(false);
  };

  const saveSlogan = async () => {
    setSavingPanel(true);
    setPanelMsg(null);
    const ok = await updateSetting({ setting_key: 'carousel_slogan', setting_value: slogan });
    if (ok) {
      invalidateSiteSetting('carousel_slogan');
      setPanelMsg('Slogan guardado ✓');
    } else {
      setPanelMsg('Error al guardar slogan');
    }
    setSavingPanel(false);
  };

  const openNew = () => {
    setForm({ ...EMPTY_FORM, sort_order: (slides.length + 1) * 10 });
    setEditing('new');
    setError(null);
  };

  const openEdit = (s: Slide) => {
    setForm({ title: s.title, description: s.description ?? '', image_url: s.image_url ?? '', sort_order: s.sort_order, is_active: s.is_active, target_device: s.target_device ?? 'both', bg_color: s.bg_color ?? '#14532d', image_fit: s.image_fit ?? 'cover' });
    setEditing(s.id);
    setError(null);
  };

  const cancelEdit = () => { setEditing(null); setForm(EMPTY_FORM); setError(null); };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const media = await uploadsApi.uploadImage(file, 'banners');
      setForm(f => ({ ...f, image_url: media.url }));
    } catch (e: any) {
      setError(`Error al subir imagen: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.title.trim()) { setError('El título es obligatorio'); return; }
    setSaving(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const isNew = editing === 'new';
      const url = isNew
        ? `${API_BASE}/api/admin/onboarding/slides`
        : `${API_BASE}/api/admin/onboarding/slides/${editing}`;
      const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar');
      await load();
      cancelEdit();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: Slide) => {
    const headers = await authHeaders();
    await fetch(`${API_BASE}/api/admin/onboarding/slides/${s.id}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ ...s, is_active: !s.is_active }),
    });
    await load();
  };

  const deleteSlide = async (id: string) => {
    if (!window.confirm('¿Eliminar este slide?')) return;
    const headers = await authHeaders();
    await fetch(`${API_BASE}/api/admin/onboarding/slides/${id}`, { method: 'DELETE', headers });
    await load();
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Onboarding — Slides</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Slides del carrusel de login/registro — desktop (panel izquierdo) y mobile (intro full-screen).
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo slide
        </button>
      </div>

      {/* ── Configuración del panel (logo + slogan) ── */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <button
          onClick={() => setPanelOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Settings2 className="w-4 h-4 text-gray-400" />
            Configuración del panel (logo + slogan)
          </div>
          <span className="text-xs text-gray-400">{panelOpen ? '▲' : '▼'}</span>
        </button>

        {panelOpen && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-4">
            {/* Logo */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Logo del panel <span className="font-normal text-gray-400">(imagen, recomendado horizontal ~200×60px)</span>
              </label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative">
                    <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain border border-gray-200 rounded-lg bg-brand-700 px-3 py-1" />
                    <button
                      onClick={() => { updateSetting({ setting_key: 'carousel_logo_url', setting_value: '' }); invalidateSiteSetting('carousel_logo_url'); setLogoUrl(''); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                      title="Quitar logo (usar texto)"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">Sin logo — usa texto "Rural24"</div>
                )}
                <button
                  onClick={() => logoFileRef.current?.click()}
                  disabled={uploadingLogo}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {uploadingLogo ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
                </button>
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ''; }}
                />
              </div>
            </div>

            {/* Slogan */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Slogan / subtítulo bajo el logo
              </label>
              <div className="flex items-center gap-2">
                <input
                  value={slogan}
                  onChange={e => setSlogan(e.target.value)}
                  placeholder="Ej: Clasificados Agrarios"
                  className="flex-1 text-sm border border-gray-300 rounded-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button
                  onClick={saveSlogan}
                  disabled={savingPanel}
                  className="flex items-center gap-1 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  {savingPanel ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>

            {panelMsg && (
              <p className={`text-xs font-medium ${panelMsg.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {panelMsg}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Formulario crear / editar */}
      {editing && (
        <div className="rounded-xl border-2 border-brand-200 bg-brand-50 p-5 space-y-4">
          <h2 className="font-bold text-gray-900 text-sm">
            {editing === 'new' ? 'Nuevo slide' : 'Editar slide'}
          </h2>

          {/* Imagen */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Imagen (recomendado 9:16)</label>
            <div className="flex items-start gap-3">
              {form.image_url ? (
                <div className="relative w-20 flex-shrink-0">
                  <img src={form.image_url} alt="" className="w-20 aspect-[9/16] object-cover rounded-lg border border-gray-200" />
                  <button
                    onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-20 aspect-[9/16] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors text-xs gap-1"
                >
                  {uploading ? (
                    <span className="text-[10px]">Subiendo...</span>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" />
                      <span>Subir</span>
                    </>
                  )}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }}
              />
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Ej: Publicá tu aviso gratis"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Texto descriptivo del slide..."
                    rows={2}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Orden</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                      className="w-20 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mt-4">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 accent-brand-500"
                    />
                    Activo
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Dispositivo</label>
                  <select
                    value={form.target_device}
                    onChange={e => setForm(f => ({ ...f, target_device: e.target.value as 'desktop' | 'mobile' | 'both' }))}
                    className="w-full text-sm border border-gray-300 rounded-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    <option value="both">Ambos (desktop + mobile)</option>
                    <option value="desktop">Solo desktop</option>
                    <option value="mobile">Solo mobile (9:16)</option>
                  </select>
                </div>

                {/* Color de fondo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Color de fondo</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="color"
                      value={form.bg_color}
                      onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))}
                      className="w-9 h-7 rounded cursor-pointer border border-gray-300 p-0.5"
                      title="Color personalizado"
                    />
                    {BG_PRESETS.map(hex => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, bg_color: hex }))}
                        style={{ backgroundColor: hex }}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          form.bg_color === hex ? 'border-brand-500 scale-110' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        title={hex}
                      />
                    ))}
                    <span className="text-xs text-gray-400 font-mono">{form.bg_color}</span>
                  </div>
                </div>

                {/* Modo imagen */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Modo imagen</label>
                  <div className="flex gap-2">
                    {(['cover', 'contain'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, image_fit: mode }))}
                        className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                          form.image_fit === mode
                            ? 'bg-brand-500 text-white border-brand-500'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {mode === 'cover' ? 'Cubrir (full-bleed)' : 'Ajustar (sin recorte)'}
                      </button>
                    ))}
                  </div>
                  {form.image_fit === 'contain' && (
                    <p className="text-xs text-gray-400 mt-1">
                      Desktop: imagen 1:1 recomendado · Mobile: imagen 9:16
                    </p>
                  )}
                </div>

              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={cancelEdit} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de slides */}
      {loading ? (
        <div className="text-sm text-gray-400 text-center py-10">Cargando...</div>
      ) : slides.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          No hay slides. Creá el primero.
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map(s => (
            <div
              key={s.id}
              className={`flex items-start gap-4 p-4 rounded-xl border ${s.is_active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}
            >
              {/* Drag handle */}
              <GripVertical className="w-4 h-4 text-gray-300 mt-1 flex-shrink-0 cursor-grab" />

              {/* Thumbnail */}
              <div className="w-12 flex-shrink-0">
                {s.image_url ? (
                  <img src={s.image_url} alt={s.title} className={`w-12 aspect-[9/16] rounded-lg border border-gray-200 ${s.image_fit === 'contain' ? 'object-contain' : 'object-cover'}`} style={{ backgroundColor: s.bg_color ?? '#14532d' }} />
                ) : (
                  <div className="w-12 aspect-[9/16] rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg_color ?? '#14532d' }}>
                    <ImageIcon className="w-4 h-4 text-white/50" />
                  </div>
                )}
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-gray-400 font-mono">#{s.sort_order}</span>
                  {!s.is_active && <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">Inactivo</span>}
                  {s.target_device === 'desktop' && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">Desktop</span>}
                  {s.target_device === 'mobile' && <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">Mobile</span>}
                </div>
                <p className="font-semibold text-sm text-gray-900 truncate">{s.title}</p>
                {s.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{s.description}</p>}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleActive(s)} title={s.is_active ? 'Desactivar' : 'Activar'}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                  {s.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(s)} title="Editar"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-600 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteSlide(s.id)} title="Eliminar"
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Máximo recomendado: 3 slides activos · Imagen 9:16 para mobile (720×1280px) · 16:9 para desktop
      </p>
    </div>
  );
}
