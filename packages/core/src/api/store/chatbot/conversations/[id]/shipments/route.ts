import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

import { CHATBOT_MODULE } from "../../../../../../modules/chatbot"
import type ChatbotModuleService from "../../../../../../modules/chatbot/service"

/**
 * Courier shipments for the customer's orders — delivery status cards.
 * Scoped to order groups the authenticated customer owns (never another
 * buyer's shipments). Guests get an empty list.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  const conversationId = req.params.id!
  const conversation = await service.getConversation(conversationId)

  if (!conversation) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Conversation not found")
  }

  const customerId = req.auth_context?.actor_id ?? null
  // Strict gate (SPEC-011): only the conversation's own customer may read.
  if (!customerId || conversation.customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Conversation not found")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: groups } = await query.graph({
    entity: "order_group",
    fields: ["id", "orders.id"],
    filters: { customer_id: customerId },
    pagination: { take: 20 },
  })

  const orderIds = (groups ?? [])
    .flatMap((g: any) => (g.orders ?? []).map((o: any) => o.id))
    .filter((id: unknown): id is string => typeof id === "string")

  if (!orderIds.length) {
    res.json({ shipments: [] })
    return
  }

  let shipments: unknown[] = []
  try {
    const { data } = await query.graph({
      entity: "courier_shipment",
      fields: [
        "id",
        "status",
        "tracking_code",
        "tracking_url",
        "provider",
        "order_id",
        "fulfillment_id",
        "created_at",
        "updated_at",
      ],
      filters: { order_id: orderIds },
      pagination: { take: 50 },
    })
    shipments = data ?? []
  } catch {
    shipments = []
  }

  res.json({ shipments })
}
