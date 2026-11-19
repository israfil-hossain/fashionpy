import { z } from "zod"

export type AdminUpdateChatbotSettingsType = z.infer<
  typeof AdminUpdateChatbotSettings
>

export const AdminUpdateChatbotSettings = z.object({
  enabled: z.boolean().optional(),
  provider: z.enum(["openrouter", "gemini", "openai_compatible"]).optional(),
  base_url: z.string().max(500).nullable().optional(),
  // Empty string clears the key; undefined leaves it unchanged.
  api_key: z.string().max(500).nullable().optional(),
  model: z.string().max(200).nullable().optional(),
  stt_provider: z.enum(["openai", "gemini", "none"]).optional(),
  stt_api_key: z.string().max(500).nullable().optional(),
  stt_model: z.string().max(200).nullable().optional(),
  system_prompt: z.string().max(8000).nullable().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().min(64).max(8192).optional(),
})

export type AdminTestChatbotType = z.infer<typeof AdminTestChatbot>

export const AdminTestChatbot = z
  .object({
    provider: z.enum(["openrouter", "gemini", "openai_compatible"]).optional(),
    base_url: z.string().max(500).nullable().optional(),
    api_key: z.string().max(500).optional(),
    model: z.string().max(200).optional(),
  })
  .optional()
  .default({})
