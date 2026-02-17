// ============================================================================
// COMPANY PROFILE PAGE
// ============================================================================
// Página pública del perfil de empresa
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  MessageCircle,
  Facebook,
  Instagram,
  Clock,
  CheckCircle,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Package
} from 'lucide-react';
import { 
  CompanyProfile, 
  Catalog,
  getCompanyProfileBySlug,
  getCatalogsByCompany
} from '../../services/companyProfileService';
import { navigateTo } from '../../hooks/useNavigate';

// ============================================================================
// COMPONENTE
// ============================================================================

export function CompanyProfilePage() {
  // Extraer slug del hash: #/empresa/:slug
  const slug = useMemo(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#\/empresa\/([^/]+)/);
    return match ? match[1] : null;
  }, []);
  
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!slug) {
        setError('Perfil no encontrado');
        setLoading(false);
        return;
      }

      try {
        const data = await getCompanyProfileBySlug(slug);
        if (!data) {
          setError('Empresa no encontrada');
          setLoading(false);
          return;
        }
        
        setProfile(data);
        
        // Cargar catálogos
        const cats = await getCatalogsByCompany(data.id);
        setCatalogs(cats);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [slug]);

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <Building2 className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {error || 'Empresa no encontrada'}
        </h1>
        <p className="text-gray-600 mb-6">
          La empresa que buscas no existe o fue desactivada.
        </p>
        <button
          onClick={() => navigateTo('/search', { cat: 'servicios-rurales' })}
          className="px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-600 transition-colors"
        >
          Ver Servicios Rurales
        </button>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const whatsappLink = profile.contact_whatsapp
    ? `https://wa.me/${profile.contact_whatsapp.replace(/\D/g, '')}?text=Hola, vi su empresa en Rural24 y me gustaría consultar por sus servicios.`
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ================================================================== */}
      {/* BANNER */}
      {/* ================================================================== */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-brand-600 to-brand-600">
        {profile.banner_url && (
          <img 
            src={profile.banner_url} 
            alt="Banner" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Back button */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigateTo('/search', { cat: 'servicios-rurales' })}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur rounded-xl text-gray-700 hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* HEADER CON LOGO */}
      {/* ================================================================== */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-gray-100 border-4 border-white shadow-lg overflow-hidden">
                {profile.logo_url ? (
                  <img 
                    src={profile.logo_url} 
                    alt={profile.company_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    {profile.company_name}
                    {profile.is_verified && (
                      <span title="Empresa Verificada">
                        <CheckCircle className="w-6 h-6 text-blue-500" />
                      </span>
                    )}
                  </h1>
                  
                  {(profile.city || profile.province) && (
                    <p className="text-gray-600 flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {[profile.city, profile.province].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {profile.description && (
                <p className="text-gray-600 mt-4 line-clamp-3">
                  {profile.description}
                </p>
              )}

              {/* Servicios */}
              {profile.services_offered && profile.services_offered.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.services_offered.map((service, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-sm"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* BOTONES DE CONTACTO */}
          {/* ============================================================ */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
            {profile.allow_whatsapp && whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>
            )}

            {profile.contact_phone && (
              <a
                href={`tel:${profile.contact_phone}`}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Llamar
              </a>
            )}

            {profile.contact_email && profile.allow_contact_form && (
              <a
                href={`mailto:${profile.contact_email}`}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Email
              </a>
            )}

            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Globe className="w-5 h-5" />
                Web
              </a>
            )}

            {profile.facebook_url && (
              <a
                href={profile.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
            )}

            {profile.instagram_url && (
              <a
                href={profile.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-pink-100 text-pink-600 rounded-xl hover:bg-pink-200 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* CATÁLOGOS */}
      {/* ================================================================== */}
      {catalogs.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-600" />
            Catálogos de Productos y Servicios
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogs.map(catalog => (
              <a
                key={catalog.id}
                href={`#/empresa/${profile.slug}/catalogo/${catalog.slug}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4"
              >
                {catalog.cover_image_url ? (
                  <div className="aspect-video rounded-lg overflow-hidden mb-3">
                    <img 
                      src={catalog.cover_image_url} 
                      alt={catalog.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-gray-100 mb-3 flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300" />
                  </div>
                )}

                <h3 className="font-semibold text-gray-900 group-hover:text-brand-500 transition-colors">
                  {catalog.name}
                </h3>
                
                {catalog.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {catalog.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    {catalog.items_count || 0} productos
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-500 transition-colors" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* INFO ADICIONAL */}
      {/* ================================================================== */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Ubicación */}
          {(profile.city || profile.province || profile.address) && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-600" />
                Ubicación
              </h3>
              <div className="space-y-2 text-gray-600">
                {profile.address && <p>{profile.address}</p>}
                <p>{[profile.city, profile.province].filter(Boolean).join(', ')}</p>
              </div>
            </div>
          )}

          {/* Contacto */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-brand-600" />
              Contacto
            </h3>
            <div className="space-y-3">
              <p className="text-gray-900 font-medium">
                {profile.contact_first_name} {profile.contact_last_name}
              </p>
              {profile.contact_phone && (
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {profile.contact_phone}
                </p>
              )}
              {profile.contact_email && (
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {profile.contact_email}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyProfilePage;
