import {
  BellAlert,
  BellAlertDone,
  InformationCircleSolid,
} from "@medusajs/icons"
import { clx, Drawer, Heading, IconButton, Text } from "@medusajs/ui"
import { QueryKey, useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { useDate } from "../../../hooks/use-date"
import { InfiniteList } from "../infinite-list"

export type NotificationFeedItem = {
  id: string
  title: string
  body: string | null
  link: string | null
  read_at: string | Date | null
  created_at: string | Date
}

export type NotificationFeedListResult = {
  notifications: NotificationFeedItem[]
  count: number
  offset: number
  limit: number
  unread_count: number
}

export type NotificationFeedListParams = {
  offset: number
  limit: number
}

type NotificationsBellProps = {
  /** Badge query key — owned by the panel hook so it can invalidate on mutations. */
  unreadQueryKey: QueryKey
  /** Paginated list query key — must differ from the badge key. */
  listQueryKey: QueryKey
  queryFn: (params: NotificationFeedListParams) => Promise<NotificationFeedListResult>
  onMarkRead: (notification: NotificationFeedItem) => void | Promise<unknown>
  onMarkAllRead: () => void | Promise<unknown>
  /** Badge poll interval; set to 0 to disable polling. */
  refetchInterval?: number
}

const BADGE_POLL_INTERVAL = 60_000

/**
 * Topbar notification bell shared by the admin and vendor panels: unread
 * badge (polled), drawer list with infinite scrolling, per-item and
 * mark-all-read actions. Read state is server-side — opening the drawer does
 * not silently mark everything read.
 */
export const NotificationsBell = ({
  unreadQueryKey,
  listQueryKey,
  queryFn,
  onMarkRead,
  onMarkAllRead,
  refetchInterval = BADGE_POLL_INTERVAL,
}: NotificationsBellProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const { data: badgeData } = useQuery({
    queryKey: unreadQueryKey,
    queryFn: () => queryFn({ limit: 1, offset: 0 }),
    refetchInterval,
    refetchOnWindowFocus: true,
  })

  const unreadCount = badgeData?.unread_count ?? 0

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  const handleItemClick = async (notification: NotificationFeedItem) => {
    if (!notification.read_at) {
      await onMarkRead(notification)
    }
    setOpen(false)
    if (notification.link) {
      navigate(notification.link)
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await onMarkAllRead()
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <IconButton
          variant="transparent"
          size="small"
          className="relative text-ui-fg-muted hover:text-ui-fg-subtle"
          data-testid="notifications-bell-trigger"
          aria-label={t("notifications.title")}
        >
          {unreadCount > 0 ? <BellAlertDone /> : <BellAlert />}
          {unreadCount > 0 && (
            <span
              className="bg-ui-bg-interactive absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none text-ui-bg-base"
              data-testid="notifications-bell-badge"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </IconButton>
      </Drawer.Trigger>
      <Drawer.Content data-testid="notifications-drawer">
        <Drawer.Header>
          <Drawer.Title asChild>
            <Heading>{t("notifications.title")}</Heading>
          </Drawer.Title>
          <Drawer.Description className="sr-only">
            {t("notifications.description")}
          </Drawer.Description>
          {unreadCount > 0 && (
            <IconButton
              variant="transparent"
              size="small"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              data-testid="notifications-mark-all-read"
            >
              {t("notifications.markAllRead")}
            </IconButton>
          )}
        </Drawer.Header>
        <Drawer.Body className="overflow-y-auto px-0">
          <InfiniteList<
            NotificationFeedListResult,
            NotificationFeedItem,
            NotificationFeedListParams
          >
            responseKey="notifications"
            queryKey={listQueryKey}
            queryFn={queryFn}
            queryOptions={{ enabled: open }}
            renderEmpty={() => <NotificationsEmptyState />}
            renderItem={(notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onClick={() => handleItemClick(notification)}
              />
            )}
          />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}

const NotificationRow = ({
  notification,
  onClick,
}: {
  notification: NotificationFeedItem
  onClick: () => void
}) => {
  const { getRelativeDate } = useDate()
  const unread = !notification.read_at

  return (
    <button
      type="button"
      className="relative flex w-full items-start justify-center gap-3 border-b p-6 text-start hover:bg-ui-bg-subtle/50"
      onClick={onClick}
      data-testid="notification-row"
      data-read={notification.read_at ? "true" : "false"}
    >
      <div className="text-ui-fg-muted flex size-5 items-center justify-center">
        <InformationCircleSolid />
      </div>
      <div className="flex w-full flex-col gap-y-1">
        <div className="flex items-center justify-between gap-3">
          <Text
            size="small"
            leading="compact"
            weight="plus"
            className={clx({ "text-ui-fg-base": unread })}
            data-testid="notification-title"
          >
            {notification.title}
          </Text>
          <div className="flex items-center justify-center gap-2">
            <Text
              as="span"
              className={clx("text-ui-fg-subtle", {
                "text-ui-fg-base": unread,
              })}
              size="small"
              leading="compact"
            >
              {getRelativeDate(notification.created_at)}
            </Text>
            {unread && (
              <div
                className="bg-ui-bg-interactive h-2 w-2 rounded-full"
                // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
                role="status"
                data-testid="notification-unread-dot"
              />
            )}
          </div>
        </div>
        {!!notification.body && (
          <Text className="text-ui-fg-subtle whitespace-pre-line" size="small">
            {notification.body}
          </Text>
        )}
      </div>
    </button>
  )
}

const NotificationsEmptyState = () => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <BellAlertDone />
      <Text size="small" leading="compact" weight="plus" className="mt-3">
        {t("notifications.emptyTitle")}
      </Text>
      <Text
        size="small"
        className="text-ui-fg-muted mt-1 max-w-[294px] text-center"
      >
        {t("notifications.emptyDescription")}
      </Text>
    </div>
  )
}
