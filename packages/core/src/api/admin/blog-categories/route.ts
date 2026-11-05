import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { MercurModules } from "@mercurjs/types"
import BlogModuleService from "../../../modules/blog/service"

import {
  AdminCreateBlogCategoryType,
  AdminGetBlogCategoriesParamsType,
} from "../blog-posts/validators"

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)
}

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetBlogCategoriesParamsType>,
  res: MedusaResponse<HttpTypes.AdminBlogCategoryListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { q, ...filters } = req.filterableFields

  if (q) {
    filters.$or = [
      { name: { $ilike: `%${q}%` } },
      { slug: { $ilike: `%${q}%` } },
    ]
  }

  const { data: blog_categories, metadata } = await query.graph({
    entity: "blog_category",
    fields: req.queryConfig.fields,
    filters,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    blog_categories,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateBlogCategoryType>,
  res: MedusaResponse<HttpTypes.AdminBlogCategoryResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const service = req.scope.resolve<BlogModuleService>(MercurModules.BLOG)

  const { slug, ...rest } = req.validatedBody

  const created = await service.createBlogCategories({
    ...rest,
    slug: slug ?? slugify(rest.name),
  })

  const {
    data: [blog_category],
  } = await query.graph({
    entity: "blog_category",
    fields: req.queryConfig.fields,
    filters: { id: (created as { id: string }).id },
  })

  res.status(201).json({ blog_category })
}
