import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { sendEmail } from "../email/send-email"
import { sellerOrderHtml } from "../email/templates"

type PlacedEventData = { id?: string } | Array<{ id: string }>

type OrderRecord = {
  id: string
  display_id?: number | null
  total?: number | string | null
  currency_code?: string | null
  items?: Array<{ title?: string | null; quantity?: number | null }> | null
}

const orderIds = (data: PlacedEventData): string[] => {
  if (Array.isArray(data)) {
    return data.map(item => item.id).filter(Boolean)
  }
  return data?.id ? [data.id] : []
}

export default async function sellerOrderEmailHandler({
  event,
  container,
}: SubscriberArgs<PlacedEventData>) {
  const ids = orderIds(event.data)
  if (!ids.length) return

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    for (const orderId of ids) {
      const [{ data: orders }, { data: sellerLinks }] = await Promise.all([
        query.graph({
          entity: "order",
          fields: ["id", "display_id", "total", "currency_code", "items.title", "items.quantity"],
          filters: { id: orderId },
        }),
        query.graph({
          entity: "order_seller",
          fields: ["seller_id"],
          filters: { order_id: orderId },
        }),
      ])

      const order = orders[0] as OrderRecord | undefined
      const sellerId = (sellerLinks[0] as { seller_id?: string } | undefined)?.seller_id
      if (!order || !sellerId) continue

      const { data: sellers } = await query.graph({
        entity: "seller",
        fields: ["id", "name", "email"],
        filters: { id: sellerId },
      })
      const seller = sellers[0] as
        | { name?: string | null; email?: string | null }
        | undefined
      if (!seller) continue

      const { data: members } = await query.graph({
        entity: "seller_member",
        fields: ["member_id", "member.email", "member.is_active"],
        filters: { seller_id: sellerId },
      })

      const recipients = new Set<string>()
      if (seller.email) recipients.add(seller.email)
      for (const link of members) {
        const member = link as {
          member?: { email?: string | null; is_active?: boolean | null } | null
        }
        if (member.member?.is_active !== false && member.member?.email) {
          recipients.add(member.member.email)
        }
      }

      if (!recipients.size) {
        logger.debug(`seller-order-email: no recipient for order ${orderId}`)
        continue
      }

      const currency = order.currency_code || "bdt"
      const displayId = order.display_id ? `#${order.display_id}` : order.id
      const total =
        order.total == null
          ? null
          : `${(Number(order.total) / 100).toFixed(2)} ${currency.toUpperCase()}`
      const items = (order.items ?? []).slice(0, 20).map(item => ({
        title: item.title || "Item",
        quantity: item.quantity || 1,
      }))

      const html = sellerOrderHtml({
        sellerName: seller.name || "Seller",
        orderId: order.id,
        displayId,
        items,
        total,
      })

      for (const to of recipients) {
        await sendEmail({
          container,
          to,
          kind: "seller_order",
          subject: `New order ${displayId}`,
          html,
          data: { order_id: order.id, seller_id: sellerId },
        })
      }
    }
  } catch (error) {
    logger.warn(`seller-order-email handler failed: ${(error as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
  context: { subscriberId: "seller-order-email-handler" },
}
