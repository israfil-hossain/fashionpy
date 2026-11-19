import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { randomUUID } from "crypto"

import { CHATBOT_MODULE } from "../../../../modules/chatbot"
import type ChatbotModuleService from "../../../../modules/chatbot/service"
import { StoreCreateChatbotConversationType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateChatbotConversationType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  const customerId = req.auth_context?.actor_id ?? null
  const body = req.validatedBody

  const guestToken =
    customerId != null
      ? null
      : (body.guest_token ?? (req.headers["x-chatbot-guest"] as string | undefined) ?? randomUUID())

  const conversation = await service.findOrCreateConversation({
    customer_id: customerId,
    guest_token: guestToken,
    locale: body.locale,
  })

  res.json({
    conversation,
    ...(guestToken && !customerId ? { guest_token: guestToken } : {}),
  })
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.json({ conversations: [] })
    return
  }
  const conversations = await service.listConversations({ customer_id: customerId })
  res.json({ conversations })
}
