import type { MedusaContainer } from "@medusajs/framework/types"

import {
  ScrapeError,
  scrapeProduct,
  type ScrapedOptionAxis,
  type ScrapedProductDraft,
  type ScrapedVariant,
} from "../utils/scrape"
import { sanitizeNullableRichText } from "../utils/sanitize-rich-text"
import { normalizeImages } from "./images"
import { buildProductDraftPrompt, PRODUCT_DRAFT_SYSTEM } from "./prompts"
import { completeJson } from "./runtime"
import { sanitizeMetadata, sanitizeSku, sanitizeTagList } from "./sanitize"
import { AiProductDraftSchema, type AiProductDraftPayload } from "./schemas"

export type AiProductDraftHints = {
  category?: string
  brand?: string
  language?: string
  target_audience?: string
  keywords?: string[]
}

export type AiProductDraft = Omit<ScrapedProductDraft, "source_url"> & {
  source_url: string
  tags: string[]
  metadata: Record<string, unknown>
}

export type GenerateProductDraftInput = {
  container: MedusaContainer
  /** Persistable http(s) image URLs. */
  image_urls?: string[]
  /** Vision-only `data:` URLs (e.g. a freshly picked file before upload). */
  image_data_urls?: string[]
  source_url?: string
  hints?: AiProductDraftHints
}

function deriveAxes(variants: ScrapedVariant[]): ScrapedOptionAxis[] {
  const axes = new Map<string, Set<string>>()
  for (const variant of variants) {
    for (const [title, value] of Object.entries(variant.options ?? {})) {
      if (!axes.has(title)) axes.set(title, new Set())
      axes.get(title)!.add(value)
    }
  }
  return [...axes.entries()]
    .filter(([, values]) => values.size > 0)
    .map(([title, values]) => ({ title, values: [...values] }))
}

function normalizeVariants(payload: AiProductDraftPayload): ScrapedVariant[] {
  return payload.variants
    .map((variant) => ({
      title: variant.title,
      options: Object.fromEntries(
        Object.entries(variant.options ?? {}).map(([key, value]) => [
          key,
          String(value),
        ])
      ),
      sku: sanitizeSku(variant.sku),
    }))
    .filter((variant) => variant.title)
}

export async function generateProductDraft(
  input: GenerateProductDraftInput
): Promise<AiProductDraft> {
  const persistedUrls = input.image_urls ?? []
  const visionUrls = [...persistedUrls, ...(input.image_data_urls ?? [])]
  if (!visionUrls.length && !input.source_url) {
    throw new ScrapeError(
      "Provide at least one product image or a product page URL",
      400
    )
  }

  let scraped: ScrapedProductDraft | null = null
  if (input.source_url) {
    try {
      scraped = await scrapeProduct(input.source_url)
    } catch (error) {
      if (!visionUrls.length) throw error
    }
  }

  let images: Awaited<ReturnType<typeof normalizeImages>>
  try {
    images = await normalizeImages(visionUrls)
  } catch (error) {
    if (!scraped) throw error
    images = { data_urls: [], source_urls: [] }
  }

  if (!images.data_urls.length && !scraped) {
    throw new ScrapeError(
      "Could not read any of the provided images. Please upload a photo or paste a product URL.",
      400
    )
  }

  const prompt = buildProductDraftPrompt({
    sourceUrl: input.source_url,
    scrapedTitle: scraped?.title,
    scrapedDescription: scraped?.description,
    scrapedBrand: scraped?.brand,
    scrapedCategories: scraped?.category_names,
    scrapedOptionAxes: scraped?.option_axes.map((axis) => axis.title),
    hints: input.hints,
  })

  const { data } = await completeJson(input.container, {
    schema: AiProductDraftSchema,
    surface: "product_draft",
    max_tokens: 2500,
    messages: [
      { role: "system", content: PRODUCT_DRAFT_SYSTEM },
      { role: "user", content: prompt, images: images.data_urls },
    ],
  })

  const aiVariants = normalizeVariants(data)
  const variants = aiVariants.length ? aiVariants : (scraped?.variants ?? [])
  const optionAxes = data.option_axes.length
    ? data.option_axes
    : variants.length
      ? deriveAxes(variants)
      : (scraped?.option_axes ?? [])

  const persistedImages = images.source_urls.length
    ? images.source_urls
    : (scraped?.images ?? [])

  const description = sanitizeNullableRichText(
    data.description ?? scraped?.description ?? null
  )

  return {
    source_url: input.source_url ?? "",
    title: data.title || scraped?.title || "",
    subtitle: data.subtitle ?? scraped?.subtitle,
    description: description ?? undefined,
    images: persistedImages,
    thumbnail: persistedImages[0],
    brand: data.brand ?? scraped?.brand,
    sku: sanitizeSku(data.sku) ?? scraped?.sku,
    availability: scraped?.availability,
    reference_price: scraped?.reference_price,
    option_axes: optionAxes,
    variants,
    category_names: data.category_names.length
      ? data.category_names
      : (scraped?.category_names ?? []),
    tags: sanitizeTagList(data.tags),
    metadata: sanitizeMetadata(data.metadata),
  }
}
