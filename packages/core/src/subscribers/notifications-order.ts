import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  OrderWorkflowEvents,
} from "@medusajs/framework/utils"

import { OrderGroupWorkflowEvents } from "../workflows/events"
import { NotificationAudience } from "../modules/notification/models"
import { fanOutNotification } from "../utils/fan-out-notification"

type OrderGroupLookup = {
  id: string
  display_id: number
  customer_id: string | null
}

type OrderLookup = {
  id: string
  display_id: number
  customer_id: string | null
}

/**
 * Order lifecycle notifications: the order group confirmation goes to the
 * customer once per checkout, "new order" goes to each split child order's
 * seller, and shipment confirmations go back to the customer (respecting the
 * existing `no_notification` suppression flag).
 */
export default async function orderNotificationHandler({
  event,
  container,
}: SubscriberArgs<{
  id?: string
  order_id?: string
  fulfillment_id?: string
  no_notification?: boolean
}>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  if (event.name === OrderGroupWorkflowEvents.CREATED) {
    const {
      data: [orderGroup],
    } = await query.graph({
      entity: "order_group",
      fields: ["id", "display_id", "customer_id"],
      filters: { id: event.data.id },
    })

    if (!orderGroup) {
      return
    }

    const { id, display_id: displayId, customer_id: customerId } =
      orderGroup as OrderGroupLookup

    await fanOutNotification(container, {
      audience: NotificationAudience.CUSTOMER,
      customer_id: customerId ?? undefined,
      event: event.name,
      title: "Order confirmed",
      body: `Your order #${displayId} has been placed.`,
      link: `/user/orders/${id}`,
      resource_type: "order_group",
      resource_id: id,
    })
    return
  }

  if (event.name === OrderWorkflowEvents.PLACED) {
    const orderId = event.data.id
    if (!orderId) {
      return
    }

    const {
      data: [sellerLink],
    } = await query.graph({
      entity: "order_seller",
      fields: ["seller_id"],
      filters: { order_id: orderId },
    })

    const sellerId = (sellerLink as { seller_id?: string } | undefined)
      ?.seller_id
    if (!sellerId) {
      return
    }

    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["id", "display_id"],
      filters: { id: orderId },
    })

    const { display_id: displayId } = (order ?? { display_id: null }) as {
      display_id: number | null
    }

    await fanOutNotification(container, {
      audience: NotificationAudience.VENDOR,
      seller_id: sellerId,
      event: event.name,
      title: "New order received",
      body: displayId
        ? `Order #${displayId} was placed for your store.`
        : "A new order was placed for your store.",
      link: `/orders/${orderId}`,
      resource_type: "order",
      resource_id: orderId,
    })
    return
  }

  if (event.name === OrderWorkflowEvents.FULFILLMENT_CREATED) {
    if (event.data.no_notification || !event.data.order_id) {
      return
    }

    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["id", "display_id", "customer_id"],
      filters: { id: event.data.order_id },
    })

    if (!order) {
      return
    }

    const {
      id,
      display_id: displayId,
      customer_id: customerId,
    } = order as OrderLookup

    // The storefront order page is keyed by order group, so resolve the
    // parent group for the deep link (falling back to the order list).
    const {
      data: [groupLink],
    } = await query.graph({
      entity: "order_group_order",
      fields: ["order_group_id"],
      filters: { order_id: id },
    })

    const groupId = (groupLink as { order_group_id?: string } | undefined)
      ?.order_group_id

    await fanOutNotification(container, {
      audience: NotificationAudience.CUSTOMER,
      customer_id: customerId ?? undefined,
      event: event.name,
      title: "Your order is on its way",
      body: displayId
        ? `Items from order #${displayId} have been shipped.`
        : "Items from your order have been shipped.",
      link: groupId ? `/user/orders/${groupId}` : "/user/orders",
      resource_type: "order",
      resource_id: id,
    })
  }
}

export const config: SubscriberConfig = {
  event: [
    OrderGroupWorkflowEvents.CREATED,
    OrderWorkflowEvents.PLACED,
    OrderWorkflowEvents.FULFILLMENT_CREATED,
  ],
  context: {
    subscriberId: "order-notification-handler",
  },
}
