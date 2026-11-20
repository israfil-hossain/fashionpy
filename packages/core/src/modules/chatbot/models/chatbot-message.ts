import { model } from "@medusajs/framework/utils"

import { ChatbotConversation } from "./chatbot-conversation"

export const ChatbotMessage = model
  .define("chatbot_message", {
    id: model.id({ prefix: "bmsg" }).primaryKey(),
    conversation: model.belongsTo(() => ChatbotConversation, {
      mappedBy: "messages",
    }),
    role: model.enum(["user", "assistant", "tool"]),
    content: model.text(),
    cards: model.json().nullable(),
    tool_name: model.text().nullable(),
    locale: model.enum(["en", "bn"]).nullable(),
    /** "ai" (default/legacy, null reads as ai) or "admin" follow-up. */
    sender: model.text().nullable(),
  })
  .indexes([
    { on: ["conversation_id", "created_at", "id"] },
    { on: ["created_at"] },
  ])
