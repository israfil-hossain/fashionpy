import { MiddlewareRoute } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"

export const vendorAnalyticsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/analytics",
    middlewares: [requirePermission("orders", "view")],
  },
]
