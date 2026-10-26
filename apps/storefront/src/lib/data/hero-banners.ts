"use server"
import { CACHE_TAGS, getGlobalCacheOptions } from "./cache-tags"
import { sdk } from "../client"

export type HeroBannerSlot = "hero" | "company_1" | "company_2" | "offer_price"

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
    const next = getGlobalCacheOptions(CACHE_TAGS.heroBanners)
    const res = (await (sdk.store.hero_banners.query({
      limit: 50,
      slot,
      fetchOptions: { next, cache: "force-cache" },
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
  } catch {
    return []
  }
}

export const listHeroBanners = async (): Promise<HeroBannerSlide[]> =>
  listBannersForSlot("hero")

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
