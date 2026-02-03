// TopNav.tsx
// Barra superior de navegación - Design System RURAL24
// Links: ¿Cómo funciona? | Planes | Publicar Gratis | User Dropdown

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDevMode } from '../contexts/DevModeContext';
import { canAccessPage } from '../utils/rolePermissions';
import { Button } from './atoms/Button';
import AuthModal from './auth/AuthModal';
import { 
  LogOut, User, Home, Package, Clock, Users, 
  Search, Star, Settings, MessageSquare, ChevronDown,
  HelpCircle, CreditCard, PlusCircle
} from 'lucide-react';

interface TopNavProps {
  onNavigate: (page: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onNavigate }) => {
  const { user, profile, signOut } = useAuth();
  const { isDevMode } = useDevMode();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
        // No cerrar si el clic fue en el botón de toggle
        const target = event.target as HTMLElement;
        if (!target.closest('button[class*="md:hidden"]')) {
          setShowMobileMenu(false);
        }
      }
    };

    if (showUserMenu || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showMobileMenu]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      setShowUserMenu(false);
      await signOut();
      window.location.hash = '#/';
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
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end h-10 gap-1">
            
            {/* Links de navegación - Desktop */}
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => onNavigate('how-it-works')}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1.5"
              >
                <HelpCircle size={14} />
                ¿Cómo funciona?
              </button>
              
              <button
                onClick={() => onNavigate('pricing')}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1.5"
              >
                <CreditCard size={14} />
                Planes
              </button>
              
              <button
                onClick={() => window.location.hash = '#/publicar'}
                className="px-3 py-1.5 text-sm font-medium text-[#16a135] hover:text-[#138a2e] hover:bg-green-50 rounded-md transition-colors flex items-center gap-1.5"
              >
                <PlusCircle size={14} />
                Publicar Gratis
              </button>
            </div>

            {/* Separador vertical */}
            <div className="hidden md:block w-px h-5 bg-gray-300 mx-2" />

            {/* Usuario autenticado */}
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <div className="w-6 h-6 bg-[#16a135] rounded-full flex items-center justify-center text-white text-xs font-bold">
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
              /* Usuario no autenticado */
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-1.5 text-sm font-medium text-white bg-[#16a135] hover:bg-[#138a2e] rounded-md transition-colors"
              >
                Ingresar
              </button>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div 
            ref={mobileMenuRef}
            className="md:hidden bg-white border-t border-gray-200 shadow-lg"
          >
            <div className="px-4 py-3 space-y-2">
              <button
                onClick={() => { onNavigate('how-it-works'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md flex items-center gap-2"
              >
                <HelpCircle size={16} />
                ¿Cómo funciona?
              </button>
              
              <button
                onClick={() => { onNavigate('pricing'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md flex items-center gap-2"
              >
                <CreditCard size={16} />
                Planes
              </button>
              
              <button
                onClick={() => { window.location.hash = '#/publicar'; setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-[#16a135] hover:bg-green-50 rounded-md flex items-center gap-2"
              >
                <PlusCircle size={16} />
                Publicar Gratis
              </button>

              <hr className="border-gray-200" />

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => { onNavigate('my-ads'); setShowMobileMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md flex items-center gap-2"
                  >
                    <Package size={16} />
                    Mis Avisos
                  </button>
                  <button
                    onClick={() => { onNavigate('profile'); setShowMobileMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md flex items-center gap-2"
                  >
                    <User size={16} />
                    Mi Perfil
                  </button>
                  <button
                    onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                    disabled={isLoggingOut}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setShowAuthModal(true); setShowMobileMenu(false); }}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-[#16a135] hover:bg-[#138a2e] rounded-md"
                >
                  Ingresar
                </button>
              )}
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
