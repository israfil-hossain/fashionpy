"use server"
import { CACHE_TAGS, getGlobalCacheOptions } from "./cache-tags"
import { sdk } from "../client"

export type HeroBannerSlide = {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  image: string
  ctaText: string | null
  ctaLink: string | null
  textPosition: "left" | "center" | "right"
}

export const listHeroBanners = async (): Promise<HeroBannerSlide[]> => {
  try {
    const next = getGlobalCacheOptions(CACHE_TAGS.heroBanners)
    const res = (await (sdk.store.hero_banners.query({
      limit: 20,
      fetchOptions: { next, cache: "force-cache" },
    } as any))) as { hero_banners?: any[] }
    const now = Date.now()
    return (res?.hero_banners ?? [])
      .filter((b: any) => b.is_active !== false)
      .map((b: any) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle ?? null,
        description: b.description ?? null,
        image: b.image_url,
        ctaText: b.cta_text ?? null,
        ctaLink: b.cta_link ?? null,
        textPosition: (b.text_position ?? "left") as "left" | "center" | "right",
      }))
  } catch {
    return []
  }
}
