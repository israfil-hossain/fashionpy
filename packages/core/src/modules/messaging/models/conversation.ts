import { model } from "@medusajs/framework/utils"

/**
 * Three conversation types share one table:
 * - marketplace:         buyer ↔ seller (product/order chat)
 * - support_customer:    buyer ↔ admin shared support inbox
 * - support_vendor:      seller ↔ admin shared support inbox
 *
 * `thread_key` is the uniqueness anchor (one thread per pair/type) because
 * buyer_id/seller_id are nullable per type — a plain (buyer, seller) unique
 * index cannot express "one support thread per buyer".
 */
export const Conversation = model
  .define("conversation", {
    id: model.id({ prefix: "conv" }).primaryKey(),
    type: model
      .enum(["marketplace", "support_customer", "support_vendor"])
      .default("marketplace"),
    thread_key: model.text(),
    buyer_id: model.text().nullable(),
    seller_id: model.text().nullable(),
    last_message_preview: model.text().nullable(),
    last_message_sender_type: model
      .enum(["customer", "seller", "admin"])
      .nullable(),
    last_message_at: model.dateTime().nullable(),
    unread_count_customer: model.number().default(0),
    unread_count_seller: model.number().default(0),
    unread_count_admin: model.number().default(0),
    messages: model.hasMany(() => Message, { mappedBy: "conversation" }),
  })
  .indexes([
    {
      on: ["thread_key"],
      unique: true,
    },
    {
      on: ["type", "last_message_at", "id"],
    },
    {
      on: ["seller_id", "last_message_at", "id"],
    },
    {
      on: ["buyer_id", "last_message_at", "id"],
    },
  ])

import { Message } from "./message"
