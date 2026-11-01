"use client"

import { Button } from "@/components/atoms"
import {
  markAllNotificationsRead,
  markNotificationRead,
  StoreNotification,
} from "@/lib/data/notifications"
import { formatDistanceToNow } from "date-fns"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

type NotificationsListProps = {
  notifications: StoreNotification[]
}

export const NotificationsList = ({ notifications }: NotificationsListProps) => {
  const router = useRouter()
  const params = useParams()
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [markingAll, setMarkingAll] = useState(false)

  const isRead = (notification: StoreNotification) =>
    Boolean(notification.read_at) || readIds.has(notification.id)

  const unreadCount = notifications.filter((n) => !isRead(n)).length

  const handleItemClick = async (notification: StoreNotification) => {
    if (!isRead(notification)) {
      setReadIds((prev) => new Set(prev).add(notification.id))
      await markNotificationRead(notification.id).catch(() => {})
      router.refresh()
    }
    if (notification.link) {
      const locale = (params?.locale as string) || "en"
      router.push(`/${locale}${notification.link}`)
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      setReadIds(new Set(notifications.map((n) => n.id)))
      router.refresh()
    } finally {
      setMarkingAll(false)
    }
  }

  if (!notifications.length) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center"
        data-testid="notifications-empty"
      >
        <h2 className="heading-md text-primary uppercase">No notifications</h2>
        <p className="text-secondary mt-2 max-w-md text-sm">
          You don&apos;t have any notifications at the moment, but once you do
          they will live here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4" data-testid="notifications-list">
      <div className="flex items-center justify-between">
        <p className="text-secondary text-sm" data-testid="notifications-count">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
            : `${notifications.length} notification${notifications.length === 1 ? "" : "s"}`}
        </p>
        {unreadCount > 0 && (
          <Button
            variant="tonal"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            data-testid="notifications-mark-all"
          >
            Mark all as read
          </Button>
        )}
      </div>

      <ul className="flex flex-col rounded-lg border">
        {notifications.map((notification) => {
          const read = isRead(notification)

          return (
            <li key={notification.id} className="border-b last:border-b-0">
              <button
                type="button"
                className="flex w-full items-start gap-3 px-4 py-4 text-start transition-colors hover:bg-gray-50"
                onClick={() => handleItemClick(notification)}
                data-testid="notification-item"
                data-read={read ? "true" : "false"}
              >
                {!read && (
                  <span
                    className="bg-blue-600 mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    aria-label="Unread"
                  />
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold">
                      {notification.title}
                    </span>
                    <span className="text-secondary shrink-0 text-xs">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </span>
                  {notification.body && (
                    <span className="text-secondary text-sm">
                      {notification.body}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
