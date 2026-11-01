import { PaginatedResponse } from "@medusajs/types"

export type NotificationRecipientType = "admin" | "vendor" | "customer"

export interface NotificationFeedDTO {
  id: string
  recipient_type: NotificationRecipientType
  recipient_id: string
  seller_id: string | null
  event: string
  title: string
  body: string | null
  link: string | null
  resource_type: string | null
  resource_id: string | null
  data: Record<string, unknown> | null
  read_at: Date | string | null
  created_at: Date | string
  updated_at: Date | string
}

export interface NotificationFeedListResponse
  extends PaginatedResponse<{ notifications: NotificationFeedDTO[] }> {
  unread_count: number
}

export interface NotificationFeedUnreadResponse {
  unread_count: number
}
