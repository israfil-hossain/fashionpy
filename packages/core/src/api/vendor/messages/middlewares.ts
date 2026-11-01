import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import { requirePermission } from "../../utils"
import {
  VendorCreateSupport,
  VendorGetMessages,
  VendorListConversations,
  VendorMarkRead,
  VendorSendReply,
} from "./validators"
import { vendorMessagingQueryConfig } from "./query-config"

export const vendorMessagingMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/messages",
    middlewares: [
      requirePermission("messages", "view"),
      validateAndTransformQuery(
        VendorListConversations,
        vendorMessagingQueryConfig.listConversations
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/messages",
    middlewares: [
      requirePermission("messages", "edit"),
      validateAndTransformBody(VendorCreateSupport),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/messages/:id",
    middlewares: [
      requirePermission("messages", "view"),
      validateAndTransformQuery(
        VendorGetMessages,
        vendorMessagingQueryConfig.listMessages
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/messages/:id",
    middlewares: [
      requirePermission("messages", "edit"),
      validateAndTransformBody(VendorSendReply),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/messages/:id/read",
    middlewares: [
      requirePermission("messages", "edit"),
      validateAndTransformBody(VendorMarkRead),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/messages/unread",
    middlewares: [requirePermission("messages", "view")],
  },
  {
    method: ["POST"],
    matcher: "/vendor/messages/sse-token",
    middlewares: [requirePermission("messages", "view")],
  },
  {
    method: ["GET"],
    matcher: "/vendor/messages/events",
    // One-time query-token auth — see events/route.ts (AUTHENTICATE=false).
    middlewares: [],
  },
]
