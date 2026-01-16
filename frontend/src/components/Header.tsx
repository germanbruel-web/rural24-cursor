import React, { useState, useEffect, useRef } from 'react';
import { TractorIcon } from './IconComponents';
import { useAuth } from '../contexts/AuthContext';
import { useDevMode } from '../contexts/DevModeContext';
import AuthModal from './auth/AuthModal';
import { LogOut, User, Home, Search, Package, Clock, Users, ImageIcon, Trash2, MessageSquare, Settings, Star, X } from 'lucide-react';
import { canAccessPage } from '../utils/rolePermissions';
import { supabase } from '../services/supabaseClient';
import { Button } from './atoms/Button';

interface HeaderProps {
  onNavigate: (page: 'home' | 'my-ads' | 'banners' | 'inbox' | 'profile' | 'subscription' | 'users' | 'how-it-works' | 'publicar' | 'ad-finder' | 'deleted-ads' | 'test-form' | 'categories-admin' | 'pricing') => void;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onSearch }) => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const { isDevMode } = useDevMode();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  
  // DEBUG: Ver qué datos llegan del profile
  useEffect(() => {
    console.log('🔍 Header - Estado del usuario:', {
      hasUser: !!user,
      hasProfile: !!profile,
      profileFullName: profile?.full_name,
      profileEmail: profile?.email,
      profileRole: profile?.role,
      isDevMode
    });
  }, [user, profile, isDevMode]);
  
  // Logo estático para evitar latencia - optimización de caché
  const LOGO_PATH = '/images/logos/rural24-dark.webp';

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      setShowUserMenu(false);
      
      await signOut();
      
      // Redirigir al home y recargar
      window.location.hash = '#/';
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setIsLoggingOut(false);
    }
  };
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center hover:opacity-80 transition"
          >
            <img 
              src={LOGO_PATH}
              alt="RURAL24" 
              className="h-14 w-auto"
              loading="eager"
              fetchPriority="high"
            />
          </button>
          
          {/* Buscador compacto - siempre visible */}
          {/* Buscador - Design System Rural24 */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim() && onSearch) {
                  onSearch(searchQuery.trim());
                  setSearchQuery('');
                }
              }}
              className="relative w-full"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar tractores, cosechadoras..."
                  className="w-full pl-12 pr-24 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-16 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  Buscar
                </button>
              </div>
            </form>
          </div>
          
          {/* Menu Links */}
          <nav className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => onNavigate('how-it-works')}
            >
              ¿Cómo funciona?
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => onNavigate('pricing')}
            >
              Ver Planes
            </Button>
            
            {/* Botón Publicar Aviso Gratis */}
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                // Navegar al formulario de alta de avisos
                window.location.hash = '#/publicar';
              }}
              leftIcon={<Package size={16} />}
            >
              Publicar Aviso Gratis
            </Button>
          </nav>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {/* Usuario autenticado o modo desarrollo */}
              {(user || isDevMode) && (
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {(() => {
                        if (!profile) {
                          return user?.email?.split('@')[0] || 'Cargando...';
                        }
                        
                        const fullName = profile.full_name || profile.email?.split('@')[0] || 'Usuario';
                        const parts = fullName.split(' ');
                        
                        if (parts.length >= 2) {
                          return `${parts[0]} ${parts[1].charAt(0)}.`;
                        }
                        return fullName;
                      })()}
                    </span>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {/* Dashboard - Todos los usuarios */}
                      <div className="px-2">
                        <Button
                          onClick={() => { onNavigate('my-ads'); setShowUserMenu(false); }}
                          variant="ghost"
                          size="sm"
                          fullWidth
                          leftIcon={<Home size={16} />}
                          className="justify-start"
                        >
                          Dashboard
                        </Button>
                      </div>

                      {/* GRUPO 1: AVISOS */}
                      {canAccessPage('deleted-ads', profile?.role) && (
                        <>
                          <hr className="my-2 border-gray-200" />
                          <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                            Avisos
                          </div>
                        </>
                      )}
                      
                      {/* Mis Avisos - Todos los usuarios */}
                      <div className="px-2">
                        <Button
                          onClick={() => { onNavigate('my-ads'); setShowUserMenu(false); }}
                          variant="ghost"
                          size="sm"
                          fullWidth
                          leftIcon={<Package size={16} />}
                          className="justify-start"
                        >
                          Mis Avisos
                        </Button>
                      </div>
                      
                      {canAccessPage('deleted-ads', profile?.role) && (
                        <div className="px-2">
                          <Button
                            onClick={() => { onNavigate('deleted-ads'); setShowUserMenu(false); }}
                            variant="ghost"
                            size="sm"
                            fullWidth
                            leftIcon={<Clock size={16} />}
                            className="justify-start"
                          >
                            Avisos Eliminados
                          </Button>
                        </div>
                      )}

                      {/* GRUPO 2: MENSAJES */}
                      <hr className="my-2 border-gray-200" />
                      <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                        Mensajes
                      </div>
                      
                      {/* Inbox - Todos los usuarios */}
                      {canAccessPage('inbox', profile?.role) && (
                        <div className="px-2">
                          <Button
                            onClick={() => { onNavigate('inbox'); setShowUserMenu(false); }}
                            variant="ghost"
                            size="sm"
                            fullWidth
                            leftIcon={<MessageSquare size={16} />}
                            className="justify-start"
                          >
                            Mensajes <span className="text-xs text-gray-400 ml-1">(en construcción)</span>
                          </Button>
                        </div>
                      )}

                      {/* GRUPO 3: USUARIOS */}
                      {canAccessPage('users', profile?.role) && (
                        <>
                          <hr className="my-2 border-gray-200" />
                          <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                            Usuarios
                          </div>
                          <div className="px-2">
                            <Button
                              onClick={() => { onNavigate('users'); setShowUserMenu(false); }}
                              variant="ghost"
                              size="sm"
                              fullWidth
                              leftIcon={<Users size={16} />}
                              className="justify-start"
                            >
                              Usuarios
                            </Button>
                          </div>
                        </>
                      )}

                      {/* GRUPO 4: OTROS */}
                      {(canAccessPage('categories-admin', profile?.role) || canAccessPage('banners', profile?.role) || canAccessPage('ad-finder', profile?.role)) && (
                        <>
                          <hr className="my-2 border-gray-200" />
                          <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                            Otros
                          </div>
                        </>
                      )}

                      {canAccessPage('ad-finder', profile?.role) && (
                        <div className="px-2">
                          <Button
                            onClick={() => { onNavigate('ad-finder'); setShowUserMenu(false); }}
                            variant="ghost"
                            size="sm"
                            fullWidth
                            leftIcon={<Search size={16} />}
                            className="justify-start"
                          >
                            Buscador de Avisos
                          </Button>
                        </div>
                      )}
                      
                      {canAccessPage('banners', profile?.role) && (
                        <div className="px-2">
                          <Button
                            onClick={() => { onNavigate('banners'); setShowUserMenu(false); }}
                            variant="ghost"
                            size="sm"
                            fullWidth
                            leftIcon={<Star size={16} />}
                            className="justify-start"
                          >
                            Banners
                          </Button>
                        </div>
                      )}
                      
                      {canAccessPage('featured-ads', profile?.role) && (
                        <div className="px-2">
                          <Button
                            onClick={() => { onNavigate('featured-ads'); setShowUserMenu(false); }}
                            variant="ghost"
                            size="sm"
                            fullWidth
                            leftIcon={<Star size={16} />}
                            className="justify-start"
                          >
                            Avisos Destacados
                          </Button>
                        </div>
                      )}
                      
                      {canAccessPage('categories-admin', profile?.role) && (
                        <div className="px-2">
                          <Button
                            onClick={() => { onNavigate('categories-admin'); setShowUserMenu(false); }}
                            variant="ghost"
                            size="sm"
                            fullWidth
                            leftIcon={<Settings size={16} />}
                            className="justify-start"
                          >
                            Categorías
                          </Button>
                        </div>
                      )}
                      
                      {canAccessPage('attributes-admin', profile?.role) && (
                        <div className="px-2">
                          <Button
                            onClick={() => { onNavigate('attributes-admin'); setShowUserMenu(false); }}
                            variant="ghost"
                            size="sm"
                            fullWidth
                            leftIcon={<Settings size={16} />}
                            className="justify-start"
                          >
                            Atributos Dinámicos
                          </Button>
                        </div>
                      )}
                      
                      <hr className="my-2 border-gray-200" />
                      
                      {/* Mi Perfil - Todos los usuarios */}
                      <div className="px-2">
                        <Button
                          onClick={() => { onNavigate('profile'); setShowUserMenu(false); }}
                          variant="ghost"
                          size="sm"
                          fullWidth
                          leftIcon={<User size={16} />}
                          className="justify-start"
                        >
                          Mi Perfil
                        </Button>
                      </div>
                      
                      {/* Salir - Todos los usuarios */}
                      <div className="px-2">
                        <Button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          variant="ghost"
                          size="sm"
                          fullWidth
                          leftIcon={<LogOut size={16} />}
                          className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {isLoggingOut ? 'Cerrando sesión...' : 'Salir'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botón para mostrar login/registro cuando no hay usuario Y NO está en modo dev */}
              {!user && !isDevMode && (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  variant="primary"
                  size="lg"
                  className="bg-black hover:bg-gray-800"
                >
                  Ingresar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </header>
  );
};
