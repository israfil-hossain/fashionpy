import type { ExtractorResult, ScrapedPrice } from "../types"

type JsonLdNode = Record<string, any>

function collectNodes(node: any, out: JsonLdNode[]): void {
  if (Array.isArray(node)) {
    node.forEach((child) => collectNodes(child, out))
    return
  }
  if (!node || typeof node !== "object") return

  const graph = node["@graph"]
  if (graph) collectNodes(graph, out)

  if (node["@type"]) {
    const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]
    if (types.some((t) => typeof t === "string" && t.toLowerCase().includes("product"))) {
      out.push(node)
    }
  }

  if (node.itemListElement) collectNodes(node.itemListElement, out)
  if (node.mainEntity) collectNodes(node.mainEntity, out)
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return undefined
}

function toImages(value: unknown): string[] {
  if (!value) return []
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) {
    return value.flatMap((entry) => {
      if (typeof entry === "string") return [entry]
      if (entry && typeof entry === "object") {
        const url = (entry as any).url ?? (entry as any).contentUrl
        return typeof url === "string" ? [url] : []
      }
      return []
    })
  }
  if (typeof value === "object") {
    const url = (value as any).url ?? (value as any).contentUrl
    return typeof url === "string" ? [url] : []
  }
  return []
}

function parsePrice(value: unknown, currency: unknown): ScrapedPrice | undefined {
  const amount = typeof value === "string" || typeof value === "number" ? Number(value) : NaN
  if (!Number.isFinite(amount) || amount <= 0) return undefined
  const currency_code =
    typeof currency === "string" && currency.trim()
      ? currency.trim().toUpperCase()
      : "USD"
  return { amount, currency_code }
}

function extractOffer(offer: any): { price?: ScrapedPrice; sku?: string } {
  if (!offer || typeof offer !== "object") return {}
  const price =
    parsePrice(offer.price ?? offer.lowPrice, offer.priceCurrency) ??
    parsePrice(offer.priceSpecification?.value, offer.priceSpecification?.priceCurrency)
  const sku = firstString(offer.sku, offer.mpn)
  return { price, sku }
}

export function extractJsonLd(html: string): ExtractorResult {
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  if (!scripts?.length) return {}

  const products: JsonLdNode[] = []
  for (const script of scripts) {
    const body = script.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "")
    try {
      collectNodes(JSON.parse(body), products)
    } catch {
      // malformed JSON-LD block — skip
    }
  }

  if (!products.length) return {}

  const product = products[0]
  const offers = product.offers
  let price: ScrapedPrice | undefined
  let sku = firstString(product.sku)

  if (Array.isArray(offers)) {
    for (const offer of offers) {
      const parsed = extractOffer(offer)
      if (!price && parsed.price) price = parsed.price
      if (!sku && parsed.sku) sku = parsed.sku
    }
  } else {
    const parsed = extractOffer(offers)
    price = parsed.price
    sku = sku ?? parsed.sku
  }

  const brand =
    typeof product.brand === "string"
      ? product.brand
      : firstString(product.brand?.name)

  const description = firstString(product.description)
  const images = toImages(product.image)

  return {
    title: firstString(product.name),
    description,
    images,
    thumbnail: images[0],
    brand,
    sku,
    reference_price: price,
  }
}
