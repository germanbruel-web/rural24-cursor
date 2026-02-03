// Header.tsx
// Header principal - Design System RURAL24
// Estructura: Logo (izq) | Buscador (centro) | Clima (der)

import React, { useState } from 'react';
import { Search, X, Sun, Cloud, Wind, Thermometer } from 'lucide-react';

interface HeaderProps {
  onNavigate: (page: string) => void;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Logo estático para evitar latencia
  const LOGO_PATH = '/images/logos/rural24-dark.webp';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          
          {/* Logo - Izquierda */}
          <button 
            onClick={() => onNavigate('home')}
            className="flex-shrink-0 hover:opacity-80 transition"
          >
            <img 
              src={LOGO_PATH}
              alt="RURAL24" 
              className="h-10 w-auto"
              loading="eager"
              fetchPriority="high"
            />
          </button>
          
          {/* Buscador - Centro */}
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

          {/* Buscador móvil - Solo icono */}
          <button
            className="sm:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-1"
            onClick={() => {
              if (onSearch) {
                const query = prompt('¿Qué estás buscando?');
                if (query?.trim()) {
                  onSearch(query.trim());
                }
              }
            }}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Widget Clima - Derecha (Desktop) */}
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-600 flex-shrink-0">
            {/* Temperatura */}
            <div className="flex items-center gap-1" title="Temperatura">
              <Sun className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">24°C</span>
            </div>
            
            {/* Separador */}
            <div className="w-px h-4 bg-gray-300" />
            
            {/* Condición */}
            <div className="flex items-center gap-1" title="Condición">
              <Cloud className="w-4 h-4 text-gray-400" />
              <span>Parcial</span>
            </div>
            
            {/* Separador */}
            <div className="w-px h-4 bg-gray-300" />
            
            {/* Viento */}
            <div className="flex items-center gap-1" title="Viento">
              <Wind className="w-4 h-4 text-blue-400" />
              <span>12 km/h</span>
            </div>
            
            {/* Separador */}
            <div className="w-px h-4 bg-gray-300" />
            
            {/* Sensación térmica */}
            <div className="flex items-center gap-1" title="Sensación térmica">
              <Thermometer className="w-4 h-4 text-orange-400" />
              <span>ST 26°</span>
            </div>
          </div>

          {/* Widget Clima - Móvil (compacto) */}
          <div className="flex md:hidden items-center gap-2 text-xs text-gray-600 flex-shrink-0">
            <Sun className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">24°C</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;