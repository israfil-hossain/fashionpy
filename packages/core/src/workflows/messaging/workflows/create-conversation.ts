import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"

import { createConversationStep } from "../steps/create-conversation"
import { MESSAGING_MODULE } from "../../../modules/messaging"
import { ConversationType } from "../../../modules/messaging/types/common"

type CreateConversationWorkflowInput = {
  type: ConversationType
  // Computed by the caller with real ids — calling buildThreadKey inside the
  // workflow body would run at graph-build time against step proxies and
  // bake in `undefined`.
  thread_key: string
  buyer_id?: string | null
  seller_id?: string | null
}

export const createConversationWorkflow = createWorkflow(
  { name: "create-conversation" },
  function (input: CreateConversationWorkflowInput) {
    const conversation = createConversationStep({
      type: input.type,
      thread_key: input.thread_key,
      buyer_id: input.buyer_id,
      seller_id: input.seller_id,
    })

    // One link per participant; support threads have exactly one human side.
    // Built inside transform so the null checks run at workflow runtime —
    // plain `if (input.seller_id)` would evaluate the build-time proxy
    // (always truthy) and push a `seller_id: null` link.
    const links = transform({ input, conversation }, ({ input, conversation }) => {
      const pairs: Record<string, Record<string, string>>[] = []

      if (input.buyer_id) {
        pairs.push({
          [Modules.CUSTOMER]: { customer_id: input.buyer_id },
          [MESSAGING_MODULE]: { conversation_id: conversation.id },
        })
      }

      if (input.seller_id) {
        pairs.push({
          seller: { seller_id: input.seller_id },
          [MESSAGING_MODULE]: { conversation_id: conversation.id },
        })
      }

      return pairs
    })

    createRemoteLinkStep(links as never)

    return new WorkflowResponse(conversation)
  }
)
