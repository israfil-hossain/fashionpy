import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { CHATBOT_MODULE } from "../../../../../modules/chatbot"
import type ChatbotModuleService from "../../../../../modules/chatbot/service"

async function loadOwnedConversation(
  req: AuthenticatedMedusaRequest,
  service: ChatbotModuleService
) {
  const id = req.params.id!
  const conversation = await service.getConversation(id)
  if (!conversation) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Conversation not found")
  }

  // Strict gate (SPEC-011): auth is required by middleware, so the actor is
  // always a customer — the conversation must be bound to that customer.
  const customerId = req.auth_context?.actor_id ?? null
  if (!customerId || conversation.customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Conversation not found")
  }

  return conversation
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  const conversation = await loadOwnedConversation(req, service)
  const messages = await service.listMessages(conversation.id, { limit: 100 })
  res.json({ conversation, messages })
}
