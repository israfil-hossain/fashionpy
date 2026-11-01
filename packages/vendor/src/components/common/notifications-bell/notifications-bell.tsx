import { NotificationsBell } from "@mercurjs/dashboard-shared"

import {
  notificationsQueryKeys,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "../../../hooks/api/notifications"
import { sdk } from "../../../lib/client"

/**
 * Vendor wiring for the shared topbar bell: badge + list share one fetcher,
 * mutations invalidate the whole notification key family.
 */
export const VendorNotificationsBell = () => {
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  return (
    <NotificationsBell
      unreadQueryKey={[...notificationsQueryKeys.all, "badge"]}
      listQueryKey={notificationsQueryKeys.list({ scope: "drawer" })}
      queryFn={(params) => sdk.vendor.notifications.query({ ...params })}
      onMarkRead={(notification) => markRead.mutateAsync(notification.id)}
      onMarkAllRead={() => markAllRead.mutateAsync()}
    />
  )
}
