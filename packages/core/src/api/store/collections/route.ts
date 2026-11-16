import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { publishedProductsContext } from "@medusajs/medusa/api/store/utils/published-products-context"

import { isRankOrder, listCollectionsByRank } from "../../utils/collection-rank"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { skip, take, order } = req.queryConfig.pagination
  // `rank` is orderable but not a column and not selectable.
  const fields = req.queryConfig.fields.filter((field) => field !== "rank")
  const context = publishedProductsContext()

  const { data: collections, metadata } = isRankOrder(order)
    ? await listCollectionsByRank(req.scope, {
        fields,
        filters: req.filterableFields,
        pagination: { skip, take, order },
        // Collections without a rank keep Medusa's store default ordering.
        baseOrder: { created_at: "DESC" },
        context,
        options: { locale: req.locale },
      })
    : await req.scope.resolve(ContainerRegistrationKeys.QUERY).graph(
        {
          entity: "product_collection",
          filters: req.filterableFields,
          pagination: req.queryConfig.pagination,
          fields,
          context,
        },
        {
          locale: req.locale,
        }
      )

  res.json({
    collections,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
