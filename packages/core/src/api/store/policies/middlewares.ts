import { validateAndTransformQuery } from "@medusajs/framework"
import {
  clearFiltersByKey,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"

import * as QueryConfig from "./query-config"
import {
  StoreGetPolicyPageParams,
  StoreGetPolicyPagesParams,
} from "./validators"

/**
 * Store visibility: published only, inside the publish/unpublish window,
 * and matching the requesting country (empty/null country_codes = all).
 */
function applyPolicyPageVisibilityFilters(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const now = new Date()
  const countryCode =
    typeof req.filterableFields.country_code === "string"
      ? req.filterableFields.country_code.toLowerCase()
      : undefined

  req.filterableFields.status ??= "published"

  req.filterableFields.$and ??= []
  const and = req.filterableFields.$and as unknown[]
  and.push(
    { $or: [{ published_at: null }, { published_at: { $lte: now } }] },
    { $or: [{ unpublished_at: null }, { unpublished_at: { $gt: now } }] }
  )

  if (countryCode) {
    and.push({
      $or: [
        { country_codes: null },
        { country_codes: { $eq: [] } },
        { country_codes: { $contains: [countryCode] } },
      ],
    })
  }

  delete req.filterableFields.country_code

  next()
}

export const storePoliciesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/policies",
    middlewares: [
      validateAndTransformQuery(
        StoreGetPolicyPagesParams,
        QueryConfig.storePolicyPageQueryConfig.list
      ),
      applyPolicyPageVisibilityFilters,
      clearFiltersByKey(["country_code"]),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/policies/:slug",
    middlewares: [
      validateAndTransformQuery(
        StoreGetPolicyPageParams,
        QueryConfig.storePolicyPageQueryConfig.retrieve
      ),
      applyPolicyPageVisibilityFilters,
      clearFiltersByKey(["country_code"]),
    ],
  },
]
