import React, { useEffect, useRef, useState } from 'react';
import { X, Building2, Globe, Phone, Mail, MapPin, Instagram, Facebook, Eye, EyeOff, Loader2, Upload, ImageOff, Wrench } from 'lucide-react';
import { getProvinces, getLocalitiesByProvince } from '../../services/v2/locationsService';
import type { Province, Locality } from '../../services/v2/locationsService';
import type { MyCompany, CreateEmpresaData, UpdateEmpresaData } from '../../services/empresaService'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { createEmpresa, updateEmpresa, CompanyLimitError } from '../../services/empresaService';
import { uploadsApi } from '../../services/api';

interface EmpresaFormProps {
  empresa?: MyCompany | null;   // null = crear, objeto = editar
  onClose: () => void;
  onSaved: (empresa: MyCompany) => void;
}

interface FormState {
  company_name: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  website: string;
  facebook: string;
  instagram: string;
  province: string;
  city: string;
  owner_public: boolean;
  show_on_ad_detail: boolean;
  // Social Proof — Sprint 7A
  anos_experiencia: string;
  area_cobertura: string;
  superficie_maxima: string;
  cultivos_input: string;       // texto libre, guardado como JSON array
  equipamiento_propio: boolean;
  aplica_precision: boolean;
  usa_drones: boolean;
  factura: boolean;
}

const EMPTY: FormState = {
  company_name: '',
  tagline: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  whatsapp: '',
  website: '',
  facebook: '',
  instagram: '',
  province: '',
  city: '',
  owner_public: false,
  show_on_ad_detail: true,
  anos_experiencia: '',
  area_cobertura: '',
  superficie_maxima: '',
  cultivos_input: '',
  equipamiento_propio: false,
  aplica_precision: false,
  usa_drones: false,
  factura: false,
};

