import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "zod"

import {
  ChatMessage,
  ChatProviderConfig,
  resolveProvider,
} from "../chatbot/providers"
import { CHATBOT_MODULE } from "../modules/chatbot"
import type ChatbotModuleService from "../modules/chatbot/service"
import { AiResponseError, parseJsonResponse } from "./json"

export type AiRuntime = {
  config: ChatProviderConfig
  model: string
}

export async function loadAiRuntime(
  container: MedusaContainer
): Promise<AiRuntime> {
  const service = container.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  const settings = await service.getRuntimeSettings()

  if (!settings.enabled) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "AI features are disabled. Enable them in the admin AI settings."
    )
  }

  if (!settings.api_key || !settings.model) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "AI settings are incomplete. Add a provider, model and API key in the admin AI settings."
    )
  }

  return {
    model: settings.model,
    config: {
      provider: settings.provider,
      base_url: settings.base_url,
      api_key: settings.api_key,
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: settings.max_tokens,
    },
  }
}

export type CompleteJsonInput<T> = {
  messages: ChatMessage[]
  schema: z.ZodType<T>
  max_tokens?: number
  temperature?: number
}

export type CompleteJsonResult<T> = {
  data: T
  model: string
}

/**
 * Ask the configured model for a JSON object and validate it. Vision input
 * rides along on `ChatMessage.images` as `data:` URLs.
 */
export async function completeJson<T>(
  container: MedusaContainer,
  input: CompleteJsonInput<T>
): Promise<CompleteJsonResult<T>> {
  const runtime = await loadAiRuntime(container)
  const provider = resolveProvider(runtime.config)

  const completion = await provider.complete(input.messages, [], {
    ...runtime.config,
    max_tokens: input.max_tokens ?? runtime.config.max_tokens,
    temperature: input.temperature ?? runtime.config.temperature,
  })

  if (!completion.content) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "The AI model returned an empty response. Please try again."
    )
  }

  let raw: unknown
  try {
    raw = parseJsonResponse(completion.content)
  } catch (error) {
    if (error instanceof AiResponseError) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, error.message)
    }
    throw error
  }

  const parsed = input.schema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const detail = issue ? ` (${issue.path.join(".") || "response"}: ${issue.message})` : ""
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `The AI model returned an unexpected response${detail}. Please try again.`
    )
  }

  return { data: parsed.data, model: runtime.model }
}
