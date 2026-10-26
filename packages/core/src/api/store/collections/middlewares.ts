import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { StoreGetCollectionsParams } from "@medusajs/medusa/api/store/collections/validators"
import { ORIGINAL_MIDDLEWARES } from "../../../utils/disable-medusa-middlewares"
import { storeCollectionQueryConfig } from "./query-config"

const capturedBase = (ORIGINAL_MIDDLEWARES[
  "dist/api/store/collections/middlewares.js"
] ?? []) as MiddlewareRoute[]

// Only the list matcher is overridden; `/store/collections/:id` keeps Medusa's
// original middleware and query config.
const baseRetained = capturedBase.filter(
  (route) => String(route.matcher) !== "/store/collections"
)

export const storeCollectionsMiddlewares: MiddlewareRoute[] = [
  ...baseRetained,
  {
    method: ["GET"],
    matcher: "/store/collections",
    middlewares: [
      validateAndTransformQuery(
        StoreGetCollectionsParams,
        storeCollectionQueryConfig.list
      ),
    ],
  },
]
