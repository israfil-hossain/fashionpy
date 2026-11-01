'use server'

import { sdk } from '@/lib/client'
import { getAuthHeaders } from './cookies'

export type StoreNotification = {
  id: string
  event: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

export type StoreNotificationListResult = {
  notifications: StoreNotification[]
  count: number
  offset: number
  limit: number
  unread_count: number
}

/**
 * The storefront sdk is intentionally untyped (`Routes = Record<string,
 * unknown>`), and indexed chains off it don't typecheck. Cast once to a
 * narrow facade for the notification endpoints instead of per call site.
 */
type NotificationRoutes = {
  query: (input: Record<string, unknown>) => Promise<StoreNotificationListResult>
  $id: {
    read: {
      mutate: (input: Record<string, unknown>) => Promise<unknown>
    }
  }
  readAll: {
    mutate: (input?: Record<string, unknown>) => Promise<{ count?: number }>
  }
}

const notificationRoutes = sdk.store as unknown as {
  notifications: NotificationRoutes
}

export const listNotifications = async (
  params: { offset?: number; limit?: number } = {}
): Promise<StoreNotificationListResult> => {
  const headers = {
    ...(await getAuthHeaders()),
    'Content-Type': 'application/json',
  }

  return await notificationRoutes.notifications.query({
    offset: params.offset,
    limit: params.limit,
    fetchOptions: { headers, cache: 'no-cache' },
  })
}

export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const result = await listNotifications({ limit: 1, offset: 0 })
    return result.unread_count ?? 0
  } catch {
    return 0
  }
}

export const markNotificationRead = async (id: string): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
    'Content-Type': 'application/json',
  }

  await notificationRoutes.notifications.$id.read.mutate({
    $id: id,
    fetchOptions: { headers },
  })
}

export const markAllNotificationsRead = async (): Promise<number> => {
  const headers = {
    ...(await getAuthHeaders()),
    'Content-Type': 'application/json',
  }

  const result = await notificationRoutes.notifications.readAll.mutate({
    fetchOptions: { headers },
  })

  return result?.count ?? 0
}
