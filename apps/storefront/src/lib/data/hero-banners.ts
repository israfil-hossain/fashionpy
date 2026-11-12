"use server"
import { CACHE_TAGS, getCatalogFetchOptions } from "./cache-tags"
import { sdk } from "../client"

export type HeroBannerSlot =
  | "hero"
  | "shop_collection"
  | "company_1"
  | "company_2"
  | "offer_price"

export type HeroBannerSlide = {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  image: string
  ctaText: string | null
  ctaLink: string | null
  textPosition: "left" | "center" | "right"
  slot: HeroBannerSlot
  startsAt?: string | null
  endsAt?: string | null
}

const listBannersForSlot = async (slot: HeroBannerSlot): Promise<HeroBannerSlide[]> => {
  try {
    const res = (await (sdk.store.hero_banners.query({
      limit: 50,
      slot,
      fetchOptions: getCatalogFetchOptions(CACHE_TAGS.heroBanners),
    } as any))) as { hero_banners?: any[] }
    const now = Date.now()
    return (res?.hero_banners ?? [])
      .filter((b: any) => b.is_active !== false)
      .filter((b: any) => {
        const starts = b.starts_at ? Date.parse(b.starts_at) : null
        const ends = b.ends_at ? Date.parse(b.ends_at) : null
        if (starts && now < starts) return false
        if (ends && now > ends) return false
        return true
      })
      .map((b: any) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle ?? null,
        description: b.description ?? null,
        image: b.image_url,
        ctaText: b.cta_text ?? null,
        ctaLink: b.cta_link ?? null,
        textPosition: (b.text_position ?? "left") as "left" | "center" | "right",
        slot: (b.slot ?? slot) as HeroBannerSlot,
        startsAt: b.starts_at ?? null,
        endsAt: b.ends_at ?? null,
      }))
  } catch (error) {
    console.error("[hero-banners] failed to fetch banners:", error)
    return []
  }
}

export const listHeroBanners = async (): Promise<HeroBannerSlide[]> => {
  const banners = await listBannersForSlot("hero")
  return banners.slice(0, 5)
}

// The `shop_collection` slot is still accepted by the admin banner page for
// existing entries, but the storefront no longer renders it: that section is
// driven by product collections (see ShopCollectionBanners).

export const listCompanyBanner = async (
  slot: "company_1" | "company_2"
): Promise<HeroBannerSlide | null> => {
  const banners = await listBannersForSlot(slot)
  return banners[0] ?? null
}

export const listOfferBanner = async (): Promise<HeroBannerSlide | null> => {
  const banners = await listBannersForSlot("offer_price")
  return banners[0] ?? null
}
