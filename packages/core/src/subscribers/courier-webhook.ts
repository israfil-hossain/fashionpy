import { Modules } from "@medusajs/framework/utils"

import { processCourierWebhookWorkflowId } from "../workflows/courier"
import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

export default async function courierWebhookHandler({
  event,
  container,
}: SubscriberArgs<{
  provider: string
  event: {
    consignment_id: string
    order_id?: string
    status: string
    delivery_fee?: number
    raw?: Record<string, unknown>
  }
}>) {
  const { provider, event: webhookEvent } = event.data

  if (!provider || !webhookEvent) {
    return
  }

  const wfEngine = container.resolve(Modules.WORKFLOW_ENGINE)
  await wfEngine.run(processCourierWebhookWorkflowId, {
    input: {
      provider,
      consignment_id: webhookEvent.consignment_id!,
      order_id: webhookEvent.order_id,
      status: webhookEvent.status!,
      delivery_fee: webhookEvent.delivery_fee,
      raw: webhookEvent.raw,
    },
  })
}

export const config: SubscriberConfig = {
  event: "courier.webhook_received",
  context: {
    subscriberId: "courier-webhook-handler",
  },
}
