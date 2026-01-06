import React, { useState, useEffect, useRef } from 'react';
import { TractorIcon } from './IconComponents';
import { useAuth } from '../contexts/AuthContext';
import { useDevMode } from '../contexts/DevModeContext';
import AuthModal from './auth/AuthModal';
import { LogOut, User, Home, Search, Package, Clock, Users, ImageIcon, Trash2, MessageSquare, Settings, Star } from 'lucide-react';
import { canAccessPage } from '../utils/rolePermissions';
import { supabase } from '../services/supabaseClient';

interface HeaderProps {
  onNavigate: (page: 'home' | 'my-ads' | 'banners' | 'inbox' | 'profile' | 'subscription' | 'users' | 'how-it-works' | 'publicar-v3' | 'ad-finder' | 'deleted-ads' | 'test-form' | 'categories-admin' | 'pricing') => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const { isDevMode } = useDevMode();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
          
          {/* Menu Links */}
          <nav className="hidden md:flex flex-1 items-center justify-end gap-4 ml-8">
            <button
              onClick={() => onNavigate('how-it-works')}
              className="text-gray-700 hover:text-[#16a135] px-4 py-2 font-medium transition-colors"
              style={{ fontFamily: 'Lato, sans-serif' }}
            >
              ¿Cómo funciona?
            </button>
            
            <button
              onClick={() => onNavigate('pricing')}
              className="text-gray-700 hover:text-[#16a135] px-4 py-2 font-medium transition-colors"
              style={{ fontFamily: 'Lato, sans-serif' }}
            >
              Ver Planes
            </button>
            
            {/* Botón Publicar Aviso Gratis */}
            <button
              onClick={() => onNavigate('publicar-v3')}
              className="bg-[#16a135] hover:bg-[#138a2c] text-white px-6 py-2.5 font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              style={{ fontFamily: 'Lato, sans-serif', borderRadius: '50px' }}
            >
              <Package className="w-4 h-4" />
              Publicar Aviso Gratis
            </button>
            
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
                      <button 
                        onClick={() => { onNavigate('my-ads'); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        <Home className="w-4 h-4" />
                        Dashboard
                      </button>

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
                      <button 
                        onClick={() => { onNavigate('my-ads'); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        Mis Avisos
                      </button>
                      
                      {canAccessPage('deleted-ads', profile?.role) && (
                        <button 
                          onClick={() => { onNavigate('deleted-ads'); setShowUserMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                          <Clock className="w-4 h-4" />
                          Avisos Eliminados
                        </button>
                      )}

                      {/* GRUPO 2: MENSAJES */}
                      <hr className="my-2 border-gray-200" />
                      <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                        Mensajes
                      </div>
                      
                      {/* Inbox - Todos los usuarios */}
                      {canAccessPage('inbox', profile?.role) && (
                        <button 
                          onClick={() => { onNavigate('inbox'); setShowUserMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Mensajes <span className="text-xs text-gray-400">(en construcción)</span>
                        </button>
                      )}

                      {/* GRUPO 3: USUARIOS */}
                      {canAccessPage('users', profile?.role) && (
                        <>
                          <hr className="my-2 border-gray-200" />
                          <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                            Usuarios
                          </div>
                          <button 
                            onClick={() => { onNavigate('users'); setShowUserMenu(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                          >
                            <Users className="w-4 h-4" />
                            Usuarios
                          </button>
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
                        <button 
                          onClick={() => { onNavigate('ad-finder'); setShowUserMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                          <Search className="w-4 h-4" />
                          Buscador de Avisos
                        </button>
                      )}
                      
                      {canAccessPage('banners', profile?.role) && (
                        <button 
                          onClick={() => { onNavigate('banners'); setShowUserMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                          <ImageIcon className="w-4 h-4" />
                          Banners
                        </button>
                      )}
                      
                      {canAccessPage('featured-ads', profile?.role) && (
                        <button 
                          onClick={() => { onNavigate('featured-ads'); setShowUserMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                          <Star className="w-4 h-4" />
                          Avisos Destacados
                        </button>
                      )}
                      
                      {canAccessPage('categories-admin', profile?.role) && (
                        <button 
                          onClick={() => { onNavigate('categories-admin'); setShowUserMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          Categorías
                        </button>
                      )}
                      
                      {canAccessPage('attributes-admin', profile?.role) && (
                        <button 
                          onClick={() => { onNavigate('attributes-admin'); setShowUserMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          Atributos Dinámicos
                        </button>
                      )}
                      
                      <hr className="my-2 border-gray-200" />
                      
                      {/* Mi Perfil - Todos los usuarios */}
                      <button 
                        onClick={() => { onNavigate('profile'); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        Mi Perfil
                      </button>
                      
                      {/* Salir - Todos los usuarios */}
                      <button 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <LogOut className="w-4 h-4" />
                        {isLoggingOut ? 'Cerrando sesión...' : 'Salir'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Botón para mostrar login/registro cuando no hay usuario Y NO está en modo dev */}
              {!user && !isDevMode && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-black text-white px-6 py-2 rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                  Ingresar
                </button>
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
