import { model } from "@medusajs/framework/utils"

export const NotificationAudience = {
  ADMIN: "admin",
  VENDOR: "vendor",
  CUSTOMER: "customer",
} as const

export type NotificationAudience =
  (typeof NotificationAudience)[keyof typeof NotificationAudience]

const NotificationFeed = model
  .define("NotificationFeed", {
    id: model.id({ prefix: "ntf" }).primaryKey(),
    recipient_type: model.enum(["admin", "vendor", "customer"]),
    recipient_id: model.text(),
    seller_id: model.text().nullable(),
    event: model.text(),
    title: model.text(),
    body: model.text().nullable(),
    link: model.text().nullable(),
    resource_type: model.text().nullable(),
    resource_id: model.text().nullable(),
    data: model.json().nullable(),
    read_at: model.dateTime().nullable(),
  })
  .indexes([
    {
      name: "IDX_notification_feed_recipient",
      on: ["recipient_id", "created_at"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_notification_feed_seller",
      on: ["seller_id", "recipient_id", "created_at"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_notification_feed_unread",
      on: ["recipient_id"],
      unique: false,
      where: "read_at IS NULL AND deleted_at IS NULL",
    },
  ])

export default NotificationFeed
