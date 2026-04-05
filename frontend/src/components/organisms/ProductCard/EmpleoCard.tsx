/**
 * EmpleoCard — Card especializada para avisos de Empleos en carruseles/grids.
 * Reemplaza ProductCard cuando category_slug === 'empleos'.
 * Click → EmpleoModal (z-[1000]).
 */

import React, { useState } from 'react';
import { MapPin, Tag, Share2, Calendar, Briefcase } from 'lucide-react';
import type { Product } from '../../../../types';
import { Card } from '../../molecules/Card';
import { cn } from '../../../design-system/utils';
import { EmpleoModal } from '../../molecules/EmpleoModal/EmpleoModal';
import { useGlobalSetting } from '../../../hooks/useGlobalSetting';

// URL del ícono de Empleos subido a Cloudinary (app/icons)
const EMPLEO_ICON_URL = 'https://res.cloudinary.com/ruralcloudinary/image/upload/v1774375739/rural24/app/icons/fadd0359-ae43-4cad-9612-cbd639583196_mn4xi3p5_ct1mk.png';

interface EmpleoCardProps {
  product: Product;
  className?: string;
}

/** Parsea "url|#hexcolor" del campo icon de categories — usa Cloudinary URL hardcoded como fallback */
function resolveCategoryIcon(icon?: string | null): string {
  if (icon?.startsWith('http')) return icon.split('|')[0];
  return EMPLEO_ICON_URL;
}

export const EmpleoCard: React.FC<EmpleoCardProps> = React.memo(({ product, className }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const descMaxChars = useGlobalSetting<number>('card_description_max_chars', 100);

  // Fecha publicación
  const dateStr = product.created_at
    ? (() => {
        const d = new Date(product.created_at);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd}/${mm}/${yy}`;
      })()
    : null;

  // Ícono de categoría: desde DB si disponible, sino Cloudinary hardcoded
  const iconUrl = resolveCategoryIcon(product.category_icon);

  // Atributos del aviso — field_name en DB es "necesidad"
  const remitente  = (product.attributes?.remitente as string) || '';
  const necesidad  = (product.attributes?.necesidad as string) || '';

  // Labels row: "Empleos · {remitente} · {necesidad label}"
  const NECESIDAD_LABEL: Record<string, string> = {
    busco:      'Busco',
    ofrezco:    'Ofrezco',
    recomiendo: 'Recomiendo',
  };
  const necesidadLabel = NECESIDAD_LABEL[necesidad] || necesidad;
  const labelParts = ['Empleos', remitente, necesidadLabel].filter(Boolean);

  // Descripción truncada (largo configurable desde global_settings)
  const desc = product.description || '';
  const descTrunc = desc.length > descMaxChars ? desc.slice(0, descMaxChars) + '…' : desc;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#/aviso/${product.slug || product.id}`;
    if (navigator.share) {
      navigator.share({ title: product.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  return (
    <>
      <Card
        variant="default"
        padding="none"
        className={cn(
          'cursor-pointer overflow-hidden select-none',
          'transition-transform duration-200 ease-out',
          'hover:scale-[1.02] hover:shadow-md',
          'h-full flex flex-col',
          className
        )}
        onClick={() => setModalOpen(true)}
      >
        {/* Header brand-50 */}
        <div className="bg-brand-50 px-4 pt-4 pb-4 flex-shrink-0 flex flex-col gap-2">
          {/* Fila superior: ícono + fecha */}
          <div className="flex items-center justify-between">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt=""
                aria-hidden="true"
                className="w-5 h-5 flex-shrink-0"
                loading="lazy"
                decoding="async"
                style={{ filter: 'brightness(0) saturate(100%) invert(48%) sepia(60%) saturate(500%) hue-rotate(60deg) brightness(90%)' }}
              />
            ) : (
              <Briefcase size={16} className="flex-shrink-0 text-brand-500 opacity-70" />
            )}
            {dateStr && (
              <div className="flex items-center gap-1 text-[10px] text-brand-600 font-medium">
                <Calendar size={11} />
                <span>{dateStr}</span>
              </div>
            )}
          </div>

          {/* Título ocupa 100% del ancho */}
          <h3 className="w-full text-[22px] font-semibold text-gray-950 leading-snug line-clamp-2">
            {product.title}
          </h3>
        </div>

        {/* Cuerpo blanco */}
        <div className="flex flex-col flex-1 px-4 py-3 gap-2 bg-white">
          {/* Descripción 14px, 100 chars */}
          {descTrunc && (
            <p className="text-[14px] text-gray-900 leading-snug">
              {descTrunc}
            </p>
          )}

          {/* Labels row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag size={10} className="flex-shrink-0 text-brand-500" />
            <span className="text-[12px] text-gray-900">{labelParts.join(' · ')}</span>
          </div>

          {/* Footer: ubicación + share */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
            {product.province ? (
              <div className="flex items-center gap-1 text-[12px] text-gray-900">
                <MapPin size={11} className="flex-shrink-0" />
                <span className="truncate">{product.province}</span>
              </div>
            ) : (
              <span />
            )}
            <button
              onClick={handleShare}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Compartir"
            >
              <Share2 size={13} />
            </button>
          </div>
        </div>
      </Card>

      <EmpleoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        product={product}
      />
    </>
  );
});

EmpleoCard.displayName = 'EmpleoCard';
