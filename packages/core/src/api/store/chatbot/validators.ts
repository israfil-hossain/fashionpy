import { z } from "zod"

export type StoreCreateChatbotConversationType = z.infer<
  typeof StoreCreateChatbotConversation
>
export const StoreCreateChatbotConversation = z.object({
  locale: z.enum(["en", "bn"]).optional().default("en"),
  guest_token: z.string().min(8).max(128).optional(),
})

export type StoreSendChatbotMessageType = z.infer<typeof StoreSendChatbotMessage>
export const StoreSendChatbotMessage = z.object({
  content: z.string().min(1).max(4000),
})

export type StoreChatbotVoiceType = z.infer<typeof StoreChatbotVoice>
export const StoreChatbotVoice = z.object({
  audio_base64: z.string().min(1).max(4_000_000),
  mime_type: z.string().max(100).optional(),
})
