/**
 * NotificationBell
 * Campanita con badge de no-leídas. Polling 30s + Supabase Realtime.
 * Abre NotificationsPanel al hacer click.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUnreadCount, subscribeToNotifications, type Notification } from '../../services/notificationsService';
import { NotificationsPanel } from './NotificationsPanel';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [unread, setUnread]   = useState(0);
  const [open, setOpen]       = useState(false);
  const panelRef              = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    const count = await getUnreadCount(user.id);
    setUnread(count);
  }, [user]);

  // Polling 30s
  useEffect(() => {
    if (!user) return;
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchCount, user]);

  // Realtime — bump badge sin fetch
  useEffect(() => {
    if (!user) return;
    const channel = subscribeToNotifications(user.id, (_n: Notification) => {
      setUnread(prev => prev + 1);
    });
    return () => { channel.unsubscribe(); };
  }, [user]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    setOpen(prev => !prev);
  };

  const handleRead = () => {
    setUnread(0);
  };

  if (!user) return null;

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={20} strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
                           bg-red-500 text-white text-[10px] font-bold leading-none
                           rounded-full flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <NotificationsPanel
          onClose={() => setOpen(false)}
          onRead={handleRead}
        />
      )}
    </div>
  );
};

export default NotificationBell;
