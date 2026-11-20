import { PaginatedResponse } from "@medusajs/types"

/** Customer ref attached to admin chatbot conversation views. */
export interface AdminChatbotCustomerRef {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
}

export interface AdminChatbotConversation {
  id: string
  customer_id: string | null
  status: "open" | "closed"
  locale: "en" | "bn"
  last_message_preview: string | null
  last_message_at: Date | string | null
  created_at: Date | string
  /** Resolved from the customer module; null for guest conversations. */
  customer: AdminChatbotCustomerRef | null
}

export interface AdminChatbotMessage {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  cards: unknown[] | null
  locale: "en" | "bn" | null
  /** null/`ai` = the model wrote it; `admin` = an inbox follow-up. */
  sender: "ai" | "admin" | null
  created_at: Date | string
}

export type AdminChatbotConversationListResponse = PaginatedResponse<{
  conversations: AdminChatbotConversation[]
}>

export interface AdminChatbotConversationResponse {
  conversation: AdminChatbotConversation
  messages: AdminChatbotMessage[]
}

export interface AdminChatbotSendMessageResponse {
  message: AdminChatbotMessage
}

export interface AdminChatbotFollowupResponse {
  suggestion: string
}
