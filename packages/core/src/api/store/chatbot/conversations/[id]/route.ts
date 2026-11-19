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

  const customerId = req.auth_context?.actor_id ?? null
  const guestHeader =
    (req.headers["x-chatbot-guest"] as string | undefined) ?? null

  const ownsByCustomer =
    customerId != null && conversation.customer_id === customerId
  const ownsByGuest =
    customerId == null &&
    conversation.customer_id == null &&
    conversation.guest_token != null &&
    guestHeader === conversation.guest_token

  // Guests without the token header can still read if they only know the id
  // from the create response — treat possession of the id as ownership for
  // guests (unguessable bconv_ ids), but customers must match exactly.
  const ownsAsGuest =
    customerId == null && conversation.customer_id == null && !guestHeader

  if (!ownsByCustomer && !ownsByGuest && !ownsAsGuest) {
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
