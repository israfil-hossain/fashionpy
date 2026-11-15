import { validateAndTransformQuery } from "@medusajs/framework"
import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import * as QueryConfig from "./query-config"
import { StoreGetPromotionsParams } from "./validators"

/**
 * Home-page visibility for public promotions:
 * - `status = active` (drops draft / inactive)
 * - not automatic (automatic promos have no code to copy)
 * - platform-owned only (any promotion linked to a seller is excluded)
 *
 * Campaign date windows need nested `campaign` fields, so they are applied in
 * the route handler after the query.
 */
async function applyPromotionVisibilityFilters(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  req.filterableFields.status ??= "active"
  req.filterableFields.is_automatic ??= false

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: links } = await query.graph({
    entity: "promotion_seller",
    fields: ["promotion_id"],
  })

  const sellerOwnedIds = (links as Array<{ promotion_id: string }>).map(
    (l) => l.promotion_id
  )

  if (sellerOwnedIds.length) {
    req.filterableFields.id = { $nin: sellerOwnedIds }
  }

  next()
}

export const storePromotionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/promotions",
    middlewares: [
      validateAndTransformQuery(
        StoreGetPromotionsParams,
        QueryConfig.storePromotionQueryConfig.list
      ),
      applyPromotionVisibilityFilters,
    ],
  },
]
