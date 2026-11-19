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

// Guests may open a conversation (search-only); checkout tools still require
// a logged-in customer checked inside the agent.
export const storeChatbotMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/chatbot/conversations",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
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
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/chatbot/conversations/:id/messages",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
      validateAndTransformBody(StoreSendChatbotMessage),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/chatbot/conversations/:id/voice",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
      validateAndTransformBody(StoreChatbotVoice),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/chatbot/conversations/:id/shipments",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
    ],
  },
]
