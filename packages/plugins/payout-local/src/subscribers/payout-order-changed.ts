import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { OrderWorkflowEvents } from "@medusajs/framework/utils"
import { createOrderPayoutsWorkflow } from "@mercurjs/core/workflows"

import { REQUIRED_FULFILLMENT_STATUS } from "../utils/selection"

/**
 * A fulfilled or canceled order re-decides its payout right away instead of
 * waiting for the transfers backstop tick.
 */
export default async function payoutLocalOrderChangedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; order_id?: string }>) {
  const orderId = event.data.order_id ?? event.data.id
  if (!orderId) {
    return
  }

  await createOrderPayoutsWorkflow(container).run({
    input: {
      order_ids: [orderId],
      required_fulfillment_status: REQUIRED_FULFILLMENT_STATUS,
    },
  })
}

export const config: SubscriberConfig = {
  event: [OrderWorkflowEvents.FULFILLMENT_CREATED, OrderWorkflowEvents.CANCELED],
  context: { subscriberId: "payout-local-order-changed" },
}
