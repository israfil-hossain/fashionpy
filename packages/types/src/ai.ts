export type AiTask = "admin_text" | "vendor_text" | "vision"

export const AI_TASKS: AiTask[] = ["admin_text", "vendor_text", "vision"]

export type AiTaskProvider = "openrouter" | "gemini" | "openai_compatible"

export type AiTaskModelConfig = {
  provider?: AiTaskProvider | null
  base_url?: string | null
  /** Write-only. Stored encrypted and never returned by the settings GET. */
  api_key?: string | null
  model?: string | null
  temperature?: number | null
  max_tokens?: number | null
}

export type AiTaskModelConfigDTO = Omit<AiTaskModelConfig, "api_key"> & {
  api_key_set: boolean
}

export type AiTaskModels = Record<AiTask, AiTaskModelConfig>
export type AiTaskModelsDTO = Record<AiTask, AiTaskModelConfigDTO>

export const emptyAiTaskModels = (): AiTaskModels => ({
  admin_text: {},
  vendor_text: {},
  vision: {},
})

export const emptyAiTaskModelsDTO = (): AiTaskModelsDTO => ({
  admin_text: { api_key_set: false },
  vendor_text: { api_key_set: false },
  vision: { api_key_set: false },
})
