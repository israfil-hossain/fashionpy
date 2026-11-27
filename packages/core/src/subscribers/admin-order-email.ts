import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { sendEmail } from "../email/send-email"
import { adminOrderHtml } from "../email/templates"
import { OrderGroupWorkflowEvents } from "../workflows/events"

type GroupRecord = {
  id: string
  display_id: number | null
  total?: number | string | null
  seller_count?: number | null
  orders?: Array<{ currency_code?: string | null }> | null
}

export default async function adminOrderEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id?: string }>) {
  if (!event.data?.id) return

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const { data } = await query.graph({
      entity: "order_group",
      fields: ["id", "display_id", "total", "seller_count", "orders.currency_code"],
      filters: { id: event.data.id },
    })
    const group = data[0] as GroupRecord | undefined
    if (!group) return

    const { data: users } = await query.graph({
      entity: "user",
      fields: ["id", "email"],
    })
    const recipients = (users as Array<{ email?: string | null }>)
      .map(user => user.email)
      .filter((email): email is string => Boolean(email))
    if (!recipients.length) return

    const currency = group.orders?.[0]?.currency_code || "bdt"
    const displayId = group.display_id ? `#${group.display_id}` : group.id
    const html = adminOrderHtml({
      displayId,
      orderGroupId: group.id,
      sellerCount: group.seller_count ?? group.orders?.length ?? 1,
      total:
        group.total == null
          ? null
          : `${(Number(group.total) / 100).toFixed(2)} ${currency.toUpperCase()}`,
    })

    for (const to of new Set(recipients)) {
      await sendEmail({
        container,
        to,
        kind: "admin_order",
        subject: `New marketplace order ${displayId}`,
        html,
        data: { order_group_id: group.id },
      })
    }
  } catch (error) {
    logger.warn(`admin-order-email handler failed: ${(error as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: OrderGroupWorkflowEvents.CREATED,
  context: { subscriberId: "admin-order-email-handler" },
}
