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
