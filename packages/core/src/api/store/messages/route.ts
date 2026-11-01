import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"
import { ConversationDTO } from "../../../modules/messaging/types/common"
import { buildThreadKey, resolveRecipientId } from "../../../modules/messaging/types/mutations"
import { createConversationWorkflow } from "../../../workflows/messaging/workflows/create-conversation"
import { sendMessageWorkflow } from "../../../workflows/messaging/workflows/send-message"
import { resolveContextLabel } from "./helpers"
import {
  StoreCreateConversationType,
  StoreListConversationsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreListConversationsType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const customerId = req.auth_context.actor_id

  const queryParams = (req.validatedQuery ?? {}) as StoreListConversationsType
  const { data: conversations, next_cursor } =
    await service.listConversationsCursor(
      {
        buyer_id: customerId,
        ...(queryParams.type ? { type: queryParams.type } : {}),
      },
      {
        cursor: queryParams.cursor,
        limit: queryParams.limit,
      }
    )

  // Enrich counterpart seller names/logos so the storefront list can label
  // marketplace threads without a second round trip.
  const enriched = conversations as (ConversationDTO & {
    seller_name?: string | null
    seller_logo?: string | null
  })[]

  const sellerIds = [
    ...new Set(
      enriched
        .map((c) => c.seller_id)
        .filter((id): id is string => typeof id === "string")
    ),
  ]

  if (sellerIds.length > 0) {
    try {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: sellers } = await query.graph({
        entity: "seller",
        fields: ["id", "name", "logo"],
        filters: { id: sellerIds },
      })
      const sellerMap = new Map(
        (sellers ?? []).map((s: { id: string; name: string; logo?: string }) => [
          s.id,
          s,
        ])
      )
      for (const conv of enriched) {
        const seller = conv.seller_id ? sellerMap.get(conv.seller_id) : undefined
        conv.seller_name = seller?.name ?? null
        conv.seller_logo = seller?.logo ?? null
      }
    } catch {
      // Continue without seller names
    }
  }

  res.json({ conversations: enriched, next_cursor })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateConversationType>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context.actor_id
  const { type, seller_id, body, context_type, context_id } = req.validatedBody

  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)

  // Chat blocks only suspend marketplace chat; support stays reachable.
  if (type === "marketplace") {
    const blocked = await service.checkBuyersBlocked([customerId])
    if (blocked.has(customerId)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Your chat access has been suspended"
      )
    }

    // Check if seller exists and is active
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { data: sellers } = await query.graph({
      entity: "seller",
      fields: ["id", "name"],
      filters: { id: seller_id! },
    })

    if (!sellers || sellers.length === 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Seller not found"
      )
    }
  }

  const conversationType =
    type === "support" ? "support_customer" as const : "marketplace" as const
  const threadKey = buildThreadKey(conversationType, {
    buyer_id: customerId,
    seller_id,
  })

  // Find or create conversation by its unique thread key
  let conversation: any
  const existing = await service.listConversations(
    { thread_key: threadKey },
    { take: 1 }
  )

  if (existing && existing.length > 0) {
    conversation = existing[0]
  } else {
    const { result } = await createConversationWorkflow.run({
      container: req.scope,
      input: {
        type: conversationType,
        buyer_id: customerId,
        seller_id: conversationType === "marketplace" ? seller_id : null,
      },
    })
    conversation = result
  }

  let message
  if (body) {
    // Resolve context label for display
    const context_label = await resolveContextLabel(req.scope, context_type ?? null, context_id ?? null)

    const { result } = await sendMessageWorkflow.run({
      container: req.scope,
      input: {
        conversation_id: conversation.id,
        sender_id: customerId,
        sender_type: "customer",
        body,
        context_type: context_type ?? null,
        context_id: context_id ?? null,
        context_label,
        recipient_id: resolveRecipientId(conversationType, "customer", {
          buyer_id: customerId,
          seller_id,
        }),
        is_new_conversation: existing.length === 0,
        conversation_type: conversationType,
      },
    })
    message = result
  }

  const response: any = { conversation }
  if (message) {
    response.message = message
  }

  res.status(200).json(response)
}
