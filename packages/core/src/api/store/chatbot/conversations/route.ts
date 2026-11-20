import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { CHATBOT_MODULE } from "../../../../modules/chatbot"
import type ChatbotModuleService from "../../../../modules/chatbot/service"
import { StoreCreateChatbotConversationType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateChatbotConversationType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  // Strict gate (SPEC-011): middleware guarantees an authenticated customer;
  // conversations are always customer-bound (no guest rows from this route).
  const customerId = req.auth_context!.actor_id
  const body = req.validatedBody

  const conversation = await service.findOrCreateConversation({
    customer_id: customerId,
    guest_token: null,
    locale: body.locale,
  })

  res.json({ conversation })
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
