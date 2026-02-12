// Header.tsx
// Header principal - Design System RURAL24
// Mobile: Logo | Buscador compacto | Menú hamburguesa (3 cols)
// Desktop: Logo (izq) | Buscador (centro) | Clima (der)

import React, { useState } from 'react';
import { Sun, Cloud, Wind, Thermometer, Menu, X } from 'lucide-react';
import { GlobalSearchBar } from './GlobalSearchBar';
import type { Page } from '../../App';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  onSearch?: (query: string) => void;
  onToggleMobileMenu?: () => void;
  showMobileMenuButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onNavigate, 
  onSearch, 
  onToggleMobileMenu,
  showMobileMenuButton = true 
}) => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  
  // Logo estático para evitar latencia
  const LOGO_PATH = '/images/logos/rural24-dark.webp';

  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query);
    }
    setShowMobileSearch(false);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8">
        {/* Mobile: 3 columnas - Logo | Buscador | Menú */}
        <div className="flex items-center h-14 sm:h-16 lg:h-20 gap-2 sm:gap-4">
          
          {/* Logo - Izquierda */}
          <button 
            onClick={() => onNavigate('home')}
            className="flex-shrink-0 hover:opacity-80 transition"
          >
            <img 
              src={LOGO_PATH}
              alt="RURAL24" 
              className="h-8 sm:h-9 lg:h-10 w-auto"
              loading="eager"
              fetchPriority="high"
            />
          </button>
          
          {/* Buscador Global - Centro (Desktop) */}
          <GlobalSearchBar
            onSearch={handleSearch}
            placeholder="Tractores, campos, semillas..."
            className="hidden sm:block flex-1 max-w-2xl mx-auto"
          />

          {showMobileSearch ? (
            /* Buscador Mobile - Expandido */
            <div className="sm:hidden flex-1 flex gap-2 items-center">
              <GlobalSearchBar
                onSearch={handleSearch}
                placeholder="Buscar..."
                autoFocus
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setShowMobileSearch(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              {/* Clima - Derecha (Desktop) */}
              <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
                <Sun className="w-4 h-4 text-yellow-500" />
                <span>28°</span>
                <Cloud className="w-4 h-4 text-gray-400" />
                <div className="w-px h-4 bg-gray-300" />
                <div className="flex items-center gap-1" title="Viento">
                  <Wind className="w-4 h-4 text-blue-400" />
                  <span>12 km/h</span>
                </div>
                <div className="w-px h-4 bg-gray-300" />
                <div className="flex items-center gap-1" title="Sensación térmica">
                  <Thermometer className="w-4 h-4 text-orange-400" />
                  <span>ST 26°</span>
                </div>
              </div>

              {/* Menú hamburguesa - Mobile */}
              {showMobileMenuButton && (
                <button
                  onClick={onToggleMobileMenu}
                  className="sm:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Abrir menú"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;