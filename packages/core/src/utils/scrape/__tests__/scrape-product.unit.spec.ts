import { extractHtml } from "../extractors/html"
import { extractJsonLd } from "../extractors/json-ld"
import { extractOpenGraph } from "../extractors/og"
import { scrapeProduct, ScrapeError } from "../scrape-product"
import {
  BARE_PAGE_HTML,
  DROPSHIPPING_PRODUCT_HTML,
  SHOPIFY_STYLE_HTML,
} from "./fixtures"

describe("extractOpenGraph", () => {
  it("reads the product OG block from a dropshipping.com.bd page", () => {
    const result = extractOpenGraph(DROPSHIPPING_PRODUCT_HTML)

    expect(result.title).toBe("Premium Stainless Steel Bar Pendant Chain")
    expect(result.images).toEqual([
      "https://dropshipping.com.bd/public//storage/images/products/img_6ad9927ad5472_0_1792643706.jpg",
    ])
    expect(result.reference_price).toEqual({ amount: 150, currency_code: "BDT" })
    expect(result.availability).toBe("in stock")
    expect(result.brand).toBe("dropshipping.com.bd")
    // og:description is the placeholder "n/a" — must not be used
    expect(result.description).toBeUndefined()
  })
})

describe("extractJsonLd", () => {
  it("parses schema.org Product JSON-LD", () => {
    const result = extractJsonLd(SHOPIFY_STYLE_HTML)

    expect(result.title).toBe("Classic Tee")
    expect(result.description).toBe("A soft cotton tee.")
    expect(result.images).toEqual([
      "https://cdn.example.com/tee.jpg",
      "https://cdn.example.com/tee-2.jpg",
    ])
    expect(result.brand).toBe("Myshop")
    expect(result.sku).toBe("TEE-001")
    expect(result.reference_price).toEqual({ amount: 29.99, currency_code: "USD" })
  })

  it("returns empty result when no JSON-LD is present", () => {
    expect(extractJsonLd(DROPSHIPPING_PRODUCT_HTML)).toEqual({})
  })
})

describe("extractHtml", () => {
  it("extracts title, description, images, size variants and breadcrumb", () => {
    const result = extractHtml(DROPSHIPPING_PRODUCT_HTML)

    expect(result.title).toBe("Premium Stainless Steel Bar Pendant Chain")
    expect(result.sku).toBe("13321")
    expect(result.description).toContain("স্টেইনলেস স্টিল")
    expect(result.images).toEqual([
      "https://dropshipping.com.bd/public/storage/images/products/img_6ad9927ad5472_0_1792643706.jpg",
    ])
    expect(result.option_axes).toEqual([{ title: "Size", values: ["XL", "L"] }])
    expect(result.variants).toEqual([
      {
        title: "XL",
        options: { Size: "XL" },
        reference_price: { amount: 300, currency_code: "BDT" },
      },
      {
        title: "L",
        options: { Size: "L" },
        reference_price: { amount: 280, currency_code: "BDT" },
      },
    ])
    expect(result.category_names).toEqual(["Men's Fashion", "Men's Accessories"])
  })

  it("falls back to h1 and generic gallery selectors", () => {
    const result = extractHtml(SHOPIFY_STYLE_HTML)

    expect(result.title).toBe("Classic Tee")
    expect(result.images).toEqual([
      "https://cdn.example.com/tee.jpg",
      "https://cdn.example.com/tee-2.jpg",
    ])
    expect(result.description).toBe("A soft cotton tee.")
  })
})

describe("scrapeProduct", () => {
  it("merges OG, JSON-LD and HTML into one draft", async () => {
    const originalFetch = global.fetch
    global.fetch = (async () =>
      new Response(SHOPIFY_STYLE_HTML, {
        status: 200,
        headers: { "content-type": "text/html" },
      })) as typeof fetch

    try {
      const draft = await scrapeProduct("https://example.com/products/classic-tee")

      expect(draft.source_url).toBe("https://example.com/products/classic-tee")
      expect(draft.title).toBe("Classic Tee")
      expect(draft.description).toBe("A soft cotton tee.")
      expect(draft.brand).toBe("Myshop")
      expect(draft.sku).toBe("TEE-001")
      expect(draft.reference_price).toEqual({ amount: 29.99, currency_code: "USD" })
      // JSON-LD images win and get double-slash normalized on merge
      expect(draft.images).toEqual([
        "https://cdn.example.com/tee.jpg",
        "https://cdn.example.com/tee-2.jpg",
      ])
      expect(draft.thumbnail).toBe("https://cdn.example.com/tee.jpg")
    } finally {
      global.fetch = originalFetch
    }
  })

  it("produces a usable draft from a dropshipping.com.bd page", async () => {
    const originalFetch = global.fetch
    global.fetch = (async () =>
      new Response(DROPSHIPPING_PRODUCT_HTML, {
        status: 200,
        headers: { "content-type": "text/html" },
      })) as typeof fetch

    try {
      const draft = await scrapeProduct(
        "https://dropshipping.com.bd/product/premium-stainless-steel-bar-pendant-chain-13321"
      )

      expect(draft.title).toBe("Premium Stainless Steel Bar Pendant Chain")
      expect(draft.reference_price).toEqual({ amount: 150, currency_code: "BDT" })
      expect(draft.option_axes).toEqual([{ title: "Size", values: ["XL", "L"] }])
      expect(draft.variants).toHaveLength(2)
      expect(draft.category_names).toEqual(["Men's Fashion", "Men's Accessories"])
      // double slash normalized
      expect(draft.images[0]).toBe(
        "https://dropshipping.com.bd/public/storage/images/products/img_6ad9927ad5472_0_1792643706.jpg"
      )
    } finally {
      global.fetch = originalFetch
    }
  })

  it("throws 422 when the page has no product information", async () => {
    const originalFetch = global.fetch
    global.fetch = (async () =>
      new Response(BARE_PAGE_HTML, {
        status: 200,
        headers: { "content-type": "text/html" },
      })) as typeof fetch

    try {
      await expect(scrapeProduct("https://example.com/empty")).rejects.toMatchObject({
        statusCode: 422,
      })
    } finally {
      global.fetch = originalFetch
    }
  })

  it("rejects non-http(s) URLs", async () => {
    await expect(scrapeProduct("ftp://example.com/x")).rejects.toBeInstanceOf(ScrapeError)
  })

  it("rejects private/loopback addresses (SSRF guard)", async () => {
    await expect(scrapeProduct("http://127.0.0.1:9000/admin")).rejects.toMatchObject({
      statusCode: 400,
    })
    await expect(scrapeProduct("http://localhost:3000")).rejects.toMatchObject({
      statusCode: 400,
    })
    await expect(scrapeProduct("http://169.254.169.254/latest/meta-data")).rejects.toMatchObject(
      { statusCode: 400 }
    )
  })

  it("maps upstream 404 to a client error", async () => {
    const originalFetch = global.fetch
    global.fetch = (async () =>
      new Response("gone", { status: 404 })) as typeof fetch

    try {
      await expect(
        scrapeProduct("https://dropshipping.com.bd/product/removed-item")
      ).rejects.toMatchObject({ statusCode: 400 })
    } finally {
      global.fetch = originalFetch
    }
  })
})
