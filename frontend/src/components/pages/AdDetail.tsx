import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import {
  MapPin, Calendar, Tag, ArrowLeft,
  ChevronLeft, ChevronRight, ZoomIn, X, MessageCircle,
  User, CheckCircle, CheckCircle2, Info, Home, Ruler,
  Settings, Hash, DollarSign, List, Loader2,
} from 'lucide-react';
import { normalizeImages, getFirstImage, type NormalizedImage } from '../../utils/imageHelpers';
import { UserFeaturedAdsBar } from '../sections/UserFeaturedAdsBar';
import { VerticalThumbnailCarousel } from '../molecules/VerticalThumbnailCarousel/VerticalThumbnailCarousel';

import PremiumBadge from '../PremiumBadge';
import { ProductCard } from '../organisms/ProductCard';
import { getFormForContext } from '../../services/v2/formsService';
import { getOptionListItemsForSelect } from '../../services/v2/optionListsService';
import { getOrCreateChannel, type ChatChannel } from '../../services/chatService';
import { NewChatModal } from '../chat/NewChatModal';
import { PlanLimitModal } from '../chat/PlanLimitModal';
import { ChatWindow } from '../chat/ChatWindow';
import { navigateTo } from '../../hooks/useNavigate';
import type { CompleteFormV2, FormFieldV2 } from '../../types/v2';
import type { Product } from '../../../types';

// ── Tipos ────────────────────────────────────────────────────────

interface AdDetailProps {
  adId: string;
  onBack?: () => void;
}

interface Seller {
  full_name?: string;
  email_verified?: boolean;
  role?: string;
  created_at?: string;
}

interface Ad {
  id: string;
  title: string;
  description: string;
  location: string;
  province?: string;
  price?: number;
  currency?: string;
  price_unit?: string;
  phone: string;
  user_id: string;
  category_id: string;
  subcategory_id?: string;
  operation_type_id?: string;
  attributes?: Record<string, any>;
  created_at: string;
  categories?: { name: string; display_name: string } | null;
  subcategories?: { name: string; display_name: string } | null;
  operation_types?: { display_name: string } | null;
  images?: NormalizedImage[];
  seller?: Seller | null;
}

type OptionLabels = Record<string, Record<string, string>>;

