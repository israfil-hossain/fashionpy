import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<HttpTypes.StoreBlogCategoryResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [blog_category],
  } = await query.graph({
    entity: "blog_category",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!blog_category) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Blog category with id ${req.params.id} was not found`
    )
  }

  res.json({ blog_category })
}
