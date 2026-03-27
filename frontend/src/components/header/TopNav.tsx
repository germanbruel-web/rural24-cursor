/**
 * TopNav.tsx
 * Barra superior secundaria - Design System RURAL24
 *
 * Mobile:  USD $1.085  |  [+ PUBLICAR]
 * Desktop: USD Oficial/Blue  |  Links secundarios
 */

import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import type { Page } from '../../../App';

interface TopNavProps {
  onNavigate: (page: Page) => void;
}

const WIZARD_HASHES = ['#/publicar', '#/publicar-v3', '#/edit/'];
const isWizardHash = (hash: string) => WIZARD_HASHES.some(w => hash.startsWith(w));

export const TopNav: React.FC<TopNavProps> = ({ onNavigate }) => {
  const [dollarRates, setDollarRates] = useState({ oficial: 0, blue: 0 });
  const [isWizard, setIsWizard] = useState(() => isWizardHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setIsWizard(isWizardHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const fetchDollar = async () => {
      try {
        const res = await fetch('/api/dollar-rates');
        if (res.ok) {
          const data = await res.json();
          setDollarRates({ oficial: data.oficial, blue: data.blue });
        }
      } catch {
        // silencioso — muestra 0 si no hay datos
      }
    };

    fetchDollar();
    const interval = setInterval(fetchDollar, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden md:block bg-gray-50 border-b border-gray-200">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10">

          {/* ===== MOBILE ===== solo cotización USD (oculto en wizard) */}
          <div className={`md:hidden items-center w-full ${isWizard ? 'hidden' : 'flex'}`}>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <span className="font-medium">USD</span>
              {dollarRates.oficial > 0 ? (
                <span className="text-brand-600 font-semibold">${dollarRates.oficial.toLocaleString()}</span>
              ) : (
                <span className="text-gray-400 text-xs">Cargando...</span>
              )}
            </div>
          </div>

          {/* ===== DESKTOP ===== */}
          <div className="hidden md:flex items-center gap-1.5 text-sm text-gray-600">
            <DollarSign className="w-3 h-3 text-gray-400" />
            {dollarRates.oficial > 0 ? (
              <span className="text-xs">
                Oficial ${dollarRates.oficial.toLocaleString()} · Blue ${dollarRates.blue.toLocaleString()}
              </span>
            ) : (
              <span className="text-xs text-gray-400">Cargando cotización...</span>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1 text-sm text-gray-500">
            <button
              onClick={() => onNavigate('how-it-works')}
              className="px-2 py-1 hover:text-gray-900 hover:underline transition-colors"
            >
              ¿Cómo funciona?
            </button>
            <span className="text-gray-300">·</span>
            <button
              onClick={() => onNavigate('pricing')}
              className="px-2 py-1 hover:text-gray-900 hover:underline transition-colors"
            >
              Precios
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TopNav;
