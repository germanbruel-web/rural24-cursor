/**
 * UserMenu.tsx
 * Menú de usuario con dropdown - Design System RURAL24
 * 
 * Muestra diferentes estados:
 * - No autenticado: Links de Login/Registro
 * - Autenticado: Iconos de favoritos, mensajes, notificaciones + Avatar con dropdown
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessPage } from '../../utils/rolePermissions';
import { 
  Heart, MessageSquare, Bell, User, ChevronDown, LogOut, 
  Package, Home, Settings, Search, Star, Clock
} from 'lucide-react';
import type { Page } from '../../../App';

interface UserMenuProps {
  onNavigate: (page: Page) => void;
  onShowAuthModal?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onNavigate, onShowAuthModal }) => {
  const { user, profile, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Manejar logout
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      setShowDropdown(false);
      await signOut();
      window.location.hash = '#/';
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setIsLoggingOut(false);
    }
  };

  // Nombre formateado del usuario
  const getUserDisplayName = () => {
    if (!profile) {
      return user?.email?.split('@')[0] || 'Usuario';
    }
    
    const fullName = profile.full_name || profile.email?.split('@')[0] || 'Usuario';
    const parts = fullName.split(' ');
    
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1].charAt(0)}.`;
    }
    return fullName.split(' ')[0]; // Solo primer nombre
  };

  // Iniciales para el avatar
  const getInitials = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  // Si no está autenticado
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onShowAuthModal}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          Ingresá
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={onShowAuthModal}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          Registrate
        </button>
      </div>
    );
  }

  // Usuario autenticado
  return (
    <div className="flex items-center gap-3">
      {/* Iconos de acciones rápidas */}
      <div className="hidden lg:flex items-center gap-1">
        {/* Favoritos */}
        <button
          onClick={() => onNavigate('my-ads')}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Favoritos"
        >
          <Heart className="w-5 h-5" />
          {/* Badge de contador (ejemplo) */}
          {/* <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span> */}
        </button>

        {/* Mensajes */}
        <button
          onClick={() => onNavigate('inbox')}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Mensajes"
        >
          <MessageSquare className="w-5 h-5" />
          {/* Badge de nuevo mensaje (ejemplo) */}
          {/* <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">1</span> */}
        </button>

        {/* Notificaciones */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          {/* Badge de notificación (ejemplo) */}
          {/* <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
        </button>
      </div>

      {/* Separador */}
      <div className="hidden lg:block w-px h-6 bg-gray-200" />

      {/* Avatar + Dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg transition-colors group"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 
                        flex items-center justify-center text-white font-semibold text-sm
                        ring-2 ring-white shadow-sm">
            {getInitials()}
          </div>
          
          {/* Nombre (solo desktop) */}
          <span className="hidden xl:inline text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {getUserDisplayName()}
          </span>
          
          {/* Chevron */}
          <ChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-64 
                        bg-white rounded-lg shadow-2xl border border-gray-200 
                        py-2 z-50 overflow-hidden">
            
            {/* Header del menú con info de usuario */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">{profile?.full_name || 'Usuario'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>

            {/* Dashboard */}
            <div className="py-2">
              <button
                onClick={() => { onNavigate('my-ads'); setShowDropdown(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4 text-gray-500" />
                Dashboard
              </button>
            </div>

            {/* Mis Avisos */}
            <div className="border-t border-gray-100 py-2">
              <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase">
                Avisos
              </div>
              
              <button
                onClick={() => { onNavigate('my-ads'); setShowDropdown(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Package className="w-4 h-4 text-gray-500" />
                Mis Avisos
              </button>

              {canAccessPage('deleted-ads', profile?.role) && (
                <button
                  onClick={() => { onNavigate('deleted-ads'); setShowDropdown(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Clock className="w-4 h-4 text-gray-500" />
                  Avisos Eliminados
                </button>
              )}
            </div>

            {/* Mensajes */}
            <div className="border-t border-gray-100 py-2">
              <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase">
                Comunicación
              </div>
              
              <button
                onClick={() => { onNavigate('inbox'); setShowDropdown(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-gray-500" />
                Mensajes
                <span className="ml-auto text-xs text-gray-400">(próximamente)</span>
              </button>
            </div>

            {/* Admin (si aplica) */}
            {(canAccessPage('users', profile?.role) || canAccessPage('banners', profile?.role)) && (
              <div className="border-t border-gray-100 py-2">
                <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase">
                  Administración
                </div>
                
                {canAccessPage('users', profile?.role) && (
                  <button
                    onClick={() => { onNavigate('users'); setShowDropdown(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    Usuarios
                  </button>
                )}

                {canAccessPage('ad-finder', profile?.role) && (
                  <button
                    onClick={() => { onNavigate('ad-finder'); setShowDropdown(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Search className="w-4 h-4 text-gray-500" />
                    Buscador de Avisos
                  </button>
                )}

                {canAccessPage('banners', profile?.role) && (
                  <button
                    onClick={() => { onNavigate('banners'); setShowDropdown(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Star className="w-4 h-4 text-gray-500" />
                    Banners
                  </button>
                )}

                {canAccessPage('categories-admin', profile?.role) && (
                  <button
                    onClick={() => { onNavigate('categories-admin'); setShowDropdown(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    Configuración
                  </button>
                )}
              </div>
            )}

            {/* Mi Perfil + Logout */}
            <div className="border-t border-gray-100 py-2">
              <button
                onClick={() => { onNavigate('profile'); setShowDropdown(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4 text-gray-500" />
                Mi Perfil
              </button>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMenu;
