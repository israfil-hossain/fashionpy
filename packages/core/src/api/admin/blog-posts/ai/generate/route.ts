import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  enforceAiRateLimit,
  generateBlogDraft,
  type AiBlogDraft,
  type AiBlogGenerateBodyType,
} from "../../../../../ai"

type BlogCategory = { id: string; name?: string | null }

export const POST = async (
  req: AuthenticatedMedusaRequest<AiBlogGenerateBodyType>,
  res: MedusaResponse<{
    blog_post: AiBlogDraft & {
      category_id: string | null
      author: string | null
      status: "draft"
    }
  }>
) => {
  const body = req.validatedBody
  let category = body.category ?? null

  if (body.category_id) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [found],
    } = await query.graph({
      entity: "blog_category",
      fields: ["id", "name"],
      filters: { id: body.category_id },
    })
    category = (found as BlogCategory | undefined)?.name ?? category
  }

  await enforceAiRateLimit(req.scope, `ai:admin:${req.auth_context?.actor_id ?? "admin"}`)

  const draft = await generateBlogDraft({
    container: req.scope,
    topic: body.topic,
    keywords: body.keywords,
    tone: body.tone,
    locale: body.locale,
    length: body.length,
    category,
    audience: body.audience,
  })

  res.json({
    blog_post: {
      ...draft,
      category_id: body.category_id ?? null,
      author: body.author ?? null,
      status: "draft",
    },
  })
}
