import {
  ChatCompletionResult,
  ChatMessage,
  ChatProvider,
  ChatProviderConfig,
  ChatToolCall,
  ChatToolDefinition,
} from "./types"
import {
  ProviderHttpError,
  SleepFn,
  defaultSleep,
  formatProviderHttpError,
  parseRetryAfterMs,
  withTransientRetries,
} from "./http"

function toGeminiContents(messages: ChatMessage[]): {
  contents: Array<{ role: "user" | "model"; parts: Array<Record<string, unknown>> }>
  systemInstruction?: { parts: Array<{ text: string }> }
} {
  const contents: Array<{
    role: "user" | "model"
    parts: Array<Record<string, unknown>>
  }> = []
  let systemInstruction: { parts: Array<{ text: string }> } | undefined

  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction = { parts: [{ text: msg.content ?? "" }] }
      continue
    }
    if (msg.role === "tool") {
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: msg.name ?? "tool",
              response: safeJson(msg.content ?? "{}"),
            },
          },
        ],
      })
      continue
    }
    if (msg.role === "assistant") {
      const parts: Array<Record<string, unknown>> = []
      if (msg.content) {
        parts.push({ text: msg.content })
      }
      for (const call of msg.tool_calls ?? []) {
        parts.push({
          functionCall: {
            name: call.function.name,
            args: safeJson(call.function.arguments || "{}"),
          },
        })
      }
      if (parts.length > 0) {
        contents.push({ role: "model", parts })
      }
      continue
    }
    contents.push({
      role: "user",
      parts: userParts(msg),
    })
  }

  return { contents, systemInstruction }
}

function safeJson(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "string") {
    // Non-standard providers may hand `arguments` back as a parsed object.
    return typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {}
  }
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === "object" && parsed !== null ? parsed : { value: parsed }
  } catch {
    return {}
  }
}

function dataUrlToInlineData(url: string): Record<string, unknown> | null {
  const match = /^data:([^;,]+);base64,([\s\S]+)$/.exec(url)
  if (!match) return null
  return { inlineData: { mimeType: match[1], data: match[2] } }
}

function userParts(message: ChatMessage): Array<Record<string, unknown>> {
  const parts: Array<Record<string, unknown>> = []
  if (message.content) {
    parts.push({ text: message.content })
  }
  for (const image of message.images ?? []) {
    const inline = dataUrlToInlineData(image)
    if (inline) parts.push(inline)
  }
  if (parts.length === 0) {
    parts.push({ text: "" })
  }
  return parts
}

function toGeminiTools(tools: ChatToolDefinition[]): Array<{
  functionDeclarations: Array<{
    name: string
    description: string
    parameters?: Record<string, unknown>
  }>
}> {
  if (tools.length === 0) return []
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters as Record<string, unknown>,
      })),
    },
  ]
}

export class GeminiProvider implements ChatProvider {
  constructor(private readonly sleepFn: SleepFn = defaultSleep) {}

  private baseUrl(config: ChatProviderConfig): string {
    if (config.base_url) {
      return config.base_url.replace(/\/+$/, "")
    }
    return "https://generativelanguage.googleapis.com/v1beta"
  }

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
    const { contents, systemInstruction } = toGeminiContents(messages)
    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: config.temperature ?? 0.4,
        maxOutputTokens: config.max_tokens ?? 1024,
      },
    }
    if (systemInstruction) {
      body.systemInstruction = systemInstruction
    }
    const geminiTools = toGeminiTools(tools)
    if (geminiTools.length > 0) {
      body.tools = geminiTools
    }

    const res = await fetch(
      `${this.baseUrl(config)}/models/${encodeURIComponent(config.model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.api_key,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(config.timeout_ms ?? 60_000),
      }
    )

    const text = await res.text().catch(() => "")
    if (!res.ok) {
      throw new ProviderHttpError(
        formatProviderHttpError("Gemini provider", res.status, text),
        res.status,
        parseRetryAfterMs(res.headers.get("retry-after"))
      )
    }

    let data: {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string
            functionCall?: { name: string; args: Record<string, unknown> }
          }>
        }
      }>
    }
    try {
      data = JSON.parse(text)
    } catch {
      throw new ProviderHttpError(
        formatProviderHttpError("Gemini provider", res.status, text),
        res.status
      )
    }

    const parts = data.candidates?.[0]?.content?.parts ?? []
    let content = ""
    const tool_calls: ChatToolCall[] = []

    parts.forEach((part, index) => {
      if (part.text) {
        content += part.text
      }
      if (part.functionCall) {
        tool_calls.push({
          id: `call_${index}_${part.functionCall.name}`,
          type: "function",
          function: {
            name: part.functionCall.name,
            arguments: JSON.stringify(part.functionCall.args ?? {}),
          },
        })
      }
    })

    return { content: content || null, tool_calls }
  }

  async test(config: ChatProviderConfig): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.complete([{ role: "user", content: "ping" }], [], {
        ...config,
        max_tokens: 8,
        timeout_ms: 15_000,
      })
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  }
}
