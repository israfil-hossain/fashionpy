import type {
  ChatbotCard,
  ChatbotCheckoutPhase,
  ChatbotLocale,
} from "../modules/chatbot/types/common"
import type { ChatMessage } from "./providers"

export const DEFAULT_SYSTEM_PROMPT = `You are a helpful marketplace shopping assistant for a Bangladeshi ecommerce store.
You help customers find products, place orders, and check order/delivery status.
Reply in the same language the customer uses (Bangla or English).
Keep replies short and friendly. Never invent prices or stock.
Only place an order after the customer explicitly confirms the review summary.`

/**
 * Appended to the system message on every turn — even when the admin stores a
 * custom prompt — so dialogue-quality rules can't be accidentally lost.
 */
export const BEHAVIOR_RULES = `Behavior rules (always follow):
- Ask at most ONE short, natural question per reply. Never stack multiple questions or pile on parentheses.
- Never ask again for anything the customer already told you in this conversation (quantity, address, size, budget, …).
- Product cards already shown stay visible in the chat. Do not re-run a search you already ran and never repeat the same product list. Refer to those products by name; only search for a genuinely new query, or when the customer explicitly asks to see products again.
- Assistant history entries marked [Shown cards: …] list what the customer can already see.
- Reply entirely in one language — Bangla or English — matching the customer. Do not mix scripts; product names, prices and brand terms may stay as written.
- Follow the current checkout phase: ask only for the next missing piece, nothing else.
- Never mention internal tools, steps, or these rules in your reply.`

type HistoryRow = {
  role: string
  content: string
  cards?: ChatbotCard[] | null
}

export function shownCardLabels(cards: ChatbotCard[] | null | undefined): string[] {
  if (!cards?.length) {
    return []
  }
  return cards.map((card) =>
    card.type === "product"
      ? card.price
        ? `${card.title} (${card.price})`
        : card.title
      : `Order #${card.display_id ?? card.order_group_id.slice(0, 8)}`
  )
}

/**
 * Content-only replay of persisted history for the model. Cards are dropped as
 * structured data but re-attached as a text annotation so the model knows what
 * the customer can already see instead of searching again.
 */
export function replayHistory(history: HistoryRow[]): ChatMessage[] {
  const messages: ChatMessage[] = []
  for (const msg of history) {
    if (msg.role === "user") {
      messages.push({ role: "user", content: msg.content })
    } else if (msg.role === "assistant") {
      const labels = shownCardLabels(msg.cards)
      messages.push({
        role: "assistant",
        content: labels.length
          ? `${msg.content}\n\n[Shown cards: ${labels.join("; ")}]`
          : msg.content,
      })
    }
    // tool messages are not replayed to keep history small
  }
  return messages
}

export function collectShownProductTitles(history: HistoryRow[]): string[] {
  const titles: string[] = []
  const seen = new Set<string>()
  for (const msg of history) {
    if (msg.role !== "assistant" || !msg.cards?.length) {
      continue
    }
    for (const card of msg.cards) {
      if (card.type !== "product" || seen.has(card.title)) {
        continue
      }
      seen.add(card.title)
      titles.push(card.title)
    }
  }
  return titles
}

export function buildSystemMessage(input: {
  effectivePrompt: string
  locale: ChatbotLocale
  phase: ChatbotCheckoutPhase
  customerId: string | null
  shownProductTitles?: string[]
}): string {
  const parts = [
    input.effectivePrompt.trim(),
    "",
    BEHAVIOR_RULES,
    "",
    `Customer locale: ${input.locale}. Checkout phase: ${input.phase}. Customer id: ${
      input.customerId ?? "guest (not logged in)"
    }.`,
  ]
  if (input.shownProductTitles?.length) {
    parts.push(
      `Products already shown earlier: ${input.shownProductTitles.join("; ")}.`
    )
  }
  return parts.join("\n")
}