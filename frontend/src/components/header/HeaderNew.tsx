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

import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Menu, X, Home, Package, Clock, MessageSquare, User, LogOut, Settings, Star, Search, ChevronDown, HelpCircle, CreditCard } from 'lucide-react';
import { TopNav } from './TopNav';
import { GlobalSearchBar } from '../GlobalSearchBar';
import { UserMenu } from './UserMenu';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessPage } from '../../utils/rolePermissions';
import AuthModal from '../auth/AuthModal';
import type { Page } from '../../../App';

interface HeaderNewProps {
  onNavigate: (page: Page) => void;
  onSearch?: (query: string, location?: string) => void;
}

export const HeaderNew: React.FC<HeaderNewProps> = ({ onNavigate, onSearch }) => {
  const { user, profile, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileUserMenu, setShowMobileUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileUserMenuRef = useRef<HTMLDivElement>(null);

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

  // Abrir modal de auth con vista específica
  const openAuth = (view: 'login' | 'register') => {
    setAuthModalView(view);
    setShowAuthModal(true);
  };

  // Manejar click en "Publicar Gratis"
  const handlePublish = () => {
    if (!user) {
      openAuth('login');
    } else {
      window.location.hash = '#/publicar';
    }
  };

  // Manejar logout mobile
  const handleMobileLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      setShowMobileUserMenu(false);
      await signOut();
      window.location.hash = '#/';
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setIsLoggingOut(false);
    }
  };

  // Cerrar dropdown mobile al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileUserMenuRef.current && !mobileUserMenuRef.current.contains(event.target as Node)) {
        setShowMobileUserMenu(false);
      }
    };
    if (showMobileUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileUserMenu]);

  return (
    <>
      {/* TOPNAV - Barra superior secundaria */}
      <TopNav onNavigate={onNavigate} />

      {/* HEADER PRINCIPAL */}
      <header 
        className={`bg-white border-b border-gray-200 transition-all duration-300
                   ${isScrolled ? 'sticky top-0 shadow-md backdrop-blur-sm bg-white/95 z-40' : 'z-30'}`}
      >
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 h-14 sm:h-16">
            
            {/* LOGO - Izquierda */}
            <button 
              onClick={() => onNavigate('home')}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
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
              <GlobalSearchBar
                onSearch={handleSearch}
                placeholder="Tractores, semillas, campos en venta..."
              />
            </div>

            {/* Derecha */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              
              {/* CTA "Publicar Aviso Gratis" - Solo Desktop */}
              <button
                onClick={handlePublish}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 
                         bg-brand-500 hover:bg-brand-600
                         text-white font-semibold rounded-full
                         shadow-md hover:shadow-lg
                         transition-all duration-200
                         transform hover:scale-105 active:scale-100
                         focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publicar Aviso Gratis</span>
              </button>

              {/* Mobile: Botones ENTRAR / REGISTRARSE separados (no autenticado) */}
              {!user && (
                <div className="sm:hidden flex items-center gap-0 min-h-[36px]">
                  <button
                    onClick={() => openAuth('login')}
                    className="px-2 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Entrar
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => openAuth('register')}
                    className="px-2 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Registrarse
                  </button>
                </div>
              )}

              {/* Mobile: Avatar + Nombre con dropdown dashboard (autenticado) */}
              {user && (
                <div ref={mobileUserMenuRef} className="sm:hidden relative">
                  <button
                    onClick={() => setShowMobileUserMenu(!showMobileUserMenu)}
                    className="flex items-center gap-1.5 min-h-[40px] px-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-brand-400"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-500 
                                    flex items-center justify-center text-white font-semibold text-xs">
                        {(profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 max-w-[60px] truncate">
                      {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || ''}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showMobileUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Dashboard Menu - Mobile */}
                  {showMobileUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{profile?.full_name || 'Usuario'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <button onClick={() => { onNavigate('my-ads'); setShowMobileUserMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <Home className="w-4 h-4 text-gray-500" /> Dashboard
                        </button>
                        <button onClick={() => { onNavigate('my-ads'); setShowMobileUserMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <Package className="w-4 h-4 text-gray-500" /> Mis Avisos
                        </button>
                        {canAccessPage('deleted-ads', profile?.role) && (
                          <button onClick={() => { onNavigate('deleted-ads'); setShowMobileUserMenu(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                            <Clock className="w-4 h-4 text-gray-500" /> Avisos Eliminados
                          </button>
                        )}
                      </div>

                      <div className="border-t border-gray-100 py-1">
                        <button onClick={() => { onNavigate('inbox'); setShowMobileUserMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <MessageSquare className="w-4 h-4 text-gray-500" /> Mensajes
                        </button>
                      </div>

                      {(canAccessPage('users', profile?.role) || canAccessPage('banners', profile?.role)) && (
                        <div className="border-t border-gray-100 py-1">
                          <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">Admin</div>
                          {canAccessPage('users', profile?.role) && (
                            <button onClick={() => { onNavigate('users'); setShowMobileUserMenu(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                              <User className="w-4 h-4 text-gray-500" /> Usuarios
                            </button>
                          )}
                          {canAccessPage('ad-finder', profile?.role) && (
                            <button onClick={() => { onNavigate('ad-finder'); setShowMobileUserMenu(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                              <Search className="w-4 h-4 text-gray-500" /> Buscador Avisos
                            </button>
                          )}
                          {canAccessPage('banners', profile?.role) && (
                            <button onClick={() => { onNavigate('banners'); setShowMobileUserMenu(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                              <Star className="w-4 h-4 text-gray-500" /> Banners
                            </button>
                          )}
                          {canAccessPage('categories-admin', profile?.role) && (
                            <button onClick={() => { onNavigate('categories-admin'); setShowMobileUserMenu(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                              <Settings className="w-4 h-4 text-gray-500" /> Categorías
                            </button>
                          )}
                        </div>
                      )}

                      <div className="border-t border-gray-100 py-1">
                        <button onClick={() => { onNavigate('profile'); setShowMobileUserMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <User className="w-4 h-4 text-gray-500" /> Mi Perfil
                        </button>
                        <button onClick={handleMobileLogout} disabled={isLoggingOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">
                          <LogOut className="w-4 h-4" /> {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Menu - Solo Desktop */}
              <div className="hidden sm:block">
                <UserMenu 
                  onNavigate={onNavigate}
                  onShowAuthModal={() => openAuth('login')}
                  onShowRegisterModal={() => openAuth('register')}
                />
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="sm:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                aria-label="Menú"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* ROW 3 - SUBNAV: Buscador Mobile - Full width */}
          <div className="md:hidden pb-2">
            <GlobalSearchBar
              onSearch={handleSearch}
              placeholder="Tractores, campos, semillas..."
            />
          </div>
        </div>
      </header>

      {/* Modal de Autenticación */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialView={authModalView}
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

            {/* Contenido del menú - Links de navegación */}
            <div className="p-4 space-y-2">
              <button
                onClick={() => { onNavigate('how-it-works'); setShowMobileMenu(false); }}
                className="w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3"
              >
                <HelpCircle className="w-5 h-5 text-gray-400" />
                ¿Qué es Rural24?
              </button>
              
              <button
                onClick={() => { onNavigate('pricing'); setShowMobileMenu(false); }}
                className="w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3"
              >
                <CreditCard className="w-5 h-5 text-gray-400" />
                Planes y Servicios
              </button>

              <button
                onClick={() => { handlePublish(); setShowMobileMenu(false); }}
                className="w-full text-left px-4 py-3 text-base font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg flex items-center gap-3"
              >
                <PlusCircle className="w-5 h-5" />
                Publicar Aviso Gratis
              </button>

              {!user && (
                <>
                  <hr className="my-2 border-gray-200" />
                  <div className="grid grid-cols-2 gap-2 px-4">
                    <button
                      onClick={() => { openAuth('login'); setShowMobileMenu(false); }}
                      className="px-4 py-3 text-sm font-semibold text-brand-500 border-2 border-brand-500 hover:bg-brand-50 rounded-lg flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Entrar
                    </button>
                    <button
                      onClick={() => { openAuth('register'); setShowMobileMenu(false); }}
                      className="px-4 py-3 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg flex items-center justify-center gap-2"
                    >
                      Registrarse
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeaderNew;
