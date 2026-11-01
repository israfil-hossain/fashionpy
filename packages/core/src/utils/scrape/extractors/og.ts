import type { ExtractorResult, ScrapedPrice } from "../types"

function metaContent(html: string, patterns: string[]): string | undefined {
  for (const pattern of patterns) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${pattern}["'][^>]+content=["']([^"']*)["']`,
      "i"
    )
    const match = html.match(re)
    if (match?.[1]?.trim()) return decodeHtmlEntities(match[1].trim())

    const reversed = new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${pattern}["']`,
      "i"
    )
    const reversedMatch = html.match(reversed)
    if (reversedMatch?.[1]?.trim()) {
      return decodeHtmlEntities(reversedMatch[1].trim())
    }
  }
  return undefined
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
}

function parseAmount(raw: string | undefined): number | undefined {
  if (!raw) return undefined
  const cleaned = raw.replace(/[^\d.,-]/g, "").replace(/,(?=\d{3}\b)/g, "")
  const amount = Number(cleaned.replace(/,/g, ""))
  return Number.isFinite(amount) && amount > 0 ? amount : undefined
}

export function extractOpenGraph(html: string): ExtractorResult {
  const title = metaContent(html, ["og:title", "twitter:title"])
  const description = metaContent(html, ["og:description", "twitter:description", "description"])
  const image = metaContent(html, ["og:image", "twitter:image"])
  const brand = metaContent(html, ["product:brand", "og:site_name"])
  const availability = metaContent(html, ["product:availability", "og:availability"])
  const currencyRaw =
    metaContent(html, ["product:price:currency", "price:currency"]) ?? "USD"
  const amount = parseAmount(
    metaContent(html, ["product:price:amount", "price:amount", "og:price:amount"])
  )

  const reference_price: ScrapedPrice | undefined =
    amount !== undefined
      ? { amount, currency_code: currencyRaw.toUpperCase() }
      : undefined

  return {
    title,
    description: description && description !== "n/a" ? description : undefined,
    images: image ? [image] : [],
    thumbnail: image,
    brand,
    availability,
    reference_price,
  }
}
