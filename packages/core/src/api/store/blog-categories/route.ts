import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { StoreGetBlogCategoriesParamsType } from "../blog-posts/validators"

export const GET = async (
  req: MedusaRequest<StoreGetBlogCategoriesParamsType>,
  res: MedusaResponse<HttpTypes.StoreBlogCategoryListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: blog_categories, metadata } = await query.graph({
    entity: "blog_category",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    blog_categories,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
