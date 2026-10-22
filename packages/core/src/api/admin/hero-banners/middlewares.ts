import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { requirePermission } from "../../utils"
import { adminHeroBannerQueryConfig } from "./query-config"
import {
  AdminCreateHeroBanner,
  AdminGetHeroBannerParams,
  AdminGetHeroBannersParams,
  AdminUpdateHeroBanner,
} from "./validators"

export const adminHeroBannersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/hero-banners",
    middlewares: [
      requirePermission("store", "view"),
      validateAndTransformQuery(
        AdminGetHeroBannersParams,
        adminHeroBannerQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/hero-banners",
    middlewares: [
      requirePermission("store", "edit"),
      validateAndTransformBody(AdminCreateHeroBanner),
      validateAndTransformQuery(
        AdminGetHeroBannerParams,
        adminHeroBannerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/hero-banners/:id",
    middlewares: [
      requirePermission("store", "view"),
      validateAndTransformQuery(
        AdminGetHeroBannerParams,
        adminHeroBannerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/hero-banners/:id",
    middlewares: [
      requirePermission("store", "edit"),
      validateAndTransformBody(AdminUpdateHeroBanner),
      validateAndTransformQuery(
        AdminGetHeroBannerParams,
        adminHeroBannerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/hero-banners/:id",
    middlewares: [requirePermission("store", "manage")],
  },
]
