import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_MODULE } from "../../../../../modules/messaging"
import type MessagingModuleService from "../../../../../modules/messaging/service"
import { resolveRecipientId } from "../../../../../modules/messaging/types/mutations"
import { markMessagesReadWorkflow } from "../../../../../workflows/messaging/workflows/mark-messages-read"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const customerId = req.auth_context.actor_id
  const conversationId = req.params.id!

  // Verify ownership
  const conversations = await service.listConversations(
    { id: conversationId, buyer_id: customerId },
    { take: 1 }
  )

  if (!conversations || conversations.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Conversation not found"
    )
  }

  const conversation = conversations[0]!
  const conversationType = conversation.type ?? "marketplace"

  await markMessagesReadWorkflow.run({
    container: req.scope,
    input: {
      conversation_id: conversationId,
      reader_id: customerId,
      reader_type: "customer",
      // Notify the other side of the thread (read receipts).
      sender_id: resolveRecipientId(conversationType, "customer", {
        buyer_id: conversation.buyer_id,
        seller_id: conversation.seller_id,
      }),
    },
  })

  res.json({ success: true, unread_count_customer: 0 })
}
