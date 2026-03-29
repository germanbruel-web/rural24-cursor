import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import {
  MapPin, Calendar, Tag, ArrowLeft,
  MessageCircle, User, CheckCircle, Loader2,
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
import { MobileStickyBar } from './ad-detail/MobileStickyBar';
import { relativeDate, formatPrice } from './ad-detail/utils';

// ── Tipos ────────────────────────────────────────────────────────

interface AdDetailProps {
  adId: string;
  onBack?: () => void;
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
  const { ad, loading, form, optionLabels, sellerOtherAds, loadingOtherAds } = useAdData(adId);

  const images = ad?.images || [];
  const { currentImageIndex, lightboxOpen, setCurrentImageIndex, setLightboxOpen } = useLightbox(images.length);

  const [showStickyBar, setShowStickyBar] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userCheckDone, setUserCheckDone] = useState(false);

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

  // ── Contact form (sidebar + mobile CTA) ──────────────────────

  const renderSidebarContactForm = () => {
    if (!userCheckDone) return null;

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

          {renderSidebarContactForm()}
        </div>
      </aside>
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

  const hasImages = images.length > 0;
  const currency = ad.currency || 'ARS';

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
              {renderSidebarContactForm()}
            </div>

            {/* Secciones dinámicas */}
            <AdFormSections form={form} ad={ad} optionLabels={optionLabels} />

          </div>

          {/* ── Sidebar desktop ────────────────────────────────── */}
          {renderSidebar()}

        </div>

        {/* ── Contenedor-B: Más avisos del vendedor ── */}
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

        {/* ── Contenedor-C: Avisos Destacados ── */}
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
