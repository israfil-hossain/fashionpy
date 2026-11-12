import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, PaymentEvents } from "@medusajs/framework/utils"
import { createOrderPayoutsWorkflow } from "@mercurjs/core/workflows"

import { REQUIRED_FULFILLMENT_STATUS } from "../utils/selection"

type CapturedEntry = { id?: string } | null | undefined

/**
 * A captured payment lets its order's seller be paid out. The cart-level
 * capture has no order yet — the split re-emits one event per order payment,
 * which is what this handles (both event shapes are accepted).
 */
export default async function payoutLocalPaymentCapturedHandler({
  event,
  container,
}: SubscriberArgs<CapturedEntry | CapturedEntry[]>) {
  const entries = Array.isArray(event.data)
    ? event.data
    : event.data
      ? [event.data]
      : []
  const paymentIds = entries
    .map((entry) => entry?.id)
    .filter((id): id is string => !!id)
  if (!paymentIds.length) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: payments } = await query.graph({
    entity: "payment",
    fields: ["payment_collection.order.id"],
    filters: { id: paymentIds },
  })

  const orderIds = Array.from(
    new Set(
      payments
        .map(
          (payment) =>
            (
              payment as {
                payment_collection?: { order?: { id?: string } | null } | null
              }
            ).payment_collection?.order?.id
        )
        .filter((id): id is string => !!id)
    )
  )
  if (!orderIds.length) {
    return
  }

  await createOrderPayoutsWorkflow(container).run({
    input: {
      order_ids: orderIds,
      required_fulfillment_status: REQUIRED_FULFILLMENT_STATUS,
    },
  })
}

export const config: SubscriberConfig = {
  event: PaymentEvents.CAPTURED,
  context: { subscriberId: "payout-local-payment-captured" },
}
