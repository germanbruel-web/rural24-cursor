import { useState } from 'react';
import { getOrCreateChannel, type ChatChannel } from '../services/chatService';

export function useAdChat(adId: string | undefined, adUserId: string | undefined, currentUser: any) {
  const [chatChannel, setChatChannel] = useState<ChatChannel | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showPlanLimit, setShowPlanLimit] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const handleContactar = async () => {
    if (!adId || !adUserId) return;
    if (!currentUser) {
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { view: 'login' } }));
      return;
    }
    if (currentUser.id === adUserId) return;

    setChatLoading(true);
    const result = await getOrCreateChannel(adId, adUserId);
    setChatLoading(false);

    if (!result.success) {
      if ((result as any).error === 'PLAN_LIMIT_REACHED') { setShowPlanLimit(true); return; }
      return;
    }

    if (result.isNew) {
      setChatChannel(result.channel);
      setShowNewChatModal(true);
    } else {
      setChatChannel(result.channel);
    }
  };

  return {
    chatChannel,
    setChatChannel,
    showNewChatModal,
    setShowNewChatModal,
    showPlanLimit,
    setShowPlanLimit,
    chatLoading,
    handleContactar,
  };
}
