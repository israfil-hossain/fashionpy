import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

const parseDate = (value: unknown): number | null => {
  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? null : time
  }
  if (typeof value !== "string" || !value) {
    return null
  }
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<HttpTypes.StoreHomePromotionListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: promotions } = await query.graph({
    entity: "promotion",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: {
      ...req.queryConfig.pagination,
      order: { created_at: "DESC" },
    },
  })

  const now = Date.now()

  const visible = promotions.filter((promotion: any) => {
    if (!promotion.code) {
      return false
    }

    const campaign = promotion.campaign
    if (!campaign) {
      return true
    }

    const starts = parseDate(campaign.starts_at)
    const ends = parseDate(campaign.ends_at)
    if (starts !== null && now < starts) {
      return false
    }
    if (ends !== null && now > ends) {
      return false
    }
    return true
  })

  const limit = req.queryConfig.pagination?.take ?? 10
  const offset = req.queryConfig.pagination?.skip ?? 0

  res.json({
    promotions: visible.slice(offset, offset + limit),
    count: visible.length,
    offset,
    limit,
  })
}
