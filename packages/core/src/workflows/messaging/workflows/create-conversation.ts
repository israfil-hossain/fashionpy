import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"

import { createConversationStep } from "../steps/create-conversation"
import { MESSAGING_MODULE } from "../../../modules/messaging"
import { ConversationType } from "../../../modules/messaging/types/common"
import { buildThreadKey } from "../../../modules/messaging/types/mutations"

type CreateConversationWorkflowInput = {
  type: ConversationType
  buyer_id?: string | null
  seller_id?: string | null
}

export const createConversationWorkflow = createWorkflow(
  { name: "create-conversation" },
  function (input: CreateConversationWorkflowInput) {
    const thread_key = buildThreadKey(input.type, {
      buyer_id: input.buyer_id,
      seller_id: input.seller_id,
    })

    const conversation = createConversationStep({
      type: input.type,
      thread_key,
      buyer_id: input.buyer_id,
      seller_id: input.seller_id,
    })

    // One link per participant; support threads have exactly one human side.
    const links: Record<string, Record<string, string>>[] = []

    if (input.buyer_id) {
      links.push({
        [Modules.CUSTOMER]: { customer_id: input.buyer_id },
        [MESSAGING_MODULE]: { conversation_id: conversation.id },
      })
    }

    if (input.seller_id) {
      links.push({
        seller: { seller_id: input.seller_id },
        [MESSAGING_MODULE]: { conversation_id: conversation.id },
      })
    }

    createRemoteLinkStep(links as never)

    return new WorkflowResponse(conversation)
  }
)
