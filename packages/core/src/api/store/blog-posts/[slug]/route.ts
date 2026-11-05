import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<HttpTypes.StoreBlogPostResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { country_code: _cc, slug: _slug, ...rest } = req.filterableFields

  const {
    data: [blog_post],
  } = await query.graph({
    entity: "blog_post",
    fields: req.queryConfig.fields,
    filters: { ...rest, slug: req.params.slug },
  })

  if (!blog_post) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Blog post with slug ${req.params.slug} was not found`
    )
  }

  res.json({ blog_post })
}
