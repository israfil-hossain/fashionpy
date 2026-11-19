import {
  ChatCompletionResult,
  ChatMessage,
  ChatProvider,
  ChatProviderConfig,
  ChatToolCall,
  ChatToolDefinition,
} from "./types"
import { normalizeOutgoingMessages, normalizeToolCalls } from "./normalize"

const DEFAULT_BASE_URLS: Record<string, string> = {
  openrouter: "https://openrouter.ai/api/v1",
  openai_compatible: "https://api.openai.com/v1",
}

function resolveBaseUrl(config: ChatProviderConfig): string {
  if (config.base_url) {
    return config.base_url.replace(/\/+$/, "")
  }
  return DEFAULT_BASE_URLS[config.provider] ?? DEFAULT_BASE_URLS.openai_compatible!
}

/**
 * OpenAI chat-completions wire format — covers OpenRouter, OpenAI, and any
 * OpenAI-compatible gateway (custom base_url).
 */
export class OpenAICompatibleProvider implements ChatProvider {
  async complete(
    messages: ChatMessage[],
    tools: ChatToolDefinition[],
    config: ChatProviderConfig
  ): Promise<ChatCompletionResult> {
    const body: Record<string, unknown> = {
      model: config.model,
      messages: normalizeOutgoingMessages(messages),
      temperature: config.temperature ?? 0.4,
      max_tokens: config.max_tokens ?? 1024,
    }
    if (tools.length > 0) {
      body.tools = tools
      body.tool_choice = "auto"
    }

    const res = await fetch(`${resolveBaseUrl(config)}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.api_key}`,
        ...(config.provider === "openrouter"
          ? { "HTTP-Referer": "https://mercurjs.com", "X-Title": "Mercur Chatbot" }
          : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Chat provider ${res.status}: ${text.slice(0, 400)}`)
    }

    const data = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null
          tool_calls?: ChatToolCall[]
        }
      }>
    }

    const message = data.choices?.[0]?.message
    return {
      content: message?.content ?? null,
      tool_calls: normalizeToolCalls(message?.tool_calls ?? []),
    }
  }

  async test(config: ChatProviderConfig): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.complete(
        [{ role: "user", content: "ping" }],
        [],
        { ...config, max_tokens: 8 }
      )
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  }
}
