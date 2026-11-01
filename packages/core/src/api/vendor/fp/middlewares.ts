import { MiddlewareRoute } from "@medusajs/framework/http"

import { requirePermission } from "../../utils"

// The FashionPy promo suite (bundles, loyalty, reward rules, funding) lives in
// the promotions domain.
export const vendorFpMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/fp/analytics",
    middlewares: [requirePermission("promotions", "view")],
  },
  {
    method: ["GET"],
    matcher: "/vendor/fp/bundles",
    middlewares: [requirePermission("promotions", "view")],
  },
  {
    method: ["POST"],
    matcher: "/vendor/fp/bundles",
    middlewares: [requirePermission("promotions", "edit")],
  },
  {
    method: ["GET"],
    matcher: "/vendor/fp/bundles/:id",
    middlewares: [requirePermission("promotions", "view")],
  },
  {
    method: ["PATCH"],
    matcher: "/vendor/fp/bundles/:id",
    middlewares: [requirePermission("promotions", "edit")],
  },
  {
    method: ["GET"],
    matcher: "/vendor/fp/promotions",
    middlewares: [requirePermission("promotions", "view")],
  },
  {
    method: ["GET"],
    matcher: "/vendor/fp/funding-summary",
    middlewares: [requirePermission("promotions", "view")],
  },
]
