import { ChatProvider, ChatProviderConfig } from "./types"
import { GeminiProvider } from "./gemini"
import { OpenAICompatibleProvider } from "./openai-compatible"

const openaiCompatible = new OpenAICompatibleProvider()
const gemini = new GeminiProvider()

export function resolveProvider(config: ChatProviderConfig): ChatProvider {
  if (config.provider === "gemini") {
    return gemini
  }
  return openaiCompatible
}

export * from "./types"
export { GeminiProvider, OpenAICompatibleProvider }
export { normalizeToolCalls, normalizeOutgoingMessages } from "./normalize"
