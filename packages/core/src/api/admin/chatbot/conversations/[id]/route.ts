import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { CHATBOT_MODULE } from "../../../../../modules/chatbot"
import type ChatbotModuleService from "../../../../../modules/chatbot/service"

/** Admin transcript — tool messages are internal and filtered out. */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminChatbotConversationResponse>
) => {
  const service = req.scope.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const conversation = await service.getConversation(req.params.id!)
  if (!conversation) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Conversation not found")
  }

  let customer: HttpTypes.AdminChatbotCustomerRef | null = null
  if (conversation.customer_id) {
    try {
      const { data } = await query.graph({
        entity: "customer",
        fields: ["id", "first_name", "last_name", "email", "phone"],
        filters: { id: conversation.customer_id },
      })
      customer =
        (data?.[0] as HttpTypes.AdminChatbotCustomerRef | undefined) ?? null
    } catch {
      customer = null
    }
  }

  const messages = await service.listMessages(conversation.id, { limit: 200 })

  res.json({
    conversation: { ...conversation, customer },
    messages: messages.filter((m) => m.role !== "tool"),
  })
}
