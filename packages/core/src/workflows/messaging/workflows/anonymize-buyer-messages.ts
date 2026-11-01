import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"
import { anonymizeMessagesBatchStep } from "../steps/anonymize-messages-batch"

type AnonymizeBuyerInput = {
  buyer_id: string
}

const BATCH_SIZE = 100

const findBuyerConversationsStep = createStep(
  "find-buyer-conversations",
  async (input: { buyer_id: string }, { container }) => {
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)

    // Paginate to avoid unbounded queries
    const rows: {
      id: string
      type: string
      thread_key: string
      seller_id: string | null
      original_buyer_id: string
    }[] = []
    let skip = 0

    while (true) {
      const conversations = await service.listConversations(
        { buyer_id: input.buyer_id },
        {
          take: BATCH_SIZE,
          skip,
          select: ["id", "type", "thread_key", "seller_id", "buyer_id"],
        }
      )

      if (!conversations || conversations.length === 0) break

      for (const c of conversations as {
        id: string
        type: string
        thread_key: string
        seller_id: string | null
        buyer_id: string
      }[]) {
        rows.push({
          id: c.id,
          type: c.type,
          thread_key: c.thread_key,
          seller_id: c.seller_id,
          original_buyer_id: c.buyer_id,
        })
      }

      skip += BATCH_SIZE
      if (conversations.length < BATCH_SIZE) break
    }

    // Anonymize buyer_id and re-key the thread so the unique thread_key no
    // longer embeds the raw customer id.
    for (const row of rows) {
      const deletedBuyerId = `deleted_${input.buyer_id}`
      await service.updateConversations({
        id: row.id,
        buyer_id: deletedBuyerId,
        thread_key:
          row.type === "support_customer"
            ? `sc:${deletedBuyerId}`
            : `mk:${deletedBuyerId}:${row.seller_id}`,
      })
    }

    return new StepResponse(
      { conversation_ids: rows.map((r) => r.id) },
      {
        conversation_ids: rows.map((r) => r.id),
        original_buyer_id: input.buyer_id,
        rows,
      }
    )
  },
  async (compensationData, { container }) => {
    if (!compensationData) return
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
    // Restore original buyer_id and thread_key on rollback
    const rows = (
      compensationData as {
        rows: {
          id: string
          thread_key: string
          original_buyer_id: string
        }[]
      }
    ).rows
    for (const row of rows) {
      await service.updateConversations({
        id: row.id,
        buyer_id: row.original_buyer_id,
        thread_key: row.thread_key,
      })
    }
  }
)

export const anonymizeBuyerMessagesWorkflow = createWorkflow(
  { name: "anonymize-buyer-messages" },
  function (input: AnonymizeBuyerInput) {
    const findInput = transform(input, (data) => ({
      buyer_id: data.buyer_id,
    }))

    const result = findBuyerConversationsStep(findInput)

    const batchInput = transform(result, (data) => ({
      conversation_ids: data.conversation_ids,
      actor_type: "customer" as const,
      batch_size: 500,
    }))

    const anonymizeResult = anonymizeMessagesBatchStep(batchInput)

    return new WorkflowResponse(anonymizeResult)
  }
)
