import {
  decodeSellerStorefrontLayout,
  DEFAULT_SELLER_STOREFRONT_LAYOUT,
  encodeSellerStorefrontLayout,
  normalizeSellerStorefrontLayout,
  SELLER_STOREFRONT_LAYOUT_KEY,
} from "@mercurjs/types"

describe("normalizeSellerStorefrontLayout", () => {
  it("returns a fresh copy of the defaults for null or garbage input", () => {
    expect(normalizeSellerStorefrontLayout(null)).toEqual(
      DEFAULT_SELLER_STOREFRONT_LAYOUT
    )
    expect(normalizeSellerStorefrontLayout("nope")).toEqual(
      DEFAULT_SELLER_STOREFRONT_LAYOUT
    )
    expect(normalizeSellerStorefrontLayout({ sections: "nope" })).toEqual(
      DEFAULT_SELLER_STOREFRONT_LAYOUT
    )

    const first = normalizeSellerStorefrontLayout(null)
    first[0].enabled = false
    expect(normalizeSellerStorefrontLayout(null)[0].enabled).toBe(true)
  })

  it("keeps saved order and flags, drops unknown ids and de-duplicates", () => {
    const normalized = normalizeSellerStorefrontLayout({
      sections: [
        { id: "reviews", enabled: false },
        { id: "unknown", enabled: true },
        { id: "reviews", enabled: true },
        { id: "contact", enabled: "yes" },
      ],
    })

    expect(normalized).toEqual([
      { id: "reviews", enabled: false },
      { id: "contact", enabled: true },
      { id: "featured_products", enabled: true },
      { id: "new_arrivals", enabled: true },
      { id: "all_products", enabled: true },
    ])
  })
})

describe("seller storefront layout preview encoding", () => {
  it("round-trips a draft layout through a URL-safe query value", () => {
    const sections = normalizeSellerStorefrontLayout({
      sections: [
        { id: "contact", enabled: true },
        { id: "featured_products", enabled: false },
      ],
    })
    const encoded = encodeSellerStorefrontLayout(sections)

    expect(encoded).not.toContain("{")
    expect(decodeSellerStorefrontLayout(encoded)).toEqual(
      normalizeSellerStorefrontLayout({ sections })
    )
  })

  it("falls back to null for a malformed preview value", () => {
    expect(decodeSellerStorefrontLayout("%7Bbroken")).toBeNull()
    expect(decodeSellerStorefrontLayout(null)).toBeNull()
  })

  it("uses the shared metadata key", () => {
    expect(SELLER_STOREFRONT_LAYOUT_KEY).toBe("storefront_layout")
  })
})
