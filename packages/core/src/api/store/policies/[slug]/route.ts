import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<HttpTypes.StorePolicyPageResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { country_code: _cc, slug: _slug, ...rest } = req.filterableFields

  const {
    data: [policy_page],
  } = await query.graph({
    entity: "policy_page",
    fields: req.queryConfig.fields,
    filters: { ...rest, slug: req.params.slug },
  })

  if (!policy_page) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Policy page with slug ${req.params.slug} was not found`
    )
  }

  res.json({ policy_page })
}
