import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { sendEmail } from "../email/send-email"
import { orderConfirmationHtml } from "../email/templates"
import { OrderGroupWorkflowEvents } from "../workflows/events"

type GroupRecord = {
  id: string
  display_id: number | null
  total?: number | string | null
  customer?: { email?: string | null } | null
  orders?: Array<{
    currency_code?: string | null
    items?: Array<{ title?: string | null; quantity?: number | null }> | null
  }> | null
}

const formatTotal = (total: number | string | null | undefined, currency: string) => {
  if (total === null || total === undefined) return null
  return `${(Number(total) / 100).toFixed(2)} ${currency.toUpperCase()}`
}

export default async function orderConfirmationEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id?: string }>) {
  if (event.name !== OrderGroupWorkflowEvents.CREATED || !event.data.id) return

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const { data } = await query.graph({
      entity: "order_group",
      fields: [
        "id",
        "display_id",
        "total",
        "customer.email",
        "orders.currency_code",
        "orders.items.title",
        "orders.items.quantity",
      ],
      filters: { id: event.data.id },
    })

    const group = data[0] as GroupRecord | undefined
    if (!group) return

    const email = group.customer?.email
    if (!email) {
      logger.debug(`order-confirmation-email: no customer email for ${group.id}`)
      return
    }

    const firstOrder = group.orders?.[0]
    const currency = firstOrder?.currency_code || "bdt"
    const items = (firstOrder?.items ?? []).slice(0, 20).map(item => ({
      title: item.title || "Item",
      quantity: item.quantity || 1,
    }))
    const displayId = group.display_id ? `#${group.display_id}` : group.id

    await sendEmail({
      container,
      to: email,
      kind: "order_confirmation",
      subject: `Order confirmed ${displayId}`,
      html: orderConfirmationHtml({
        displayId,
        total: formatTotal(group.total, currency),
        items,
        orderGroupId: group.id,
      }),
      data: {
        display_id: group.display_id,
        order_group_id: group.id,
      },
    })
  } catch (error) {
    logger.warn(`order-confirmation-email handler failed: ${(error as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: OrderGroupWorkflowEvents.CREATED,
  context: { subscriberId: "order-confirmation-email-handler" },
}
