import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import { requirePermission } from "../../utils"
import { adminChatbotConversationQueryConfig } from "./query-config"
import {
  AdminChatbotFollowup,
  AdminGetChatbotConversationParams,
  AdminGetChatbotConversationsParams,
  AdminSendChatbotMessage,
  AdminTestChatbot,
  AdminUpdateChatbotSettings,
} from "./validators"

export const adminChatbotMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/chatbot/settings",
    middlewares: [requirePermission("chatbot", "view")],
  },
  {
    method: ["PUT"],
    matcher: "/admin/chatbot/settings",
    middlewares: [
      requirePermission("chatbot", "edit"),
      validateAndTransformBody(AdminUpdateChatbotSettings),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/chatbot/test",
    middlewares: [
      requirePermission("chatbot", "edit"),
      validateAndTransformBody(AdminTestChatbot),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/chatbot/conversations",
    middlewares: [
      requirePermission("chatbot", "view"),
      validateAndTransformQuery(
        AdminGetChatbotConversationsParams,
        adminChatbotConversationQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/chatbot/conversations/:id",
    middlewares: [
      requirePermission("chatbot", "view"),
      validateAndTransformQuery(
        AdminGetChatbotConversationParams,
        adminChatbotConversationQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/chatbot/conversations/:id/messages",
    middlewares: [
      requirePermission("chatbot", "edit"),
      validateAndTransformBody(AdminSendChatbotMessage),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/chatbot/conversations/:id/followup",
    middlewares: [
      requirePermission("chatbot", "edit"),
      validateAndTransformBody(AdminChatbotFollowup),
    ],
  },
]
