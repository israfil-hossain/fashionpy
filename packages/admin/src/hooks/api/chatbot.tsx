import { ClientError } from "@mercurjs/client"
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query"

import { fetchQuery } from "../../lib/client"

export type ChatbotSettings = {
  enabled: boolean
  provider: "openrouter" | "gemini" | "openai_compatible"
  base_url: string | null
  model: string | null
  stt_provider: "openai" | "gemini" | "none"
  stt_model: string | null
  system_prompt: string | null
  temperature: number
  max_tokens: number
  api_key_set: boolean
  stt_api_key_set: boolean
}

export type ChatbotSettingsInput = Partial<
  Omit<ChatbotSettings, "api_key_set" | "stt_api_key_set"> & {
    api_key?: string | null
    stt_api_key?: string | null
  }
>

export type ChatbotTestResult = {
  ok: boolean
  provider: string
  model: string
  latency_ms: number
  error?: string
}

const KEY = "chatbot_settings" as const

export const useChatbotSettings = (
  options?: Omit<
    UseQueryOptions<{ settings: ChatbotSettings }, ClientError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: [KEY],
    queryFn: () =>
      fetchQuery("/admin/chatbot/settings", { method: "GET" }) as Promise<{
        settings: ChatbotSettings
      }>,
    ...options,
  })
}

export const useUpdateChatbotSettings = (
  options?: UseMutationOptions<
    { settings: ChatbotSettings },
    ClientError,
    ChatbotSettingsInput
  >
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery("/admin/chatbot/settings", {
        method: "PUT",
        body: payload,
      }) as Promise<{ settings: ChatbotSettings }>,
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData([KEY], data)
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useTestChatbot = (
  options?: UseMutationOptions<
    ChatbotTestResult,
    ClientError,
    ChatbotSettingsInput | undefined
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery("/admin/chatbot/test", {
        method: "POST",
        body: payload ?? {},
      }) as Promise<ChatbotTestResult>,
    ...options,
  })
}

/* ── Admin chat inbox (SPEC-011) ─────────────────────────────────────── */

export type ChatbotCustomerRef = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
}

export type AdminChatbotConversationDTO = {
  id: string
  customer_id: string | null
  status: "open" | "closed"
  locale: "en" | "bn"
  last_message_preview: string | null
  last_message_at: string | null
  created_at: string
  customer: ChatbotCustomerRef | null
}

export type AdminChatbotMessageDTO = {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  cards: unknown[] | null
  locale: "en" | "bn" | null
  sender: "ai" | "admin" | null
  created_at: string
}

export type ChatbotConversationListQuery = {
  q?: string
  status?: "open" | "closed"
  limit?: number
  offset?: number
}

const INBOX_KEY = "chatbot_conversations" as const
const THREAD_KEY = "chatbot_conversation" as const

export const useChatbotConversations = (
  query: ChatbotConversationListQuery,
  options?: Omit<
    UseQueryOptions<
      {
        conversations: AdminChatbotConversationDTO[]
        count: number
        offset: number
        limit: number
      },
      ClientError
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: [INBOX_KEY, query],
    queryFn: () =>
      fetchQuery("/admin/chatbot/conversations", {
        method: "GET",
        query: query as Record<string, string | number>,
      }),
    ...options,
  })
  return { ...data, ...rest }
}

export const useChatbotConversation = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      {
        conversation: AdminChatbotConversationDTO
        messages: AdminChatbotMessageDTO[]
      },
      ClientError
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: [THREAD_KEY, id],
    queryFn: () =>
      fetchQuery(`/admin/chatbot/conversations/${id}`, {
        method: "GET",
      }) as Promise<{
        conversation: AdminChatbotConversationDTO
        messages: AdminChatbotMessageDTO[]
      }>,
    ...options,
  })
  return { ...data, ...rest }
}

export const useSendChatbotAdminMessage = (
  id: string,
  options?: UseMutationOptions<
    { message: AdminChatbotMessageDTO },
    ClientError,
    { content: string }
  >
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/admin/chatbot/conversations/${id}/messages`, {
        method: "POST",
        body: payload,
      }) as Promise<{ message: AdminChatbotMessageDTO }>,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [THREAD_KEY, id] })
      queryClient.invalidateQueries({ queryKey: [INBOX_KEY] })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useChatbotFollowupDraft = (
  id: string,
  options?: UseMutationOptions<
    { suggestion: string },
    ClientError,
    { instruction?: string }
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/admin/chatbot/conversations/${id}/followup`, {
        method: "POST",
        body: payload ?? {},
      }) as Promise<{ suggestion: string }>,
    ...options,
  })
}
