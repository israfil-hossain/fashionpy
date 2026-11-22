import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

import {
  enforceAiRateLimit,
  generateProductInsights,
  type AiProductEnrichBodyType,
  type AiProductInsights,
} from "../../../../../../ai"

type ProductTag = { id: string; value: string }

type ProductContext = {
  id: string
  title?: string | null
  description?: string | null
  thumbnail?: string | null
  metadata?: Record<string, unknown> | null
  tags?: ProductTag[]
  images?: { url?: string | null }[]
}

type ProductTagService = {
  listProductTags: (filters: { value: string[] }) => Promise<ProductTag[]>
  createProductTags: (input: { value: string }[]) => Promise<ProductTag[]>
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AiProductEnrichBodyType>,
  res: MedusaResponse<{ product: ProductContext; suggestions: AiProductInsights }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id
  const body = req.validatedBody

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "description",
      "thumbnail",
      "metadata",
      "tags.id",
      "tags.value",
      "images.url",
    ],
    filters: { id: productId },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} was not found`
    )
  }

  const context = product as ProductContext
  const imageUrls =
    body.image_urls?.length
      ? body.image_urls
      : [
          context.thumbnail,
          ...(context.images ?? []).map((image) => image.url),
        ].filter((url): url is string => Boolean(url))

  await enforceAiRateLimit(req.scope, `ai:admin:${req.auth_context?.actor_id ?? "admin"}`)

  const suggestions = await generateProductInsights({
    container: req.scope,
    title: context.title ?? "",
    description: context.description,
    image_urls: imageUrls,
    existing_tags: (context.tags ?? []).map((tag) => tag.value),
    existing_metadata: context.metadata ?? {},
    language: body.language,
  })

  const update: Record<string, unknown> = {}

  if (body.apply_tags && suggestions.tags.length) {
    const productService = req.scope.resolve(
      Modules.PRODUCT
    ) as unknown as ProductTagService
    const existingTags = context.tags ?? []
    const known = new Set(existingTags.map((tag) => tag.value.toLowerCase()))
    const wanted = suggestions.tags.filter(
      (value) => !known.has(value.toLowerCase())
    )

    const found = wanted.length
      ? await productService.listProductTags({ value: wanted })
      : []
    const foundValues = new Set(found.map((tag) => tag.value.toLowerCase()))
    const missing = wanted.filter(
      (value) => !foundValues.has(value.toLowerCase())
    )
    const created = missing.length
      ? await productService.createProductTags(missing.map((value) => ({ value })))
      : []

    const ids = new Set(existingTags.map((tag) => tag.id))
    for (const tag of [...found, ...created]) {
      ids.add(tag.id)
    }
    update.tags = [...ids].map((id) => ({ id }))
  }

  if (body.apply_metadata) {
    update.metadata = {
      ...(context.metadata ?? {}),
      ...suggestions.metadata,
      ai_enriched_at: new Date().toISOString(),
    }
  }

  if (Object.keys(update).length) {
    await updateProductsWorkflow(req.scope).run({
      input: {
        selector: { id: productId },
        update,
      },
    })
  }

  const {
    data: [updated],
  } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata", "tags.id", "tags.value"],
    filters: { id: productId },
  })

  res.json({ product: (updated ?? context) as ProductContext, suggestions })
}
