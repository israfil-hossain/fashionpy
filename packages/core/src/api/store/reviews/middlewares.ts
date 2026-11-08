import {
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { MiddlewareRoute } from "@medusajs/medusa"

import customerReview from "../../../links/customer-review"
import productReview from "../../../links/product-review"
import sellerReview from "../../../links/seller-review"
import { storeReviewQueryConfig } from "./query-config"
import {
  StoreCreateReview,
  StoreGetReviewsParams,
  StoreUpdateReview,
} from "./validators"

/**
 * GET /store/reviews:
 * - With `product_id` / `seller_id`: public listing of published reviews for
 *   that reference (PDP reviews, shop reviews). No customer session needed.
 * - Without: personal "my reviews" list, scoped to the signed-in customer.
 */
const applyStoreReviewFilters = (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const filters = req.filterableFields as Record<string, unknown>
  const isPublicListing = Boolean(filters.product_id || filters.seller_id)

  if (isPublicListing) {
    // Public PDP/shop listing never exposes pending or rejected reviews,
    // even if the client asks for another status.
    filters.status = "published"
    return next()
  }

  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    return next(
      new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Authentication required to list your reviews"
      )
    )
  }

  filters.customer_id = customerId
  return next()
}

export const storeReviewsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/reviews",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.list
      ),
      // Must run BEFORE maybeApplyLinkFilter — link filters delete
      // product_id/seller_id/customer_id and rewrite them to an `id` list.
      applyStoreReviewFilters,
      maybeApplyLinkFilter({
        entryPoint: productReview.entryPoint,
        resourceId: "review_id",
        filterableField: "product_id",
      }),
      maybeApplyLinkFilter({
        entryPoint: sellerReview.entryPoint,
        resourceId: "review_id",
        filterableField: "seller_id",
      }),
      maybeApplyLinkFilter({
        entryPoint: customerReview.entryPoint,
        resourceId: "review_id",
        filterableField: "customer_id",
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/reviews",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.retrieve
      ),
      validateAndTransformBody(StoreCreateReview),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/reviews/:id",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/store/reviews/:id",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["POST"],
    matcher: "/store/reviews/:id",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.retrieve
      ),
      validateAndTransformBody(StoreUpdateReview),
    ],
  },
]
