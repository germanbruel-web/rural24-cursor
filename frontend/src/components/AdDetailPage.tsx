import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, DollarSign, ArrowLeft, Phone, Mail, User, Settings, CheckCircle, Check, Star } from 'lucide-react';
import { DocumentTextIcon, InformationCircleIcon, Cog6ToothIcon, CheckBadgeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { Ad, SearchFilters } from '../../types';
import { getAdById } from '../services/adsService';
import { sendContactMessage } from '../services/contactService';
import { VerifiedBadge } from './UserBadges';
import PremiumBadge from './PremiumBadge';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './auth/AuthModal';
import { ProductCard } from './organisms/ProductCard';
import { getFeaturedForResults } from '../services/userFeaturedService';
import { supabase } from '../services/supabaseClient';
import { AdDetailDynamic } from './AdDetailDynamic';
import { getAttributes } from '../services/v2/attributesService';
import type { DynamicAttributeDB } from '../services/v2/attributesService';
import type { DynamicAttribute } from '../services/catalogService';
import { normalizeImages, getFirstImage } from '../utils/imageHelpers';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../constants/defaultImages';
import { getImageVariant } from '../utils/imageOptimizer';
import { TEXTS } from '../constants/texts';
import { formatPrice, formatBoolean } from '../utils/currency';
import { separateValues, formatAttributeLabel } from '../utils/textProcessing';
import { groupAttributes } from '../config/attributeGroups';

interface AdDetailPageProps {
  adId: string;
  onBack: () => void;
  onSearch?: (filters: SearchFilters) => void;
}

export const AdDetailPage: React.FC<AdDetailPageProps> = ({ adId, onBack, onSearch }) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sellerOtherAds, setSellerOtherAds] = useState<Ad[]>([]);
  const [loadingOtherAds, setLoadingOtherAds] = useState(false);
  const [featuredAds, setFeaturedAds] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  const [dynamicSchema, setDynamicSchema] = useState<DynamicAttribute[]>([]);
  
  const { user, profile } = useAuth();
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', lastName: '', email: '', phone: '', message: '' });
  const [sendingContact, setSendingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Inicializar desde sessionStorage para mantener estado durante la sesión
  const [hasContactedSeller, setHasContactedSeller] = useState(() => {
    if (typeof window !== 'undefined') {
      const key = `contacted_ad_${adId}`;
      return sessionStorage.getItem(key) === 'true';
    }
    return false;
  });

  useEffect(() => {
    loadAd();
  }, [adId]);

  // Autocompletar formulario cuando el usuario se loguea o cuando abre el formulario
  useEffect(() => {
    if (user && profile && showContactForm) {
      const names = profile.full_name?.split(' ') || ['', ''];
      console.log('📝 Autocompletando formulario:', { 
        fullName: profile.full_name, 
        email: user.email, 
        phone: profile.phone || profile.mobile 
      });
      setContactForm(prev => ({
        ...prev,
        name: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        email: user.email || '',
        phone: profile.phone || profile.mobile || ''
      }));
    }
  }, [user, profile, showContactForm]);

  // Verificar sessionStorage cuando cambia el aviso
  useEffect(() => {
    const key = `contacted_ad_${adId}`;
    const wasContacted = sessionStorage.getItem(key) === 'true';
    console.log('🔄 AdId cambió:', adId, '- Estado en sessionStorage:', wasContacted);
    setHasContactedSeller(wasContacted);
  }, [adId]);
  
  // Sincronizar con sessionStorage cuando cambia hasContactedSeller
  useEffect(() => {
    const key = `contacted_ad_${adId}`;
    if (hasContactedSeller) {
      sessionStorage.setItem(key, 'true');
      console.log('💾 Guardado en sessionStorage:', key, '= true');
    }
  }, [hasContactedSeller, adId]);

  const loadAd = async () => {
    console.log('📄 AdDetailPage - loadAd iniciado para adId:', adId);
    setLoading(true);
    const data = await getAdById(adId);
    console.log('📄 AdDetailPage - getAdById respondió:', {
      data,
      hasData: !!data,
      isManual: data && !data.sourceUrl,
      isScraped: data && !!data.sourceUrl,
      hasAttributes: data && !!data.attributes,
      images: data?.images,
      imagesType: typeof data?.images,
      imagesIsArray: Array.isArray(data?.images)
    });
    
    // 🔍 DEBUG: Verificar URLs de imágenes
    if (data?.images) {
      console.log('🖼️ DEBUG - Imágenes detectadas:', data.images);
      if (Array.isArray(data.images)) {
        data.images.forEach((img: any, idx: number) => {
          console.log(`🖼️ Imagen ${idx + 1}:`, {
            type: typeof img,
            value: img,
            url: img?.url || img,
            isString: typeof img === 'string',
            isObject: typeof img === 'object'
          });
        });
      }
    }
    
    setAd(data);
    
    // Si tiene attributes (JSONB) y subcategory_id, cargar el esquema dinámico V2
    if (data?.attributes && data?.subcategory_id) {
      try {
        const filters: any = {
          subcategoryId: data.subcategory_id,
          isActive: true,
        };
        
        // ✅ NUEVO: Si el aviso tiene type_id, filtrar por ese tipo
        if (data.type_id) {
          filters.typeId = data.type_id;
        }
        
        const attributesData = await getAttributes(filters);

        // Convertir DynamicAttributeDB a DynamicAttribute (mismo formato que usa PublicarAviso)
        const formatted: DynamicAttribute[] = attributesData.map((attr: DynamicAttributeDB) => ({
          id: attr.id,
          slug: attr.field_name,
          name: attr.field_label,
          description: attr.help_text || undefined,
          inputType: attr.field_type,
          dataType: attr.field_type,
          isRequired: attr.is_required,
          displayOrder: attr.sort_order,
          fieldGroup: attr.field_group || 'general',
          uiConfig: {
            label: attr.field_label,
            placeholder: attr.placeholder || undefined,
            prefix: attr.prefix || undefined,
            suffix: attr.suffix || undefined,
          },
          validations: {
            min: attr.min_value !== null ? attr.min_value : undefined,
            max: attr.max_value !== null ? attr.max_value : undefined,
          },
          isFilterable: false,
          isFeatured: false,
          options: Array.isArray(attr.field_options)
            ? attr.field_options.map((opt: string) => ({ value: opt, label: opt }))
            : [],
        }));

        setDynamicSchema(formatted);
        console.log('📐 Esquema dinámico V2 cargado:', formatted.length, 'atributos');
      } catch (error) {
        console.error('Error loading dynamic schema V2:', error);
      }
    }
    
    if (data?.user_id && data?.id) {
      // Cargar otros avisos del vendedor usando el UUID real del ad
      loadSellerOtherAds(data.user_id, data.id);
    }
    
    setLoading(false);
  };

  const loadSellerOtherAds = async (sellerId: string, currentAdUuid: string) => {
    setLoadingOtherAds(true);
    try {
      console.log('🔍 Cargando otros avisos del vendedor:', sellerId, 'excluyendo:', currentAdUuid);
      
      // Cargar avisos destacados si hay categoría
      if (ad?.category_id) {
        setLoadingFeatured(true);
        const { data: featured } = await getFeaturedForResults(ad.category_id, 5, 0);
        setFeaturedAds(featured || []);
        setLoadingFeatured(false);
      }
      
      // Query simple sin join - solo los ads
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', sellerId)
        .eq('status', 'active')
        .neq('id', currentAdUuid)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('❌ Error en query:', error);
        throw error;
      }
      
      console.log('✅ Avisos encontrados:', data?.length || 0, data);
      
      // Transformar a formato Product para usar con ProductCard
      const transformedAds = (data || []).map((adItem: any) => {
        // Normalizar imágenes de cada aviso
        const normalizedImages = normalizeImages(adItem.images || adItem.image_urls || []);
        const firstImageUrl = getFirstImage(adItem.images || adItem.image_urls || []);
        
        return {
          id: adItem.id,
          slug: adItem.slug,
          short_id: adItem.short_id,
          title: adItem.title,
          description: adItem.description,
          price: adItem.price,
          currency: adItem.currency || 'ARS',
          location: adItem.location || '',
          province: adItem.province,
          imageUrl: firstImageUrl,
          images: normalizedImages,
          category: adItem.category || '',
          subcategory: adItem.subcategory,
          brand: adItem.brand,
          model: adItem.model,
          user_id: adItem.user_id,
          sourceUrl: '#',
          isSponsored: false,
          createdAt: adItem.created_at,
          updatedAt: adItem.updated_at,
          enrichedData: adItem.enriched_data,
          // Usar los datos del seller del ad principal
          seller: ad?.seller
        };
      });

      console.log('✅ Avisos transformados:', transformedAds.length);
      setSellerOtherAds(transformedAds);
    } catch (error) {
      console.error('❌ Error loading seller other ads:', error);
    } finally {
      setLoadingOtherAds(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad?.user_id) return;
    
    // ⚠️ VALIDAR AUTENTICACIÓN
    if (!user) {
      alert('Debes iniciar sesión para enviar mensajes');
      setShowAuthModal(true);
      return;
    }

    setSendingContact(true);
    try {
      const result = await sendContactMessage({
        ad_id: ad.id,
        ad_owner_id: ad.user_id,
        sender_user_id: user.id,
        sender_name: contactForm.name,
        sender_last_name: contactForm.lastName,
        sender_email: contactForm.email,
        sender_phone: contactForm.phone,
        message: contactForm.message
      });

      if (result.success) {
        console.log('✅ Mensaje enviado exitosamente - Guardando estado para aviso:', ad.id);
        setContactSuccess(true);
        setHasContactedSeller(true);
        setContactForm({ name: '', lastName: '', email: '', phone: '', message: '' });
        console.log('🔒 Estado contactado guardado en sessionStorage - Botón deshabilitado hasta cerrar sesión');
      } else {
        // Manejo de errores específicos
        const errorMessage = result.error?.message || 'Error al enviar el mensaje';
        
        if (result.error?.code === 'SENDER_LIMIT_REACHED') {
          alert(`⚠️ Límite Alcanzado\n\n${errorMessage}\n\nActualiza a Premium para contactos ilimitados.`);
        } else if (result.error?.code === 'RECEIVER_LIMIT_REACHED') {
          alert(`⚠️ Vendedor No Disponible\n\n${errorMessage}\n\nIntenta contactar al vendedor más tarde o busca avisos similares.`);
        } else if (result.error?.code === 'EMAIL_NOT_VERIFIED') {
          alert(`⚠️ Email No Verificado\n\n${errorMessage}\n\nRevisa tu bandeja de entrada y verifica tu email.`);
        } else {
          alert(`❌ Error\n\n${errorMessage}`);
        }
      }
    } finally {
      setSendingContact(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!ad) {
    console.log('❌ AdDetailPage - No hay ad, mostrando "no encontrado"');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{TEXTS.adDetail.notFound}</h2>
          <button
            onClick={onBack}
            className="text-brand-600 hover:text-brand-700 hover:underline"
          >
            {TEXTS.adDetail.backToResults}
          </button>
        </div>
      </div>
    );
  }

  const images = normalizeImages(ad.images || ad.image_urls || []);
  console.log('🖼️ AdDetailPage - Renderizando ad:', {
    id: ad.id,
    title: ad.title,
    hasSourceUrl: !!ad.sourceUrl,
    isManual: !ad.sourceUrl,
    imagesRaw: ad.images,
    imagesNormalized: images,
    imagesCount: images.length,
    firstImageUrl: images[0]?.url,
    category: ad.category,
    subcategory: ad.subcategory
  });

  // 🛡️ Función defensiva para navegación del breadcrumb
  const handleBreadcrumbClick = (filters: SearchFilters) => {
    if (onSearch) {
      onSearch(filters);
      onBack();
    } else {
      // Fallback: Log warning si no hay handler
      console.warn('⚠️ onSearch no disponible, navegación deshabilitada');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Título + Breadcrumb estáticos */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 py-2">
          <h1 id="ad-title" className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-3 pt-[10px] break-words overflow-wrap">
            {ad.title}
          </h1>          
          {/* Breadcrumb debajo del título */}
          <nav id="breadcrumb-nav" className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-brand-600 transition-colors flex items-center gap-1"
              aria-label={TEXTS.adDetail.back}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{TEXTS.adDetail.back}</span>
            </button>
            
            <span className="text-gray-400">/</span>
            
            <button
              onClick={onBack}
              className="text-brand-600 hover:text-brand-700 hover:underline font-medium"
            >
              {TEXTS.adDetail.home}
            </button>
            
            {ad.category && (
              <>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => handleBreadcrumbClick({ 
                    categories: [ad.category],
                    query: ad.category 
                  })}
                  disabled={!onSearch}
                  className="text-brand-600 hover:text-brand-700 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed max-w-[150px] truncate"
                  title={ad.category}
                >
                  {ad.category}
                </button>
              </>
            )}
            
            {ad.subcategory && (
              <>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => handleBreadcrumbClick({ 
                    categories: [ad.category],
                    subcategories: [ad.subcategory],
                    query: `${ad.category} ${ad.subcategory}` 
                  })}
                  disabled={!onSearch}
                  className="text-brand-600 hover:text-brand-700 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed max-w-[150px] truncate"
                  title={ad.subcategory}
                >
                  {ad.subcategory}
                </button>
              </>
            )}
            
            {ad.brand && (
              <>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => handleBreadcrumbClick({ 
                    categories: [ad.category],
                    subcategories: ad.subcategory ? [ad.subcategory] : undefined,
                    query: `${ad.category} ${ad.subcategory || ''} ${ad.brand}`.trim()
                  })}
                  disabled={!onSearch}
                  className="text-brand-600 hover:text-brand-700 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed max-w-[120px] truncate"
                  title={ad.brand}
                >
                  {ad.brand}
                </button>
              </>
            )}
            
            {ad.model && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-700 font-semibold max-w-[120px] truncate inline-block" title={ad.model}>{ad.model}</span>
              </>
            )}
          </nav>        </div>
      </div>

      <div id="ad-detail-content" className="max-w-[1400px] mx-auto px-4 py-6">
        <div id="ad-detail-grid" className="grid lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Imágenes y descripción */}
          <div id="ad-left-column" className="lg:col-span-2 space-y-6">
            {/* Galería de imágenes */}
            <div id="image-gallery" className="bg-white rounded-lg shadow-md overflow-hidden">
              {images.length > 0 ? (
                <>
                  <div className="relative aspect-[16/9] bg-gray-100">
                    <img
                      src={getImageVariant(images[currentImageIndex]?.url || images[currentImageIndex], 'original')}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                      decoding="async"
                      onLoad={() => {
                        console.log('✅ Imagen principal cargada correctamente:', images[currentImageIndex]);
                      }}
                      onError={(e) => {
                        const imageUrl = images[currentImageIndex]?.url || images[currentImageIndex];
                        console.error('❌ Error cargando imagen principal');
                        console.error('   URL fallida:', imageUrl);
                        console.error('   Tipo URL:', typeof imageUrl);
                        console.error('   Longitud URL:', imageUrl?.length);
                        console.error('   Comienza con http:', imageUrl?.startsWith('http'));
                        const target = e.currentTarget;
                        // Evitar bucle infinito de errores
                        if (target.src !== DEFAULT_PLACEHOLDER_IMAGE) {
                          console.log('🔄 Usando fallback:', DEFAULT_PLACEHOLDER_IMAGE);
                          target.src = DEFAULT_PLACEHOLDER_IMAGE;
                        }
                      }}
                    />
                  </div>
                  {images.length > 1 && (
                    <div className="p-4 grid grid-cols-6 gap-2">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            currentImageIndex === idx
                              ? 'border-brand-600 scale-105'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <img
                            src={getImageVariant(img?.url || img, 'thumb')}
                            alt={`${ad.title} ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              console.error('❌ Error cargando miniatura:', img);
                              const target = e.currentTarget;
                              if (target.src !== DEFAULT_PLACEHOLDER_IMAGE) {
                                target.src = DEFAULT_PLACEHOLDER_IMAGE;
                              }
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">Sin imagen</span>
                </div>
              )}
            </div>

            {/* Descripción - Con borde verde */}
            <div id="ad-description" className="bg-white rounded-xl shadow-md p-4 sm:p-6 border-l-4 border-brand-600">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-brand-600" />
                {TEXTS.adDetail.description}
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base break-words overflow-wrap">
                {ad.description}
              </p>
            </div>

            {/* Ficha Técnica - Sistema de bordes verde unificado */}
            <div id="technical-specs" className="space-y-6">
                {ad.attributes && Object.keys(ad.attributes).length > 0 && dynamicSchema.length > 0 ? (
                  /* Atributos dinámicos desde JSONB con agrupación */
                  (() => {
                    // Agrupar atributos por fieldGroup
                    const grouped = dynamicSchema.reduce((acc, attr) => {
                      const group = attr.fieldGroup || 'general';
                      if (!acc[group]) acc[group] = [];
                      const value = ad.attributes[attr.slug];
                      if (value !== undefined && value !== null && value !== '') {
                        acc[group].push({ ...attr, value });
                      }
                      return acc;
                    }, {} as Record<string, Array<DynamicAttribute & { value: any }>>);

                    // Usar títulos desde config
                    const groupTitles = TEXTS.attributeGroups;

                    return (
                      <>
                        {Object.entries(grouped).map(([groupKey, attrs]) => (
                          <div key={groupKey} className="bg-white rounded-xl shadow-md p-4 sm:p-6 border-l-4 border-brand-600">
                            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <Cog6ToothIcon className="w-6 h-6 text-brand-600" />
                              {groupTitles[groupKey as keyof typeof groupTitles] || groupKey}
                            </h3>
                            <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                              {attrs.map((attr) => {
                                // Si el valor es un array, mostrarlo como lista
                                const isArray = Array.isArray(attr.value);
                                const displayValue = formatBoolean(attr.value);
                                
                                return (
                                  <div key={attr.slug} className="flex flex-col">
                                    <span className="text-gray-600">
                                      {attr.name}
                                    </span>
                                    {isArray && attr.value.length > 0 ? (
                                      <ul className="mt-2 space-y-2">
                                        {attr.value.map((item: string, idx: number) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-base font-bold text-gray-900">{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span className="text-base font-bold text-gray-900 mt-1">
                                        {attr.uiConfig?.prefix && `${attr.uiConfig.prefix} `}
                                        {displayValue}
                                        {attr.uiConfig?.suffix && ` ${attr.uiConfig.suffix}`}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </>
                    );
                  })()
                ) : ad.attributes && Object.keys(ad.attributes).length > 0 ? (
                  /* Fallback: mostrar atributos raw del JSONB sin schema */
                  <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border-l-4 border-brand-600">
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckBadgeIcon className="w-6 h-6 text-brand-600" />
                      Características
                    </h3>
                    <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                      {Object.entries(ad.attributes)
                        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
                        .map(([key, value]) => {
                          const isArray = Array.isArray(value);
                          const displayValue = typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value;
                          
                          return (
                            <div key={key} className="flex flex-col">
                              <span className="text-gray-600">
                                {key.replace(/_/g, ' ')}
                              </span>
                              {isArray && value.length > 0 ? (
                                <ul className="mt-2 space-y-2">
                                  {value.map((item: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <CheckCircle className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                                      <span className="text-base font-bold text-gray-900">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-base font-bold text-gray-900 mt-1">
                                  {String(displayValue)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* SECCIÓN 1: Información Básica - Compacta */}
                    {(ad.category || ad.subcategory || ad.brand || ad.model || ad.year || ad.condition) && (
                      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border-l-4 border-brand-600">
                        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <InformationCircleIcon className="w-5 h-5 text-brand-600" />
                          Información General
                        </h3>
                        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                          {ad.category && (
                            <div className="flex flex-col">
                              <span className="text-gray-600">Categoría</span>
                              <span className="text-base font-bold text-gray-900 mt-1">{ad.category}</span>
                            </div>
                          )}
                          
                          {ad.subcategory && (
                            <div className="flex flex-col">
                              <span className="text-gray-600">{TEXTS.adDetail.subcategory}</span>
                              <span className="text-base font-bold text-gray-900 mt-1">{ad.subcategory}</span>
                            </div>
                          )}
                          
                          {ad.brand && (
                            <div className="flex flex-col">
                              <span className="text-gray-600">{TEXTS.adDetail.brand}</span>
                              <span className="text-base font-bold text-gray-900 mt-1">{ad.brand}</span>
                            </div>
                          )}
                          
                          {ad.model && (
                            <div className="flex flex-col">
                              <span className="text-gray-600">{TEXTS.adDetail.model}</span>
                              <span className="text-base font-bold text-gray-900 mt-1">{ad.model}</span>
                            </div>
                          )}
                          
                          {ad.year && (
                            <div className="flex flex-col">
                              <span className="text-gray-600">{TEXTS.adDetail.year}</span>
                              <span className="text-base font-bold text-gray-900 mt-1">{ad.year}</span>
                            </div>
                          )}
                          
                          {ad.condition && (
                            <div className="flex flex-col">
                              <span className="text-gray-600">{TEXTS.adDetail.condition}</span>
                              <span className="text-base font-bold text-brand-600 mt-1">{ad.condition}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mensaje si no hay datos */}
                    {!ad.category && !ad.subcategory && !ad.brand && !ad.model && !ad.year && !ad.condition && (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{TEXTS.adDetail.noSpecs}</h3>
                        <p className="text-gray-600">{TEXTS.adDetail.contactSellerForDetails}</p>
                      </div>
                    )}
                  </>
                )}
            </div>

            {/* Características adicionales - Con borde verde */}
            {ad.enriched_data && Object.keys(ad.enriched_data).length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border-l-4 border-brand-600">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckBadgeIcon className="w-5 h-5 text-brand-600" />
                  {TEXTS.adDetail.characteristics}
                </h3>
                <ul className="space-y-3">
                  {Object.entries(ad.enriched_data).map(([key, value]) => {
                    const values = separateValues(String(value));
                    
                    return values.map((result, idx) => (
                      <li key={`${key}-${idx}`} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <CheckCircle className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                        <span className="text-base text-gray-900 leading-relaxed">{result.value}</span>
                      </li>
                    ));
                  }).flat()}
                </ul>
              </div>
            )}
          </div>

          {/* Columna derecha - Info del vendedor y contacto */}
          <div id="ad-right-column" className="space-y-6">
            {/* Precio destacado */}
            <div id="price-card" className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
              <div className="mb-6">
                <p className="text-base text-gray-500 font-medium mb-2">{TEXTS.adDetail.price}</p>
                <div className="text-4xl sm:text-5xl font-black text-gray-900">
                  {formatPrice(ad.price, ad.currency)}
                </div>
              </div>

              {/* Info del vendedor - SIEMPRE VISIBLE */}
              <div className="mb-6 p-4 rounded-lg bg-gray-50">
                <div className="space-y-2.5">
                  {/* Mostrar nombre del vendedor con icono adelante */}
                  {ad.seller?.full_name ? (
                    <div className="text-base text-gray-900 font-semibold flex items-center gap-2">
                      <User className="w-5 h-5 text-brand-600 flex-shrink-0" />
                      {(() => {
                        const names = ad.seller.full_name.split(' ');
                        if (names.length >= 2) {
                          return `${names[0]} ${names[names.length - 1].charAt(0)}.`;
                        }
                        return ad.seller.full_name;
                      })()}
                    </div>
                  ) : (
                    <div className="text-base text-gray-900 font-semibold flex items-center gap-2">
                      <User className="w-5 h-5 text-brand-600 flex-shrink-0" />
                      Vendedor Anónimo
                    </div>
                  )}
                  
                  {/* Badge verificado solo si existe seller */}
                  {ad.seller && (
                    <div className="flex items-center">
                      <VerifiedBadge 
                        verified={ad.seller.email_verified} 
                        size="sm"
                        showLabel={true}
                      />
                    </div>
                  )}

                  {/* Fecha de registro del usuario */}
                  {ad.seller?.created_at && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      <span>
                        Registrado desde {new Date(ad.seller.created_at).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </span>
                    </div>
                  )}

                  {/* Ubicación */}
                  {(ad.province || ad.location) && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 pt-2 border-t border-gray-200">
                      <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                      <div>
                        {ad.province && <span className="font-medium">{ad.province}</span>}
                        {ad.province && ad.location && <span className="text-gray-400"> • </span>}
                        {ad.location && <span>{ad.location}</span>}
                      </div>
                    </div>
                  )}

                  {/* Fecha de publicación */}
                  {ad.created_at && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      <span>
                        Publicado el {new Date(ad.created_at).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de Contacto - SIEMPRE VISIBLE */}
              {!showContactForm ? (
                <div className="contact-button-wrapper relative">
                  <style>{`
                    #contact-seller-btn {
                      width: 100%;
                      padding: 1rem 1.5rem;
                      font-size: 1.125rem;
                      font-weight: 600;
                      border-radius: 9999px;
                      border: none;
                      cursor: pointer;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      gap: 0.5rem;
                      transition: all 0.3s ease;
                      position: relative;
                      z-index: 1;
                    }
                    
                    /* Estado activo (verde - brand-600) */
                    #contact-seller-btn:not(:disabled) {
                      background: rgb(var(--color-brand-600));
                      color: white;
                      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                    }
                    
                    #contact-seller-btn:not(:disabled):hover {
                      background: rgb(var(--color-brand-700));
                      box-shadow: 0 4px 12px rgba(22, 161, 53, 0.3);
                      transform: translateY(-1px);
                    }
                    
                    #contact-seller-btn:not(:disabled):active {
                      transform: translateY(0);
                    }
                    
                    /* Estado desactivado (gris) */
                    #contact-seller-btn:disabled {
                      background: #e5e7eb;
                      color: #374151;
                      cursor: not-allowed;
                      box-shadow: none;
                    }
                    
                    #contact-seller-btn:disabled svg {
                      color: #374151;
                    }
                  `}</style>
                  <button
                    id="contact-seller-btn"
                    onClick={() => {
                      console.log('🖱️ Click en botón - Estado actual:', { 
                        hasContactedSeller, 
                        disabled: hasContactedSeller,
                        user: !!user,
                        adId: ad?.id
                      });
                      if (!user) {
                        // Usuario NO autenticado → Obligar a login/registro
                        setShowAuthModal(true);
                      } else {
                        // Usuario autenticado → Mostrar formulario de contacto
                        setShowContactForm(true);
                      }
                    }}
                    disabled={hasContactedSeller}
                  >
                    {hasContactedSeller ? (
                      <>
                        <Check className="w-5 h-5" />
                        {TEXTS.adDetail.alreadyContacted}
                      </>
                    ) : !user ? (
                      <>
                        🔒 {TEXTS.adDetail.loginToContact}
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        {TEXTS.adDetail.contactSeller}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                    <div id="contact-success-modal" className="space-y-3">
                      {contactSuccess ? (
                        <div className="bg-white border-2 border-brand-600 rounded-lg p-6 text-center shadow-lg">
                          <div className="mb-4">
                            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Check className="w-8 h-8 text-brand-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{TEXTS.adDetail.messageSent}</h3>
                            <p className="text-gray-600 text-sm mb-4">
                              El vendedor recibirá tu consulta y te responderá a la brevedad.
                            </p>
                          </div>
                          
                          <button
                            onClick={() => {
                              setContactSuccess(false);
                              setShowContactForm(false);
                            }}
                            className="w-full bg-brand-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-brand-500 transition-colors"
                          >
                            {TEXTS.common.close}
                          </button>
                          
                          {!user && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-sm text-gray-600 mb-3">
                                {TEXTS.adDetail.loginTip}
                              </p>
                              <button
                                onClick={() => setShowAuthModal(true)}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                              >
                                {TEXTS.adDetail.createAccountFree}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <form id="contact-form" onSubmit={handleContactSubmit} className="space-y-3">
                          {user && (
                            <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 mb-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <CheckCircleIcon className="w-4 h-4 text-brand-600" />
                                <p className="text-xs text-brand-600">{TEXTS.adDetail.sendingAs}</p>
                              </div>
                              <p className="text-sm font-medium text-brand-800 break-words">
                                {contactForm.name} {contactForm.lastName} · {contactForm.phone}
                              </p>
                              <p className="text-xs text-brand-600 mt-1">{user.email}</p>
                            </div>
                          )}
                          {!user && (
                            <>
                              <input 
                                type="text" 
                                required 
                                placeholder={TEXTS.adDetail.name}
                                value={contactForm.name} 
                                onChange={(e) => setContactForm({...contactForm, name: e.target.value})} 
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                              <input 
                                type="text" 
                                required 
                                placeholder={TEXTS.adDetail.lastName}
                                value={contactForm.lastName} 
                                onChange={(e) => setContactForm({...contactForm, lastName: e.target.value})} 
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                              <input 
                                type="email" 
                                required 
                                placeholder={TEXTS.adDetail.email}
                                value={contactForm.email}
                                onChange={(e) => setContactForm({...contactForm, email: e.target.value})} 
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                              <input 
                                type="tel" 
                                required
                                placeholder={TEXTS.adDetail.phone}
                                value={contactForm.phone} 
                                onChange={(e) => setContactForm({...contactForm, phone: e.target.value})} 
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                            </>
                          )}
                          <textarea 
                            required 
                            placeholder={TEXTS.adDetail.message}
                            value={contactForm.message} 
                            onChange={(e) => setContactForm({...contactForm, message: e.target.value})} 
                            rows={4} 
                            className="w-full px-3 py-2 border rounded-lg" 
                          />
                          <div className="flex gap-2">
                            <button 
                              type="button" 
                              onClick={() => setShowContactForm(false)} 
                              className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              {TEXTS.common.cancel}
                            </button>
                            <button 
                              type="submit" 
                              disabled={sendingContact} 
                              className="flex-1 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-colors disabled:bg-gray-300"
                            >
                              {sendingContact ? TEXTS.adDetail.sending : TEXTS.adDetail.sendMessage}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de autenticación */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialView="register"
      />

      {/* Otros avisos del vendedor */}
      {ad?.user_id && (
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-[1400px] mx-auto px-4 py-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {TEXTS.adDetail.otherAds}
              </h2>
              {loadingOtherAds && (
                <p className="text-gray-600 mt-1">{TEXTS.common.loading}</p>
              )}
              {!loadingOtherAds && sellerOtherAds.length === 0 && (
                <p className="text-gray-600 mt-1">{TEXTS.adDetail.noOtherAds}</p>
              )}
              {!loadingOtherAds && sellerOtherAds.length > 0 && (
                <p className="text-gray-600 mt-1">
                  {sellerOtherAds.length} {sellerOtherAds.length === 1 ? 'aviso disponible' : 'avisos disponibles'} de este vendedor
                </p>
              )}
            </div>
            
            {loadingOtherAds ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
              </div>
            ) : sellerOtherAds.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {sellerOtherAds.map((otherAd) => (
                  <ProductCard 
                    key={otherAd.id} 
                    product={otherAd}
                    variant="compact"
                    showProvince={true}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Avisos Destacados */}
      {ad?.category_id && featuredAds.length > 0 && (
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-[1400px] mx-auto px-4 py-12">
            {/* Título con icono Lucide */}
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-6 h-6 text-yellow-500" fill="currentColor" />
              <h2 className="text-2xl font-bold text-gray-900">
                Avisos Destacados
              </h2>
              <span className="text-sm text-gray-500">({featuredAds.length})</span>
            </div>
            
            {loadingFeatured ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {featuredAds.map((featuredAd) => {
                  const firstImage = featuredAd.images?.[0];
                  const imageUrl = typeof firstImage === 'string' 
                    ? firstImage 
                    : ((firstImage as { url?: string })?.url || '');
                  
                  return (
                    <div key={featuredAd.id}>
                      <ProductCard 
                        product={{
                          ...featuredAd,
                          id: featuredAd.id,
                          title: featuredAd.title,
                          price: featuredAd.price,
                          currency: featuredAd.currency || 'ARS',
                          category: featuredAd.categories?.name || '',
                          location: featuredAd.province || featuredAd.location || '',
                          imageUrl,
                          images: featuredAd.images,
                          sourceUrl: '',
                          isSponsored: true,
                        }}
                        variant="compact"
                        showProvince={true}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
