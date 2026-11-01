import { fetchHtml, ScrapeError } from "./fetch-html"
import { extractHtml } from "./extractors/html"
import { extractJsonLd } from "./extractors/json-ld"
import { extractOpenGraph } from "./extractors/og"
import type { ExtractorResult, ScrapedProductDraft } from "./types"

function mergeResults(
  ...results: ExtractorResult[]
): Omit<ScrapedProductDraft, "source_url"> {
  const merged: Omit<ScrapedProductDraft, "source_url"> = {
    images: [],
    option_axes: [],
    variants: [],
    category_names: [],
  }

  for (const result of results) {
    if (result.title && !merged.title) merged.title = result.title
    if (result.subtitle && !merged.subtitle) merged.subtitle = result.subtitle
    if (result.description && !merged.description) {
      merged.description = result.description
    }
    if (result.brand && !merged.brand) merged.brand = result.brand
    if (result.sku && !merged.sku) merged.sku = result.sku
    if (result.availability && !merged.availability) {
      merged.availability = result.availability
    }
    if (result.reference_price && !merged.reference_price) {
      merged.reference_price = result.reference_price
    }
    if (result.thumbnail && !merged.thumbnail) {
      merged.thumbnail = result.thumbnail.replace(/([^:]\/)\/+/g, "$1")
    }

    if (result.images?.length) {
      const seen = new Set(merged.images)
      for (const image of result.images) {
        const normalized = image.replace(/([^:]\/)\/+/g, "$1")
        if (!seen.has(normalized)) {
          seen.add(normalized)
          merged.images.push(normalized)
        }
      }
    }

    if (result.option_axes?.length && !merged.option_axes.length) {
      merged.option_axes = result.option_axes
    }
    if (result.variants?.length && !merged.variants.length) {
      merged.variants = result.variants
    }
    if (result.category_names?.length && !merged.category_names.length) {
      merged.category_names = result.category_names
    }
  }

  if (!merged.thumbnail && merged.images.length) {
    merged.thumbnail = merged.images[0]
  }

  return merged
}

export async function scrapeProduct(rawUrl: string): Promise<ScrapedProductDraft> {
  const html = await fetchHtml(rawUrl)

  const draft = mergeResults(
    extractJsonLd(html),
    extractOpenGraph(html),
    extractHtml(html)
  )

  // A title alone is not enough — a random page with just a <title> tag is
  // not a product page.
  const looksLikeProduct =
    Boolean(draft.title) &&
    (draft.images.length > 0 ||
      Boolean(draft.description) ||
      draft.option_axes.length > 0 ||
      Boolean(draft.reference_price))

  if (!looksLikeProduct) {
    throw new ScrapeError(
      "Could not find product information on this page. The site may require JavaScript or block scrapers.",
      422
    )
  }

  return { source_url: rawUrl, ...draft }
}

export { ScrapeError } from "./fetch-html"
export type { ScrapedProductDraft } from "./types"
