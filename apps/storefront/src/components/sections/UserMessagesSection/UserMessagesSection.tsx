'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Badge,
  Button,
  Card,
  Textarea,
} from '@/components/atoms';
import {
  MessagingConversation,
  MessagingMessage,
  markMessagingRead,
  sendMessagingMessage,
} from '@/lib/data/messages';
import { toast } from '@/lib/helpers/toast';
import { MessageIcon } from '@/icons';

const THREAD_POLL_INTERVAL = 15_000;

const formatRelativeTime = (dateStr: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const formatMessageTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const isToday = date.toDateString() === new Date().toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const conversationTitle = (conversation: MessagingConversation): string => {
  const type = conversation.type ?? 'marketplace';
  if (type !== 'marketplace') return 'Marketplace Support';
  return conversation.seller_name || 'Seller';
};

type UserMessagesSectionProps = {
  conversations: MessagingConversation[];
  activeId?: string;
  threadMessages: MessagingMessage[];
  orderContextId?: string;
};

export const UserMessagesSection = ({
  conversations,
  activeId,
  threadMessages,
  orderContextId,
}: UserMessagesSectionProps) => {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeId);

  // Mark the open thread read so the badges clear.
  useEffect(() => {
    if (!activeId) return;
    const conversation = conversations.find((c) => c.id === activeId);
    if (conversation && conversation.unread_count_customer > 0) {
      void markMessagingRead(activeId).then(() => router.refresh());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages.length]);

  // Keep the open thread fresh (self-hosted SSE is a fast-follow; polling
  // keeps the v1 simple and dependency-free).
  useEffect(() => {
    if (!activeId) return;
    const interval = setInterval(() => router.refresh(), THREAD_POLL_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !activeId || isSending) return;

    setIsSending(true);
    try {
      const res = await sendMessagingMessage(activeId, {
        body,
        ...(orderContextId
          ? { context_type: 'order' as const, context_id: orderContextId }
          : {}),
      });

      if (res.success) {
        setDraft('');
        router.refresh();
      } else {
        toast.error({
          title: res.error || 'Your message could not be sent.',
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // API returns messages newest-first; display oldest-first.
  const displayMessages = [...threadMessages].reverse();

  const listPane = (
    <Card className="h-full overflow-hidden flex flex-col" data-testid="messages-list">
      <div className="p-4 border-b border">
        <h2 className="heading-md uppercase text-primary">Messages</h2>
      </div>
      {conversations.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-secondary">No conversations yet.</p>
          <p className="label-sm text-secondary mt-1">
            Contact a seller from any order, or reach marketplace support.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto [divide-y divide-ui-border-base>*+*]:border-t">
          {conversations.map((conversation) => {
            const type = conversation.type ?? 'marketplace';
            const isSupport = type !== 'marketplace';
            const isUnread = conversation.unread_count_customer > 0;
            const prefix =
              conversation.last_message_sender_type === 'customer' ? 'You: ' : '';

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() =>
                  router.push(`/user/messages?c=${conversation.id}`)
                }
                className={`w-full text-left p-4 transition-colors hover:bg-component-hover ${
                  conversation.id === activeId ? 'bg-component-secondary' : ''
                }`}
                data-testid="conversation-row"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`label-md text-primary truncate ${
                      isUnread ? 'font-semibold' : ''
                    }`}
                  >
                    {conversationTitle(conversation)}
                  </span>
                  {isSupport && (
                    <Badge className="ml-2 shrink-0">Support</Badge>
                  )}
                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-action shrink-0" />
                  )}
                </div>
                <p
                  className={`label-sm truncate mt-1 ${
                    isUnread ? 'text-primary' : 'text-secondary'
                  }`}
                >
                  {conversation.last_message_preview
                    ? `${prefix}${conversation.last_message_preview}`
                    : 'No messages yet'}
                </p>
                <p className="text-xs text-secondary mt-1">
                  {formatRelativeTime(conversation.last_message_at)}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );

  const threadPane = (
    <Card className="h-full overflow-hidden flex flex-col" data-testid="messages-thread">
      {!activeConversation ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-secondary">Select a conversation</p>
        </div>
      ) : (
        <>
          <div className="p-4 border-b border flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="label-sm text-action-on-secondary underline md:hidden"
                onClick={() => router.push('/user/messages')}
                data-testid="messages-back"
              >
                Back
              </button>
              <h2 className="heading-md uppercase text-primary truncate">
                {conversationTitle(activeConversation)}
              </h2>
              {(activeConversation.type ?? 'marketplace') !== 'marketplace' && (
                <Badge>Support</Badge>
              )}
            </div>
            {orderContextId && (
              <span className="label-sm text-secondary shrink-0">
                About this order
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {displayMessages.length === 0 ? (
              <p className="text-center text-secondary py-8">
                No messages yet — say hello.
              </p>
            ) : (
              displayMessages.map((message) => {
                const isMine = message.sender_type === 'customer';
                const isAdmin = message.sender_type === 'admin';

                return (
                  <div
                    key={message.id}
                    className={`flex flex-col gap-1 ${
                      isMine ? 'items-end' : 'items-start'
                    }`}
                    data-testid="message-bubble"
                  >
                    {message.context_type && (
                      <span className="label-sm text-secondary">
                        {message.context_label ||
                          `${message.context_type}: ${message.context_id}`}
                      </span>
                    )}
                    <div
                      className={`max-w-[75%] rounded-sm px-3 py-2 ${
                        isMine
                          ? 'bg-action text-action-on-primary'
                          : 'bg-component-secondary text-primary'
                      }`}
                    >
                      {isAdmin && (
                        <span className="label-sm block opacity-70 mb-1">
                          Marketplace Support
                        </span>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.body}
                      </p>
                    </div>
                    <span className="text-xs text-secondary px-1">
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border">
            <div className="flex items-end gap-2">
              <Textarea
                placeholder={
                  (activeConversation.type ?? 'marketplace') === 'marketplace'
                    ? `Message ${conversationTitle(activeConversation)}...`
                    : 'Message marketplace support...'
                }
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                className="flex-1 resize-none"
                data-testid="message-composer"
              />
              <Button
                onClick={() => void handleSend()}
                disabled={!draft.trim() || isSending}
                data-testid="message-send-button"
              >
                <span className="flex items-center gap-2">
                  <MessageIcon size={16} />
                  Send
                </span>
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-[655px]">
      <div className={`md:col-span-2 h-full ${activeId ? 'hidden md:block' : ''}`}>
        {listPane}
      </div>
      <div className={`md:col-span-3 h-full ${activeId ? '' : 'hidden md:block'}`}>
        {threadPane}
      </div>
    </div>
  );
};
