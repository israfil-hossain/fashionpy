import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { SellerWorkflowEvents } from "../workflows/events"
import { NotificationAudience } from "../modules/notification/models"
import { fanOutNotification } from "../utils/fan-out-notification"

const LIFECYCLE_TITLES: Record<string, string> = {
  [SellerWorkflowEvents.APPROVED]: "Your store is live",
  [SellerWorkflowEvents.SUSPENDED]: "Your store has been suspended",
  [SellerWorkflowEvents.TERMINATED]: "Your store has been terminated",
  [SellerWorkflowEvents.UNSUSPENDED]: "Your store is active again",
  [SellerWorkflowEvents.UNTERMINATED]: "Your store has been reinstated",
}

/**
 * Seller lifecycle notifications: new sellers ping every admin (approval
 * queue), and status changes ping the seller's active members.
 */
export default async function sellerNotificationHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const sellerId = event.data.id
  if (!sellerId) {
    return
  }

  if (event.name === SellerWorkflowEvents.CREATED) {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [seller],
    } = await query.graph({
      entity: "seller",
      fields: ["id", "name"],
      filters: { id: sellerId },
    })

    await fanOutNotification(container, {
      audience: NotificationAudience.ADMIN,
      event: event.name,
      title: "New seller awaiting approval",
      body: (seller as { name?: string } | undefined)?.name
        ? `${seller.name} registered and is waiting for review.`
        : "A new seller registered and is waiting for review.",
      link: `/stores/${sellerId}`,
      resource_type: "seller",
      resource_id: sellerId,
    })
    return
  }

  const title = LIFECYCLE_TITLES[event.name]
  if (!title) {
    return
  }

  await fanOutNotification(container, {
    audience: NotificationAudience.VENDOR,
    seller_id: sellerId,
    event: event.name,
    title,
    link: "/settings",
    resource_type: "seller",
    resource_id: sellerId,
  })
}

export const config: SubscriberConfig = {
  event: [
    SellerWorkflowEvents.CREATED,
    SellerWorkflowEvents.APPROVED,
    SellerWorkflowEvents.SUSPENDED,
    SellerWorkflowEvents.TERMINATED,
    SellerWorkflowEvents.UNSUSPENDED,
    SellerWorkflowEvents.UNTERMINATED,
  ],
  context: {
    subscriberId: "seller-notification-handler",
  },
}
