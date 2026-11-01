import { authenticate } from "@medusajs/medusa"
import { validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"

import { notificationFeedQueryConfig } from "./query-config"
import { StoreGetNotificationFeedParams } from "./validators"

export const storeNotificationFeedMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/notifications",
    middlewares: [
      authenticate("customer", ["bearer", "session"]),
      validateAndTransformQuery(
        StoreGetNotificationFeedParams,
        notificationFeedQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/notifications/read-all",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
  {
    method: ["POST"],
    matcher: "/store/notifications/:id/read",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
]
