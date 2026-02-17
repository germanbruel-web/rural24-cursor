// TopNav.tsx
// Barra superior de navegación - Design System RURAL24
// Desktop: Links + User Dropdown
// Mobile: Menú unificado (se controla desde Header)

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDevMode } from '../contexts/DevModeContext';
import { canAccessPage } from '../utils/rolePermissions';
import { navigateTo } from '../hooks/useNavigate';
import { Button } from './atoms/Button';
import AuthModal from './auth/AuthModal';
import { 
  LogOut, User, Home, Package, Clock, Users, 
  Search, Star, Settings, MessageSquare, ChevronDown,
  HelpCircle, CreditCard, PlusCircle, Sun, X
} from 'lucide-react';
import type { Page } from '../../App';

interface TopNavProps {
  onNavigate: (page: Page) => void;
  showMobileMenu?: boolean;
  onCloseMobileMenu?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ 
  onNavigate, 
  showMobileMenu = false,
  onCloseMobileMenu 
}) => {
  const { user, profile, signOut } = useAuth();
  const { isDevMode } = useDevMode();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest('button[aria-label="Abrir menú"]')) {
          onCloseMobileMenu?.();
        }
      }
    };

    if (showUserMenu || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showMobileMenu, onCloseMobileMenu]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      setShowUserMenu(false);
      await signOut();
      navigateTo('/');
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setIsLoggingOut(false);
    }
  };

  // Nombre del usuario formateado
  const getUserDisplayName = () => {
    if (!profile) {
      return user?.email?.split('@')[0] || 'Cargando...';
    }
    
    const fullName = profile.full_name || profile.email?.split('@')[0] || 'Usuario';
    const parts = fullName.split(' ');
    
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1].charAt(0)}.`;
    }
    return fullName;
  };

  const isAuthenticated = user || isDevMode;

  return (
    <>
      <nav className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-8 sm:h-10 gap-1">

            {/* Mobile: Clima + Dolar (izq) + Publicar (der) */}
            <div className="flex md:hidden items-center justify-between w-full">
              <div className="flex items-center gap-2 text-sm text-gray-600 font-sans">
                <Sun size={14} className="text-yellow-500" />
                <span className="font-medium">24°</span>
                <span className="text-gray-300">·</span>
                <span className="font-medium">USD</span>
                <span className="text-brand-600 font-semibold">$1.085</span>
              </div>
              <button
                onClick={() => navigateTo('/publicar')}
                className="flex items-center gap-1 px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-full min-h-[32px] transition-colors active:scale-95"
              >
                <PlusCircle size={14} />
                PUBLICAR
              </button>
            </div>
            
            {/* Links de navegación - Desktop */}
            <div className="hidden md:flex items-center gap-1 ml-auto">
              <button
                onClick={() => onNavigate('how-it-works')}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1.5"
              >
                <HelpCircle size={14} />
                ¿Qué es RURAL 24?
              </button>
              
              <button
                onClick={() => onNavigate('pricing')}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1.5"
              >
                <CreditCard size={14} />
                Planes
              </button>
              
              <button
                onClick={() => navigateTo('/publicar')}
                className="px-3 py-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-md transition-colors flex items-center gap-1.5"
              >
                <PlusCircle size={14} />
                Publicar Gratis
              </button>
            </div>

            {/* Separador vertical */}
            <div className="hidden md:block w-px h-5 bg-gray-300 mx-2" />

            {/* Usuario autenticado - Desktop only */}
            {isAuthenticated ? (
              <div className="hidden md:block relative" ref={menuRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <div className="w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{getUserDisplayName()}</span>
                  <ChevronDown 
                    size={14} 
                    className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    {/* Dashboard */}
                    <div className="px-2">
                      <button
                        onClick={() => { onNavigate('my-ads'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Home size={16} className="text-gray-500" />
                        Dashboard
                      </button>
                    </div>

                    {/* GRUPO: AVISOS */}
                    {canAccessPage('deleted-ads', profile?.role) && (
                      <>
                        <hr className="my-2 border-gray-200" />
                        <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">
                          Avisos
                        </div>
                      </>
                    )}
                    
                    <div className="px-2">
                      <button
                        onClick={() => { onNavigate('my-ads'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Package size={16} className="text-gray-500" />
                        Mis Avisos
                      </button>
                    </div>
                    
                    {canAccessPage('deleted-ads', profile?.role) && (
                      <div className="px-2">
                        <button
                          onClick={() => { onNavigate('deleted-ads'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Clock size={16} className="text-gray-500" />
                          Avisos Eliminados
                        </button>
                      </div>
                    )}

                    {/* GRUPO: MENSAJES */}
                    <hr className="my-2 border-gray-200" />
                    <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">
                      Mensajes
                    </div>
                    
                    {canAccessPage('inbox', profile?.role) && (
                      <div className="px-2">
                        <button
                          onClick={() => { onNavigate('inbox'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <MessageSquare size={16} className="text-gray-500" />
                          Mensajes
                          <span className="text-xs text-gray-400">(próximamente)</span>
                        </button>
                      </div>
                    )}

                    {/* GRUPO: ADMINISTRACIÓN */}
                    {(canAccessPage('users', profile?.role) || canAccessPage('banners', profile?.role) || canAccessPage('categories-admin', profile?.role)) && (
                      <>
                        <hr className="my-2 border-gray-200" />
                        <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">
                          Administración
                        </div>
                      </>
                    )}

                    {canAccessPage('users', profile?.role) && (
                      <div className="px-2">
                        <button
                          onClick={() => { onNavigate('users'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Users size={16} className="text-gray-500" />
                          Usuarios
                        </button>
                      </div>
                    )}

                    {canAccessPage('ad-finder', profile?.role) && (
                      <div className="px-2">
                        <button
                          onClick={() => { onNavigate('ad-finder'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Search size={16} className="text-gray-500" />
                          Buscador de Avisos
                        </button>
                      </div>
                    )}
                    
                    {canAccessPage('banners', profile?.role) && (
                      <div className="px-2">
                        <button
                          onClick={() => { onNavigate('banners'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Star size={16} className="text-gray-500" />
                          Banners
                        </button>
                      </div>
                    )}
                    
                    {canAccessPage('categories-admin', profile?.role) && (
                      <div className="px-2">
                        <button
                          onClick={() => { onNavigate('categories-admin'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Settings size={16} className="text-gray-500" />
                          Categorías
                        </button>
                      </div>
                    )}
                    
                    {canAccessPage('attributes-admin', profile?.role) && (
                      <div className="px-2">
                        <button
                          onClick={() => { onNavigate('attributes-admin'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Settings size={16} className="text-gray-500" />
                          Atributos
                        </button>
                      </div>
                    )}
                    
                    <hr className="my-2 border-gray-200" />
                    
                    {/* Mi Perfil */}
                    <div className="px-2">
                      <button
                        onClick={() => { onNavigate('profile'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <User size={16} className="text-gray-500" />
                        Mi Perfil
                      </button>
                    </div>
                    
                    {/* Cerrar Sesión */}
                    <div className="px-2">
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      >
                        <LogOut size={16} />
                        {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Usuario no autenticado - Desktop only */
              <button
                onClick={() => setShowAuthModal(true)}
                className="hidden md:block px-4 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-md transition-colors"
              >
                Ingresar
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown - Unificado con links + profile + clima */}
        {showMobileMenu && (
          <div 
            ref={mobileMenuRef}
            className="md:hidden fixed inset-0 top-14 bg-white z-50 overflow-y-auto"
          >
            {/* Header del menú con botón cerrar */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Menú</span>
              <button
                onClick={onCloseMobileMenu}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-4 py-4 space-y-1">
              {/* Sección: Navegación */}
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                Navegación
              </div>
              
              <button
                onClick={() => { onNavigate('how-it-works'); onCloseMobileMenu?.(); }}
                className="w-full text-left px-3 py-3 text-base text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3"
              >
                <HelpCircle size={20} className="text-gray-400" />
                ¿Qué es RURAL 24?
              </button>
              
              <button
                onClick={() => { onNavigate('pricing'); onCloseMobileMenu?.(); }}
                className="w-full text-left px-3 py-3 text-base text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3"
              >
                <CreditCard size={20} className="text-gray-400" />
                Planes y Precios
              </button>
              
              <button
                onClick={() => { navigateTo('/publicar'); onCloseMobileMenu?.(); }}
                className="w-full text-left px-3 py-3 text-base font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg flex items-center gap-3"
              >
                <PlusCircle size={20} />
                Publicar Gratis
              </button>

              <hr className="my-3 border-gray-200" />

              {/* Sección: Mi Cuenta */}
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                Mi Cuenta
              </div>

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => { onNavigate('my-ads'); onCloseMobileMenu?.(); }}
                    className="w-full text-left px-3 py-3 text-base text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                  >
                    <Package size={20} className="text-gray-400" />
                    Mis Avisos
                  </button>
                  
                  <button
                    onClick={() => { onNavigate('inbox'); onCloseMobileMenu?.(); }}
                    className="w-full text-left px-3 py-3 text-base text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                  >
                    <MessageSquare size={20} className="text-gray-400" />
                    Mensajes
                  </button>
                  
                  <button
                    onClick={() => { onNavigate('profile'); onCloseMobileMenu?.(); }}
                    className="w-full text-left px-3 py-3 text-base text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                  >
                    <User size={20} className="text-gray-400" />
                    Mi Perfil
                  </button>
                  
                  <hr className="my-3 border-gray-200" />
                  
                  <button
                    onClick={() => { handleLogout(); onCloseMobileMenu?.(); }}
                    disabled={isLoggingOut}
                    className="w-full text-left px-3 py-3 text-base text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3"
                  >
                    <LogOut size={20} />
                    {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setShowAuthModal(true); onCloseMobileMenu?.(); }}
                  className="w-full px-4 py-3 text-base font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg flex items-center justify-center gap-2"
                >
                  <User size={20} />
                  Ingresar / Registrarse
                </button>
              )}

              <hr className="my-3 border-gray-200" />

              {/* Sección: Clima (al final) */}
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                Clima
              </div>
              <div className="px-3 py-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun size={24} className="text-yellow-500" />
                    <div>
                      <p className="text-lg font-bold text-gray-900">24°C</p>
                      <p className="text-sm text-gray-500">Parcialmente nublado</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>ST 26°</p>
                    <p>Viento 12 km/h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default TopNav;
