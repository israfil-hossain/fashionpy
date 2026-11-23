const JSON_RULES = `Return ONLY a single JSON object. No markdown, no code fences, no commentary. If a value is unknown, omit it or use null instead of guessing.`

export const PRODUCT_DRAFT_SYSTEM = `You are a careful marketplace catalog assistant. You turn product images and source pages into structured product drafts for a multi-vendor marketplace.

Rules:
- Write in the requested language (default: English).
- Describe only what is visibly true in the images or source text. Never invent certifications, materials, measurements, brands or compatibility claims.
- Do not invent prices, shipping costs, stock levels, discounts or dates.
- Suggest realistic variant axes (e.g. Color, Size) only when the image or source supports them. Variants must be the cartesian product of the axes.
- SKU must be uppercase A-Z, 0-9 and hyphens, at most 48 chars, and look like BRAND-CATEGORY-NUMBER.
- Tags are short lowercase catalog tags (no leading #).
- description is clean merchant copy, at most 2000 words, and must not contain HTML script tags.
${JSON_RULES}

JSON shape:
{
  "title": string,
  "subtitle": string | null,
  "description": string | null,
  "brand": string | null,
  "sku": string | null,
  "category_names": string[],
  "option_axes": [{ "title": string, "values": string[] }],
  "variants": [{ "title": string, "options": { [axis]: value }, "sku": string | null }],
  "tags": string[],
  "metadata": { [key: string]: string | number | boolean | string[] }
}`

export const INSIGHTS_SYSTEM = `You are a marketplace merchandising assistant. Given a product's title, description and images, propose catalog tags, structured metadata and SEO copy.

Rules:
- Prefer tags from the provided existing tag list; only add a new tag when none fits.
- Tags are short lowercase phrases (no leading #).
- Metadata must use snake_case keys and simple string/number/boolean/string[] values. Suitable keys include material, color, style, gender, season, occasion, care_instructions, country_of_origin.
- Do not invent prices, stock, certifications or measurements.
- SEO title max 60 characters, SEO description max 160 characters.
- Write in the requested language (default: English).
${JSON_RULES}

JSON shape:
{
  "tags": string[],
  "metadata": { [key: string]: string | number | boolean | string[] },
  "seo": { "title": string, "description": string, "keywords": string[] }
}`

export const BLOG_SYSTEM = `You are an SEO content writer for a multi-vendor marketplace blog. Write helpful, original articles that read like a human editor wrote them.

Rules:
- Follow the requested topic, keywords, tone, language and length.
- Return the article body as clean HTML using only these tags: p, h2, h3, ul, ol, li, strong, em, blockquote and a.
- Never emit script, style, iframe, inline event handlers or javascript: URLs.
- Do not invent statistics, studies, quotes, product prices or brand claims.
- The excerpt is a 1-2 sentence summary.
- tags are hashtag-ready phrases without the leading #.
- seo.title max 60 characters, seo.description max 160 characters.
${JSON_RULES}

JSON shape:
{
  "title": string,
  "slug": string,
  "excerpt": string,
  "content": string,
  "tags": string[],
  "seo": { "title": string, "description": string, "keywords": string[] },
  "metadata": { [key: string]: string | number | boolean | string[] }
}`

export type ProductPromptContext = {
  sourceUrl?: string
  scrapedTitle?: string
  scrapedDescription?: string
  scrapedBrand?: string
  scrapedCategories?: string[]
  scrapedOptionAxes?: string[]
  hints?: {
    category?: string
    brand?: string
    language?: string
    target_audience?: string
    keywords?: string[]
  }
}

export function buildProductDraftPrompt(context: ProductPromptContext): string {
  const lines: string[] = ["Create a product draft from the attached image(s) and context."]

  if (context.sourceUrl) lines.push(`Source URL: ${context.sourceUrl}`)
  if (context.scrapedTitle) lines.push(`Source title: ${context.scrapedTitle}`)
  if (context.scrapedDescription) {
    lines.push(`Source description: ${context.scrapedDescription.slice(0, 3000)}`)
  }
  if (context.scrapedBrand) lines.push(`Source brand: ${context.scrapedBrand}`)
  if (context.scrapedCategories?.length) {
    lines.push(`Source categories: ${context.scrapedCategories.join(" > ")}`)
  }
  if (context.scrapedOptionAxes?.length) {
    lines.push(`Source option axes: ${context.scrapedOptionAxes.join(", ")}`)
  }

  const hints = context.hints ?? {}
  if (hints.category) lines.push(`Preferred category: ${hints.category}`)
  if (hints.brand) lines.push(`Brand hint: ${hints.brand}`)
  if (hints.language) lines.push(`Output language: ${hints.language}`)
  if (hints.target_audience) lines.push(`Target audience: ${hints.target_audience}`)
  if (hints.keywords?.length) lines.push(`Keywords: ${hints.keywords.join(", ")}`)

  return lines.join("\n")
}

export type InsightsPromptContext = {
  title: string
  description?: string | null
  existingTags?: string[]
  existingMetadata?: Record<string, unknown>
  language?: string
}

export function buildInsightsPrompt(context: InsightsPromptContext): string {
  const lines = [
    "Analyze this product and return catalog tags, metadata and SEO copy.",
    `Title: ${context.title}`,
  ]

  if (context.description) {
    lines.push(`Description: ${context.description.slice(0, 3000)}`)
  }
  if (context.existingTags?.length) {
    lines.push(`Existing tags: ${context.existingTags.join(", ")}`)
  }
  if (context.existingMetadata && Object.keys(context.existingMetadata).length) {
    lines.push(`Existing metadata: ${JSON.stringify(context.existingMetadata).slice(0, 1500)}`)
  }
  if (context.language) {
    lines.push(`Output language: ${context.language}`)
  }

  return lines.join("\n")
}

export type BlogPromptContext = {
  topic: string
  keywords?: string[]
  tone?: "professional" | "friendly" | "playful" | "informative"
  locale?: "en" | "bn"
  length?: "short" | "medium" | "long"
  category?: string | null
  audience?: string | null
}

export function buildBlogPrompt(context: BlogPromptContext): string {
  const lines = [
    "Write a marketplace blog post as JSON.",
    `Topic: ${context.topic}`,
  ]

  if (context.keywords?.length) lines.push(`SEO keywords: ${context.keywords.join(", ")}`)
  if (context.tone) lines.push(`Tone: ${context.tone}`)
  if (context.length) lines.push(`Length: ${context.length}`)
  if (context.category) lines.push(`Category: ${context.category}`)
  if (context.audience) lines.push(`Audience: ${context.audience}`)
  lines.push(`Language: ${context.locale === "bn" ? "Bengali (bn)" : "English (en)"}`)

  return lines.join("\n")
}
