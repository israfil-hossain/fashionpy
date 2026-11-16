/**
 * Home-page section layout contract, shared by the admin homepage-layout
 * editor and the storefront renderer. Persisted in `store.metadata.home_layout`
 * (see `GET /store/store-settings`).
 */

export const HOME_SECTION_IDS = [
  "hero",
  "categories",
  "trust_bar",
  "collection_slider",
  "collection_banners",
  "studio_rail",
  "company_banner_1",
  "offer_price",
  "company_banner_2",
  "promo_codes",
  "new_arrivals",
  "best_deals",
  "featured_products",
  "promo_banner",
  "blog",
] as const

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number]

export type HomeLayoutSection = {
  id: HomeSectionId
  enabled: boolean
}

export type HomeLayoutConfig = {
  sections: HomeLayoutSection[]
}

/**
 * Render order when nothing has been saved yet — mirrors the original
 * hard-coded home page order.
 */
export const DEFAULT_HOME_LAYOUT: HomeLayoutSection[] = [
  { id: "hero", enabled: true },
  { id: "categories", enabled: true },
  { id: "trust_bar", enabled: true },
  { id: "collection_slider", enabled: true },
  { id: "collection_banners", enabled: true },
  { id: "studio_rail", enabled: true },
  { id: "company_banner_1", enabled: true },
  { id: "offer_price", enabled: true },
  { id: "company_banner_2", enabled: true },
  { id: "promo_codes", enabled: true },
  { id: "new_arrivals", enabled: true },
  { id: "best_deals", enabled: true },
  { id: "featured_products", enabled: true },
  { id: "promo_banner", enabled: true },
  { id: "blog", enabled: true },
]

const DEFAULT_IDS = new Set<string>(HOME_SECTION_IDS)

const isSectionId = (value: unknown): value is HomeSectionId =>
  typeof value === "string" && DEFAULT_IDS.has(value)

/**
 * Coerce whatever is stored in `store.metadata.home_layout` (or returned by
 * the store endpoint) into a complete, ordered section list:
 *
 * - unknown ids are dropped, duplicate ids keep their first entry,
 * - saved order and `enabled` flags win,
 * - known sections missing from the saved config (newly shipped sections)
 *   are appended with their default flag.
 *
 * Returns `DEFAULT_HOME_LAYOUT` for null/garbage input so both the admin
 * editor and the storefront always render a full list.
 */
export const normalizeHomeLayout = (raw: unknown): HomeLayoutSection[] => {
  const source: unknown =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as { sections?: unknown }).sections
      : raw

  if (!Array.isArray(source)) {
    return DEFAULT_HOME_LAYOUT.map((section) => ({ ...section }))
  }

  const byId = new Map<HomeSectionId, boolean>()
  for (const entry of source) {
    if (!entry || typeof entry !== "object") {
      continue
    }
    const { id, enabled } = entry as { id?: unknown; enabled?: unknown }
    if (!isSectionId(id) || byId.has(id)) {
      continue
    }
    byId.set(id, typeof enabled === "boolean" ? enabled : true)
  }

  const normalized: HomeLayoutSection[] = []
  for (const [id, enabled] of byId) {
    normalized.push({ id, enabled })
  }
  for (const fallback of DEFAULT_HOME_LAYOUT) {
    if (!byId.has(fallback.id)) {
      normalized.push({ ...fallback })
    }
  }

  return normalized
}
