import { ConversationType, ContextType, SenderType } from "./common"

export interface CreateConversationInput {
  type: ConversationType
  thread_key: string
  buyer_id?: string | null
  seller_id?: string | null
}

export interface SendMessageInput {
  conversation_id: string
  sender_id: string
  sender_type: SenderType
  body: string
  context_type?: ContextType | null
  context_id?: string | null
  context_label?: string | null
}

export interface MarkMessagesReadInput {
  conversation_id: string
  reader_id: string
  reader_type: SenderType
}

export interface BlockCustomerInput {
  customer_id: string
  blocked_by: string
  reason?: string | null
}

export interface UnblockCustomerInput {
  customer_id: string
}

export interface PublishMessageEventInput {
  conversation_id: string
  recipient_id: string
  sender_type: SenderType
  event_type: "new_message" | "messages_read" | "unread_count"
  context_type?: string | null
  context_label?: string | null
  message_id?: string
  unread_count?: number
}

/**
 * thread_key encodes the counterpart uniqueness per conversation type so a
 * single unique index covers all three shapes:
 * - marketplace:        mk:{buyer_id}:{seller_id}
 * - support_customer:   sc:{buyer_id}
 * - support_vendor:     sv:{seller_id}
 */
export function buildThreadKey(
  type: ConversationType,
  ids: { buyer_id?: string | null; seller_id?: string | null }
): string {
  switch (type) {
    case "marketplace":
      return `mk:${ids.buyer_id}:${ids.seller_id}`
    case "support_customer":
      return `sc:${ids.buyer_id}`
    case "support_vendor":
      return `sv:${ids.seller_id}`
  }
}

/**
 * SSE/event recipient for a message or read event. The shared admin inbox
 * receives every event regardless of recipient (admin SSE is unfiltered), so
 * "admin" is a routing sentinel; human participants get the concrete id.
 */
export function resolveRecipientId(
  type: ConversationType,
  senderType: SenderType,
  ids: { buyer_id?: string | null; seller_id?: string | null }
): string {
  if (type === "marketplace") {
    return senderType === "customer"
      ? ids.seller_id ?? "admin"
      : ids.buyer_id ?? "admin"
  }

  // Support threads: human → "admin"; admin → the human side.
  if (senderType === "admin") {
    return type === "support_customer"
      ? ids.buyer_id ?? "admin"
      : ids.seller_id ?? "admin"
  }

  return "admin"
}
