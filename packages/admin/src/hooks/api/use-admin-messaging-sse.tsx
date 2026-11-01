import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { backendUrl, getAuthHeaders } from "../../lib/client";

type SSEStatus = "connecting" | "connected" | "disconnected" | "polling";

const ADMIN_CONVERSATIONS_KEY = "admin_conversations";
const ADMIN_CONVERSATION_KEY = "admin_conversation";
const ADMIN_UNREAD_KEY = "admin_messaging_unread";
const POLLING_INTERVAL = 30000;

/**
 * Realtime updates for the shared support inbox + oversight lists.
 *
 * EventSource cannot send Authorization headers (the panel authenticates with
 * a Bearer token), so the stream is opened with a one-time token minted by the
 * authenticated POST /admin/messages/sse-token endpoint. Falls back to
 * polling when SSE is unavailable.
 */
export const useAdminMessagingSSE = (
  activeConversationId?: string,
  onStatusChange?: (status: SSEStatus) => void
) => {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(1000);
  const statusRef = useRef<SSEStatus>("disconnected");
  const mountedRef = useRef(true);

  // Store callbacks in refs to avoid dependency chains
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  useEffect(() => {
    mountedRef.current = true;

    const setStatus = (status: SSEStatus) => {
      statusRef.current = status;
      onStatusChangeRef.current?.(status);
    };

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATION_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_UNREAD_KEY] });
    };

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    const startPolling = () => {
      if (pollingRef.current) return;
      setStatus("polling");

      pollingRef.current = setInterval(() => {
        invalidateAll();
      }, POLLING_INTERVAL);
    };

    const scheduleReconnect = () => {
      // Exponential backoff: 1s, 2s, 4s, 8s, ..., max 30s
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, 30000);

      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        if (mountedRef.current && statusRef.current === "polling") {
          void connect();
        }
      }, delay);
    };

    const connect = async () => {
      if (!mountedRef.current) return;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      setStatus("connecting");

      // Mint a one-time stream token (authenticated POST).
      let token: string | null = null;
      try {
        const response = await fetch(`${backendUrl}/admin/messages/sse-token`, {
          method: "POST",
          credentials: "omit",
          headers: {
            Accept: "application/json",
            ...getAuthHeaders(),
          },
        });
        if (response.ok) {
          const data = (await response.json()) as { token?: string };
          token = data.token ?? null;
        }
      } catch {
        // Network failure — fall through to polling
      }

      if (!mountedRef.current) return;

      if (!token) {
        startPolling();
        scheduleReconnect();
        return;
      }

      const url = `${backendUrl}/admin/messages/events?token=${encodeURIComponent(token)}`;

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener("connected", () => {
        setStatus("connected");
        stopPolling();
        reconnectDelayRef.current = 1000; // Reset backoff on success
      });

      es.addEventListener("new_message", (event: MessageEvent) => {
        invalidateAll();
        try {
          const data = JSON.parse(event.data);
          if (data.conversation_id) {
            queryClient.invalidateQueries({
              queryKey: [ADMIN_CONVERSATION_KEY, data.conversation_id],
            });
          }
        } catch {
          queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATION_KEY] });
        }
      });

      es.addEventListener("messages_read", (event: MessageEvent) => {
        invalidateAll();
        try {
          const data = JSON.parse(event.data);
          if (data.conversation_id) {
            queryClient.invalidateQueries({
              queryKey: [ADMIN_CONVERSATION_KEY, data.conversation_id],
            });
          }
        } catch {
          queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATION_KEY] });
        }
      });

      es.addEventListener("unread_count", () => {
        queryClient.invalidateQueries({ queryKey: [ADMIN_UNREAD_KEY] });
      });

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        startPolling();
        scheduleReconnect();
      };
    };

    void connect();

    return () => {
      mountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      stopPolling();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [queryClient]); // queryClient is stable — no re-render loop

  return { status: statusRef.current };
};
