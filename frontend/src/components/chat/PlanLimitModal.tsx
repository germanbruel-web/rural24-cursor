/**
 * PlanLimitModal — Se muestra cuando usuario FREE intenta abrir
 * más de 3 conversaciones activas como comprador.
 */

import React from 'react';
import { X, Zap, Lock } from 'lucide-react';
import { navigateTo } from '../../hooks/useNavigate';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useBodyOverflow } from '../../hooks/useBodyOverflow';

interface PlanLimitModalProps {
  onClose: () => void;
}

export const PlanLimitModal: React.FC<PlanLimitModalProps> = ({ onClose }) => {
  useBodyOverflow(true);
  useEscapeKey(onClose);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-sm bg-white rounded-2xl shadow-xl p-6 text-center"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-amber-500" />
        </div>

        <h2 className="text-base font-bold text-gray-900 mb-1">
          Límite de conversaciones alcanzado
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          El plan <strong>Free</strong> permite hasta <strong>3 conversaciones activas</strong>.
          Pasá a <strong>Premium</strong> para chatear sin límites.
        </p>

        <div className="space-y-2">
          <button
            onClick={() => { onClose(); navigateTo('/subscription'); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Zap className="w-4 h-4" />
            Ver planes Premium
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Ahora no
          </button>
        </div>
      </div>
    </>
  );
};

export default PlanLimitModal;
