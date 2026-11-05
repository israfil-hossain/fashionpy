import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { MercurModules } from "@mercurjs/types"
import BlogModuleService from "../../../../modules/blog/service"

import { AdminUpdateBlogCategoryType } from "../../blog-posts/validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminBlogCategoryResponse>
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

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateBlogCategoryType>,
  res: MedusaResponse<HttpTypes.AdminBlogCategoryResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const service = req.scope.resolve<BlogModuleService>(MercurModules.BLOG)

  const {
    data: [existing],
  } = await query.graph({
    entity: "blog_category",
    fields: ["id"],
    filters: { id: req.params.id },
  })

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Blog category with id ${req.params.id} was not found`
    )
  }

  await service.updateBlogCategories({ id: req.params.id, ...req.validatedBody })

  const {
    data: [blog_category],
  } = await query.graph({
    entity: "blog_category",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ blog_category })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminBlogCategoryDeleteResponse>
) => {
  const service = req.scope.resolve<BlogModuleService>(MercurModules.BLOG)

  await service.softDeleteBlogCategories([req.params.id])

  res.json({
    id: req.params.id,
    object: "blog_category",
    deleted: true,
  })
}
