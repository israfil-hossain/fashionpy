import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { StoreGetBlogPostsParamsType } from "./validators"

export const GET = async (
  req: MedusaRequest<StoreGetBlogPostsParamsType>,
  res: MedusaResponse<HttpTypes.StoreBlogPostListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { q, tag, country_code: _cc, ...filters } = req.filterableFields

  if (q) {
    filters.$or = [
      { title: { $ilike: `%${q}%` } },
      { excerpt: { $ilike: `%${q}%` } },
    ]
  }

  if (tag) {
    filters.tags = { $contains: [tag] }
  }

  const { data: blog_posts, metadata } = await query.graph({
    entity: "blog_post",
    fields: req.queryConfig.fields,
    filters,
    pagination: {
      ...req.queryConfig.pagination,
      order: { published_at: "DESC", created_at: "DESC" },
    },
  })

  res.json({
    blog_posts,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
