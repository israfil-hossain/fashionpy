import { validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"
import { notificationFeedQueryConfig } from "./query-config"
import { VendorGetNotificationFeedParams } from "./validators"

export const vendorNotificationFeedMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/notifications",
    middlewares: [
      requirePermission("notifications", "view"),
      validateAndTransformQuery(
        VendorGetNotificationFeedParams,
        notificationFeedQueryConfig.list
      ),
    ],
  },
  {
    // Marking a notification read is personal read state, not a config edit.
    method: ["POST"],
    matcher: "/vendor/notifications/read-all",
    middlewares: [requirePermission("notifications", "view")],
  },
  {
    method: ["POST"],
    matcher: "/vendor/notifications/:id/read",
    middlewares: [requirePermission("notifications", "view")],
  },
  {
    method: ["GET"],
    matcher: "/vendor/products/import-template",
    middlewares: [],
  },
]
