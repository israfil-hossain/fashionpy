import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import type { NotificationFeedListResponse } from "@mercurjs/types"
import type NotificationFeedModuleService from "../../modules/notification/service"

type NotificationScope = {
  recipient_type: "admin" | "vendor" | "customer"
  recipient_id: string
  seller_id?: string
}

type ListParams = {
  limit?: number
  offset?: number
  order?: string
  unread?: boolean
  event?: string
}

const resolveService = (
  req: AuthenticatedMedusaRequest
): NotificationFeedModuleService =>
  req.scope.resolve<NotificationFeedModuleService>(
    MercurModules.NOTIFICATION_FEED
  )

const buildFilters = (scope: NotificationScope, unread?: boolean) => ({
  recipient_type: scope.recipient_type,
  recipient_id: scope.recipient_id,
  ...(scope.seller_id ? { seller_id: scope.seller_id } : {}),
  ...(unread ? { read_at: null } : {}),
})

export const listNotificationFeed = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<NotificationFeedListResponse>,
  scope: NotificationScope
) => {
  const service = resolveService(req)
  const {
    limit = 50,
    offset = 0,
    order,
    unread,
    event,
  } = req.validatedQuery as ListParams

  const filters = {
    ...buildFilters(scope, unread),
    ...(event ? { event } : {}),
  }
  const [notifications, count] = await service.listAndCountNotificationFeeds(
    filters,
    {
      take: limit,
      skip: offset,
      order: { created_at: order?.startsWith("asc") ? "ASC" : "DESC" },
    }
  )

  const [, unreadCount] = await service.listAndCountNotificationFeeds(
    { ...buildFilters(scope), read_at: null },
    { take: 1 }
  )

  res.json({
    notifications,
    count,
    offset,
    limit,
    unread_count: unreadCount,
  })
}

export const markNotificationRead = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ notification: unknown }>,
  scope: NotificationScope
) => {
  const service = resolveService(req)

  const [notification] = await service.listNotificationFeeds({
    id: req.params.id,
    ...buildFilters(scope),
  })

  if (!notification) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Notification ${req.params.id} was not found`
    )
  }

  if (!notification.read_at) {
    await service.updateNotificationFeeds({
      id: notification.id,
      read_at: new Date(),
    })
  }

  res.json({ notification: { ...notification, read_at: notification.read_at ?? new Date() } })
}

export const markAllNotificationsRead = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ count: number }>,
  scope: NotificationScope
) => {
  const service = resolveService(req)
  const now = new Date()

  let updated = 0
  for (;;) {
    const unread = await service.listNotificationFeeds({
      ...buildFilters(scope),
      read_at: null,
    }, { take: 500 })

    if (!unread.length) {
      break
    }

    await service.updateNotificationFeeds(
      unread.map((notification) => ({
        id: notification.id,
        read_at: now,
      }))
    )
    updated += unread.length

    if (unread.length < 500) {
      break
    }
  }

  res.json({ count: updated })
}
