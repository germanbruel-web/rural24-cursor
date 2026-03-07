// ============================================================================
// COMPANY PROFILE FORM
// ============================================================================
// Formulario para crear/editar perfil de empresa
// ============================================================================

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Camera,
  Save,
  Loader2,
  CheckCircle,
  MessageCircle,
  FileText,
  Instagram,
  Facebook
} from 'lucide-react';
import { 
  CompanyProfile, 
  CreateCompanyProfileData,
  getMyCompanyProfile,
  createCompanyProfile,
  updateCompanyProfile,
  updateCompanyLogo,
  updateCompanyBanner
} from '../../services/companyProfileService';
import { uploadService } from '../../services/uploadService';

// ============================================================================
// TIPOS
// ============================================================================

interface CompanyProfileFormProps {
  onSuccess?: (profile: CompanyProfile) => void;
  onCancel?: () => void;
}

interface FormData {
  company_name: string;
  tagline: string;
  description: string;
  whatsapp: string;
  website: string;
  facebook_url: string;
  instagram_url: string;
  province: string;
  city: string;
}

const INITIAL_FORM: FormData = {
  company_name: '',
  tagline: '',
  description: '',
  whatsapp: '',
  website: '',
  facebook_url: '',
  instagram_url: '',
  province: '',
  city: '',
};

// ============================================================================
// PROVINCIAS ARGENTINA
// ============================================================================

const PROVINCIAS = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

// ============================================================================
// COMPONENTE
// ============================================================================

export function CompanyProfileForm({ onSuccess, onCancel }: CompanyProfileFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingProfile, setExistingProfile] = useState<CompanyProfile | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ============================================================================
  // HELPERS
  // ============================================================================

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Limpiar error del campo al editar
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // ============================================================================
  // CARGAR PERFIL EXISTENTE
  // ============================================================================

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getMyCompanyProfile();
        if (profile) {
          setExistingProfile(profile);
          setLogoUrl(profile.logo_url);
          setBannerUrl(profile.cover_url);
          setFormData({
            company_name: profile.company_name,
            tagline: profile.tagline || '',
            description: profile.description || '',
            whatsapp: profile.whatsapp || '',
            website: profile.website || '',
            facebook_url: profile.social_networks?.facebook || '',
            instagram_url: profile.social_networks?.instagram || '',
            province: profile.province || '',
            city: profile.city || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // ============================================================================
  // HANDLERS DE IMÁGENES
  // ============================================================================

  async function handleLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const result = await uploadService.uploadImage(file, 'company-logos');
      setLogoUrl(result.url);
      
      if (existingProfile) {
        await updateCompanyLogo(result.url);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error al subir el logo');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleBannerUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const result = await uploadService.uploadImage(file, 'company-banners');
      setBannerUrl(result.url);
      
      if (existingProfile) {
        await updateCompanyBanner(result.url);
      }
    } catch (error) {
      console.error('Error uploading banner:', error);
      alert('Error al subir el banner');
    } finally {
      setUploadingBanner(false);
    }
  }

  // ============================================================================
  // VALIDACIÓN
  // ============================================================================

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'El nombre de la empresa es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ============================================================================
  // SUBMIT
  // ============================================================================

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!validate()) return;

    setSaving(true);
    setSuccessMessage(null);

    try {
      const profileData: CreateCompanyProfileData = {
        company_name: formData.company_name,
        tagline: formData.tagline || undefined,
        description: formData.description || undefined,
        whatsapp: formData.whatsapp || undefined,
        website: formData.website || undefined,
        social_networks: {
          facebook: formData.facebook_url || undefined,
          instagram: formData.instagram_url || undefined,
        },
        province: formData.province || undefined,
        city: formData.city || undefined,
      };

      let profile: CompanyProfile;

      if (existingProfile) {
        profile = await updateCompanyProfile({
          ...profileData,
          logo_url: logoUrl || undefined,
          cover_url: bannerUrl || undefined,
        });
        setSuccessMessage('Perfil actualizado correctamente');
      } else {
        profile = await createCompanyProfile(profileData);

        if (logoUrl) await updateCompanyLogo(logoUrl);
        if (bannerUrl) await updateCompanyBanner(bannerUrl);

        setExistingProfile(profile);
        setSuccessMessage('Perfil de empresa creado correctamente');
      }

      onSuccess?.(profile);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  // ============================================================================
  // LOADING
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-brand-600" />
          <span className="text-brand-700">{successMessage}</span>
        </div>
      )}

      {/* ================================================================== */}
      {/* IMÁGENES */}
      {/* ================================================================== */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Camera className="w-5 h-5 text-brand-600" />
          Imágenes de la Empresa
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de la Empresa
            </label>
            <div className="relative group">
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 group-hover:border-brand-500 transition-colors">
                {uploadingLogo ? (
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                ) : logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-12 h-12 text-gray-300" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploadingLogo}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Recomendado: 200x200px, cuadrado</p>
          </div>

          {/* Banner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner / Portada
            </label>
            <div className="relative group">
              <div className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 group-hover:border-brand-500 transition-colors">
                {uploadingBanner ? (
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                ) : bannerUrl ? (
                  <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-sm">Click para subir banner</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploadingBanner}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Recomendado: 1200x300px, horizontal</p>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* DATOS DE LA EMPRESA */}
      {/* ================================================================== */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-600" />
          Datos de la Empresa
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Empresa *
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.company_name ? 'border-red-300' : 'border-gray-200'
              } focus:ring-2 focus:ring-brand-600 focus:border-transparent`}
              placeholder="Ej: Agrícola San Martín S.R.L."
            />
            {errors.company_name && (
              <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Eslogan / Tagline
            </label>
            <input
              type="text"
              name="tagline"
              value={formData.tagline}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              placeholder="Ej: Especialistas en ganadería de precisión"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              placeholder="Describe brevemente tu empresa y los servicios que ofrece..."
            />
          </div>

        </div>
      </section>

      {/* ================================================================== */}
      {/* CONTACTO */}
      {/* ================================================================== */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-brand-600" />
          Contacto
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MessageCircle className="w-4 h-4 inline mr-1" />
              WhatsApp
            </label>
            <input
              type="tel"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              placeholder="+54 9 11 1234-5678"
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* UBICACIÓN */}
      {/* ================================================================== */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-600" />
          Ubicación
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provincia
            </label>
            <select
              name="province"
              value={formData.province}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            >
              <option value="">Seleccionar provincia</option>
              {PROVINCIAS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad / Localidad
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              placeholder="Ej: Rosario"
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* REDES Y WEB */}
      {/* ================================================================== */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Globe className="w-5 h-5 text-brand-600" />
          Web y Redes Sociales
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Globe className="w-4 h-4 inline mr-1" />
              Sitio Web
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              placeholder="https://www.miempresa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Facebook className="w-4 h-4 inline mr-1" />
              Facebook
            </label>
            <input
              type="url"
              name="facebook_url"
              value={formData.facebook_url}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              placeholder="https://facebook.com/miempresa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Instagram className="w-4 h-4 inline mr-1" />
              Instagram
            </label>
            <input
              type="url"
              name="instagram_url"
              value={formData.instagram_url}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              placeholder="https://instagram.com/miempresa"
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* BOTONES */}
      {/* ================================================================== */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        )}
        
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {existingProfile ? 'Guardar Cambios' : 'Crear Perfil de Empresa'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default CompanyProfileForm;
