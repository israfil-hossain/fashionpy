import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { OrderWorkflowEvents } from "@medusajs/framework/utils"

import { MercurModules } from "@mercurjs/types"

export default async function fpLoyaltyCreditHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "items.total", "items.quantity"],
    filters: { id: event.data.id },
  })
  const order = Array.isArray(orders) ? orders[0] : orders
  if (!order || !order.customer_id) {
    return
  }

  const eligibleSpend = (order.items || []).reduce(
    (sum: number, item: any) => sum + Number(item.total || 0),
    0
  )

  const service: any = container.resolve(MercurModules.FP)
  await service.creditEarnedPoints({
    customerId: order.customer_id,
    orderId: order.id,
    eligibleSpend,
    idempotencyKey: `order-completed:${order.id}`,
  })
}

export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.COMPLETED,
  context: {
    subscriberId: "mercur-fp-loyalty-credit",
  },
}
