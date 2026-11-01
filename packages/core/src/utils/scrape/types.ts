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

export type ExtractorResult = Partial<
  Pick<
    ScrapedProductDraft,
    | "title"
    | "subtitle"
    | "description"
    | "images"
    | "thumbnail"
    | "brand"
    | "sku"
    | "availability"
    | "reference_price"
    | "option_axes"
    | "variants"
    | "category_names"
  >
>
