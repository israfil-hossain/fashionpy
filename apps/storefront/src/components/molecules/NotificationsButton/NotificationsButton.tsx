"use client"

import { Badge } from "@/components/atoms"
import { BellIcon } from "@/icons"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { getUnreadNotificationCount } from "@/lib/data/notifications"
import { useEffect, useState } from "react"

const UNREAD_POLL_INTERVAL = 60_000

export const NotificationsButton = ({ iconColor }: { iconColor?: string }) => {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      const count = await getUnreadNotificationCount()
      if (!cancelled) {
        setUnreadCount(count)
      }
    }

    refresh()
    const interval = setInterval(refresh, UNREAD_POLL_INTERVAL)
    const onFocus = () => refresh()

    window.addEventListener("visibilitychange", onFocus)

    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener("visibilitychange", onFocus)
    }
  }, [])

  return (
    <LocalizedClientLink
      href="/user/notifications"
      className="relative"
      aria-label="Notifications"
      data-testid="header-notifications"
    >
      <BellIcon size={20} color={iconColor} />
      {unreadCount > 0 && (
        <Badge className="absolute -top-2 -right-2 min-w-4 h-4 p-0 flex items-center justify-center text-[10px] leading-none">
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </LocalizedClientLink>
  )
}
