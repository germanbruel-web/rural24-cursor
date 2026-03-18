/**
 * BottomNav.tsx
 * Barra de navegación inferior sticky — solo mobile (lg:hidden)
 * Tabs: Mis Avisos | Favoritos | [PUBLICAR FAB] | Chat | Alertas
 * Altura: 80px + safe-area-inset-bottom (Material Design 3)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Heart, Plus, MessageCircle, Bell } from 'lucide-react';
import { navigateTo } from '../hooks/useNavigate';
import { useChatBadge } from '../hooks/useChatBadge';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { getUnreadCount, subscribeToNotifications } from '../services/notificationsService';
import { NotificationsPanel } from './notifications/NotificationsPanel';

const WIZARD_PREFIXES = ['#/publicar', '#/publicar-v3', '#/publicar-v2', '#/edit/', '#/publicar-aviso'];
const isWizardPage = (hash: string) => WIZARD_PREFIXES.some(p => hash.startsWith(p));

type TabId = 'my-ads' | 'favorites' | 'publicar' | 'inbox' | 'notifications';

const getActiveTab = (hash: string): TabId | null => {
  if (hash === '#/my-ads')    return 'my-ads';
  if (hash === '#/favorites') return 'favorites';
  if (hash === '#/inbox')     return 'inbox';
  return null;
};

export const BottomNav: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId | null>(() => getActiveTab(window.location.hash));
  const [hidden,    setHidden]    = useState(() => isWizardPage(window.location.hash));
  const [userId,    setUserId]    = useState<string | null>(null);
  const chatUnread = useChatBadge(userId);

  // Notificaciones
  const { user } = useAuth();
  const [bellUnread, setBellUnread] = useState(0);
  const [bellOpen,   setBellOpen]   = useState(false);
  const bellPanelRef                = useRef<HTMLDivElement>(null);

  const fetchBellCount = useCallback(async () => {
    if (!user) return;
    const count = await getUnreadCount(user.id);
    setBellUnread(count);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchBellCount();
    const interval = setInterval(fetchBellCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchBellCount, user]);

  useEffect(() => {
    if (!user) return;
    const ch = subscribeToNotifications(user.id, () => setBellUnread(prev => prev + 1));
    return () => { ch.unsubscribe(); };
  }, [user]);

  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellPanelRef.current && !bellPanelRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

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

  const NavTab = ({
    id, label, icon: Icon, path,
  }: { id: TabId; label: string; icon: typeof FileText; path: string }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => navigateTo(path)}
        className={`
          flex-1 flex flex-col items-center justify-center gap-1.5 pt-1
          transition-all active:scale-95
          ${isActive ? 'text-brand-600' : 'text-gray-400 hover:text-brand-400'}
        `}
      >
        <div className={`
          p-1.5 rounded-xl transition-all duration-200
          ${isActive ? 'bg-brand-50 scale-105' : 'hover:bg-brand-50/60'}
        `}>
          <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
        </div>
        <span className="text-[10px] font-medium leading-none tracking-wide">{label}</span>
      </button>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 overflow-visible"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* 80px — Material Design 3 */}
      <div className="flex items-center h-[80px]">

        <NavTab id="my-ads"    label="Mis Avisos" icon={FileText}       path="/my-ads"    />
        <NavTab id="favorites" label="Favoritos"  icon={Heart}          path="/favorites" />

        {/* FAB central Publicar */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 pt-1 relative">
          <button
            onClick={() => navigateTo('/publicar')}
            className="
              -mt-8
              w-[60px] h-[60px] rounded-full
              bg-brand-600 hover:bg-brand-500 active:bg-brand-700
              flex items-center justify-center
              shadow-lg shadow-brand-600/40
              ring-4 ring-white
              transition-all active:scale-95
            "
            aria-label="Publicar aviso"
          >
            <Plus size={28} strokeWidth={2.5} className="text-white" />
          </button>
          <span className="text-[10px] font-medium leading-none tracking-wide text-brand-600">
            Publicar
          </span>
        </div>

        {/* Tab Chat con badge */}
        <button
          onClick={() => navigateTo('/inbox')}
          className={`
            flex-1 flex flex-col items-center justify-center gap-1.5 pt-1
            transition-all active:scale-95
            ${activeTab === 'inbox' ? 'text-brand-600' : 'text-gray-400 hover:text-brand-400'}
          `}
        >
          <div className={`
            relative p-1.5 rounded-xl transition-all duration-200
            ${activeTab === 'inbox' ? 'bg-brand-50 scale-105' : 'hover:bg-brand-50/60'}
          `}>
            <MessageCircle size={22} strokeWidth={activeTab === 'inbox' ? 2.2 : 1.6} />
            {chatUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-brand-600 text-white text-[9px] font-bold rounded-full px-1 leading-none">
                {chatUnread > 9 ? '9+' : chatUnread}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium leading-none tracking-wide">Chat</span>
        </button>

        {/* Tab Alertas con badge */}
        <div ref={bellPanelRef} className="flex-1 flex flex-col items-center justify-center gap-1.5 pt-1 relative">
          <button
            onClick={() => setBellOpen(prev => !prev)}
            className={`
              flex flex-col items-center gap-1.5
              transition-all active:scale-95
              ${bellOpen ? 'text-brand-600' : 'text-gray-400 hover:text-brand-400'}
            `}
          >
            <div className={`
              relative p-1.5 rounded-xl transition-all duration-200
              ${bellOpen ? 'bg-brand-50 scale-105' : 'hover:bg-brand-50/60'}
            `}>
              <Bell size={22} strokeWidth={bellOpen ? 2.2 : 1.6} />
              {bellUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1 leading-none">
                  {bellUnread > 9 ? '9+' : bellUnread}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none tracking-wide">Alertas</span>
          </button>

          {bellOpen && (
            <div className="absolute bottom-full right-0 mb-2 z-50">
              <NotificationsPanel
                onClose={() => setBellOpen(false)}
                onRead={() => setBellUnread(0)}
              />
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};

export default BottomNav;
