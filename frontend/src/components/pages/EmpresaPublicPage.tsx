import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2, MapPin, Phone, Mail, Globe, MessageCircle,
  Facebook, Instagram, CheckCircle, ArrowLeft, Package,
  Eye, Tag, Loader2, ImageOff, User,
  Clock, Wrench, Zap, Wind, FileText, ExternalLink,
} from 'lucide-react';
import { getCompanyPublicPage, type CompanyPublicPage } from '../../services/empresaService';
import { supabase } from '../../services/supabaseClient';
import { navigateTo } from '../../hooks/useNavigate';

// ── Tipos locales ──────────────────────────────────────────────────────────

interface AdCard {
  id: string;
  slug: string | null;
  title: string;
  price: number | null;
  price_unit: string | null;
  currency: string;
  province: string | null;
  city: string | null;
  images: { url: string }[];
  categories?: { display_name: string } | null;
  subcategories?: { display_name: string } | null;
}

// ── Component ──────────────────────────────────────────────────────────────

export function EmpresaPublicPage() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const slug = useMemo(() => {
    const match = hash.match(/^#\/empresa\/([^/]+)/);
    return match ? match[1] : null;
  }, [hash]);

  const [empresa, setEmpresa] = useState<CompanyPublicPage | null>(null);
  const [ads, setAds] = useState<AdCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    loadAll(slug);
  }, [slug]);

  const loadAll = async (s: string) => {
    setLoading(true);
    const data = await getCompanyPublicPage(s);
    setEmpresa(data);

    if (data) {
      const { data: adsData } = await supabase
        .from('ads')
        .select(`
          id, slug, title, price, price_unit, currency, province, city, images,
          categories:category_id(display_name),
          subcategories:subcategory_id(display_name)
        `)
        .eq('business_profile_id', data.id)
        .eq('status', 'active')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(12);

      setAds((adsData as unknown as AdCard[]) ?? []);
    }
    setLoading(false);
  };

  // ── Loading / Error ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
        <Building2 className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Empresa no encontrada</h1>
        <p className="text-gray-600 mb-6">La empresa que buscás no existe o fue desactivada.</p>
        <button
          onClick={() => navigateTo('/')}
          className="px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const whatsappLink = empresa.whatsapp
    ? `https://wa.me/${empresa.whatsapp.replace(/\D/g, '')}?text=Hola, vi su empresa en Rural24 y quería consultar.`
    : null;

  const gallery = empresa.gallery_images ?? [];
  const brands = empresa.brands_worked ?? [];
  const cultivos = empresa.cultivos_json ?? [];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── COVER ─────────────────────────────────────────────────────── */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-brand-700 to-brand-500 overflow-hidden">
        {empresa.cover_url && (
          <img
            src={empresa.cover_url}
            alt="Portada"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute top-4 left-4">
          <button
            onClick={() => history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur rounded-xl text-gray-700 hover:bg-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
        {/* Views counter */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-black/40 text-white rounded-full text-xs">
          <Eye className="w-3.5 h-3.5" />
          {empresa.profile_views} vista{empresa.profile_views !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── HEADER CARD ───────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col sm:flex-row gap-6">

            {/* Logo */}
            <div className="shrink-0">
              <div className="w-28 h-28 rounded-2xl bg-gray-100 border-4 border-white shadow-lg overflow-hidden">
                {empresa.logo_url ? (
                  <img src={empresa.logo_url} alt={empresa.company_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Info principal */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                {empresa.company_name}
                {empresa.is_verified && (
                  <CheckCircle className="w-6 h-6 text-brand-500 shrink-0" aria-label="Empresa verificada" />
                )}
              </h1>

              {empresa.tagline && (
                <p className="text-brand-600 font-medium mt-1">{empresa.tagline}</p>
              )}

              {/* Ubicación */}
              {(empresa.city || empresa.province) && (
                <p className="text-gray-500 text-sm flex items-center gap-1 mt-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {[empresa.city, empresa.province].filter(Boolean).join(', ')}
                </p>
              )}

              {/* Contacto secundario */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                {empresa.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />{empresa.phone}
                  </span>
                )}
                {empresa.email && (
                  <a href={`mailto:${empresa.email}`} className="flex items-center gap-1 hover:text-brand-600 transition-colors">
                    <Mail className="w-3.5 h-3.5" />{empresa.email}
                  </a>
                )}
                {empresa.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />{empresa.address}
                  </span>
                )}
              </div>

              {/* Owner público */}
              {empresa.owner_public && empresa.owner_full_name && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                  <User className="w-3 h-3" />Responsable: {empresa.owner_full_name}
                </p>
              )}

              {/* Categoría */}
              {empresa.category_name && (
                <span className="inline-flex items-center gap-1 mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  <Tag className="w-3 h-3" />{empresa.category_name}
                </span>
              )}

              {/* Social Proof chips */}
              {(empresa.anos_experiencia || empresa.area_cobertura || empresa.factura || empresa.usa_drones) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {empresa.anos_experiencia != null && empresa.anos_experiencia > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs rounded-full font-medium">
                      <Clock className="w-3 h-3" />{empresa.anos_experiencia} años de exp.
                    </span>
                  )}
                  {empresa.area_cobertura && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs rounded-full font-medium capitalize">
                      <Globe className="w-3 h-3" />{empresa.area_cobertura}
                    </span>
                  )}
                  {empresa.factura && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs rounded-full font-medium">
                      <FileText className="w-3 h-3" />Factura
                    </span>
                  )}
                  {empresa.usa_drones && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs rounded-full font-medium">
                      <Wind className="w-3 h-3" />Drones
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botones de contacto */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium">
                <MessageCircle className="w-4 h-4" />WhatsApp
              </a>
            )}
            {empresa.website && (
              <a href={empresa.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
                <Globe className="w-4 h-4" />Sitio Web
              </a>
            )}
            {empresa.social_networks?.facebook && (
              <a href={empresa.social_networks.facebook} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors text-sm font-medium">
                <Facebook className="w-4 h-4" />Facebook
              </a>
            )}
            {empresa.social_networks?.instagram && (
              <a href={empresa.social_networks.instagram} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-pink-100 text-pink-600 rounded-xl hover:bg-pink-200 transition-colors text-sm font-medium">
                <Instagram className="w-4 h-4" />Instagram
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Stats bar ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-brand-600">{empresa.ads_count}</p>
            <p className="text-xs text-gray-500 mt-0.5">Avisos activos</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-brand-600">{empresa.profile_views}</p>
            <p className="text-xs text-gray-500 mt-0.5">Visitas al perfil</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center flex flex-col items-center justify-center">
            {empresa.is_verified ? (
              <>
                <CheckCircle className="w-7 h-7 text-brand-500 mb-0.5" />
                <p className="text-xs text-gray-500">Verificado</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-300">—</p>
                <p className="text-xs text-gray-400 mt-0.5">Sin verificar</p>
              </>
            )}
          </div>
        </div>

        {/* Descripción */}
        {empresa.description && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Sobre la empresa</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{empresa.description}</p>
          </div>
        )}

        {/* ── Zona de Cobertura ─────────────────────────────────────── */}
        {(empresa.area_cobertura || empresa.superficie_maxima) && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-600" />
              Zona de cobertura
            </h2>
            <div className="flex flex-wrap gap-4">
              {empresa.area_cobertura && (
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-200 rounded-lg">
                  <Globe className="w-4 h-4 text-brand-600" />
                  <div>
                    <p className="text-xs text-brand-500 font-medium uppercase tracking-wide">Alcance</p>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{empresa.area_cobertura}</p>
                  </div>
                </div>
              )}
              {empresa.superficie_maxima != null && empresa.superficie_maxima > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Superficie máx.</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {empresa.superficie_maxima.toLocaleString('es-AR')} ha / campaña
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Equipamiento y Capacidades ────────────────────────────── */}
        {(empresa.anos_experiencia != null || empresa.equipamiento_propio || empresa.aplica_precision || empresa.usa_drones || empresa.factura || cultivos.length > 0) && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-brand-600" />
              Equipamiento y capacidades
            </h2>

            {/* Años de experiencia chip */}
            {empresa.anos_experiencia != null && empresa.anos_experiencia > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-brand-500" />
                <span className="text-sm font-semibold text-gray-800">
                  {empresa.anos_experiencia} {empresa.anos_experiencia === 1 ? 'año' : 'años'} de experiencia
                </span>
              </div>
            )}

            {/* Verificaciones booleanas */}
            {(empresa.equipamiento_propio || empresa.aplica_precision || empresa.usa_drones || empresa.factura) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {empresa.equipamiento_propio && (
                  <div className="flex flex-col items-center gap-1.5 p-3 bg-brand-50 rounded-xl border border-brand-100 text-center">
                    <Wrench className="w-5 h-5 text-brand-600" />
                    <span className="text-xs font-medium text-gray-700">Equipo propio</span>
                  </div>
                )}
                {empresa.aplica_precision && (
                  <div className="flex flex-col items-center gap-1.5 p-3 bg-brand-50 rounded-xl border border-brand-100 text-center">
                    <Zap className="w-5 h-5 text-brand-600" />
                    <span className="text-xs font-medium text-gray-700">Agr. de precisión</span>
                  </div>
                )}
                {empresa.usa_drones && (
                  <div className="flex flex-col items-center gap-1.5 p-3 bg-brand-50 rounded-xl border border-brand-100 text-center">
                    <Wind className="w-5 h-5 text-brand-600" />
                    <span className="text-xs font-medium text-gray-700">Usa drones</span>
                  </div>
                )}
                {empresa.factura && (
                  <div className="flex flex-col items-center gap-1.5 p-3 bg-brand-50 rounded-xl border border-brand-100 text-center">
                    <FileText className="w-5 h-5 text-brand-600" />
                    <span className="text-xs font-medium text-gray-700">Emite factura</span>
                  </div>
                )}
              </div>
            )}

            {/* Cultivos */}
            {cultivos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Cultivos</p>
                <div className="flex flex-wrap gap-2">
                  {cultivos.map((c, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full capitalize">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Marcas */}
        {brands.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Marcas con las que trabajamos</h2>
            <div className="flex flex-wrap gap-3">
              {brands.map((b, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} className="w-6 h-6 object-contain" />
                  ) : null}
                  <span className="text-sm font-medium text-gray-700">{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Galería */}
        {gallery.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Galería</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setGalleryIndex(i)}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    galleryIndex === i ? 'border-brand-500' : 'border-transparent hover:border-brand-300'
                  }`}
                >
                  <img src={img.url} alt={img.caption ?? `Foto ${i + 1}`} className="w-full h-full object-cover" />
                  {img.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs px-2 py-1 truncate">
                      {img.caption}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Avisos activos */}
        {ads.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-600" />
              Avisos publicados
              <span className="text-sm font-normal text-gray-400">({empresa.ads_count} activos)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ads.map(ad => (
                <a
                  key={ad.id}
                  href={`#/ad/${ad.slug ?? ad.id}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                >
                  {/* Imagen */}
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    {ad.images?.[0]?.url ? (
                      <img
                        src={ad.images[0].url}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    {/* Breadcrumb */}
                    {(ad.categories || ad.subcategories) && (
                      <p className="text-xs text-gray-400 mb-1 truncate">
                        {[ad.categories?.display_name, ad.subcategories?.display_name]
                          .filter(Boolean).join(' › ')}
                      </p>
                    )}
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {ad.title}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-brand-600 font-bold text-sm">
                        {ad.price
                          ? `${ad.currency === 'USD' ? 'USD' : '$'} ${ad.price.toLocaleString('es-AR')}${ad.price_unit ? ` / ${ad.price_unit.replace(/-/g, ' ')}` : ''}`
                          : '—'
                        }
                      </span>
                      {(ad.city || ad.province) && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5 truncate max-w-[40%]">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {ad.city ?? ad.province}
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {empresa.ads_count > 12 && (
              <div className="text-center mt-6">
                <a
                  href={`#/search?empresa=${empresa.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-brand-600 text-brand-600 rounded-xl hover:bg-brand-50 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver todos los avisos
                </a>
              </div>
            )}
          </div>
        )}

        {/* Estado vacío */}
        {ads.length === 0 && empresa.ads_count === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">Esta empresa no tiene avisos publicados aún.</p>
          </div>
        )}
      </div>

      {/* Padding inferior */}
      <div className="pb-12" />
    </div>
  );
}

export default EmpresaPublicPage;
