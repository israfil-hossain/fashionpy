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
  const adminUserId = req.auth_context.actor_id
  const conversationId = req.params.id!

  const conversations = await service.listConversations(
    { id: conversationId },
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

  // Oversight reads on marketplace threads must not touch human read state —
  // only support threads belong to the shared inbox.
  if (conversationType === "marketplace") {
    res.json({ success: true, read_only: true })
    return
  }

  await markMessagesReadWorkflow.run({
    container: req.scope,
    input: {
      conversation_id: conversationId,
      reader_id: adminUserId,
      reader_type: "admin",
      // Notify the human side of the thread (read receipts).
      sender_id: resolveRecipientId(conversationType, "admin", {
        buyer_id: conversation.buyer_id,
        seller_id: conversation.seller_id,
      }),
    },
  })

  res.json({ success: true, unread_count_admin: 0 })
}
