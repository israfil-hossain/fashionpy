import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_MODULE } from "../../../../modules/messaging"
import type MessagingModuleService from "../../../../modules/messaging/service"
import { resolveRecipientId } from "../../../../modules/messaging/types/mutations"
import { sendMessageWorkflow } from "../../../../workflows/messaging/workflows/send-message"
import { AdminGetMessagesType, AdminSendMessageType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetMessagesType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const conversationId = req.params.id!

  // Admin can access any conversation — no ownership check
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

  const queryParams = (req.validatedQuery ?? {}) as AdminGetMessagesType
  const { data: messages, next_cursor } = await service.listMessagesCursor(
    conversationId,
    {
      cursor: queryParams.cursor,
      limit: queryParams.limit,
    }
  )

  // Resolve buyer + seller names for admin view (support threads have one
  // side null — skip the missing lookups).
  let buyer_name: string | null = null
  let buyer_email: string | null = null
  let seller_name: string | null = null

  try {
    const query = req.scope.resolve("query")

    if (conversation.buyer_id) {
      const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["id", "first_name", "last_name", "email"],
        filters: { id: conversation.buyer_id },
      })

      if (customers?.length > 0) {
        buyer_name = [customers[0].first_name, customers[0].last_name]
          .filter(Boolean)
          .join(" ")
        buyer_email = customers[0].email
      }
    }

    if (conversation.seller_id) {
      const { data: sellers } = await query.graph({
        entity: "seller",
        fields: ["id", "name"],
        filters: { id: conversation.seller_id },
      })

      if (sellers?.length > 0) {
        seller_name = sellers[0].name
      }
    }
  } catch {
    // Continue without enrichment
  }

  // Check block status with reason (marketplace threads only)
  let blockDetail = { blocked: false, reason: null as string | null }
  if (conversation.buyer_id && (conversation.type ?? "marketplace") === "marketplace") {
    blockDetail = await service.getBlockDetail(conversation.buyer_id)
  }

  res.json({
    conversation: {
      ...conversation,
      buyer_name,
      buyer_email,
      seller_name,
      is_buyer_blocked: blockDetail.blocked,
      block_reason: blockDetail.reason,
    },
    messages,
    next_cursor,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminSendMessageType>,
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

  // Admin oversight on marketplace threads stays read-only — staff replies
  // are only allowed on the support threads.
  if (conversationType === "marketplace") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Marketplace conversations are read-only for admins; reply from the support threads instead"
    )
  }

  const { body } = req.validatedBody

  const { result: message } = await sendMessageWorkflow.run({
    container: req.scope,
    input: {
      conversation_id: conversationId,
      sender_id: adminUserId,
      sender_type: "admin",
      body,
      context_type: null,
      context_id: null,
      context_label: null,
      recipient_id: resolveRecipientId(conversationType, "admin", {
        buyer_id: conversation.buyer_id,
        seller_id: conversation.seller_id,
      }),
      is_new_conversation: false,
      conversation_type: conversationType,
    },
  })

  res.json({ message })
}
