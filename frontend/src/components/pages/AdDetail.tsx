import React, { useEffect, useState, useRef } from 'react';
import { useGlobalSetting } from '../../hooks/useGlobalSetting';
import { Helmet } from 'react-helmet-async';
import type { User as AuthUser } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient';
import {
  MapPin, Calendar, Tag, ArrowLeft,
  MessageCircle, CheckCircle, Loader2,
  Share2, Eye, Store,
} from 'lucide-react';
import { UserFeaturedAdsBar } from '../sections/UserFeaturedAdsBar';
import PremiumBadge from '../PremiumBadge';
import { ProductCard } from '../organisms/ProductCard';
import { navigateTo } from '../../hooks/useNavigate';
import { NewChatModal } from '../chat/NewChatModal';
import { PlanLimitModal } from '../chat/PlanLimitModal';
import { ChatWindow } from '../chat/ChatWindow';

import { useAdData } from '../../hooks/useAdData';
import { useLightbox } from '../../hooks/useLightbox';
import { useAdChat } from '../../hooks/useAdChat';
import { AdGallery } from './ad-detail/AdGallery';
import { Lightbox } from './ad-detail/Lightbox';
import { AdFormSections } from './ad-detail/AdFormSections';
import { PageErrorBoundary } from '../common/PageErrorBoundary';
import { MobileStickyBar } from './ad-detail/MobileStickyBar';
import { relativeDate, formatPrice } from './ad-detail/utils';

// ── Tipos ────────────────────────────────────────────────────

interface AdDetailProps {
  adId: string;
  onBack?: () => void;
}

// ── Skeleton ─────────────────────────────────────────────────

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

// ── Helper: Avatar con iniciales ──────────────────────────────

const SellerAvatar: React.FC<{ avatarUrl?: string | null; fullName?: string }> = ({ avatarUrl, fullName }) => {
  const initials = (fullName || 'V')
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() || '')
    .join('');

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName || 'Vendedor'}
        className="w-12 h-12 rounded-full object-cover border-2 border-brand-100"
        loading="lazy"
      />
    );
  }

  return (
    <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
      <span className="text-white text-sm font-bold">{initials}</span>
    </div>
  );
};

// ── Helper: Price badges ──────────────────────────────────────

