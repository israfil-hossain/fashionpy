import { validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"

import { notificationFeedQueryConfig } from "./query-config"
import { AdminGetNotificationFeedParams } from "./validators"

export const adminNotificationFeedMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/notifications",
    middlewares: [
      validateAndTransformQuery(
        AdminGetNotificationFeedParams,
        notificationFeedQueryConfig.list
      ),
    ],
  },
]
