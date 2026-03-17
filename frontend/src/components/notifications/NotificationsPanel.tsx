/**
 * NotificationsPanel
 * Dropdown de notificaciones. Abre desde la campanita.
 * Mobile: panel full-width desde abajo. Desktop: dropdown alineado a la derecha.
 */

import React, { useEffect, useState } from 'react';
import { X, CheckCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getNotifications,
  markAsRead,
  getNotificationMeta,
  timeAgo,
  type Notification,
} from '../../services/notificationsService';
import { navigateTo } from '../../hooks/useNavigate';

interface NotificationsPanelProps {
  onClose: () => void;
  onRead: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ onClose, onRead }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getNotifications(user.id)
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, [user]);

  const handleMarkAll = async () => {
    if (!user) return;
    await markAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    onRead();
  };

  const handleItemClick = async (n: Notification) => {
    if (!user) return;
    if (!n.is_read) {
      await markAsRead(user.id, [n.id]);
      setNotifications(prev =>
        prev.map(x => x.id === n.id ? { ...x, is_read: true } : x)
      );
      onRead();
    }
    // Navegar si tiene ad_id
    const adId   = n.data?.ad_slug as string | undefined;
    const convId = n.data?.conversation_id as string | undefined;
    if (adId)   { navigateTo(`/ad/${adId}`);   onClose(); }
    if (convId) { navigateTo('/inbox');         onClose(); }
    if (n.type === 'nuevo_contacto') { navigateTo('/inbox'); onClose(); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="
      absolute right-0 top-full mt-2 z-[200]
      w-80 sm:w-96
      bg-white rounded-xl shadow-2xl border border-gray-200
      overflow-hidden
      animate-in fade-in slide-in-from-top-2 duration-150
    ">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm">Notificaciones</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[11px] font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-brand-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              <CheckCheck size={13} />
              Marcar leídas
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="max-h-[420px] overflow-y-auto">
        {loading && (
          <div className="py-10 text-center text-sm text-gray-400">Cargando...</div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-500">Sin notificaciones aún</p>
          </div>
        )}

        {!loading && notifications.map(n => {
          const meta = getNotificationMeta(n.type);
          return (
            <button
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={`
                w-full text-left px-4 py-3 border-b border-gray-50
                flex items-start gap-3
                hover:bg-gray-50 transition-colors
                ${!n.is_read ? 'bg-blue-50/40' : ''}
              `}
            >
              {/* Icono tipo */}
              <span className="text-base mt-0.5 flex-shrink-0">{meta.icon}</span>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>

              {/* Punto no-leído */}
              {!n.is_read && (
                <span className="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0 mt-1.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationsPanel;
