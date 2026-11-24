import type { MedusaContainer } from "@medusajs/framework/types"

import type {
  ChatbotCard,
  ChatbotLocale,
} from "../modules/chatbot/types/common"
import { CHATBOT_MODULE } from "../modules/chatbot"
import type ChatbotModuleService from "../modules/chatbot/service"
import { MESSAGING_REDIS_MODULE } from "../modules/messaging-redis"
import type MessagingRedisModuleService from "../modules/messaging-redis/service"
import { ChatMessage, resolveProvider } from "./providers"
import { RATE_LIMIT_MESSAGE, RATE_LIMIT_PER_MINUTE } from "./rate-limit"
import { CHATBOT_TOOLS } from "./tools/definitions"
import { dispatchTool, ToolContext } from "./tools/execute"
import { CheckoutState, IDLE_STATE } from "./state"
import {
  buildSystemMessage,
  collectShownProductTitles,
  replayHistory,
} from "./prompts"

const MAX_TOOL_STEPS = 8
const MAX_HISTORY_MESSAGES = 24

export type AgentEvent =
  | { type: "delta"; text: string }
  | { type: "card"; card: ChatbotCard }
  | { type: "done"; message_id: string; content: string; cards: ChatbotCard[] }
  | { type: "error"; error: string }

export type AgentRunInput = {
  container: MedusaContainer
  conversation_id: string
  customer_id: string | null
  user_content: string
  locale: ChatbotLocale
  onEvent?: (event: AgentEvent) => void
}

export type AgentRunResult = {
  content: string
  cards: ChatbotCard[]
  message_id: string
}

function detectLocale(text: string, fallback: ChatbotLocale): ChatbotLocale {
  // Bangla script range
  if (/[\u0980-\u09FF]/.test(text)) {
    return "bn"
  }
  return fallback
}

/**
 * Per-customer (or per-guest conversation) message budget. Redis-backed when
 * messaging-redis is registered; skipped gracefully otherwise so a missing
 * Redis never blocks the assistant.
 */
async function enforceRateLimit(
  container: MedusaContainer,
  actorKey: string
): Promise<void> {
  let redis: MessagingRedisModuleService
  try {
    redis = container.resolve<MessagingRedisModuleService>(MESSAGING_REDIS_MODULE)
  } catch {
    return
  }
  if (!redis.isAvailable) {
    return
  }

  try {
    const { allowed } = await redis.checkRateLimit(
      `ratelimit:chatbot:${actorKey}`,
      RATE_LIMIT_PER_MINUTE,
      60
    )
    if (!allowed) {
      const err = new Error(RATE_LIMIT_MESSAGE)
      err.name = "RateLimitError"
      throw err
    }
  } catch (err) {
    if ((err as Error).name === "RateLimitError") {
      throw err
    }
    // Redis hiccup — fail open
  }
}

