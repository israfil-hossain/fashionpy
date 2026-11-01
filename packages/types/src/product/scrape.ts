export type ScrapedPrice = {
  amount: number
  currency_code: string
}

export type ScrapedOptionAxis = {
  title: string
  values: string[]
}

export type ScrapedVariant = {
  title: string
  options: Record<string, string>
  sku?: string
  reference_price?: ScrapedPrice
}

/**
 * Draft returned by POST /{admin,vendor}/products/scrape. Field-by-field
 * merge of JSON-LD, Open Graph and HTML heuristics — anything may be absent;
 * consumers must treat every scalar as optional.
 */
export type ScrapedProductDraft = {
  source_url: string
  title?: string
  subtitle?: string
  description?: string
  images: string[]
  thumbnail?: string
  brand?: string
  sku?: string
  availability?: string
  reference_price?: ScrapedPrice
  option_axes: ScrapedOptionAxis[]
  variants: ScrapedVariant[]
  category_names: string[]
}
