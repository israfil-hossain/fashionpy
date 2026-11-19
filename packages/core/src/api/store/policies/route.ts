import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { StoreGetPolicyPagesParamsType } from "./validators"

export const GET = async (
  req: MedusaRequest<StoreGetPolicyPagesParamsType>,
  res: MedusaResponse<HttpTypes.StorePolicyPageListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { q, country_code: _cc, ...filters } = req.filterableFields

  if (q) {
    filters.$or = [
      { title: { $ilike: `%${q}%` } },
      { excerpt: { $ilike: `%${q}%` } },
    ]
  }

  const { data: policy_pages, metadata } = await query.graph({
    entity: "policy_page",
    fields: req.queryConfig.fields,
    filters,
    pagination: {
      ...req.queryConfig.pagination,
      order: { title: "ASC" },
    },
  })

  res.json({
    policy_pages,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
