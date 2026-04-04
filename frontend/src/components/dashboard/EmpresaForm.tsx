import React, { useEffect, useRef, useState } from 'react';
import { X, Building2, Globe, Phone, Mail, MapPin, Instagram, Facebook, Youtube, Eye, EyeOff, Loader2, Upload, ImageOff, Wrench, Plus, Trash2 } from 'lucide-react';

// ── Redes sociales disponibles ──────────────────────────────────────────────
const SOCIAL_NETWORKS = [
  {
    key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/usuario',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" style={{ color: '#0077B5' }}>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/usuario',
    icon: () => <Instagram className="w-4 h-4" style={{ color: '#E1306C' }} />,
  },
  {
    key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/usuario',
    icon: () => <Facebook className="w-4 h-4" style={{ color: '#1877F2' }} />,
  },
  {
    key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/usuario',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-gray-900">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@canal',
    icon: () => <Youtube className="w-4 h-4" style={{ color: '#FF0000' }} />,
  },
  {
    key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@usuario',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-gray-900">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
      </svg>
    ),
  },
  {
    key: 'web', label: 'Sitio Web', placeholder: 'https://misitioweb.com',
    icon: () => <Globe className="w-4 h-4 text-gray-500" />,
  },
] as const;

type SocialNetworkKey = typeof SOCIAL_NETWORKS[number]['key'];
interface SocialLink { network: SocialNetworkKey; url: string; }

const MAX_SOCIAL_LINKS = 5;
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
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  // ── Helpers redes sociales ──────────────────────────────────────────────
  const addSocialLink = () => {
    if (socialLinks.length >= MAX_SOCIAL_LINKS) return;
    const used = new Set(socialLinks.map(l => l.network));
    const next = SOCIAL_NETWORKS.find(n => !used.has(n.key));
    if (!next) return;
    setSocialLinks(prev => [...prev, { network: next.key, url: '' }]);
  };

  const removeSocialLink = (idx: number) =>
    setSocialLinks(prev => prev.filter((_, i) => i !== idx));

  const updateSocialLink = (idx: number, field: 'network' | 'url', value: string) =>
    setSocialLinks(prev => prev.map((l, i) =>
      i === idx ? { ...l, [field]: value as SocialNetworkKey } : l
    ));

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

    // Parsear social_networks JSONB → array de links
    const sn = e.social_networks ?? {};
    const validKeys = SOCIAL_NETWORKS.map(n => n.key);
    const parsed: SocialLink[] = Object.entries(sn)
      .filter(([k, v]) => validKeys.includes(k as SocialNetworkKey) && typeof v === 'string' && (v as string).trim())
      .map(([k, v]) => ({ network: k as SocialNetworkKey, url: v as string }))
      .slice(0, MAX_SOCIAL_LINKS);
    setSocialLinks(parsed);
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

      const payload = {
        company_name: form.company_name.trim(),
        tagline: form.tagline.trim() || undefined,
        description: form.description.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        website: form.website.trim() || undefined,
        social_networks: Object.fromEntries(
          socialLinks
            .filter(l => l.url.trim())
            .map(l => [l.network, l.url.trim()])
        ),
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
        await updateEmpresa(empresa.id, payload as UpdateEmpresaData);
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

          {/* Redes Sociales — selector dinámico */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Redes sociales
                <span className="ml-1 text-xs font-normal text-gray-400">
                  ({socialLinks.length}/{MAX_SOCIAL_LINKS})
                </span>
              </label>
              {socialLinks.length < MAX_SOCIAL_LINKS && (
                <button
                  type="button"
                  onClick={addSocialLink}
                  className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar red
                </button>
              )}
            </div>

            {socialLinks.length === 0 && (
              <p className="text-xs text-gray-400 italic py-2">
                Ninguna red agregada. Hacé click en "Agregar red" para sumar una.
              </p>
            )}

            <div className="space-y-2">
              {socialLinks.map((link, idx) => {
                const netConfig = SOCIAL_NETWORKS.find(n => n.key === link.network)!;
                const usedKeys = new Set(socialLinks.map((l, i) => i !== idx ? l.network : null));
                return (
                  <div key={idx} className="flex items-center gap-2">
                    {/* Selector de red */}
                    <div className="relative">
                      <select
                        value={link.network}
                        onChange={e => updateSocialLink(idx, 'network', e.target.value)}
                        className="appearance-none pl-8 pr-6 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                      >
                        {SOCIAL_NETWORKS.map(n => (
                          <option key={n.key} value={n.key} disabled={usedKeys.has(n.key)}>
                            {n.label}
                          </option>
                        ))}
                      </select>
                      {/* Icono superpuesto */}
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <netConfig.icon />
                      </span>
                    </div>

                    {/* Input URL */}
                    <input
                      type="url"
                      value={link.url}
                      onChange={e => updateSocialLink(idx, 'url', e.target.value)}
                      placeholder={netConfig.placeholder}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />

                    {/* Eliminar */}
                    <button
                      type="button"
                      onClick={() => removeSocialLink(idx)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
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
