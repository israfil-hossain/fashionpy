import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import {
  enforceAiRateLimit,
  generateProductInsights,
  type AiProductInsights,
  type AiProductInsightsBodyType,
} from "../../../../../ai"

type ProductContext = {
  title?: string | null
  description?: string | null
  thumbnail?: string | null
  images?: { url?: string | null }[]
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AiProductInsightsBodyType>,
  res: MedusaResponse<{ insights: AiProductInsights }>
) => {
  const body = req.validatedBody
  let title = body.title
  let description = body.description ?? null
  let imageUrls = body.image_urls ?? []

  if (body.product_id) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [product],
    } = await query.graph({
      entity: "product",
      fields: ["id", "title", "description", "thumbnail", "images.url"],
      filters: { id: body.product_id },
    })

    if (!product) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with id ${body.product_id} was not found`
      )
    }

    const context = product as ProductContext
    title = context.title ?? undefined
    description = context.description ?? null
    if (!imageUrls.length) {
      imageUrls = [
        context.thumbnail,
        ...(context.images ?? []).map((image) => image.url),
      ].filter((url): url is string => Boolean(url))
    }
  }

  if (!title?.trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Provide a product_id or a title"
    )
  }

  await enforceAiRateLimit(req.scope, `ai:admin:${req.auth_context?.actor_id ?? "admin"}`)

  const insights = await generateProductInsights({
    container: req.scope,
    title,
    description,
    image_urls: imageUrls,
    language: body.language,
  })

  res.json({ insights })
}
