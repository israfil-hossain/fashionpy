'use server';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';

export type MessagingConversationType =
  | 'marketplace'
  | 'support_customer'
  | 'support_vendor';

export type MessagingConversation = {
  id: string;
  type: MessagingConversationType;
  thread_key: string;
  buyer_id: string | null;
  seller_id: string | null;
  seller_name?: string | null;
  seller_logo?: string | null;
  last_message_preview: string | null;
  last_message_sender_type: 'customer' | 'seller' | 'admin' | null;
  last_message_at: string | null;
  unread_count_customer: number;
  created_at: string;
};

export type MessagingMessage = {
  id: string;
  sender_type: 'customer' | 'seller' | 'admin';
  body: string;
  context_type: 'product' | 'order' | null;
  context_id: string | null;
  context_label: string | null;
  read_at: string | null;
  created_at: string;
};

type ConversationListResponse = {
  conversations: MessagingConversation[];
  next_cursor: string | null;
};

type ThreadResponse = {
  conversation: MessagingConversation;
  messages: MessagingMessage[];
  next_cursor: string | null;
};

export const listMessagingConversations = async (): Promise<
  MessagingConversation[]
> => {
  const headers = await getAuthHeaders();
  const res = (await (sdk.store.messages.query({
    limit: 50,
    fetchOptions: { headers },
  } as never) as unknown as Promise<ConversationListResponse>));

  return res.conversations ?? [];
};

export const getMessagingThread = async (
  conversationId: string
): Promise<ThreadResponse | null> => {
  const headers = await getAuthHeaders();
  try {
    const res = (await (sdk.store.messages.$id.query({
      $id: conversationId,
      limit: 100,
      fetchOptions: { headers },
    } as never) as unknown as Promise<ThreadResponse>));

    return res;
  } catch {
    return null;
  }
};

export const getMessagingUnread = async (): Promise<number> => {
  const headers = await getAuthHeaders();
  try {
    const res = (await (sdk.store.messages.unread.query({
      fetchOptions: { headers },
    } as never) as unknown as Promise<{ unread_count: number }>));

    return res.unread_count ?? 0;
  } catch {
    return 0;
  }
};

/**
 * Open (or re-open) the customer's conversation for an order. Find-or-create
 * happens server-side on the unique thread key, so repeat clicks are safe.
 */
export const startOrderConversation = async (input: {
  mode: 'seller' | 'support';
  sellerId?: string | null;
}): Promise<{ success: boolean; conversationId?: string; message?: string }> => {
  const headers = await getAuthHeaders();

  try {
    const res = (await (sdk.store.messages.mutate({
      ...(input.mode === 'support' ? { type: 'support' } : {}),
      ...(input.sellerId ? { seller_id: input.sellerId } : {}),
      fetchOptions: { headers },
    } as never) as unknown as Promise<{
      conversation: { id: string };
    }>));

    return { success: true, conversationId: res.conversation.id };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        (error as Error)?.message || 'Unable to start the conversation. Please try again.'
    };
  }
};

export const sendMessagingMessage = async (
  conversationId: string,
  input: {
    body: string;
    context_type?: 'order';
    context_id?: string;
  }
): Promise<{ success: boolean; message?: MessagingMessage; error?: string }> => {
  const headers = await getAuthHeaders();

  try {
    const res = (await (sdk.store.messages.$id.mutate({
      $id: conversationId,
      body: input.body,
      ...(input.context_type && input.context_id
        ? { context_type: input.context_type, context_id: input.context_id }
        : {}),
      fetchOptions: { headers },
    } as never) as unknown as Promise<{ message: MessagingMessage }>));

    return { success: true, message: res.message };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        (error as Error)?.message ||
        'Your message could not be sent. Please try again.'
    };
  }
};

export const markMessagingRead = async (
  conversationId: string
): Promise<void> => {
  const headers = await getAuthHeaders();

  try {
    await (sdk.store.messages.$id.read.mutate({
      $id: conversationId,
      fetchOptions: { headers },
    } as never) as unknown as Promise<unknown>);
  } catch {
    // Best effort — unread counts self-heal via the reconciliation job.
  }
};
