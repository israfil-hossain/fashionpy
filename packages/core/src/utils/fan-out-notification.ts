import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import { NotificationAudience } from "../modules/notification/models"
import type NotificationFeedModuleService from "../modules/notification/service"

export type FanOutNotificationInput = {
  audience: NotificationAudience
  /** Required for the vendor audience — the seller whose members receive the row. */
  seller_id?: string
  /** Required for the customer audience. */
  customer_id?: string
  /**
   * Skip audience resolution and deliver to these actor ids directly
   * (e.g. the member who submitted a product change).
   */
  recipient_ids?: string[]
  event: string
  title: string
  body?: string | null
  link?: string | null
  resource_type?: string | null
  resource_id?: string | null
  data?: Record<string, unknown> | null
}

type NotificationRow = {
  recipient_type: NotificationAudience
  recipient_id: string
  seller_id: string | null
  event: string
  title: string
  body: string | null
  link: string | null
  resource_type: string | null
  resource_id: string | null
  data: Record<string, unknown> | null
}

const RECIPIENT_PREFIX_BY_AUDIENCE: Record<NotificationAudience, string> = {
  admin: "user_",
  vendor: "mem_",
  customer: "cus_",
}

/**
 * Resolve the recipients for an audience and create one notification row per
 * recipient so `read_at` stays per-person. Called from subscribers; failures
 * propagate so the subscriber logs them, but notification creation never runs
 * inside the originating workflow and therefore cannot roll it back.
 */
export async function fanOutNotification(
  container: MedusaContainer,
  input: FanOutNotificationInput
): Promise<void> {
  const base = {
    recipient_type: input.audience,
    event: input.event,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    resource_type: input.resource_type ?? null,
    resource_id: input.resource_id ?? null,
    data: input.data ?? null,
  }

  let rows: NotificationRow[] = []

  if (input.recipient_ids?.length) {
    const prefix = RECIPIENT_PREFIX_BY_AUDIENCE[input.audience]
    rows = input.recipient_ids
      .filter((recipientId) => recipientId.startsWith(prefix))
      .map((recipientId) => ({
        ...base,
        recipient_id: recipientId,
        seller_id: input.seller_id ?? null,
      }))
  } else if (input.audience === NotificationAudience.ADMIN) {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: users } = await query.graph({
      entity: "user",
      fields: ["id"],
    })

    rows = users.map((user) => ({
      ...base,
      recipient_id: (user as { id: string }).id,
      seller_id: null,
    }))
  } else if (input.audience === NotificationAudience.VENDOR) {
    if (!input.seller_id) {
      return
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: members } = await query.graph({
      entity: "seller_member",
      fields: ["member_id", "member.is_active"],
      filters: { seller_id: input.seller_id },
    })

    rows = members
      .filter(
        (member) =>
          (member as { member?: { is_active?: boolean } | null }).member
            ?.is_active !== false
      )
      .map((member) => ({
        ...base,
        recipient_id: (member as { member_id: string }).member_id,
        seller_id: input.seller_id!,
      }))
  } else {
    if (!input.customer_id) {
      return
    }

    rows = [
      {
        ...base,
        recipient_id: input.customer_id,
        seller_id: null,
      },
    ]
  }

  if (!rows.length) {
    return
  }

  const service = container.resolve<NotificationFeedModuleService>(
    MercurModules.NOTIFICATION_FEED
  )

  await service.createNotificationFeeds(rows)
}
