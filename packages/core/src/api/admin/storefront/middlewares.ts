import { MiddlewareRoute } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"

export const adminStorefrontMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/storefront/revalidate",
    middlewares: [requirePermission("store", "edit")],
  },
]
