'use client';

import { useEffect, useState } from 'react';

import { getMessagingUnread } from '@/lib/data/messages';

const UNREAD_POLL_INTERVAL = 60_000;

/**
 * Polls the customer's total unread message count. Replaces the TalkJS
 * `useUnreads` badge source with the self-hosted messaging API.
 */
export const useMessagesUnread = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      const count = await getMessagingUnread();
      if (mounted) {
        setUnreadCount(count);
      }
    };

    void refresh();
    const interval = setInterval(refresh, UNREAD_POLL_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return unreadCount;
};
