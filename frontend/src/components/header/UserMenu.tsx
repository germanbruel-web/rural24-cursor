/**
 * UserMenu.tsx
 * Menú de usuario - Design System RURAL24
 *
 * - No autenticado: Links de Login/Registro
 * - Autenticado: Iconos de acceso rápido + AccountSwitcher (dropdown unificado)
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AccountSwitcher } from './AccountSwitcher';
import { Heart, MessageSquare } from 'lucide-react';
import type { Page } from '../../../App';

interface UserMenuProps {
  onNavigate: (page: Page) => void;
  onShowAuthModal?: () => void;
  onShowRegisterModal?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onNavigate, onShowAuthModal, onShowRegisterModal }) => {
  const { user } = useAuth();

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
          onClick={onShowRegisterModal || onShowAuthModal}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          Registrate
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Iconos de acceso rápido (desktop) */}
      <div className="hidden lg:flex items-center gap-1">
        <button
          onClick={() => onNavigate('my-ads')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Mis avisos"
        >
          <Heart className="w-5 h-5" />
        </button>

        <button
          onClick={() => onNavigate('inbox')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Mensajes"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Separador */}
      <div className="hidden lg:block w-px h-6 bg-gray-200" />

      {/* Dropdown unificado: cuenta + navegación + logout */}
      <AccountSwitcher onNavigate={onNavigate} />
    </div>
  );
};

export default UserMenu;
