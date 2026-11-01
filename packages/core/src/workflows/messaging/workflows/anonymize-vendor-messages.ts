import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"

type AnonymizeVendorInput = {
  seller_id: string
}

const BATCH_SIZE = 100

const anonymizeVendorConversationsStep = createStep(
  "anonymize-vendor-conversations",
  async (input: { seller_id: string }, { container }) => {
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)

    // Paginate to avoid unbounded queries
    const rows: {
      id: string
      type: string
      thread_key: string
      buyer_id: string | null
      original_seller_id: string
    }[] = []
    let skip = 0

    while (true) {
      const conversations = await service.listConversations(
        { seller_id: input.seller_id },
        {
          take: BATCH_SIZE,
          skip,
          select: ["id", "type", "thread_key", "buyer_id", "seller_id"],
        }
      )

      if (!conversations || conversations.length === 0) break

      for (const c of conversations as {
        id: string
        type: string
        thread_key: string
        buyer_id: string | null
        seller_id: string
      }[]) {
        rows.push({
          id: c.id,
          type: c.type,
          thread_key: c.thread_key,
          buyer_id: c.buyer_id,
          original_seller_id: c.seller_id,
        })
      }

      skip += BATCH_SIZE
      if (conversations.length < BATCH_SIZE) break
    }

    // Mark conversations as having a deleted vendor and re-key the thread so
    // the unique thread_key no longer embeds the raw seller id.
    // Vendor message bodies are preserved per spec (FR-006)
    for (const row of rows) {
      const deletedSellerId = `deleted_${input.seller_id}`
      await service.updateConversations({
        id: row.id,
        seller_id: deletedSellerId,
        thread_key:
          row.type === "support_vendor"
            ? `sv:${deletedSellerId}`
            : `mk:${row.buyer_id}:${deletedSellerId}`,
      })
    }

    return new StepResponse(
      { conversation_ids: rows.map((r) => r.id), anonymized_count: rows.length },
      {
        conversation_ids: rows.map((r) => r.id),
        original_seller_id: input.seller_id,
        rows,
      }
    )
  },
  async (compensationData, { container }) => {
    if (!compensationData) return
    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
    // Restore original seller_id and thread_key on rollback
    const rows = (
      compensationData as {
        rows: {
          id: string
          thread_key: string
          original_seller_id: string
        }[]
      }
    ).rows
    for (const row of rows) {
      await service.updateConversations({
        id: row.id,
        seller_id: row.original_seller_id,
        thread_key: row.thread_key,
      })
    }
  }
)

export const anonymizeVendorMessagesWorkflow = createWorkflow(
  { name: "anonymize-vendor-messages" },
  function (input: AnonymizeVendorInput) {
    const findInput = transform(input, (data) => ({
      seller_id: data.seller_id,
    }))

    const result = anonymizeVendorConversationsStep(findInput)

    return new WorkflowResponse(result)
  }
)
