/**
 * HeaderNew.tsx
 * Header Principal rediseñado - Design System RURAL24
 * 
 * Estructura optimizada para conversión:
 * ┌────────────────────────────────────────────────────────────────┐
 * │ TOPNAV (40px) - Clima | Espacio | Links secundarios           │
 * └────────────────────────────────────────────────────────────────┘
 * ┌────────────────────────────────────────────────────────────────┐
 * │ HEADER (80px) - Logo | Buscador protagonista | CTA + Usuario   │
 * └────────────────────────────────────────────────────────────────┘
 * 
 * Features:
 * - Sticky header con backdrop blur
 * - Buscador inteligente con autocompletado
 * - CTA "Publicar Gratis" destacado
 * - Microinteracciones sutiles
 * - Responsive mobile-first
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Menu, X } from 'lucide-react';
import { TopNav } from './TopNav';
import { GlobalSearchBar } from '../GlobalSearchBar';
import { UserMenu } from './UserMenu';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../auth/AuthModal';
import type { Page } from '../../../App';

interface HeaderNewProps {
  onNavigate: (page: Page) => void;
  onSearch?: (query: string, location?: string) => void;
}

export const HeaderNew: React.FC<HeaderNewProps> = ({ onNavigate, onSearch }) => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Logo estático para evitar latencia
  const LOGO_PATH = '/images/logos/rural24-dark.webp';

  // Detect scroll para sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Manejar búsqueda
  const handleSearch = (query: string) => {
    console.log('Búsqueda:', query);
    
    // La navegación ya la maneja GlobalSearchBar internamente
    // Solo trigger callback si existe
    if (onSearch) {
      onSearch(query);
    }
  };

  // Manejar click en "Publicar Gratis"
  const handlePublish = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      window.location.hash = '#/publicar';
    }
  };

  return (
    <>
      {/* TOPNAV - Barra superior secundaria */}
      <TopNav onNavigate={onNavigate} />

      {/* HEADER PRINCIPAL */}
      <header 
        className={`bg-white border-b border-gray-200 transition-all duration-300
                   ${isScrolled ? 'sticky top-0 shadow-md backdrop-blur-sm bg-white/95 z-40' : 'z-30'}`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16 sm:h-20">
            
            {/* LOGO - Izquierda */}
            <button 
              onClick={() => onNavigate('home')}
              className="flex-shrink-0 hover:opacity-80 transition-opacity group"
              aria-label="Ir al inicio"
            >
              <img 
                src={LOGO_PATH}
                alt="RURAL24" 
                className={`h-8 sm:h-10 w-auto transition-all duration-300 
                          ${isScrolled ? 'sm:h-8' : 'sm:h-10'}`}
                loading="eager"
                fetchPriority="high"
              />
            </button>

            {/* BUSCADOR - Centro (Desktop) */}
            <div className="hidden md:flex flex-1 justify-center max-w-4xl mx-4">
              <SmartSearchBar
                onSearch={handleSearch}
                placeholder="Tractores, semillas, campos en venta..."
              />
            </div>

            {/*GlobalLE: Botón de búsqueda */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden flex-1 flex items-center gap-2 px-3 py-2 
                       text-sm text-gray-500 bg-gray-100 rounded-lg 
                       hover:bg-gray-200 transition-colors"
            >
              <span>Buscar...</span>
            </button>

            {/* CTA + Usuario - Derecha */}
            <div className="flex items-center gap-3 flex-shrink-0">
              
              {/* CTA "Publicar Gratis" - Desktop */}
              <button
                onClick={handlePublish}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 
                         bg-gradient-to-r from-green-600 to-green-700
                         hover:from-green-700 hover:to-green-800
                         text-white font-semibold rounded-lg
                         shadow-md hover:shadow-lg
                         transition-all duration-200
                         transform hover:scale-105 active:scale-100
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Publicar Gratis</span>
              </button>

              {/* CTA Mobile (solo icono) */}
              <button
                onClick={handlePublish}
                className="sm:hidden p-2.5 bg-gradient-to-r from-green-600 to-green-700
                         hover:from-green-700 hover:to-green-800
                         text-white rounded-lg shadow-md"
              >
                <Sparkles className="w-5 h-5" />
              </button>

              {/* User Menu */}
              <div className="hidden sm:block">
                <UserMenu 
                  onNavigate={onNavigate}
                  onShowAuthModal={() => setShowAuthModal(true)}
                />
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="sm:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Menú"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Buscador Mobile - Expandible */}
          <div className="md:hidden pb-3">
            <GlobalSearchBar
              onSearch={handleSearch}
              placeholder="Buscar productos..."
            />
          </div>
        </div>
      </header>

      {/* Modal de Autenticación */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="sm:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setShowMobileMenu(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del menú */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
              <h3 className="font-semibold text-gray-900">Menú</h3>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del menú */}
            <div className="p-4 space-y-4">
              {/* User info si está logueado */}
              {user && (
                <div className="pb-4 border-b border-gray-200">
                  <UserMenu 
                    onNavigate={(page) => {
                      onNavigate(page);
                      setShowMobileMenu(false);
                    }}
                    onShowAuthModal={() => {
                      setShowAuthModal(true);
                      setShowMobileMenu(false);
                    }}
                  />
                </div>
              )}

              {/* Links principales */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onNavigate('how-it-works');
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  ¿Qué es Rural24?
                </button>
                
                <button
                  onClick={() => {
                    onNavigate('pricing');
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Planes y Servicios
                </button>

                {!user && (
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    Ingresar / Registrarse
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeaderNew;
