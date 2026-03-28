/**
 * ProfileCompleteModal.tsx
 * Modal de incentivo para completar el perfil del usuario.
 *
 * Dos variantes automáticas:
 *  - Estado A (< 50%): banner secondary-600 (tierra/urgente), tono motivador fuerte
 *  - Estado B (50–99%): banner brand-600 (verde/logro), tono de empujoncito final
 *
 * Comportamiento:
 *  - Bottom sheet en mobile (slide-in-up), dialog centrado en desktop (scale-in)
 *  - El usuario DEBE hacer click para cerrar (X, "Ahora no", o overlay)
 *  - Barra de progreso animada al montar (0% → percentage en 700ms)
 */

import React, { useEffect, useState } from 'react';
import {
  X, UserCircle, BadgeCheck, MapPin, Phone, ShieldCheck,
  User, Image, Home, Circle, ChevronRight, TrendingUp,
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
  'Calle':              Home,
  'Altura':             Home,
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
  // Animación de la barra de progreso: arranca en 0, sube al valor real
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

  const isUrgent = percentage < 50;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full bg-white
                   rounded-t-2xl md:rounded-2xl
                   shadow-2xl overflow-hidden
                   max-h-[92vh] overflow-y-auto
                   md:max-w-md
                   animate-slide-in-up md:animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-nudge-title"
      >

        {/* ── ZONA A: HEADER BANNER ──────────────────────────────────── */}
        <div className={`relative px-6 py-5 ${isUrgent ? 'bg-secondary-600' : 'bg-brand-600'}`}>

          {/* Botón cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg
                       text-white/60 hover:text-white hover:bg-white/10
                       transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4 pr-8">
            {/* Ícono header */}
            <div className="shrink-0 w-12 h-12 bg-white/15 rounded-xl
                            flex items-center justify-center">
              {isUrgent
                ? <UserCircle size={28} className="text-white" />
                : <BadgeCheck size={28} className="text-white" />}
            </div>

            <div>
              <h2
                id="profile-nudge-title"
                className="text-white font-bold text-lg leading-snug"
              >
                {isUrgent
                  ? 'Tu perfil necesita más datos'
                  : '¡Ya casi llegás al 100%!'}
              </h2>
              <p className={`text-sm mt-1 leading-relaxed ${isUrgent ? 'text-secondary-100' : 'text-brand-100'}`}>
                {isUrgent
                  ? 'Completalo para acceder al Check Verificado y generar confianza real en el campo'
                  : 'Con un paso más desbloqueás el Check Verificado de Rural24'}
              </p>
            </div>
          </div>

          {/* Badge porcentaje */}
          <div className="mt-4 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
            <span className="text-white font-semibold text-sm">{percentage}%</span>
            <span className="text-white/75 text-xs">
              {isUrgent ? 'completado' : '— casi listo'}
            </span>
          </div>
        </div>

        {/* ── ZONA B: BARRA DE PROGRESO ─────────────────────────────── */}
        <div className="px-6 py-4 bg-white border-b border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600 text-xs font-medium">
              Completitud del perfil
            </span>
            <span className={`text-xs font-bold ${isUrgent ? 'text-secondary-700' : 'text-brand-700'}`}>
              {isUrgent
                ? `Faltan ${missingFields.length} campos`
                : `Solo ${missingFields.length} ${missingFields.length === 1 ? 'campo' : 'campos'} más`}
            </span>
          </div>
          <div className="bg-neutral-200 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out
                ${isUrgent ? 'bg-secondary-500' : 'bg-brand-500'}`}
              style={{ width: `${animatedWidth}%` }}
            />
          </div>
        </div>

        {/* ── ZONA C: CUERPO ────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-4 bg-white">

          {/* Lista de campos faltantes */}
          <div>
            <p className="text-neutral-700 text-sm font-semibold mb-3">
              {isUrgent ? 'Para llegar al 100% necesitás agregar:' : 'Solo falta agregar:'}
            </p>
            <ul className="space-y-2">
              {missingFields.map((field) => {
                const Icon = fieldIconMap[field] ?? Circle;
                return (
                  <li
                    key={field}
                    className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border
                      ${isUrgent
                        ? 'bg-neutral-50 border-neutral-200'
                        : 'bg-brand-50 border-brand-100'}`}
                  >
                    <div className={`shrink-0 w-8 h-8 bg-white rounded-lg border flex items-center justify-center
                      ${isUrgent ? 'border-neutral-200' : 'border-brand-200'}`}>
                      <Icon
                        size={16}
                        className={isUrgent ? 'text-neutral-500' : 'text-brand-600'}
                      />
                    </div>
                    <span className="text-neutral-800 text-sm font-medium flex-1">
                      {field}
                    </span>
                    <ChevronRight
                      size={14}
                      className={`shrink-0 ${isUrgent ? 'text-neutral-400' : 'text-brand-400'}`}
                    />
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Social proof */}
          <div className={`flex items-start gap-3 rounded-r-xl px-4 py-3 border-l-4
            ${isUrgent
              ? 'bg-secondary-50 border-secondary-400'
              : 'bg-brand-50 border-brand-400'}`}>
            {isUrgent
              ? <TrendingUp size={16} className="text-secondary-600 shrink-0 mt-0.5" />
              : <ShieldCheck size={16} className="text-brand-600 shrink-0 mt-0.5" />}
            <p className={`text-xs leading-relaxed
              ${isUrgent ? 'text-secondary-800' : 'text-brand-800'}`}>
              {isUrgent
                ? <>Los perfiles completos reciben <strong>3x más contactos</strong> de compradores serios</>
                : <>El <strong>Check Verificado</strong> te distingue de cuentas sin verificar y aumenta tu credibilidad como vendedor</>}
            </p>
          </div>

        </div>

        {/* ── ZONA D: FOOTER CTAs ───────────────────────────────────── */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex flex-col gap-3">
          <button
            type="button"
            onClick={onGoToProfile}
            className="w-full h-12 bg-brand-600 hover:bg-brand-700
                       text-white font-semibold rounded-xl
                       flex items-center justify-center gap-2
                       transition-colors shadow-brand
                       active:scale-[0.98]"
          >
            <span>{isUrgent ? 'Completar mi perfil' : 'Terminar ahora'}</span>
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-neutral-500 text-sm
                       hover:text-neutral-700 transition-colors text-center"
          >
            {isUrgent ? 'Ahora no' : 'Lo hago después'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileCompleteModal;
