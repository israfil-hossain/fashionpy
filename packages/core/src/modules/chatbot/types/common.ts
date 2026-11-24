import type { AiTaskModels, AiTaskModelsDTO } from "@mercurjs/types"

export type ChatbotProvider = "openrouter" | "gemini" | "openai_compatible"
export type ChatbotSttProvider = "openai" | "gemini" | "none"
export type ChatbotLocale = "en" | "bn"
export type ChatbotRole = "user" | "assistant" | "tool"
/** Author of an assistant message — null/`ai` = the model, `admin` = a follow-up. */
export type ChatbotSender = "ai" | "admin"
export type ChatbotConversationStatus = "open" | "closed"

export interface ChatbotConversationDTO {
  id: string
  customer_id: string | null
  guest_token: string | null
  status: ChatbotConversationStatus
  locale: ChatbotLocale
  checkout_state: ChatbotCheckoutState | null
  last_message_preview: string | null
  last_message_at: Date | string | null
  created_at: Date | string
  updated_at: Date | string
}

export interface ChatbotMessageDTO {
  id: string
  conversation_id: string
  role: ChatbotRole
  content: string
  cards: ChatbotCard[] | null
  tool_name: string | null
  locale: ChatbotLocale | null
  sender: ChatbotSender | null
  created_at: Date | string
}

export type ChatbotCard =
  | {
      type: "product"
      id: string
      title: string
      handle?: string | null
      thumbnail?: string | null
      price?: string | null
      currency_code?: string | null
      url?: string | null
    }
  | {
      type: "order"
      order_group_id: string
      display_id?: number | null
      status?: string | null
      fulfillment_status?: string | null
      payment_status?: string | null
      total?: string | null
      currency_code?: string | null
      url?: string | null
      shipments?: ChatbotShipmentCard[]
    }

export interface ChatbotShipmentCard {
  id: string
  status: string
  tracking_number?: string | null
  tracking_url?: string | null
  carrier?: string | null
}

export type ChatbotCheckoutPhase =
  | "idle"
  | "cart"
  | "address"
  | "shipping"
  | "payment"
  | "review"
  | "placed"

export interface ChatbotCheckoutState {
  phase: ChatbotCheckoutPhase
  cart_id?: string | null
  address_id?: string | null
  shipping_method_id?: string | null
  payment_provider_id?: string | null
  confirmed?: boolean
  order_group_id?: string | null
}

export interface ChatbotSettingsDTO {
  enabled: boolean
  provider: ChatbotProvider
  base_url: string | null
  model: string | null
  task_models: AiTaskModelsDTO
  stt_provider: ChatbotSttProvider
  stt_model: string | null
  system_prompt: string | null
  temperature: number
  max_tokens: number
  api_key_set: boolean
  stt_api_key_set: boolean
}

export interface ChatbotSettingsInput {
  enabled?: boolean
  provider?: ChatbotProvider
  base_url?: string | null
  api_key?: string | null
  model?: string | null
  task_models?: Partial<AiTaskModels>
  stt_provider?: ChatbotSttProvider
  stt_api_key?: string | null
  stt_model?: string | null
  system_prompt?: string | null
  temperature?: number
  max_tokens?: number
}

export type ChatbotRuntimeSettings = ChatbotSettingsDTO & {
  api_key: string | null
  stt_api_key: string | null
  system_prompt_effective: string
}

export const CHATBOT_SETTINGS_ID = "global"
