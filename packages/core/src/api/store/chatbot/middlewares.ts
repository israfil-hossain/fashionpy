import {
  authenticate,
  validateAndTransformBody,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import {
  StoreChatbotVoice,
  StoreCreateChatbotConversation,
  StoreSendChatbotMessage,
} from "./validators"

// Strict gate (SPEC-011): the assistant is for logged-in customers only —
// every conversation, message and voice route requires a customer session.
export const storeChatbotMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/chatbot/conversations",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(StoreCreateChatbotConversation),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/chatbot/conversations",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/chatbot/conversations/:id",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/chatbot/conversations/:id/messages",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(StoreSendChatbotMessage),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/chatbot/conversations/:id/voice",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(StoreChatbotVoice),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/chatbot/conversations/:id/shipments",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
    ],
  },
]
