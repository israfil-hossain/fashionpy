import {
  validateAndTransformQuery,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"

import * as QueryConfig from "./query-config"
import { StoreGetHeroBannersParams } from "./validators"

function applyHeroBannerVisibilityFilters(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const now = new Date()

  req.filterableFields.is_active ??= true

  req.filterableFields.$and ??= []
    ; (req.filterableFields.$and as any[]).push(
      { $or: [{ starts_at: null }, { starts_at: { $lte: now } }] },
      { $or: [{ ends_at: null }, { ends_at: { $gte: now } }] }
    )

  next()
}

export const storeHeroBannersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/hero-banners",
    middlewares: [
      validateAndTransformQuery(
        StoreGetHeroBannersParams,
        QueryConfig.listHeroBannerQueryConfig
      ),
      applyHeroBannerVisibilityFilters,
    ],
  },
]
