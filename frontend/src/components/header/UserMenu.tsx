/**
 * UserMenu.tsx
 * Menú de usuario - Design System RURAL24
 *
 * - No autenticado: Links de Login/Registro
 * - Autenticado: Campanita | Chat overlay | AccountSwitcher
 */

import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AccountSwitcher } from './AccountSwitcher';
import { MessageSquare } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { ChatList } from '../chat/ChatList';
import type { Page } from '../../../App';
import { useClickOutside } from '../../hooks/useClickOutside';

interface UserMenuProps {
  onNavigate: (page: Page) => void;
  onShowAuthModal?: () => void;
  onShowRegisterModal?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onNavigate, onShowAuthModal, onShowRegisterModal }) => {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useClickOutside(chatRef, () => setShowChat(false), showChat);

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

        {/* Campanita — reemplaza Favoritos */}
        <NotificationBell />

        {/* Chat — abre overlay inline */}
        <div ref={chatRef} className="relative">
          <button
            onClick={() => setShowChat(prev => !prev)}
            className={`p-2 rounded-lg transition-colors ${
              showChat
                ? 'text-brand-600 bg-brand-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {showChat && (
            <div className="absolute right-0 top-full mt-2 z-50 w-[380px] max-h-[520px] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-200">
              <ChatList
                currentUserId={user.id}
                onClose={() => setShowChat(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Separador */}
      <div className="hidden lg:block w-px h-6 bg-gray-200" />

      {/* Dropdown unificado: cuenta + navegación + logout */}
      <AccountSwitcher onNavigate={onNavigate} />
    </div>
  );
};

export default UserMenu;
