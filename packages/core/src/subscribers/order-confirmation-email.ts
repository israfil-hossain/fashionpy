import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils"

import { OrderGroupWorkflowEvents } from "../workflows/events"
import { sendOrderConfirmationEmail } from "../chatbot/email"

/**
 * Sends the order confirmation email (Resend when configured) once per
 * checkout, alongside the existing in-app notification fan-out.
 */
export default async function orderConfirmationEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id?: string }>) {
  if (event.name !== OrderGroupWorkflowEvents.CREATED || !event.data.id) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const {
      data: [group],
    } = await query.graph({
      entity: "order_group",
      fields: [
        "id",
        "display_id",
        "total",
        "customer.email",
        "customer_id",
        "orders.currency_code",
        "orders.items.title",
        "orders.items.quantity",
      ],
      filters: { id: event.data.id },
    })

    if (!group) {
      return
    }

    const email = (group as any).customer?.email
    if (!email) {
      logger.debug(
        `order-confirmation-email: no customer email for group ${group.id}`
      )
      return
    }

    const firstOrder = (group as any).orders?.[0]
    const items = ((firstOrder?.items ?? []) as Array<{
      title: string
      quantity: number
    }>).slice(0, 20)

    await sendOrderConfirmationEmail(container, {
      email,
      order_group_id: group.id,
      display_id: group.display_id,
      total: (group as any).total ?? null,
      currency_code: firstOrder?.currency_code ?? null,
      items,
    })
  } catch (err) {
    logger.warn(
      `order-confirmation-email handler failed: ${(err as Error).message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: OrderGroupWorkflowEvents.CREATED,
  context: {
    subscriberId: "order-confirmation-email-handler",
  },
}
