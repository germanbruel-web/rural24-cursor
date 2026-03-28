/**
 * ProfileCompleteModal.tsx
 * Modal minimalista para completar perfil del usuario.
 *
 * - Bottom sheet en mobile (slide-in-up), dialog centrado en desktop (scale-in)
 * - El usuario DEBE hacer click para cerrar (X, "Más tarde", o overlay)
 * - Barra de progreso animada al montar (0% → percentage en 700ms)
 */

import React, { useEffect, useState } from 'react';
import {
  X, UserCircle, MapPin, Phone, ShieldCheck,
  User, Image, ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Mapa ícono → campo faltante ──────────────────────────────────────────────

const fieldIconMap: Record<string, LucideIcon> = {
  'Nombre completo':    User,
  'Celular':            Phone,
  'Celular verificado': ShieldCheck,
  'Provincia':          MapPin,
  'Localidad':          MapPin,
  'Foto de perfil':     Image,
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProfileCompleteModalProps {
  open: boolean;
  onClose: () => void;
  onGoToProfile: () => void;
  percentage: number;
  missingFields: string[];
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═════════════════════════════════════════════════════════════════════════════

export const ProfileCompleteModal: React.FC<ProfileCompleteModalProps> = ({
  open, onClose, onGoToProfile, percentage, missingFields,
}) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setAnimatedWidth(percentage), 200);
      return () => clearTimeout(t);
    } else {
      setAnimatedWidth(0);
    }
  }, [open, percentage]);

  if (!open) return null;

  const remaining = missingFields.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full bg-white
                   rounded-t-2xl md:rounded-2xl
                   shadow-2xl overflow-hidden
                   max-h-[88vh] overflow-y-auto
                   md:max-w-sm
                   animate-slide-in-up md:animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-nudge-title"
      >

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4">

          {/* Botón cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg
                       text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100
                       transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>

          {/* Ícono */}
          <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
            <UserCircle size={24} className="text-brand-600" />
          </div>

          <h2
            id="profile-nudge-title"
            className="text-neutral-900 font-bold text-lg leading-snug"
          >
            Completá tu perfil
          </h2>
          <p className="text-neutral-500 text-sm mt-1 leading-relaxed">
            {remaining === 1
              ? 'Solo falta un dato más para llegar al 100%.'
              : `Faltan ${remaining} datos para tener un perfil completo.`}
          </p>
        </div>

        {/* ── BARRA DE PROGRESO ─────────────────────────────────────── */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-400 text-xs">Completitud</span>
            <span className="text-brand-600 text-xs font-semibold">{percentage}%</span>
          </div>
          <div className="bg-neutral-100 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${animatedWidth}%` }}
            />
          </div>
        </div>

        {/* ── CAMPOS FALTANTES ──────────────────────────────────────── */}
        <div className="px-6 pb-5">
          <p className="text-neutral-500 text-xs mb-3 uppercase tracking-wide font-medium">
            Datos faltantes
          </p>
          <ul className="space-y-1.5">
            {missingFields.map((field) => {
              const Icon = fieldIconMap[field] ?? ChevronRight;
              return (
                <li
                  key={field}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg bg-neutral-50 border border-neutral-100"
                >
                  <Icon size={15} className="text-neutral-400 shrink-0" />
                  <span className="text-neutral-700 text-sm">{field}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ── CTAs ──────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-neutral-100 flex flex-col gap-2">
          <button
            type="button"
            onClick={onGoToProfile}
            className="w-full h-11 bg-brand-600 hover:bg-brand-700
                       text-white text-sm font-semibold rounded-xl
                       flex items-center justify-center gap-2
                       transition-colors active:scale-[0.98]"
          >
            Completar perfil
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-neutral-400 text-sm hover:text-neutral-600
                       transition-colors text-center"
          >
            Más tarde
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileCompleteModal;
