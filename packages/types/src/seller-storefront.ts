export const SELLER_STOREFRONT_LAYOUT_KEY = "storefront_layout"

export const SELLER_STOREFRONT_SECTION_IDS = [
  "featured_products",
  "new_arrivals",
  "all_products",
  "reviews",
  "contact",
] as const

export type SellerStorefrontSectionId =
  (typeof SELLER_STOREFRONT_SECTION_IDS)[number]

export type SellerStorefrontLayoutSection = {
  id: SellerStorefrontSectionId
  enabled: boolean
}

export type SellerStorefrontLayout = {
  sections: SellerStorefrontLayoutSection[]
}

export const DEFAULT_SELLER_STOREFRONT_LAYOUT: SellerStorefrontLayoutSection[] = [
  { id: "featured_products", enabled: true },
  { id: "new_arrivals", enabled: true },
  { id: "all_products", enabled: true },
  { id: "reviews", enabled: true },
  { id: "contact", enabled: true },
]

const validIds = new Set<string>(SELLER_STOREFRONT_SECTION_IDS)

export const normalizeSellerStorefrontLayout = (
  raw: unknown
): SellerStorefrontLayoutSection[] => {
  const source =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as { sections?: unknown }).sections
      : raw

  if (!Array.isArray(source)) {
    return DEFAULT_SELLER_STOREFRONT_LAYOUT.map((section) => ({ ...section }))
  }

  const byId = new Map<SellerStorefrontSectionId, boolean>()
  for (const entry of source) {
    if (!entry || typeof entry !== "object") {
      continue
    }
    const { id, enabled } = entry as { id?: unknown; enabled?: unknown }
    if (typeof id !== "string" || !validIds.has(id)) {
      continue
    }
    const sectionId = id as SellerStorefrontSectionId
    if (byId.has(sectionId)) {
      continue
    }
    byId.set(sectionId, typeof enabled === "boolean" ? enabled : true)
  }

  const sections: SellerStorefrontLayoutSection[] = []
  for (const [id, enabled] of byId) {
    sections.push({ id, enabled })
  }
  for (const fallback of DEFAULT_SELLER_STOREFRONT_LAYOUT) {
    if (!byId.has(fallback.id)) {
      sections.push({ ...fallback })
    }
  }

  return sections
}

export const encodeSellerStorefrontLayout = (
  sections: SellerStorefrontLayoutSection[]
): string => encodeURIComponent(JSON.stringify({ sections }))

export const decodeSellerStorefrontLayout = (
  value: string | null | undefined
): SellerStorefrontLayoutSection[] | null => {
  if (!value) {
    return null
  }
  try {
    return normalizeSellerStorefrontLayout(
      JSON.parse(decodeURIComponent(value))
    )
  } catch {
    return null
  }
}