// ── Helpers ──────────────────────────────────────────────────────

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days > 30)
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  if (days >= 1) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
  if (hours >= 1) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  if (mins >= 1) return `hace ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
  return 'hace un momento';
}

function formatPrice(price: number): string {
  return price.toLocaleString('es-AR');
}

// ── Mapa de iconos de sección ─────────────────────────────────────

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  info: Info, home: Home, ruler: Ruler, settings: Settings,
  hash: Hash, 'dollar-sign': DollarSign, list: List,
  'map-pin': MapPin, tag: Tag, check: CheckCircle2,
};

function SectionIcon({ name, className = 'w-4 h-4' }: { name?: string; className?: string }) {
  if (!name) return null;
  const Icon = ICON_MAP[name.toLowerCase()] ?? ICON_MAP[name.replace(/[_\s]/g, '-').toLowerCase()];
  if (!Icon) return null;
  return <Icon className={className} />;
}

// ── Grid dinámico por field_width ────────────────────────────────

function getSectionCols(fields: FormFieldV2[]): number {
  if (fields.some(f => f.field_width === 'third')) return 3;
  if (fields.some(f => f.field_width === 'half')) return 2;
  return 1;
}

function gridColsClass(cols: number): string {
  if (cols === 3) return 'grid-cols-1 sm:grid-cols-3';
  if (cols === 2) return 'grid-cols-1 sm:grid-cols-2';
  return 'grid-cols-1';
}

function fieldSpanClass(field: FormFieldV2): string {
  return field.field_width === 'full' ? 'col-span-full' : '';
}

// ── Skeleton ─────────────────────────────────────────────────────

const AdDetailSkeleton: React.FC = () => (
  <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-6" />
    <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 lg:items-start">
      <div className="space-y-4">
        <div className="aspect-[4/3] bg-gray-200 rounded-xl animate-pulse" />
        <div className="bg-white rounded-xl p-5 space-y-3">
          <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-7 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="hidden lg:block space-y-3">
        <div className="bg-white rounded-xl p-5 space-y-4">
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-1/2 bg-gray-200 rounded animate-pulse" />
          <div className="h-px bg-gray-100" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 space-y-3">
          <div className="h-11 w-full bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-24 w-full bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

// ── Componente principal ─────────────────────────────────────────

export const AdDetail: React.FC<AdDetailProps> = ({ adId, onBack }) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [form, setForm] = useState<CompleteFormV2 | null>(null);
  const [optionLabels, setOptionLabels] = useState<OptionLabels>({});
  const [sellerOtherAds, setSellerOtherAds] = useState<Product[]>([]);
  const [loadingOtherAds, setLoadingOtherAds] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Auth
  const [currentUser, setCurrentUser]   = useState<any>(null);
  const [userCheckDone, setUserCheckDone] = useState(false);

  // Chat P2P
  const [chatChannel, setChatChannel]         = useState<ChatChannel | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showPlanLimit, setShowPlanLimit]       = useState(false);
  const [chatLoading, setChatLoading]           = useState(false);

  const mobileCTARef = useRef<HTMLDivElement>(null);

  // ── Auth check ───────────────────────────────────────────────

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserCheckDone(true);
    if (!user) return;
    setCurrentUser(user);
  };

  // ── Keyboard lightbox ─────────────────────────────────────────

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft')
        setCurrentImageIndex(prev => (prev === 0 ? (ad?.images?.length ?? 1) - 1 : prev - 1));
      if (e.key === 'ArrowRight')
        setCurrentImageIndex(prev => (prev === (ad?.images?.length ?? 1) - 1 ? 0 : prev + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, ad?.images?.length]);

  // ── IntersectionObserver sticky bar ──────────────────────────

  useEffect(() => {
    const ref = mobileCTARef.current;
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, []);

  // ── Cargas principales ────────────────────────────────────────

  useEffect(() => { loadAd(); }, [adId]);

  useEffect(() => {
    if (!ad) return;
    loadFormAndLabels(ad);
    loadSellerOtherAds(ad.user_id, ad.id);
  }, [ad?.id]);

  const loadAd = async () => {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adId || '');
      const isShortId = /^[A-Z]{3}\d{5}$/.test(adId || '');

      let query = supabase.from('ads').select('*');
      if (isUuid) query = query.eq('id', adId);
      else if (isShortId) query = query.eq('short_id', adId);
      else query = query.eq('slug', adId);

      const { data, error } = await query.single();
      if (error) throw error;

      const normalizedImages = normalizeImages(data.images);

      const [subcatResult, opTypeResult, sellerResult] = await Promise.all([
        data.subcategory_id
          ? supabase.from('subcategories').select('name, display_name, category_id').eq('id', data.subcategory_id).single()
          : Promise.resolve({ data: null }),
        data.operation_type_id
          ? supabase.from('operation_types').select('display_name').eq('id', data.operation_type_id).single()
          : Promise.resolve({ data: null }),
        data.user_id
          ? supabase.from('users').select('full_name, email_verified, role, created_at').eq('id', data.user_id).single()
          : Promise.resolve({ data: null }),
      ]);

      let categoryData = null;
      if (subcatResult.data?.category_id) {
        const { data: cat } = await supabase
          .from('categories').select('name, display_name').eq('id', subcatResult.data.category_id).single();
        categoryData = cat;
      }

      setAd({
        ...data,
        images: normalizedImages,
        categories: categoryData,
        subcategories: subcatResult.data ?? null,
        operation_types: opTypeResult.data ?? null,
        seller: sellerResult.data ?? null,
      });
    } catch (err) {
      console.error('Error al cargar aviso:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSellerOtherAds = async (sellerId: string, excludeId: string) => {
    setLoadingOtherAds(true);
    try {
      const { data } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', sellerId)
        .eq('status', 'active')
        .neq('id', excludeId)
        .order('created_at', { ascending: false })
        .limit(5);

      const products: Product[] = (data || []).map((item: any) => ({
        id: item.id,
        slug: item.slug,
        short_id: item.short_id,
        title: item.title,
        description: item.description || '',
        price: item.price,
        currency: item.currency || 'ARS',
        location: item.location || '',
        province: item.province,
        imageUrl: getFirstImage(item.images || item.image_urls || []),
        images: normalizeImages(item.images || item.image_urls || []),
        category: item.category || '',
        subcategory: item.subcategory,
        sourceUrl: '#',
        isSponsored: false,
        user_id: item.user_id,
        createdAt: item.created_at,
      }));

      setSellerOtherAds(products);
    } catch (err) {
      console.error('Error cargando otros avisos del vendedor:', err);
    } finally {
      setLoadingOtherAds(false);
    }
  };

  const loadFormAndLabels = async (loadedAd: Ad) => {
    const loadedForm = await getFormForContext(loadedAd.category_id, loadedAd.subcategory_id);
    setForm(loadedForm);
    if (!loadedForm) return;

    const listIds = [
      ...new Set(loadedForm.fields.filter(f => f.option_list_id).map(f => f.option_list_id as string)),
    ];
    const labels: OptionLabels = {};
    await Promise.all(
      listIds.map(async listId => {
        const items = await getOptionListItemsForSelect(listId);
        labels[listId] = Object.fromEntries(items.map(i => [i.value, i.label]));
      })
    );
    setOptionLabels(labels);
  };

  const resolveFieldValue = (field: FormFieldV2, value: any): string => {
    if (value === null || value === undefined || value === '') return '';
    if (field.field_type === 'checkbox') return value ? 'Sí' : 'No';
    const strValue = String(value);
    if (field.options?.length) {
      const opt = field.options.find(o => o.value === strValue);
      return opt?.label ?? strValue;
    }
    if (field.option_list_id && optionLabels[field.option_list_id]) {
      return optionLabels[field.option_list_id][strValue] ?? strValue;
    }
    if (field.field_type === 'number' && (field.metadata as any)?.suffix) {
      return `${strValue} ${(field.metadata as any).suffix}`;
    }
    return strValue;
  };

  // ── Chat P2P ──────────────────────────────────────────────────

  const handleContactar = async () => {
    if (!ad) return;
    if (!currentUser) {
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { view: 'login' } }));
      return;
    }
    if (currentUser.id === ad.user_id) return; // no self-contact

    setChatLoading(true);
    const result = await getOrCreateChannel(ad.id, ad.user_id);
    setChatLoading(false);

    if (!result.success) {
      if (result.error === 'PLAN_LIMIT_REACHED') { setShowPlanLimit(true); return; }
      return;
    }

    if (result.isNew) {
      // Canal nuevo: mostrar modal de primer mensaje
      setChatChannel(result.channel);
      setShowNewChatModal(true);
    } else {
      // Canal existente: abrir directamente
      setChatChannel(result.channel);
    }
  };

  const renderSidebarContactForm = () => {
    if (!userCheckDone) return null;

    // No logueado
    if (!currentUser) {
      return (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <button
            onClick={handleContactar}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Contactar
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Iniciá sesión para contactar al vendedor
          </p>
        </div>
      );
    }

    // Canal abierto → mostrar acceso directo
    if (chatChannel) {
      return (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-2">
          <button
            onClick={() => setChatChannel(chatChannel)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Ver conversación
          </button>
          <button
            onClick={() => navigateTo('/inbox')}
            className="w-full py-1.5 text-xs text-brand-600 hover:underline"
          >
            Ir a Mensajes
          </button>
        </div>
      );
    }

    // Disponible
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <button
          onClick={handleContactar}
          disabled={chatLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 text-white text-sm font-semibold transition-colors"
        >
          {chatLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Abriendo chat...</>
            : <><MessageCircle className="w-4 h-4" /> Contactar vendedor</>
          }
        </button>
      </div>
    );
  };

  // ── Sidebar desktop ───────────────────────────────────────────

  const renderSidebar = () => {
    if (!ad) return null;
    const currency = ad.currency || 'ARS';
    const sellerName = ad.seller?.full_name || 'Vendedor';

    return (
      <aside className="hidden lg:block">
        <div className="sticky top-6 space-y-3">

          {/* Precio + vendedor info */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Precio</p>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    currency === 'USD' ? 'bg-brand-100 text-brand-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {currency}
                  </span>
                </div>
                {ad.price ? (
                  <>
                    <div className="text-3xl font-bold text-gray-900">
                      ${formatPrice(ad.price)}
                    </div>
                    {ad.price_unit && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        por {ad.price_unit.replace(/-/g, ' ')}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-lg font-semibold text-gray-400">Consultar precio</div>
                )}
              </div>
            </div>

            {/* Vendedor */}
            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-900">{sellerName}</span>
                {ad.seller?.role === 'premium' && <PremiumBadge size="sm" />}
              </div>
              {ad.seller?.email_verified && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <span className="text-sm text-brand-700 font-medium">Usuario Verificado</span>
                </div>
              )}
              {(ad.province || ad.location) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{ad.province || ad.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  Publicado el {new Date(ad.created_at).toLocaleDateString('es-AR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario de contacto inline */}
          {renderSidebarContactForm()}

        </div>
      </aside>
    );
  };

  // ── Form sections con grid dinámico ──────────────────────────

  const renderFormSections = () => {
    const attrs = ad?.attributes;
    if (!attrs || Object.keys(attrs).length === 0) return null;

    const renderField = (field: FormFieldV2, _gridCols: number) => {
      const rawValue = attrs[field.field_name];
      if (rawValue === null || rawValue === undefined || rawValue === '') return null;

      const spanClass = fieldSpanClass(field);

      // checkbox_group → chips con check
      if (field.field_type === 'checkbox_group') {
        const vals: string[] = Array.isArray(rawValue)
          ? rawValue
          : typeof rawValue === 'string'
          ? rawValue.split(',').map(v => v.trim()).filter(Boolean)
          : [];
        if (vals.length === 0) return null;
        return (
          <div key={field.field_name} className={`${spanClass} border-b border-gray-100 pb-3 last:border-0 last:pb-0`}>
            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {field.field_label}
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              {vals.map(v => {
                const label = resolveFieldValue(field, v) || v;
                return (
                  <span key={v} className="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-700 rounded-full px-2.5 py-1 font-medium">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    {label}
                  </span>
                );
              })}
            </dd>
          </div>
        );
      }

      // checkbox único → check icon
      if (field.field_type === 'checkbox') {
        const isSi = rawValue === true || rawValue === 'true' || rawValue === 'Sí' || rawValue === 'si';
        if (!isSi) return null;
        return (
          <div key={field.field_name} className={`${spanClass} flex items-center gap-2 py-2 border-b border-gray-100 last:border-0`}>
            <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">{field.field_label}</span>
          </div>
        );
      }

      // Campo normal
      const displayValue = resolveFieldValue(field, rawValue);
      if (!displayValue) return null;

      return (
        <div key={field.field_name} className={`${spanClass} border-b border-gray-100 pb-3 last:border-0 last:pb-0`}>
          <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            {field.field_label}
          </dt>
          <dd className="text-sm font-medium text-gray-900">{displayValue}</dd>
        </div>
      );
    };

    if (!form) {
      const cols = 2;
      return (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Información adicional</h2>
          <dl className={`grid ${gridColsClass(cols)} gap-x-6 gap-y-1`}>
            {Object.entries(attrs).map(([key, val]) =>
              val !== null && val !== '' ? (
                <div key={key} className="border-b border-gray-100 pb-3">
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{key}</dt>
                  <dd className="text-sm font-medium text-gray-900">{String(val)}</dd>
                </div>
              ) : null
            )}
          </dl>
        </div>
      );
    }

    const sectionedBlocks = form.sections
      .map(section => ({
        section,
        fields: form.fields
          .filter(f => f.section_id === section.id)
          .filter(f => {
            const val = attrs[f.field_name];
            return val !== null && val !== undefined && val !== '';
          })
          .sort((a, b) => a.display_order - b.display_order),
      }))
      .filter(b => b.fields.length > 0);

    const unsectioned = form.fields
      .filter(f => !f.section_id)
      .filter(f => {
        const val = attrs[f.field_name];
        return val !== null && val !== undefined && val !== '';
      });

    if (sectionedBlocks.length === 0 && unsectioned.length === 0) return null;

    return (
      <>
        {sectionedBlocks.map(({ section, fields }) => {
          const cols = getSectionCols(fields);
          return (
            <div key={section.id} className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                <SectionIcon name={section.icon} className="w-4 h-4 text-brand-600" />
                {section.label}
              </h2>
              <dl className={`grid ${gridColsClass(cols)} gap-x-6 gap-y-1`}>
                {fields.map(f => renderField(f, cols))}
              </dl>
            </div>
          );
        })}
        {unsectioned.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Otros datos</h2>
            <dl className={`grid ${gridColsClass(getSectionCols(unsectioned))} gap-x-6 gap-y-1`}>
              {unsectioned.map(f => renderField(f, getSectionCols(unsectioned)))}
            </dl>
          </div>
        )}
      </>
    );
  };

  // ── Render mobile price block ────────────────────────────────

  const renderMobilePriceBlock = () => {
    if (!ad) return null;
    const currency = ad.currency || 'ARS';
    return (
      <div className="flex items-start justify-between">
        <div>
          <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${
            currency === 'USD' ? 'bg-brand-100 text-brand-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {currency}
          </span>
          {ad.price ? (
            <>
              <div className="text-2xl font-bold text-gray-900">${formatPrice(ad.price)}</div>
              {ad.price_unit && (
                <div className="text-xs text-gray-400 mt-0.5">por {ad.price_unit.replace(/-/g, ' ')}</div>
              )}
            </>
          ) : (
            <div className="text-lg font-semibold text-gray-400">Consultar precio</div>
          )}
        </div>
      </div>
    );
  };

  // ── Estados ───────────────────────────────────────────────────

  if (loading) return <AdDetailSkeleton />;

  if (!ad) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Aviso no encontrado</p>
        {onBack && (
          <button onClick={onBack} className="mt-4 text-brand-600 hover:underline text-sm">
            Volver
          </button>
        )}
      </div>
    );
  }

  const images = ad.images || [];
  const hasImages = images.length > 0;

  // ── Render ────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 lg:pb-6">

        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        )}

        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 lg:items-start">

          {/* ── Columna principal ──────────────────────────────── */}
          <div className="space-y-4">

            {/* Galería 4:3 */}
            {hasImages && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden p-3">
                <div className="flex gap-3">

                  {/* Carrusel vertical de miniaturas — solo desktop */}
                  <div className="hidden lg:flex self-stretch bg-gray-100 rounded-lg p-2">
                    <VerticalThumbnailCarousel
                      images={images}
                      currentIndex={currentImageIndex}
                      onSelect={setCurrentImageIndex}
                      thumbSize={120}
                      maxVisible={4}
                    />
                  </div>

                  {/* Imagen principal 4:3 */}
                  <div className="flex-1 min-w-0">
                    <div className="relative aspect-[4/3] bg-gray-100 group rounded-lg overflow-hidden">
                      <img
                        src={images[currentImageIndex].url}
                        alt={`${ad.title} - Imagen ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setLightboxOpen(true)}
                        className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Ver imagen completa"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      {images.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full pointer-events-none">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      )}
                      {/* Flechas — solo mobile (en desktop las miniaturas controlan la navegación) */}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                            className="lg:hidden absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md"
                            aria-label="Imagen anterior"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                            className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md"
                            aria-label="Siguiente imagen"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Título + meta */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              {/* Breadcrumb */}
              <div className="flex items-center flex-wrap gap-1 text-xs text-gray-400 mb-3">
                <Tag className="w-3 h-3 flex-shrink-0" />
                {ad.operation_types && (
                  <>
                    <span>{ad.operation_types.display_name}</span>
                    <span>›</span>
                  </>
                )}
                {ad.categories && (
                  <>
                    <span>{ad.categories.display_name}</span>
                    <span>›</span>
                  </>
                )}
                {ad.subcategories && <span>{ad.subcategories.display_name}</span>}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{ad.title}</h1>

              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                {(ad.province || ad.location) && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{[ad.province, ad.location].filter(Boolean).join(' · ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>Publicado {relativeDate(ad.created_at)}</span>
                </div>
              </div>

              {/* Precio mobile */}
              <div className="lg:hidden border-t mt-4 pt-4">
                {renderMobilePriceBlock()}
              </div>

              {/* Descripción */}
              {ad.description && (
                <div className="border-t mt-4 pt-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{ad.description}</p>
                </div>
              )}
            </div>

            {/* CTA mobile */}
            <div ref={mobileCTARef} id="mobile-cta" className="lg:hidden">
              {renderSidebarContactForm()}
            </div>

            {/* Secciones dinámicas */}
            {renderFormSections()}

          </div>

          {/* ── Sidebar desktop ────────────────────────────────── */}
          {renderSidebar()}

        </div>

        {/* ── Contenedor-B: Más avisos del vendedor (ancho completo) ── */}
        {(loadingOtherAds || sellerOtherAds.length > 0) && (
          <div className="bg-gray-50 rounded-xl p-5 mt-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">
              Más avisos de este vendedor
            </h2>
            {loadingOtherAds ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-4">
                  {sellerOtherAds.length}{' '}
                  {sellerOtherAds.length === 1 ? 'aviso disponible' : 'avisos disponibles'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {sellerOtherAds.map(otherAd => (
                    <ProductCard key={otherAd.id} product={otherAd} variant="compact" showProvince />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Contenedor-C: Avisos Destacados (ancho completo) ── */}
        <UserFeaturedAdsBar
          categoryId={ad.category_id}
          placement="detail"
          excludeAdId={ad.id}
          className="mt-4"
        />

      </div>

      {/* ── Mobile sticky bar ─────────────────────────────────── */}
      {showStickyBar && (
        <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {(() => {
              const currency = ad.currency || 'ARS';
              return (
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    currency === 'USD' ? 'bg-brand-100 text-brand-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {currency}
                  </span>
                  {ad.price ? (
                    <span className="text-base font-bold text-gray-900 truncate">${formatPrice(ad.price)}</span>
                  ) : (
                    <span className="text-sm text-gray-400 truncate">Consultar precio</span>
                  )}
                </div>
              );
            })()}
          </div>
          <button
            onClick={() => document.getElementById('mobile-cta')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg transition-colors flex-shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            Contactar
          </button>
          {ad.phone && (
            <a
              href={`https://wa.me/${ad.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, te contacto por: ${ad.title}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors flex-shrink-0"
              aria-label="WhatsApp"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* ── Lightbox ──────────────────────────────────────────── */}
      {lightboxOpen && hasImages && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="max-w-5xl w-full max-h-[90vh] px-16 flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={images[currentImageIndex].url}
              alt={`${ad.title} - Imagen ${currentImageIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded"
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                aria-label="Siguiente imagen"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm font-medium px-3 py-1.5 rounded-full pointer-events-none">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>
      )}

      {/* ── Chat modals / window ───────────────────────────────── */}
      {showNewChatModal && chatChannel && ad && (
        <NewChatModal
          adId={ad.id}
          adTitle={ad.title}
          sellerId={ad.user_id}
          sellerName={ad.seller?.full_name || 'Vendedor'}
          onSuccess={(ch) => { setShowNewChatModal(false); setChatChannel(ch); }}
          onClose={() => setShowNewChatModal(false)}
          onPlanLimit={() => { setShowNewChatModal(false); setShowPlanLimit(true); }}
        />
      )}

      {showPlanLimit && (
        <PlanLimitModal onClose={() => setShowPlanLimit(false)} />
      )}

      {chatChannel && !showNewChatModal && currentUser && (
        <ChatWindow
          channel={chatChannel}
          currentUserId={currentUser.id}
          onClose={() => setChatChannel(null)}
        />
      )}
    </>
  );
};
