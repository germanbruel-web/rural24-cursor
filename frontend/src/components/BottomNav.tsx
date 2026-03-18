/**
 * BottomNav.tsx
 * Barra de navegación inferior sticky — solo mobile (lg:hidden)
 * Tabs: Mis Avisos | Favoritos | [PUBLICAR] | Mensajes | Mi Perfil
 *
 * El botón central "Publicar" flota sobre la barra con fondo verde brand-600,
 * igual que el botón del TopNav pero posicionado como FAB central.
 */

import React, { useState, useEffect } from 'react';
import { FileText, Heart, Plus, MessageCircle, User } from 'lucide-react';
import { navigateTo } from '../hooks/useNavigate';
import { NotificationBell } from './notifications/NotificationBell';
import { useChatBadge } from '../hooks/useChatBadge';
import { supabase } from '../services/supabaseClient';

const WIZARD_PREFIXES = ['#/publicar', '#/publicar-v3', '#/publicar-v2', '#/edit/', '#/publicar-aviso'];
const isWizardPage = (hash: string) => WIZARD_PREFIXES.some(p => hash.startsWith(p));

type TabId = 'my-ads' | 'favorites' | 'publicar' | 'inbox' | 'profile';

const getActiveTab = (hash: string): TabId | null => {
  if (hash === '#/my-ads')      return 'my-ads';
  if (hash === '#/favorites')   return 'favorites';
  if (hash === '#/inbox')       return 'inbox';
  if (hash === '#/profile')     return 'profile';
  return null;
};

export const BottomNav: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId | null>(() => getActiveTab(window.location.hash));
  const [hidden,    setHidden]    = useState(() => isWizardPage(window.location.hash));
  const [userId,    setUserId]    = useState<string | null>(null);
  const chatUnread = useChatBadge(userId);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      setActiveTab(getActiveTab(hash));
      setHidden(isWizardPage(hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (hidden) return null;

  const NavTab = ({ id, label, icon: Icon, path }: { id: TabId; label: string; icon: typeof FileText; path: string }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => navigateTo(path)}
        className={`
          flex-1 flex flex-col items-center justify-end pb-2.5 gap-1
          transition-colors active:scale-95
          ${isActive ? 'text-brand-600' : 'text-gray-400'}
        `}
      >
        <Icon size={21} strokeWidth={isActive ? 2 : 1.5} />
        <span className="text-[10px] font-medium leading-none tracking-wide">{label}</span>
      </button>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 overflow-visible"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Altura fija de la barra */}
      <div className="flex items-end h-[64px]">

        <NavTab id="my-ads"    label="Mis Avisos" icon={FileText}    path="/my-ads"     />
        <NavTab id="favorites" label="Favoritos"  icon={Heart}       path="/favorites"  />

        {/* Botón central Publicar — flota sobre la barra */}
        <div className="flex-1 flex flex-col items-center justify-end pb-2 relative">
          <button
            onClick={() => navigateTo('/publicar')}
            className="
              absolute -top-8
              w-[60px] h-[60px] rounded-full
              bg-brand-600 hover:bg-brand-500 active:bg-brand-700
              flex items-center justify-center
              shadow-xl shadow-brand-600/40
              ring-4 ring-white
              transition-all active:scale-95
            "
            aria-label="Publicar aviso"
          >
            <Plus size={26} strokeWidth={2.5} className="text-white" />
          </button>
          {/* Label debajo, alineado con el resto */}
          <span className="text-[10px] font-medium leading-none tracking-wide text-brand-600 mt-auto">
            Publicar
          </span>
        </div>

        {/* Tab Mensajes con badge */}
        <div className="flex-1 flex flex-col items-center justify-end pb-2.5 gap-1 relative">
          {/* Campanita — flotante sobre mensajes */}
          <div className="absolute -top-3 right-1">
            <NotificationBell />
          </div>
          <div className="relative">
            <button
              onClick={() => navigateTo('/inbox')}
              className={`transition-colors active:scale-95 ${activeTab === 'inbox' ? 'text-brand-600' : 'text-gray-400'}`}
            >
              <MessageCircle size={21} strokeWidth={activeTab === 'inbox' ? 2 : 1.5} />
            </button>
            {chatUnread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-brand-600 text-white text-[9px] font-bold rounded-full px-1 leading-none">
                {chatUnread > 9 ? '9+' : chatUnread}
              </span>
            )}
          </div>
          <button
            onClick={() => navigateTo('/inbox')}
            className={`text-[10px] font-medium leading-none tracking-wide transition-colors ${activeTab === 'inbox' ? 'text-brand-600' : 'text-gray-400'}`}
          >
            Mensajes
          </button>
        </div>

      </div>
    </nav>
  );
};

export default BottomNav;
