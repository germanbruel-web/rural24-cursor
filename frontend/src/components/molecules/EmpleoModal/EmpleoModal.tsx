/**
 * EmpleoModal — Quick-view modal para avisos de Empleos
 * Empleos no tienen página de detalle. Este modal es su experiencia completa.
 */
import { useState, useEffect } from 'react';
import { MapPin, X, Briefcase } from 'lucide-react';
import type { Product } from '../../../../types';
import { Modal } from '../Modal/Modal';
import { useAdChat } from '../../../hooks/useAdChat';
import { ChatWindow } from '../../chat/ChatWindow';
import NewChatModal from '../../chat/NewChatModal';
import { PlanLimitModal } from '../../chat/PlanLimitModal';
import { supabase } from '../../../services/supabaseClient';
import { cn } from '../../../design-system/utils';

// Mapeo de price_type a etiquetas legibles
const PRICE_TYPE_LABELS: Record<string, string> = {
  'salario-mensual': 'Salario mensual',
  'por-hora':        'Por hora',
  'a-convenir':      'A convenir',
  'no-remunerado':   'No remunerado',
  'precio-fijo':     'Precio fijo',
  'por-proyecto':    'Por proyecto',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export function EmpleoModal({ isOpen, onClose, product }: Props) {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, []);

  const {
    chatChannel, setChatChannel,
    showNewChatModal, setShowNewChatModal,
    showPlanLimit, setShowPlanLimit,
    chatLoading, handleContactar,
  } = useAdChat(product.id, product.user_id, currentUser);

  const bgColor    = (product.attributes?.bg_color as string) || '#FFFFFF';
  const priceType  = product.attributes?.price_type as string | undefined;
  const priceLabel = priceType ? (PRICE_TYPE_LABELS[priceType] ?? priceType) : null;
  const hasPrice   = product.price && product.price > 0;
  const isTextDark = bgColor === '#333333';

  const formatPrice = (price: number, currency: string) => {
    const formatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    return `${currency === 'USD' ? 'USD' : '$'} ${formatted}`;
  };

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        size="lg"
        showCloseButton={false}
        className="overflow-hidden p-0"
      >
        {/* Header de color con avatar */}
        <div
          className="relative flex flex-col items-center justify-center pt-8 pb-6 px-6"
          style={{ backgroundColor: bgColor }}
        >
          <button
            onClick={onClose}
            className={cn(
              'absolute top-3 right-3 p-1.5 rounded-full transition-colors',
              isTextDark
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-gray-500 hover:text-gray-800 hover:bg-black/10'
            )}
          >
            <X size={18} />
          </button>

          {/* Avatar */}
          {product.user_avatar_url ? (
            <img
              src={product.user_avatar_url}
              alt={product.title}
              className="w-20 h-20 rounded-full object-cover shadow-md border-4 border-white/80"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/30 border-4 border-white/60 flex items-center justify-center shadow-md">
              <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
          )}

          {/* Badge subcategoría */}
          <span className={cn(
            'mt-3 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full',
            isTextDark ? 'bg-white/15 text-white' : 'bg-black/10 text-gray-700'
          )}>
            <Briefcase size={11} />
            {product.subcategory || 'Empleo'}
          </span>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-4">
          {/* Título */}
          <h2 className="text-xl font-bold text-gray-900 leading-tight">
            {product.title}
          </h2>

          {/* Precio / Modalidad */}
          {(hasPrice || priceLabel) && (
            <div className="flex items-baseline gap-2 flex-wrap">
              {hasPrice && (
                <span className="text-2xl font-black text-brand-600">
                  {formatPrice(product.price!, product.currency)}
                </span>
              )}
              {product.price_unit && hasPrice && (
                <span className="text-sm text-brand-500">
                  /{product.price_unit.replace(/-/g, ' ')}
                </span>
              )}
              {priceLabel && (
                <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  {priceLabel}
                </span>
              )}
            </div>
          )}

          {/* Ubicación */}
          {product.province && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin size={13} className="flex-shrink-0" />
              <span>{product.province}</span>
            </div>
          )}

          {/* Descripción */}
          {product.description && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* CTA */}
          {product.user_id && currentUser?.id !== product.user_id && (
            <div className="pt-2">
              <button
                onClick={handleContactar}
                disabled={chatLoading}
                className="w-full py-3 rounded-xl font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 transition-colors"
              >
                {chatLoading ? 'Conectando...' : 'Contactar'}
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Chat overlays */}
      {showNewChatModal && product.user_id && (
        <NewChatModal
          adId={product.id}
          adTitle={product.title}
          sellerId={product.user_id}
          sellerName={product.title}
          onSuccess={(channel) => { setChatChannel(channel); setShowNewChatModal(false); }}
          onClose={() => setShowNewChatModal(false)}
          onPlanLimit={() => { setShowNewChatModal(false); setShowPlanLimit(true); }}
        />
      )}
      {chatChannel && !showNewChatModal && currentUser && (
        <ChatWindow
          channel={chatChannel}
          currentUserId={currentUser.id}
          onClose={() => setChatChannel(null)}
        />
      )}
      {showPlanLimit && <PlanLimitModal onClose={() => setShowPlanLimit(false)} />}
    </>
  );
}
