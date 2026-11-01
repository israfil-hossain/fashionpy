import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { ProductWorkflowEvents } from "../workflows/product/events"
import { ProductChangeWorkflowEvents } from "../workflows/product-edit/events"
import { NotificationAudience } from "../modules/notification/models"
import { fanOutNotification } from "../utils/fan-out-notification"

type ChangeLookup = {
  id: string
  product_id: string
  created_by: string | null
}

/**
 * Notify vendors about the fate of their product submissions and ping admins
 * when a new change request lands in the review queue. Vendor attribution
 * resolves through the change's (or product's) `created_by`, which carries a
 * seller id for vendor submissions and an admin user id for operator actions.
 */
export default async function productNotificationHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; message?: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  if (event.name === ProductChangeWorkflowEvents.CREATED) {
    const {
      data: [change],
    } = await query.graph({
      entity: "product_change",
      fields: ["id", "product_id"],
      filters: { id: event.data.id },
    })

    if (!change) {
      return
    }

    const { product_id: productId } = change as ChangeLookup

    await fanOutNotification(container, {
      audience: NotificationAudience.ADMIN,
      event: event.name,
      title: "Product change awaiting review",
      body: "A new product change request is waiting for review.",
      link: `/products/${productId}`,
      resource_type: "product_change",
      resource_id: (change as ChangeLookup).id,
    })
    return
  }

  if (
    event.name === ProductChangeWorkflowEvents.CONFIRMED ||
    event.name === ProductChangeWorkflowEvents.DECLINED
  ) {
    const {
      data: [change],
    } = await query.graph({
      entity: "product_change",
      fields: ["id", "product_id", "created_by"],
      filters: { id: event.data.id },
    })

    if (!change) {
      return
    }

    const { product_id: productId, created_by: createdBy } =
      change as ChangeLookup

    const confirmed = event.name === ProductChangeWorkflowEvents.CONFIRMED
    await fanOutNotification(container, {
      audience: NotificationAudience.VENDOR,
      seller_id: createdBy?.startsWith("sel_") ? createdBy : undefined,
      recipient_ids: createdBy?.startsWith("mem_") ? [createdBy] : undefined,
      event: event.name,
      title: confirmed
        ? "Product change confirmed"
        : "Product change declined",
      body: event.data.message ?? null,
      link: `/products/${productId}`,
      resource_type: "product_change",
      resource_id: (change as ChangeLookup).id,
    })
    return
  }

  if (
    event.name === ProductWorkflowEvents.PUBLISHED ||
    event.name === ProductWorkflowEvents.REJECTED
  ) {
    const {
      data: [product],
    } = await query.graph({
      entity: "product",
      fields: ["id", "title", "created_by"],
      filters: { id: event.data.id },
    })

    if (!product) {
      return
    }

    const { id: productId, title, created_by: createdBy } = product as {
      id: string
      title: string
      created_by: string | null
    }

    const published = event.name === ProductWorkflowEvents.PUBLISHED
    await fanOutNotification(container, {
      audience: NotificationAudience.VENDOR,
      seller_id: createdBy?.startsWith("sel_") ? createdBy : undefined,
      recipient_ids: createdBy?.startsWith("mem_") ? [createdBy] : undefined,
      event: event.name,
      title: published ? "Your product is live" : "Product rejected",
      body: published
        ? `${title} has been published to the marketplace.`
        : `${title} was rejected${event.data.message ? `: ${event.data.message}` : "."}`,
      link: `/products/${productId}`,
      resource_type: "product",
      resource_id: productId,
    })
  }
}

export const config: SubscriberConfig = {
  event: [
    ProductChangeWorkflowEvents.CREATED,
    ProductChangeWorkflowEvents.CONFIRMED,
    ProductChangeWorkflowEvents.DECLINED,
    ProductWorkflowEvents.PUBLISHED,
    ProductWorkflowEvents.REJECTED,
  ],
  context: {
    subscriberId: "product-notification-handler",
  },
}
