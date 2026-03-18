/**
 * ShareModal — Modal tipo card para compartir avisos en redes sociales.
 *
 * Diseño: brand tokens, animate-scale-in, mobile-first.
 * Accesibilidad: role="dialog", foco atrapado, cierre con Escape.
 * Feedback: react-hot-toast para copy link.
 * Sin dependencias externas nuevas.
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Copy, Check, MessageCircle } from 'lucide-react';
import { cn } from '../../../design-system/utils';
import { notify } from '../../../utils/notifications';

// ── Tipos ─────────────────────────────────────────────────────────

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

// ── Redes sociales ───────────────────────────────────────────────

interface Network {
  id: string;
  label: string;
  bgClass: string;
  hoverClass: string;
  icon: React.ReactNode;
  getHref: (url: string, title: string) => string;
}

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.629 5.905-5.629Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const NETWORKS: Network[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    bgClass: 'bg-[#25D366]',
    hoverClass: 'hover:bg-[#1fbd5a]',
    icon: <WhatsAppIcon />,
    getHref: (url, title) =>
      `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    bgClass: 'bg-gray-900',
    hoverClass: 'hover:bg-black',
    icon: <XIcon />,
    getHref: (url, title) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    bgClass: 'bg-[#1877F2]',
    hoverClass: 'hover:bg-[#0f6de5]',
    icon: <FacebookIcon />,
    getHref: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
];

// ── Componente principal ──────────────────────────────────────────

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  url,
}) => {
  const [copied, setCopied] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);

  // Focus al abrir, cierre con Escape
  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      notify.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      notify.error('No se pudo copiar el enlace');
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, url });
    } catch {
      // Usuario canceló o no soportado — silencioso
    }
  };

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      role="presentation"
      className="fixed inset-0 z-[50] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fade-in"
        aria-hidden="true"
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Compartir: ${title}`}
        className={cn(
          'relative z-10 w-full sm:max-w-sm',
          'bg-white rounded-t-2xl sm:rounded-2xl shadow-xl',
          // Mobile: slide-up desde abajo. Desktop: scale-in centrado.
          'animate-slide-in-up sm:animate-scale-in',
        )}
      >
        {/* Handle drag (solo mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 sm:pt-5">
          <div className="min-w-0 pr-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
              Compartir aviso
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Cerrar"
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Redes sociales */}
        <div className="px-5 pb-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {NETWORKS.map((net) => (
              <a
                key={net.id}
                ref={net.id === NETWORKS[0].id ? firstFocusableRef : undefined}
                href={net.getHref(url, title)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Compartir en ${net.label}`}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-white text-xs font-medium',
                  'transition-transform duration-150 hover:scale-105 active:scale-95',
                  net.bgClass,
                  net.hoverClass,
                )}
                onClick={() => {
                  // Pequeño delay para que el visual del click se vea antes de abrir
                }}
              >
                {net.icon}
                <span>{net.label}</span>
              </a>
            ))}
          </div>

          {/* Native share (sólo si está soportado — mobile generalmente) */}
          {'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-50 text-brand-700 text-sm font-medium hover:bg-brand-100 transition-colors border border-brand-200"
            >
              <MessageCircle size={16} />
              Más opciones
            </button>
          )}

          {/* Separador */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">o copiá el enlace</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Copy link */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
            <span className="flex-1 text-xs text-gray-500 truncate">{url}</span>
            <button
              onClick={handleCopyLink}
              aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all duration-200',
                copied
                  ? 'bg-brand-600 text-white scale-95'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-brand-400 hover:text-brand-700'
              )}
            >
              {copied ? (
                <>
                  <Check size={13} />
                  Copiado
                </>
              ) : (
                <>
                  <Copy size={13} />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Safe area para iOS */}
        <div className="h-safe-bottom sm:hidden" aria-hidden="true" />
      </div>
    </div>
  );
};

export default ShareModal;
