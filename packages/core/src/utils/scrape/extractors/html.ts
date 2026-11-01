import * as cheerio from "cheerio"
import type {
  ExtractorResult,
  ScrapedPrice,
  ScrapedVariant,
} from "../types"

function text($: cheerio.CheerioAPI, selector: string): string | undefined {
  const value = $(selector).first().text().trim()
  return value || undefined
}

function normalizeImageUrl($: cheerio.CheerioAPI, src: string | undefined): string | undefined {
  if (!src) return undefined
  const trimmed = src.trim()
  if (!trimmed || trimmed.startsWith("data:")) return undefined
  try {
    // Site templates sometimes emit a double slash (e.g. /public//storage/...)
    const normalized = trimmed.replace(/([^:]\/)\/+/g, "$1")
    return new URL(normalized, "https://placeholder.local").toString() === "https://placeholder.local/"
      ? undefined
      : normalized
  } catch {
    return undefined
  }
}

function collectImages($: cheerio.CheerioAPI): string[] {
  const selectors = [
    ".zooming_show_image img",
    ".zooming_image_list img",
    ".product_single_list img",
    ".product-images img",
    ".product-gallery img",
    ".woocommerce-product-gallery img",
    "[data-gallery] img",
    "figure.product img",
  ]

  const seen = new Set<string>()
  const images: string[] = []

  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const raw = $(el).attr("src") ?? $(el).attr("data-src")
      const url = normalizeImageUrl($, raw)
      if (url && !seen.has(url)) {
        seen.add(url)
        images.push(url)
      }
    })
  }

  return images
}

function parseTkAmount(raw: string): number | undefined {
  const cleaned = raw.replace(/[^\d.]/g, "")
  if (!cleaned) return undefined
  const amount = Number(cleaned)
  return Number.isFinite(amount) && amount > 0 ? amount : undefined
}

/**
 * Size rows on dropshipping.com.bd render as hidden modal <li>s:
 *   <span class="select_size_name_modal"><span>XL</span></span>
 *   <span class="select_price_modal">500TK</span>  (original)
 *   <span class="select_price_modal">300TK</span>  (selling)
 * Per-size prices come in positional pairs.
 */
function collectSizeVariants($: cheerio.CheerioAPI): ScrapedVariant[] {
  const variants: ScrapedVariant[] = []
  const seenSizes = new Set<string>()

  $(".product_select_attribute_container_modal .product_select_attribute_modal ul li").each(
    (_, li) => {
      const size = $(li).find(".select_size_name_modal span, .select_size_name_modal").first().text().trim()
      if (!size || seenSizes.has(size)) return
      seenSizes.add(size)

      const prices = $(li)
        .find(".select_price_modal")
        .map((__, el) => $(el).text().trim())
        .get()
        .filter(Boolean)

      // Positional pair: [original, selling] → take selling (second) as reference
      const sellingRaw = prices.length >= 2 ? prices[1] : prices[0]
      const selling = parseTkAmount(sellingRaw ?? "")

      variants.push({
        title: size,
        options: { Size: size },
        reference_price:
          selling !== undefined ? { amount: selling, currency_code: "BDT" } : undefined,
      })
    }
  )

  // Generic fallback: radio/checkbox size inputs with labels
  if (!variants.length) {
    const sizeInputs = $("input[name*='size' i], input[name*='attribute_pa_size' i]")
    sizeInputs.each((_, input) => {
      const value = $(input).attr("value")?.trim()
      const id = $(input).attr("id")
      const label = id ? $(`label[for='${id}']`).text().trim() : ""
      const size = value || label
      if (!size || seenSizes.has(size)) return
      seenSizes.add(size)
      variants.push({ title: size, options: { Size: size } })
    })
  }

  return variants
}

function collectBreadcrumbs($: cheerio.CheerioAPI): string[] {
  const crumbs: string[] = []
  const seen = new Set<string>()

  $(".single_product_list ul li a, ._breadcrumb ul li a, .breadcrumb a, nav[aria-label*='readcrumb' i] a").each(
    (_, el) => {
      const label = $(el).text().trim()
      const href = $(el).attr("href") ?? ""
      // Skip the home crumb (icon-only or href pointing at site root path)
      if (!label || label === "Home" || label.length > 80) return
      const path = href.replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "")
      if (!path) return
      if (seen.has(label)) return
      seen.add(label)
      crumbs.push(label)
    }
  )

  return crumbs
}

export function extractHtml(html: string): ExtractorResult {
  const $ = cheerio.load(html)

  const titleTag = $("title").first().text().trim()
  // Titles like "Premium Stainless Steel Bar Pendant Chain || 13321"
  const titleFromTag = titleTag ? titleTag.split(/\|\||[|—–-]\s*\d+\s*$/)[0].trim() : undefined

  const title =
    text($, ".single_product_name h2") ??
    text($, "h1.product-title, h1.product_title, h1[itemprop='name'], h1") ??
    titleFromTag

  const descriptionHtml = $(".single_product_tab_content, #home .single_product_tab_content, #tab-description, .woocommerce-Tabs-panel--description, [itemprop='description']").first().html()
  const description =
    descriptionHtml && descriptionHtml.trim()
      ? descriptionHtml.trim()
      : text($, "meta[name='description']")

  const images = collectImages($)

  const variants = collectSizeVariants($)
  const category_names = collectBreadcrumbs($)

  const sku =
    text($, ".s_p_code span, .sku, [itemprop='sku'], .product_code") ??
    (() => {
      // "Code: 13321" pattern
      const codeMatch = $(".single_product_attribute.s_p_code").text().match(/(\d{4,})/)
      return codeMatch?.[1]
    })()

  const brand =
    text($, "[itemprop='brand'], .product_brand, .brand") ??
    text($, "meta[property='product:brand']") // rarely in body; cheap check

  // Single selling price when a classic new/discount pair renders
  const newPrice = text($, ".single_product_new_price, .product_new_price, .price .amount, [itemprop='price']")
  const discountPrice = text($, ".single_product_discount_price, .product_discount_price, del .amount")
  const sellingRaw = newPrice ?? discountPrice
  const sellingAmount = sellingRaw ? parseTkAmount(sellingRaw) : undefined
  const currencyMatch = sellingRaw?.match(/(BDT|Tk|TK|৳|\$|USD|EUR|£|GBP)/i)

  const reference_price: ScrapedPrice | undefined = (() => {
    if (sellingAmount === undefined) {
      return variants.find((v) => v.reference_price)?.reference_price
    }
    const symbol = currencyMatch?.[1]
    if (symbol && /tk|৳|bdt/i.test(symbol)) {
      return { amount: sellingAmount, currency_code: "BDT" }
    }
    if (symbol === "$" || (symbol && /usd/i.test(symbol))) {
      return { amount: sellingAmount, currency_code: "USD" }
    }
    if (symbol) {
      return { amount: sellingAmount, currency_code: symbol.toUpperCase() }
    }
    return undefined
  })()

  const availability =
    text($, "[itemprop='availability'], .stock")?.replace(/^https?:\/\/schema\.org\//, "") ??
    undefined

  return {
    title,
    description,
    images,
    thumbnail: images[0],
    brand,
    sku,
    availability,
    reference_price,
    option_axes: variants.length ? [{ title: "Size", values: variants.map((v) => v.title) }] : [],
    variants,
    category_names,
  }
}
