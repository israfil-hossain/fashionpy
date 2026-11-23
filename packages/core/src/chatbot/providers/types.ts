export type ChatRole = "system" | "user" | "assistant" | "tool"

export interface ChatToolDefinition {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface ChatToolCall {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

export interface ChatMessage {
  role: ChatRole
  content?: string | null
  /** Image inputs as `data:` URLs. Only used by vision-capable models. */
  images?: string[]
  tool_calls?: ChatToolCall[]
  tool_call_id?: string
  name?: string
}

export interface ChatUsage {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

export interface ChatCompletionResult {
  content: string | null
  tool_calls: ChatToolCall[]
  usage?: ChatUsage
}

export interface ChatProviderConfig {
  provider: "openrouter" | "gemini" | "openai_compatible"
  base_url?: string | null
  api_key: string
  model: string
  temperature?: number
  max_tokens?: number
  /** Per-request timeout; defaults to 60s (connection tests use a shorter one). */
  timeout_ms?: number
}

export interface ChatProvider {
  complete(
    messages: ChatMessage[],
    tools: ChatToolDefinition[],
    config: ChatProviderConfig
  ): Promise<ChatCompletionResult>
  test(config: ChatProviderConfig): Promise<{ ok: boolean; error?: string }>
}
