import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { resolveProvider } from "../../../../../../chatbot/providers"
import { CHATBOT_MODULE } from "../../../../../../modules/chatbot"
import type ChatbotModuleService from "../../../../../../modules/chatbot/service"
import type { AdminChatbotFollowupType } from "../../../validators"

function followupSystemPrompt(
  locale: "en" | "bn",
  instruction?: string
): string {
  const language =
    locale === "bn"
      ? "Write in Bangla (বাংলা), Latin script brand terms allowed."
      : "Write in English."
  return [
    "You are the FashionPy shopping-assistant support operator writing a follow-up to a customer who chatted about products but may not have completed a purchase.",
    language,
    "Rules: under 60 words, warm and helpful, reference something specific from the transcript when possible, no emojis, do not invent discounts or stock claims, end with a gentle question or an offer to help.",
    "Output ONLY the message text — no quotes, no preamble, no labels.",
    instruction ? `Additional instruction from the admin: ${instruction}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

/**
 * AI follow-up draft (SPEC-011): generates a suggested message from the
 * transcript using the configured provider. Nothing is persisted or sent —
 * the admin reviews/edits the suggestion and sends it via POST messages.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminChatbotFollowupType>,
  res: MedusaResponse<HttpTypes.AdminChatbotFollowupResponse>
) => {
  const service = req.scope.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  const conversation = await service.getConversation(req.params.id!)
  if (!conversation) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Conversation not found")
  }

  const runtime = await service.getRuntimeSettings("admin_text")
  if (!runtime.enabled || !runtime.api_key || !runtime.model) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "AI is not configured. Add a provider and API key in Settings → AI Chatbot."
    )
  }

  const messages = await service.listMessages(conversation.id, { limit: 40 })
  const transcript = messages
    .filter((m) => m.role !== "tool")
    .map((m) => {
      const who =
        m.role === "user"
          ? "Customer"
          : m.sender === "admin"
            ? "Admin"
            : "Assistant"
      return `${who}: ${m.content}`
    })
    .join("\n")
    .slice(0, 6000)

  const config = {
    provider: runtime.provider,
    base_url: runtime.base_url,
    api_key: runtime.api_key,
    model: runtime.model,
    temperature: runtime.temperature,
    max_tokens: Math.min(runtime.max_tokens ?? 300, 400),
  }
  const provider = resolveProvider(config)

  try {
    const result = await provider.complete(
      [
        {
          role: "system",
          content: followupSystemPrompt(
            conversation.locale ?? "en",
            req.validatedBody?.instruction
          ),
        },
        {
          role: "user",
          content: `Conversation transcript:\n${transcript}\n\nWrite the follow-up message now.`,
        },
      ],
      [],
      config
    )

    const suggestion = (result.content ?? "").trim()
    if (!suggestion) {
      throw new Error("The model returned an empty suggestion")
    }
    res.json({ suggestion })
  } catch (err) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Could not generate a follow-up: ${(err as Error).message}`
    )
  }
}
