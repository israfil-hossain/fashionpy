import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { StoreGetHeroBannersParamsType } from "./validators"

export const GET = async (
  req: MedusaRequest<StoreGetHeroBannersParamsType>,
  res: MedusaResponse<HttpTypes.StoreHeroBannerListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: hero_banners, metadata } = await query.graph({
    entity: "hero_banner",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: {
      ...req.queryConfig.pagination,
      order: { rank: "ASC" },
    },
  })

  res.json({
    hero_banners,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
