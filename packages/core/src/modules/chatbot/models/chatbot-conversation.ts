import { model } from "@medusajs/framework/utils"

import { ChatbotMessage } from "./chatbot-message"

export const ChatbotConversation = model
  .define("chatbot_conversation", {
    id: model.id({ prefix: "bconv" }).primaryKey(),
    customer_id: model.text().nullable(),
    guest_token: model.text().nullable(),
    status: model.enum(["open", "closed"]).default("open"),
    locale: model.enum(["en", "bn"]).default("en"),
    checkout_state: model.json().nullable(),
    last_message_preview: model.text().nullable(),
    last_message_at: model.dateTime().nullable(),
    messages: model.hasMany(() => ChatbotMessage, {
      mappedBy: "conversation",
    }),
  })
  .indexes([
    { on: ["customer_id", "status", "last_message_at"] },
    { on: ["guest_token"] },
    { on: ["status", "last_message_at"] },
  ])
