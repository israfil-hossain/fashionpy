import {
  ChatCompletionResult,
  ChatMessage,
  ChatProvider,
  ChatProviderConfig,
  ChatToolCall,
  ChatToolDefinition,
} from "./types"
import { normalizeOutgoingMessages, normalizeToolCalls } from "./normalize"
import {
  ProviderHttpError,
  SleepFn,
  defaultSleep,
  formatProviderHttpError,
  parseRetryAfterMs,
  withTransientRetries,
} from "./http"

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

type WireContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }

type WireMessage = {
  role: ChatMessage["role"]
  content?: string | null | WireContentPart[]
  tool_calls?: ChatMessage["tool_calls"]
  tool_call_id?: string
  name?: string
}

/**
 * Fold `images` into the multimodal content array the chat-completions API
 * expects. Non-user roles keep their plain string content (tool calls and
 * results never carry images).
 */
function toWireMessage(message: ChatMessage): WireMessage {
  if (!message.images?.length || message.role !== "user") {
    return {
      role: message.role,
      content: message.content,
      tool_calls: message.tool_calls,
      tool_call_id: message.tool_call_id,
      name: message.name,
    }
  }

  const parts: WireContentPart[] = []
  if (message.content) {
    parts.push({ type: "text", text: message.content })
  }
  for (const url of message.images) {
    parts.push({ type: "image_url", image_url: { url } })
  }

  return { role: message.role, content: parts }
}

/**
 * OpenAI chat-completions wire format — covers OpenRouter, OpenAI, and any
 * OpenAI-compatible gateway (custom base_url).
 */
export class OpenAICompatibleProvider implements ChatProvider {
  constructor(private readonly sleepFn: SleepFn = defaultSleep) {}

  async complete(
    messages: ChatMessage[],
    tools: ChatToolDefinition[],
    config: ChatProviderConfig
  ): Promise<ChatCompletionResult> {
    return withTransientRetries(
      () => this.doComplete(messages, tools, config),
      { sleepFn: this.sleepFn }
    )
  }

  private async doComplete(
    messages: ChatMessage[],
    tools: ChatToolDefinition[],
    config: ChatProviderConfig
  ): Promise<ChatCompletionResult> {
    const body: Record<string, unknown> = {
      model: config.model,
      messages: normalizeOutgoingMessages(messages).map(toWireMessage),
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
      signal: AbortSignal.timeout(config.timeout_ms ?? 60_000),
    })

    const text = await res.text().catch(() => "")
    if (!res.ok) {
      throw new ProviderHttpError(
        formatProviderHttpError("Chat provider", res.status, text),
        res.status,
        parseRetryAfterMs(res.headers.get("retry-after"))
      )
    }

    let data: {
      choices?: Array<{
        message?: {
          content?: string | null
          tool_calls?: ChatToolCall[]
        }
      }>
    }
    try {
      data = JSON.parse(text)
    } catch {
      throw new ProviderHttpError(
        formatProviderHttpError("Chat provider", res.status, text),
        res.status
      )
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
        { ...config, max_tokens: 8, timeout_ms: 15_000 }
      )
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  }
}