const PriceBadges: React.FC<{
  currency?: string;
  condition?: string | null;
  priceNegotiable?: boolean;
  viewsCount?: number;
}> = ({ currency, condition, priceNegotiable, viewsCount }) => (
  <div className="flex flex-wrap items-center gap-1.5 mt-2">
    {currency && (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        currency === 'USD'
          ? 'bg-brand-100 text-brand-700'
          : 'bg-gray-100 text-gray-600'
      }`}>
        {currency}
      </span>
    )}
    {condition && (
      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full capitalize">
        {condition}
      </span>
    )}
    {priceNegotiable && (
      <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">
        Precio a acordar
      </span>
    )}
    {viewsCount !== undefined && viewsCount > 0 && (
      <span className="text-xs text-gray-400 flex items-center gap-1">
        <Eye className="w-3 h-3" />
        {viewsCount.toLocaleString('es-AR')} vistas
      </span>
    )}
  </div>
);

// ── Componente principal ──────────────────────────────────────

export const AdDetail: React.FC<AdDetailProps> = ({ adId, onBack }) => {
  const { ad, loading, form, optionLabels, similarAds, loadingSimilar, sellerAdsCount } = useAdData(adId);
  const seoDescMaxChars = useGlobalSetting<number>('seo_description_max_chars', 155);
  const canonicalBase   = useGlobalSetting<string>('site_canonical_url', 'https://rural24.com.ar');

  const images = ad?.images || [];
  const { currentImageIndex, lightboxOpen, setCurrentImageIndex, setLightboxOpen } = useLightbox(images.length);

  const [showStickyBar, setShowStickyBar] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userCheckDone, setUserCheckDone] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const mobileCTARef = useRef<HTMLDivElement>(null);

  const {
    chatChannel, setChatChannel,
    showNewChatModal, setShowNewChatModal,
    showPlanLimit, setShowPlanLimit,
    chatLoading, handleContactar,
  } = useAdChat(ad?.id, ad?.user_id, currentUser);

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserCheckDone(true);
      if (user) setCurrentUser(user);
    });
  }, []);

  // IntersectionObserver sticky bar
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

  // ── Share ─────────────────────────────────────────────────

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: ad?.title, url });
        return;
      } catch {
        // fallback al clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch {
      // silenciar errores de clipboard en contextos sin permiso
    }
  };

  // ── Contact form (sidebar + mobile CTA) ──────────────────

  const renderContactButton = () => {
    if (!userCheckDone) return null;

    if (!currentUser) {
      return (
        <button
          onClick={handleContactar}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Contactar vendedor
        </button>
      );
    }

    if (chatChannel) {
      return (
        <div className="space-y-2">
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

    return (
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
    );
  };

  // ── Seller Card ───────────────────────────────────────────

  const renderSellerCard = () => {
    if (!ad) return null;
    const seller = ad.seller;
    const sellerName = seller?.full_name || 'Vendedor';

    const memberSince = seller?.created_at
      ? new Date(seller.created_at).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
      : null;

    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        {/* Avatar + nombre */}
        <div className="flex items-center gap-3 mb-4">
          <SellerAvatar avatarUrl={seller?.avatar_url} fullName={sellerName} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-gray-900 truncate">{sellerName}</span>
              {seller?.role === 'premium' && <PremiumBadge size="sm" />}
            </div>
            {memberSince && (
              <p className="text-xs text-gray-400 mt-0.5">Miembro desde {memberSince}</p>
            )}
          </div>
        </div>

        {/* Stats del vendedor */}
        <div className="space-y-1.5 mb-4">
          {sellerAdsCount > 0 && (
            <div className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500">
                {sellerAdsCount} {sellerAdsCount === 1 ? 'aviso publicado' : 'avisos publicados'}
              </span>
            </div>
          )}
          {seller?.email_verified && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
              <span className="text-xs text-brand-700 font-medium">Usuario Verificado</span>
            </div>
          )}
          {(ad.province || ad.location) && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500">{ad.province || ad.location}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4">
          {renderContactButton()}
          {!currentUser && (
            <p className="text-xs text-gray-400 text-center mt-2">
              Iniciá sesión para contactar al vendedor
            </p>
          )}
        </div>
      </div>
    );
  };

  // ── Sidebar desktop ───────────────────────────────────────

  const renderSidebar = () => {
    if (!ad) return null;
    const currency = ad.currency || 'ARS';

    return (
      <aside className="hidden lg:block">
        <div className="sticky top-6 space-y-3">

          {/* Precio */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Precio</p>
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
            ) : ad.price_negotiable ? (
              <div className="text-lg font-semibold text-gray-500">Precio a acordar</div>
            ) : (
              <div className="text-lg font-semibold text-gray-400">Consultar precio</div>
            )}

            <PriceBadges
              currency={currency}
              condition={ad.condition}
              priceNegotiable={ad.price_negotiable}
              viewsCount={ad.views_count}
            />

            <div className="border-t border-gray-100 mt-4 pt-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                Publicado {relativeDate(ad.created_at)}
              </div>
            </div>
          </div>

          {/* Vendedor + contacto */}
          {renderSellerCard()}
        </div>
      </aside>
    );
  };

  // ── Estados ───────────────────────────────────────────────

  if (loading) return <AdDetailSkeleton />;

  if (!ad) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-gray-500 font-medium mb-1">Aviso no encontrado</p>
        {import.meta.env.DEV && (
          <p className="text-xs text-gray-400 font-mono mt-1 mb-4">slug: {adId}</p>
        )}
        {onBack && (
          <button onClick={onBack} className="mt-2 text-brand-600 hover:underline text-sm">
            Volver
          </button>
        )}
      </div>
    );
  }

  const hasImages = images.length > 0;
  const currency = ad.currency || 'ARS';

  // ── Render ────────────────────────────────────────────────

  return (
    <>
      {/* ── SEO Meta Tags ──────────────────────────────────────── */}
      {(() => {
        const pageTitle = `${ad.title} | Rural24`;
        const pageDescription = ad.description
          ? ad.description.slice(0, seoDescMaxChars).replace(/\n/g, ' ')
          : `${ad.categories?.display_name || 'Aviso'} en ${ad.province || ad.location || 'Argentina'} — Rural24`;
        const firstImage = ad.images?.[0]?.url;
        const canonicalUrl = `${canonicalBase}/#/ad/${ad.slug || ad.id}`;

        const productSchema = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: ad.title,
          ...(ad.description ? { description: ad.description } : {}),
          url: canonicalUrl,
          ...(firstImage ? { image: firstImage } : {}),
          ...(ad.categories ? { category: ad.categories.display_name } : {}),
          offers: {
            '@type': 'Offer',
            priceCurrency: ad.currency || 'ARS',
            ...(ad.price ? { price: ad.price } : {}),
            availability: 'https://schema.org/InStock',
            seller: { '@type': 'Person', name: ad.seller?.full_name || 'Vendedor' },
          },
        };

        return (
          <Helmet>
            <title>{pageTitle}</title>
            <meta name="description" content={pageDescription} />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={pageDescription} />
            <meta property="og:type" content="product" />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:site_name" content="Rural24" />
            <meta property="og:locale" content="es_AR" />
            {firstImage && <meta property="og:image" content={firstImage} />}
            {firstImage && <meta property="og:image:alt" content={ad.title} />}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={pageDescription} />
            {firstImage && <meta name="twitter:image" content={firstImage} />}
            <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
          </Helmet>
        );
      })()}

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 lg:pb-6">

        {/* ── Toast "Enlace copiado" ── */}
        {showCopied && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs px-4 py-2 rounded-full shadow-lg pointer-events-none">
            ¡Enlace copiado!
          </div>
        )}

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

            {hasImages && (
              <AdGallery
                images={images}
                title={ad.title}
                currentIndex={currentImageIndex}
                onIndexChange={setCurrentImageIndex}
                onOpenLightbox={() => setLightboxOpen(true)}
              />
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
                {ad.subcategory_parent && (
                  <>
                    <span>{ad.subcategory_parent.display_name}</span>
                    <span>›</span>
                  </>
                )}
                {ad.subcategories && <span>{ad.subcategories.display_name}</span>}
              </div>

              {/* Título + share */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{ad.title}</h1>
                <button
                  onClick={handleShare}
                  title="Compartir aviso"
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 transition-colors border border-gray-200 hover:border-brand-300 rounded-lg px-2.5 py-1.5 mt-0.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Compartir</span>
                </button>
              </div>

              {/* Meta: location, date, year */}
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
                <div>
                  {ad.price ? (
                    <>
                      <div className="text-2xl font-bold text-gray-900">${formatPrice(ad.price)}</div>
                      {ad.price_unit && (
                        <div className="text-xs text-gray-400 mt-0.5">por {ad.price_unit.replace(/-/g, ' ')}</div>
                      )}
                    </>
                  ) : ad.price_negotiable ? (
                    <div className="text-lg font-semibold text-gray-500">Precio a acordar</div>
                  ) : (
                    <div className="text-lg font-semibold text-gray-400">Consultar precio</div>
                  )}

                  <PriceBadges
                    currency={currency}
                    condition={ad.condition}
                    priceNegotiable={ad.price_negotiable}
                    viewsCount={ad.views_count}
                  />
                </div>
              </div>

              {ad.description && (
                <div className="border-t mt-4 pt-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{ad.description}</p>
                </div>
              )}
            </div>

            {/* CTA mobile */}
            <div ref={mobileCTARef} id="mobile-cta" className="lg:hidden">
              <div className="bg-white rounded-xl shadow-sm p-4">
                {renderContactButton()}
              </div>
            </div>

            {/* Secciones dinámicas (características) */}
            <PageErrorBoundary pageName="secciones del aviso">
              <AdFormSections form={form} ad={ad} optionLabels={optionLabels} />
            </PageErrorBoundary>

            {/* Vendedor — solo mobile (sidebar en desktop) */}
            <div className="lg:hidden">
              {renderSellerCard()}
            </div>

          </div>

          {/* ── Sidebar desktop ────────────────────────────────── */}
          {renderSidebar()}

        </div>

        {/* ── Avisos similares ── */}
        {(loadingSimilar || similarAds.length >= 2) && (
          <div className="bg-white rounded-xl shadow-sm p-5 mt-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Avisos similares</h2>
            {loadingSimilar ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-4">
                  {similarAds.length} {similarAds.length === 1 ? 'aviso encontrado' : 'avisos encontrados'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {similarAds.map(item => (
                    <ProductCard key={item.id} product={item} variant="compact" showProvince />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Avisos Destacados ── */}
        <UserFeaturedAdsBar
          categoryId={ad.category_id}
          placement="detail"
          excludeAdId={ad.id}
          className="mt-4"
        />

      </div>

      {/* ── Mobile sticky bar ─────────────────────────────────── */}
      {showStickyBar && <MobileStickyBar ad={ad} onContactar={handleContactar} />}

      {/* ── Lightbox ──────────────────────────────────────────── */}
      {lightboxOpen && hasImages && (
        <Lightbox
          images={images}
          title={ad.title}
          currentIndex={currentImageIndex}
          onIndexChange={setCurrentImageIndex}
          onClose={() => setLightboxOpen(false)}
        />
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
