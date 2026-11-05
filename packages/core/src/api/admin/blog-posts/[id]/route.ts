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

import { AdminUpdateBlogPostType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminBlogPostResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [blog_post],
  } = await query.graph({
    entity: "blog_post",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!blog_post) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Blog post with id ${req.params.id} was not found`
    )
  }

  res.json({ blog_post })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateBlogPostType>,
  res: MedusaResponse<HttpTypes.AdminBlogPostResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const service = req.scope.resolve<BlogModuleService>(MercurModules.BLOG)

  const {
    data: [existing],
  } = await query.graph({
    entity: "blog_post",
    fields: ["id", "status"],
    filters: { id: req.params.id },
  })

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Blog post with id ${req.params.id} was not found`
    )
  }

  const payload = { ...req.validatedBody }

  if (
    payload.status === "published" &&
    payload.published_at === undefined &&
    existing.status !== "published"
  ) {
    payload.published_at = new Date()
  }

  if (payload.country_codes !== undefined) {
    payload.country_codes = payload.country_codes?.length
      ? payload.country_codes
      : null
  }

  await service.updateBlogPosts({ id: req.params.id, ...payload })

  const {
    data: [blog_post],
  } = await query.graph({
    entity: "blog_post",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ blog_post })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminBlogPostDeleteResponse>
) => {
  const service = req.scope.resolve<BlogModuleService>(MercurModules.BLOG)

  await service.softDeleteBlogPosts([req.params.id])

  res.json({
    id: req.params.id,
    object: "blog_post",
    deleted: true,
  })
}
