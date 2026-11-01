import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import { requirePermission } from "../../utils"
import {
  AdminBlockCustomer,
  AdminGetMessages,
  AdminMarkRead,
  AdminSearchConversations,
  AdminSendMessage,
} from "./validators"
import {
  AdminCreateFilter,
  AdminUpdateFilter,
  AdminListFilters,
  AdminListBlocked,
} from "./filters/validators"
import { adminMessagingQueryConfig } from "./query-config"

export const adminMessagingMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/messages",
    middlewares: [
      requirePermission("messages", "view"),
      validateAndTransformQuery(
        AdminSearchConversations,
        adminMessagingQueryConfig.listConversations
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/messages/unread",
    middlewares: [requirePermission("messages", "view")],
  },
  {
    method: ["POST"],
    matcher: "/admin/messages/sse-token",
    middlewares: [requirePermission("messages", "view")],
  },
  {
    method: ["GET"],
    matcher: "/admin/messages/events",
    // One-time query-token auth — see events/route.ts (AUTHENTICATE=false).
    middlewares: [],
  },
  {
    method: ["GET"],
    matcher: "/admin/messages/filters",
    middlewares: [
      requirePermission("messages", "view"),
      validateAndTransformQuery(AdminListFilters, { defaults: ["*"], isList: true }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/messages/filters",
    middlewares: [
      requirePermission("messages", "edit"),
      validateAndTransformBody(AdminCreateFilter),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/messages/filters/:id",
    middlewares: [
      requirePermission("messages", "edit"),
      validateAndTransformBody(AdminUpdateFilter),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/messages/filters/:id",
    middlewares: [requirePermission("messages", "manage")],
  },
  {
    method: ["GET"],
    matcher: "/admin/messages/blocked",
    middlewares: [
      requirePermission("messages", "view"),
      validateAndTransformQuery(AdminListBlocked, { defaults: ["*"], isList: true }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/messages/chat-blocks",
    middlewares: [
      requirePermission("messages", "edit"),
      validateAndTransformBody(AdminBlockCustomer),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/messages/chat-blocks/:customer_id",
    middlewares: [requirePermission("messages", "view")],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/messages/chat-blocks/:customer_id",
    middlewares: [requirePermission("messages", "manage")],
  },
  {
    method: ["GET"],
    matcher: "/admin/messages/:id",
    middlewares: [
      requirePermission("messages", "view"),
      validateAndTransformQuery(
        AdminGetMessages,
        adminMessagingQueryConfig.listMessages
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/messages/:id",
    middlewares: [
      requirePermission("messages", "edit"),
      validateAndTransformBody(AdminSendMessage),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/messages/:id/read",
    middlewares: [
      requirePermission("messages", "edit"),
      validateAndTransformBody(AdminMarkRead),
    ],
  },
]
