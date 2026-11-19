import { validateAndTransformBody } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import { requirePermission } from "../../utils"
import { AdminTestChatbot, AdminUpdateChatbotSettings } from "./validators"

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
]
