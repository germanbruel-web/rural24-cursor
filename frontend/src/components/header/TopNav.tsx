/**
 * TopNav.tsx
 * Barra superior secundaria - Design System RURAL24
 *
 * Mobile:  USD $1.085  |  [+ PUBLICAR]
 * Desktop: USD Oficial/Blue  |  Links secundarios
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, PlusCircle } from 'lucide-react';
import type { Page } from '../../../App';

interface TopNavProps {
  onNavigate: (page: Page) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onNavigate }) => {
  const [dollarRates, setDollarRates] = useState({ oficial: 0, blue: 0 });

  useEffect(() => {
    const fetchDollar = async () => {
      try {
        const [oficialRes, blueRes] = await Promise.all([
          fetch('https://dolarapi.com/v1/dolares/oficial'),
          fetch('https://dolarapi.com/v1/dolares/blue'),
        ]);
        if (oficialRes.ok && blueRes.ok) {
          const oficial = await oficialRes.json();
          const blue = await blueRes.json();
          setDollarRates({
            oficial: Math.round(oficial.venta || 0),
            blue: Math.round(blue.venta || 0),
          });
        }
      } catch (error) {
        console.warn('Error fetching dollar rates:', error);
      }
    };

    fetchDollar();
    const interval = setInterval(fetchDollar, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10">

          {/* ===== MOBILE ===== */}
          <div className="flex md:hidden items-center justify-between w-full">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <span className="font-medium">USD</span>
              {dollarRates.oficial > 0 ? (
                <span className="text-brand-600 font-semibold">${dollarRates.oficial.toLocaleString()}</span>
              ) : (
                <span className="text-gray-400 text-xs">Cargando...</span>
              )}
            </div>
            <button
              onClick={() => { window.location.hash = '#/publicar'; }}
              className="flex items-center gap-1.5 px-5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-full min-h-[34px] transition-colors active:scale-95"
            >
              <PlusCircle size={14} />
              PUBLICAR
            </button>
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
              Preguntas Frecuentes
            </button>
            <span className="text-gray-300">·</span>
            <button
              onClick={() => onNavigate('pricing')}
              className="px-2 py-1 hover:text-gray-900 hover:underline transition-colors"
            >
              Servicios
            </button>
            <span className="text-gray-300">·</span>
            <button
              onClick={() => onNavigate('how-it-works')}
              className="px-2 py-1 hover:text-gray-900 hover:underline transition-colors"
            >
              Sobre Rural24
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TopNav;
