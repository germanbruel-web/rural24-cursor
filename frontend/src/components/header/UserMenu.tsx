/**
 * UserMenu.tsx
 * Menú de usuario - Design System RURAL24
 *
 * - No autenticado: Links de Login/Registro
 * - Autenticado: Campanita | Chat overlay | AccountSwitcher
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AccountSwitcher } from './AccountSwitcher';
import { NotificationBell } from '../notifications/NotificationBell';
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
      {/* Campanita — solo desktop */}
      <div className="hidden lg:flex items-center gap-1">
        <NotificationBell />
      </div>

      {/* Separador */}
      <div className="hidden lg:block w-px h-6 bg-gray-200" />

      {/* Dropdown unificado: cuenta + navegación + logout */}
      <AccountSwitcher onNavigate={onNavigate} />
    </div>
  );
};

export default UserMenu;