export const EmpresaForm: React.FC<EmpresaFormProps> = ({ empresa, onClose, onSaved }) => {
  const isEdit = !!empresa;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (
    file: File,
    setUploading: (v: boolean) => void,
    setUrl: (url: string) => void,
  ) => {
    setUploading(true);
    try {
      const result = await uploadsApi.uploadImage(file, 'profiles');
      setUrl(result.url);
    } catch {
      setError('Error al subir la imagen. Intentá de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  // Cargar provincias
  useEffect(() => {
    getProvinces().then(setProvinces);
  }, []);

  // Cargar localidades cuando cambia la provincia
  useEffect(() => {
    if (!form.province) { setLocalities([]); return; }
    const prov = provinces.find(p => p.name === form.province);
    if (prov) getLocalitiesByProvince(prov.id).then(setLocalities);
  }, [form.province, provinces]);

  // Poblar form al editar
  useEffect(() => {
    if (!empresa) { setForm(EMPTY); setLogoUrl(null); setCoverUrl(null); return; }
    setLogoUrl(empresa.logo_url ?? null);
    setCoverUrl(empresa.cover_url ?? null);

    // Cargar localidades para la provincia guardada
    if (empresa.province) {
      getProvinces().then(provs => {
        const prov = provs.find(p => p.name === empresa.province);
        if (prov) getLocalitiesByProvince(prov.id).then(setLocalities);
      });
    }

    const e = empresa as any;
    setForm({
      company_name: empresa.company_name ?? '',
      tagline: empresa.tagline ?? '',
      description: empresa.description ?? '',
      phone: e.phone ?? '',
      email: e.email ?? '',
      address: e.address ?? '',
      whatsapp: e.whatsapp ?? '',
      website: e.website ?? '',
      facebook: e.social_networks?.facebook ?? '',
      instagram: e.social_networks?.instagram ?? '',
      province: empresa.province ?? '',
      city: empresa.city ?? '',
      owner_public: empresa.owner_public ?? false,
      show_on_ad_detail: empresa.show_on_ad_detail ?? true,
      anos_experiencia: e.anos_experiencia != null ? String(e.anos_experiencia) : '',
      area_cobertura: e.area_cobertura ?? '',
      superficie_maxima: e.superficie_maxima != null ? String(e.superficie_maxima) : '',
      cultivos_input: Array.isArray(e.cultivos_json) ? e.cultivos_json.join(', ') : '',
      equipamiento_propio: e.equipamiento_propio ?? false,
      aplica_precision: e.aplica_precision ?? false,
      usa_drones: e.usa_drones ?? false,
      factura: e.factura ?? false,
    });
  }, [empresa]);

  const set = (field: keyof FormState, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim()) { setError('El nombre de la empresa es obligatorio'); return; }
    setSaving(true);
    setError(null);

    try {
      // Parsear cultivos desde texto libre
      const cultivos = form.cultivos_input
        ? form.cultivos_input.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const payload: UpdateEmpresaData = {
        company_name: form.company_name.trim(),
        tagline: form.tagline.trim() || undefined,
        description: form.description.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        website: form.website.trim() || undefined,
        social_networks: {
          facebook: form.facebook.trim() || undefined,
          instagram: form.instagram.trim() || undefined,
        },
        province: form.province || undefined,
        city: form.city || undefined,
        owner_public: form.owner_public,
        show_on_ad_detail: form.show_on_ad_detail,
        logo_url: logoUrl ?? undefined,
        cover_url: coverUrl ?? undefined,
        // Social Proof
        anos_experiencia: form.anos_experiencia ? parseInt(form.anos_experiencia) : undefined,
        area_cobertura: form.area_cobertura || undefined,
        superficie_maxima: form.superficie_maxima ? parseInt(form.superficie_maxima) : undefined,
        cultivos_json: cultivos.length > 0 ? cultivos : undefined,
        equipamiento_propio: form.equipamiento_propio,
        aplica_precision: form.aplica_precision,
        usa_drones: form.usa_drones,
        factura: form.factura,
      };

      if (isEdit && empresa) {
        await updateEmpresa(empresa.id, payload);
        onSaved({ ...empresa, ...payload, logo_url: logoUrl, cover_url: coverUrl, role: empresa.role, ads_count: empresa.ads_count });
      } else {
        const created = await createEmpresa(payload as CreateEmpresaData);
        // Si subió imágenes en la creación, guardarlas en un segundo paso
        if (logoUrl || coverUrl) {
          await updateEmpresa(created.id, {
            ...(logoUrl ? { logo_url: logoUrl } : {}),
            ...(coverUrl ? { cover_url: coverUrl } : {}),
          });
        }
        onSaved({ ...created, logo_url: logoUrl ?? null, cover_url: coverUrl ?? null });
      }
    } catch (err) {
      if (err instanceof CompanyLimitError) {
        setError('Tu plan no permite más empresas. Contratá un plan superior.');
      } else {
        setError(err instanceof Error ? err.message : 'Error al guardar');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="drawer-enter fixed inset-y-0 right-0 z-50 w-[90vw] sm:w-1/2 max-w-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Editar empresa' : 'Nueva empresa'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Imágenes — Logo + Cover */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Imágenes</h3>
            <div className="flex gap-4 flex-wrap">

              {/* Logo */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50 relative">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-gray-300" />
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                    </div>
                  )}
                </div>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, setUploadingLogo, setLogoUrl);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  disabled={uploadingLogo}
                  className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 disabled:opacity-50"
                >
                  <Upload className="w-3 h-3" />Logo
                </button>
                {logoUrl && (
                  <button type="button" onClick={() => setLogoUrl(null)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                    <ImageOff className="w-3 h-3" />Quitar
                  </button>
                )}
              </div>

              {/* Cover */}
              <div className="flex flex-col items-center gap-2 flex-1 min-w-[160px]">
                <div className="w-full h-20 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50 relative">
                  {coverUrl ? (
                    <img src={coverUrl} alt="Portada" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">Sin portada</span>
                  )}
                  {uploadingCover && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                    </div>
                  )}
                </div>
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, setUploadingCover, setCoverUrl);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => coverRef.current?.click()}
                  disabled={uploadingCover}
                  className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 disabled:opacity-50"
                >
                  <Upload className="w-3 h-3" />Imagen de portada
                </button>
                {coverUrl && (
                  <button type="button" onClick={() => setCoverUrl(null)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                    <ImageOff className="w-3 h-3" />Quitar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la empresa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.company_name}
              onChange={e => set('company_name', e.target.value)}
              placeholder="Ej: Agro Distribuidora San Martín"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slogan / tagline</label>
            <input
              type="text"
              value={form.tagline}
              onChange={e => set('tagline', e.target.value)}
              placeholder="Ej: Insumos agrícolas desde 1985"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              placeholder="Contá de qué se trata la empresa, qué productos o servicios ofrece..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Contacto — fila 2 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-3.5 h-3.5 inline mr-1" />Teléfono
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+54 11 1234-5678"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-3.5 h-3.5 inline mr-1" />WhatsApp
              </label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={e => set('whatsapp', e.target.value)}
                placeholder="5491112345678"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-3.5 h-3.5 inline mr-1" />Email de contacto
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="info@empresa.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Globe className="w-3.5 h-3.5 inline mr-1" />Sitio web
              </label>
              <input
                type="url"
                value={form.website}
                onChange={e => set('website', e.target.value)}
                placeholder="https://miempresa.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />Dirección física
            </label>
            <input
              type="text"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Av. San Martín 1234, Rosario"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <select
                value={form.province}
                onChange={e => { set('province', e.target.value); set('city', ''); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">Seleccioná provincia</option>
                {provinces.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
              {localities.length > 0 ? (
                <select
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Seleccioná localidad</option>
                  {localities.map(l => (
                    <option key={l.id} value={l.name}>{l.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder="Localidad"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              )}
            </div>
          </div>

          {/* Redes Sociales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Facebook className="w-3.5 h-3.5 inline mr-1" />Facebook
              </label>
              <input
                type="url"
                value={form.facebook}
                onChange={e => set('facebook', e.target.value)}
                placeholder="https://facebook.com/miempresa"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Instagram className="w-3.5 h-3.5 inline mr-1" />Instagram
              </label>
              <input
                type="url"
                value={form.instagram}
                onChange={e => set('instagram', e.target.value)}
                placeholder="https://instagram.com/miempresa"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Social Proof — Servicios y Capacidades */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-brand-600" />
              Servicios y Capacidades
              <span className="text-xs font-normal text-gray-400">(opcional — contratistas y servicios)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Años de experiencia</label>
                <input
                  type="number"
                  min={0} max={100}
                  value={form.anos_experiencia}
                  onChange={e => set('anos_experiencia', e.target.value)}
                  placeholder="Ej: 15"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Zona de cobertura</label>
                <select
                  value={form.area_cobertura}
                  onChange={e => set('area_cobertura', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Sin especificar</option>
                  <option value="local">Local</option>
                  <option value="regional">Regional</option>
                  <option value="nacional">Nacional</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Superficie máx. (ha)</label>
                <input
                  type="number"
                  min={0}
                  value={form.superficie_maxima}
                  onChange={e => set('superficie_maxima', e.target.value)}
                  placeholder="Ej: 500"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cultivos con los que trabajás</label>
              <input
                type="text"
                value={form.cultivos_input}
                onChange={e => set('cultivos_input', e.target.value)}
                placeholder="Ej: soja, maíz, trigo, girasol (separados por coma)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-400 mt-0.5">Separalos con comas.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {([
                { field: 'equipamiento_propio', label: 'Equipo propio' },
                { field: 'aplica_precision', label: 'Agricultura de precisión' },
                { field: 'usa_drones', label: 'Utiliza drones' },
                { field: 'factura', label: 'Emite factura' },
              ] as const).map(({ field, label }) => (
                <label key={field} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[field]}
                    onChange={e => set(field, e.target.checked)}
                    className="accent-brand-600"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Privacidad */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Privacidad</h3>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_on_ad_detail}
                onChange={e => set('show_on_ad_detail', e.target.checked)}
                className="mt-0.5 accent-brand-600"
              />
              <span className="text-sm text-gray-700">
                <span className="font-medium">Mostrar en avisos</span>
                <span className="text-gray-500 block text-xs mt-0.5">
                  Los compradores verán el botón "Ver Perfil de Empresa" en tus avisos.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.owner_public}
                onChange={e => set('owner_public', e.target.checked)}
                className="mt-0.5 accent-brand-600"
              />
              <span className="text-sm text-gray-700">
                <span className="font-medium flex items-center gap-1">
                  {form.owner_public
                    ? <><Eye className="w-3.5 h-3.5" /> Mostrar mi nombre como responsable</>
                    : <><EyeOff className="w-3.5 h-3.5" /> Ocultar mi nombre (modo anónimo)</>
                  }
                </span>
                <span className="text-gray-500 block text-xs mt-0.5">
                  {form.owner_public
                    ? 'Tu nombre aparecerá en la página pública de la empresa.'
                    : 'Tu identidad permanece oculta en la página pública.'}
                </span>
              </span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Crear empresa'}
          </button>
        </div>
      </div>
    </>
  );
};