export async function runAgent(input: AgentRunInput): Promise<AgentRunResult> {
  const { container, conversation_id, customer_id, user_content } = input
  const service = container.resolve<ChatbotModuleService>(CHATBOT_MODULE)

  const conversation = await service.getConversation(conversation_id)
  if (!conversation) {
    throw new Error("Conversation not found")
  }

  const locale = detectLocale(user_content, input.locale || conversation.locale || "en")
  if (locale !== conversation.locale) {
    await service.updateLocale(conversation_id, locale)
  }

  await enforceRateLimit(container, customer_id ?? `guest:${conversation_id}`)

  const runtime = await service.getRuntimeSettings()
  if (!runtime.enabled) {
    const disabled =
      locale === "bn"
        ? "অ্যাসিস্টেন্ট এখন বন্ধ আছে।"
        : "The assistant is currently disabled."
    const userMsg = await service.appendMessage({
      conversation_id,
      role: "user",
      content: user_content,
      locale,
      preview: user_content.slice(0, 100),
    })
    const botMsg = await service.appendMessage({
      conversation_id,
      role: "assistant",
      content: disabled,
      locale,
      preview: disabled.slice(0, 100),
    })
    input.onEvent?.({ type: "delta", text: disabled })
    input.onEvent?.({
      type: "done",
      message_id: botMsg.id,
      content: disabled,
      cards: [],
    })
    void userMsg
    return { content: disabled, cards: [], message_id: botMsg.id }
  }

  if (!runtime.api_key || !runtime.model) {
    throw new Error(
      locale === "bn"
        ? "AI সেটিংস সম্পূর্ণ নয়। অ্যাডমিন প্যানেল থেকে প্রোভাইডার ও কী যোগ করুন।"
        : "AI settings are incomplete. Add a provider and API key in the admin panel."
    )
  }

  await service.appendMessage({
    conversation_id,
    role: "user",
    content: user_content,
    locale,
    preview: user_content.slice(0, 100),
  })

  const history = await service.listMessages(conversation_id, {
    limit: MAX_HISTORY_MESSAGES,
  })

  const provider = resolveProvider({
    provider: runtime.provider,
    base_url: runtime.base_url,
    api_key: runtime.api_key,
    model: runtime.model,
    temperature: runtime.temperature,
    max_tokens: runtime.max_tokens,
  })

  const checkout: CheckoutState =
    (conversation.checkout_state as CheckoutState | null) ?? IDLE_STATE

  const toolCtx: ToolContext = {
    container,
    customer_id,
    conversation_id,
    locale,
    checkout,
    onCheckoutChange: async (state) => {
      await service.updateCheckoutState(conversation_id, state as never)
      toolCtx.checkout = state
    },
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: buildSystemMessage({
        effectivePrompt: runtime.system_prompt_effective,
        locale,
        phase: checkout.phase,
        customerId: customer_id,
        shownProductTitles: collectShownProductTitles(history),
      }),
    },
    ...replayHistory(history),
  ]

  const collectedCards: ChatbotCard[] = []
  let finalContent = ""
  const collectedToolMessages: ChatMessage[] = []

  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    const completion = await provider.complete(
      [...messages, ...collectedToolMessages],
      CHATBOT_TOOLS,
      {
        provider: runtime.provider,
        base_url: runtime.base_url,
        api_key: runtime.api_key,
        model: runtime.model,
        temperature: runtime.temperature,
        max_tokens: runtime.max_tokens,
      }
    )

    if (completion.tool_calls.length > 0) {
      collectedToolMessages.push({
        role: "assistant",
        content: completion.content,
        tool_calls: completion.tool_calls,
      })

      for (const call of completion.tool_calls) {
        let resultText: string
        let cards: ChatbotCard[] = []
        try {
          const result = await dispatchTool(
            call.function.name,
            call.function.arguments,
            toolCtx
          )
          resultText = result.content
          cards = result.cards ?? []
          collectedCards.push(...cards)
          for (const card of cards) {
            input.onEvent?.({ type: "card", card })
          }
        } catch (err) {
          resultText = `Error: ${(err as Error).message}`
        }

        collectedToolMessages.push({
          role: "tool",
          tool_call_id: call.id,
          name: call.function.name,
          content: JSON.stringify({ content: resultText, cards }),
        })
      }
      continue
    }

    finalContent = completion.content ?? ""
    break
  }

  if (!finalContent) {
    finalContent =
      locale === "bn"
        ? "দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না। আবার চেষ্টা করুন।"
        : "Sorry, I couldn't respond right now. Please try again."
  }

  // Stream deltas (word-ish chunks)
  if (input.onEvent) {
    const chunks = finalContent.match(/\S+\s*|\n/g) ?? [finalContent]
    for (const chunk of chunks) {
      input.onEvent({ type: "delta", text: chunk })
    }
  }

  const botMsg = await service.appendMessage({
    conversation_id,
    role: "assistant",
    content: finalContent,
    cards: collectedCards.length ? collectedCards : null,
    locale,
    preview: finalContent.slice(0, 100),
  })

  input.onEvent?.({
    type: "done",
    message_id: botMsg.id,
    content: finalContent,
    cards: collectedCards,
  })

  return {
    content: finalContent,
    cards: collectedCards,
    message_id: botMsg.id,
  }
}

export async function testConnection(
  container: MedusaContainer,
  overrides?: {
    provider?: string
    base_url?: string | null
    api_key?: string
    model?: string
    task?: "admin_text" | "vendor_text" | "vision"
  }
): Promise<{ ok: boolean; provider: string; model: string; latency_ms: number; error?: string }> {
  const service = container.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  const runtime = await service.getRuntimeSettings(overrides?.task)

  const provider = (overrides?.provider ?? runtime.provider) as
    | "openrouter"
    | "gemini"
    | "openai_compatible"
  const api_key = overrides?.api_key || runtime.api_key
  const model = overrides?.model || runtime.model
  const base_url = overrides?.base_url !== undefined ? overrides?.base_url : runtime.base_url

  if (!api_key || !model) {
    return {
      ok: false,
      provider,
      model: model ?? "",
      latency_ms: 0,
      error: "API key or model not configured",
    }
  }

  const adapter = resolveProvider({
    provider,
    base_url,
    api_key: api_key!,
    model: model!,
  })

  const started = Date.now()
  const result = await adapter.test({
    provider,
    base_url,
    api_key: api_key!,
    model: model!,
    max_tokens: 8,
  })

  return {
    ok: result.ok,
    provider,
    model: model!,
    latency_ms: Date.now() - started,
    ...(result.error ? { error: result.error } : {}),
  }
}
