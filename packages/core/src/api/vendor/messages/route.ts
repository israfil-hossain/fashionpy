import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"
import {
  ConversationDTO,
  ConversationType,
} from "../../../modules/messaging/types/common"
import { resolveRecipientId } from "../../../modules/messaging/types/mutations"
import { createConversationWorkflow } from "../../../workflows/messaging/workflows/create-conversation"
import { sendMessageWorkflow } from "../../../workflows/messaging/workflows/send-message"
import { resolveContextLabel } from "../../store/messages/helpers"
import {
  VendorCreateSupportType,
  VendorListConversationsType,
} from "./validators"

type EnrichedConversation = ConversationDTO & {
  buyer_first_name?: string | null
  is_buyer_blocked?: boolean
}

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorListConversationsType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const sellerId = req.seller_context!.seller_id

  const queryParams = (req.validatedQuery ?? {}) as VendorListConversationsType
  const { data: conversations, next_cursor } =
    await service.listConversationsCursor(
      {
        seller_id: sellerId,
        ...(queryParams.type ? { type: queryParams.type } : {}),
      },
      {
        cursor: queryParams.cursor,
        limit: queryParams.limit,
      }
    )

  const enriched = conversations as EnrichedConversation[]

  // Resolve buyer first names via customer link (support_vendor threads have
  // no buyer — the map lookup yields null, which is correct).
  if (enriched.length > 0) {
    try {
      const query = req.scope.resolve("query")
      const buyerIds = [
        ...new Set(
          enriched
            .map((c) => c.buyer_id)
            .filter((id): id is string => typeof id === "string")
        ),
      ]

      if (buyerIds.length > 0) {
        const { data: customers } = await query.graph({
          entity: "customer",
          fields: ["id", "first_name"],
          filters: { id: buyerIds },
        })

        const customerMap = new Map(
          (customers ?? []).map((c: { id: string; first_name: string }) => [c.id, c.first_name])
        )

        for (const conv of enriched) {
          conv.buyer_first_name =
            conv.buyer_id != null
              ? customerMap.get(conv.buyer_id) ?? null
              : null
        }
      }
    } catch {
      // Continue without buyer names
    }
  }

  // Annotate block status (marketplace threads only — support buyers are
  // never blocked from reaching admin).
  if (enriched.length > 0) {
    const buyerIds = [
      ...new Set(
        enriched
          .filter((c) => (c.type ?? "marketplace") === "marketplace")
          .map((c) => c.buyer_id)
          .filter((id): id is string => typeof id === "string")
      ),
    ]
    const blockedSet = await service.checkBuyersBlocked(buyerIds)
    for (const conv of enriched) {
      conv.is_buyer_blocked =
        conv.buyer_id != null ? blockedSet.has(conv.buyer_id) : false
    }
  }

  res.json({ conversations: enriched, next_cursor })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateSupportType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingModuleService>(MESSAGING_MODULE)
  const sellerId = req.seller_context!.seller_id

  // Find or create the seller's shared support thread (one per seller)
  let conversation: any
  const existing = await service.listConversations(
    { thread_key: `sv:${sellerId}` },
    { take: 1 }
  )

  if (existing && existing.length > 0) {
    conversation = existing[0]
  } else {
    const { result } = await createConversationWorkflow.run({
      container: req.scope,
      input: {
        type: "support_vendor" as ConversationType,
        seller_id: sellerId,
      },
    })
    conversation = result
  }

  let message
  const { body, context_type, context_id } = req.validatedBody
  if (body) {
    const context_label = await resolveContextLabel(
      req.scope,
      context_type ?? null,
      context_id ?? null
    )

    const { result } = await sendMessageWorkflow.run({
      container: req.scope,
      input: {
        conversation_id: conversation.id,
        sender_id: sellerId,
        sender_type: "seller",
        body,
        context_type: context_type ?? null,
        context_id: context_id ?? null,
        context_label,
        recipient_id: resolveRecipientId("support_vendor", "seller", {
          seller_id: sellerId,
        }),
        is_new_conversation: existing.length === 0,
        conversation_type: "support_vendor",
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
