// Header.tsx
// Header principal - Design System RURAL24
// Mobile: Logo | Buscador compacto | Menú hamburguesa (3 cols)
// Desktop: Logo (izq) | Buscador (centro) | Clima (der)

import React, { useState } from 'react';
import { Search, X, Sun, Cloud, Wind, Thermometer, Menu } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  
  // Logo estático para evitar latencia
  const LOGO_PATH = '/images/logos/rural24-dark.webp';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
      setSearchQuery('');
      setShowMobileSearch(false);
    }
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
          
          {/* Buscador - Centro (Desktop) */}
          <div className="hidden sm:block flex-1 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tractores, cosechadoras, campos..."
                className="w-full pl-10 pr-20 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a135] focus:border-transparent transition-all bg-gray-50 hover:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-14 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#16a135] hover:bg-[#138a2e] text-white text-sm font-medium rounded-md transition-colors"
              >
                Buscar
              </button>
            </form>
          </div>

          {/* Buscador móvil - Expandible */}
          {showMobileSearch ? (
            <form onSubmit={handleSubmit} className="sm:hidden flex-1 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  autoFocus
                  className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a135]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-[#16a135] text-white text-sm font-medium rounded-lg"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowMobileSearch(false)}
                className="p-2 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <>
              {/* Icono búsqueda mobile */}
              <button
                className="sm:hidden flex-1 flex items-center justify-center gap-2 py-2 px-3 text-gray-500 bg-gray-100 rounded-lg"
                onClick={() => setShowMobileSearch(true)}
              >
                <Search className="w-4 h-4" />
                <span className="text-sm text-gray-400">Buscar...</span>
              </button>

              {/* Widget Clima - Desktop */}
              <div className="hidden lg:flex items-center gap-3 text-sm text-gray-600 flex-shrink-0">
                <div className="flex items-center gap-1" title="Temperatura">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">24°C</span>
                </div>
                <div className="w-px h-4 bg-gray-300" />
                <div className="flex items-center gap-1" title="Condición">
                  <Cloud className="w-4 h-4 text-gray-400" />
                  <span>Parcial</span>
                </div>
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