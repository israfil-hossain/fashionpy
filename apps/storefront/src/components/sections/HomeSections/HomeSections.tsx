import type { ReactNode } from "react"

import type { HeroBannerSlide } from "@/lib/data/hero-banners"
import { listHeroBanners } from "@/lib/data/hero-banners"
import { retrieveHomeLayout } from "@/lib/data/store-settings"
import type { HomeLayoutSection, HomeSectionId } from "@mercurjs/types"

import { BannerSection } from "../BannerSection/BannerSection"
import { BestDealsSection } from "../BestDealsSection/BestDealsSection"
import { BlogSection } from "../BlogSection/BlogSection"
import { CategoryStrip } from "../CategoryStrip/CategoryStrip"
import { CollectionSliderSection } from "../CollectionSlider/CollectionSliderSection"
import { CompanyBannerSlot } from "../CompanyBanner/CompanyBannerSlot"
import { HeroCarousel } from "../HeroCarousel/HeroCarousel"
import { NewArrivalsSection } from "../NewArrivalsSection/NewArrivalsSection"
import { OfferPriceSection } from "../OfferPrice/OfferPriceSection"
import { PromoCodeSection } from "../PromoCodeSection/PromoCodeSection"
import { ShopCollectionBanners } from "../ShopCollectionBanners/ShopCollectionBanners"
import { StudioRail } from "../StudioRail/StudioRail"
import { TabbedProductGrid } from "../TabbedProductGrid/TabbedProductGrid"
import { TrustBarSection } from "../TrustBar/TrustBarSection"

type RenderContext = {
  locale: string
  heroSlides: HeroBannerSlide[]
}

/**
 * Sections that used to share one white card on the home page. Consecutive
 * card sections in the saved order are grouped back into a single card so the
 * default layout keeps its original look.
 */
const CARD_SECTIONS = new Set<HomeSectionId>([
  "new_arrivals",
  "best_deals",
  "featured_products",
  "promo_banner",
  "blog",
])

const PLAIN_WRAPPER = "px-4 pt-5 lg:px-16"

/**
 * One entry per `HOME_SECTION_IDS` id. Renderers are invoked directly (not as
 * JSX) so a section that resolves to `null` — no banners configured, no
 * qualifying promos, no posts — is skipped entirely instead of leaving an
 * empty padded wrapper behind. Each renderer is a pure async data component;
 * client children (e.g. `HeroCarousel`) are returned through JSX.
 */
const RENDERERS: Record<
  HomeSectionId,
  (ctx: RenderContext) => Promise<ReactNode | null>
> = {
  hero: async (ctx) =>
    ctx.heroSlides.length ? <HeroCarousel slides={ctx.heroSlides} /> : null,
  categories: () => CategoryStrip(),
  trust_bar: async () => <TrustBarSection />,
  collection_slider: () => CollectionSliderSection(),
  collection_banners: () => ShopCollectionBanners(),
  studio_rail: ({ locale }) => StudioRail({ locale }),
  company_banner_1: async () => CompanyBannerSlot({ slot: "company_1" }),
  offer_price: () => OfferPriceSection(),
  company_banner_2: async () => CompanyBannerSlot({ slot: "company_2" }),
  promo_codes: () => PromoCodeSection(),
  new_arrivals: ({ locale }) => NewArrivalsSection({ locale }),
  best_deals: ({ locale }) => BestDealsSection({ locale }),
  featured_products: ({ locale }) => TabbedProductGrid({ locale }),
  promo_banner: async () => BannerSection(),
  blog: ({ locale }) => BlogSection({ locale }),
}

const WRAPPERS: Record<HomeSectionId, string | null> = {
  hero: null,
  categories: "pt-3",
  trust_bar: "px-4 pt-3 lg:px-16",
  collection_slider: PLAIN_WRAPPER,
  collection_banners: PLAIN_WRAPPER,
  studio_rail: PLAIN_WRAPPER,
  company_banner_1: PLAIN_WRAPPER,
  offer_price: PLAIN_WRAPPER,
  company_banner_2: PLAIN_WRAPPER,
  promo_codes: PLAIN_WRAPPER,
  new_arrivals: PLAIN_WRAPPER,
  best_deals: PLAIN_WRAPPER,
  featured_products: PLAIN_WRAPPER,
  promo_banner: PLAIN_WRAPPER,
  blog: PLAIN_WRAPPER,
}

type RenderedSection = {
  id: HomeSectionId
  content: ReactNode
}

const renderSections = async (
  layout: HomeLayoutSection[],
  ctx: RenderContext
): Promise<RenderedSection[]> => {
  // Parallel on purpose: the old hard-coded JSX rendered section siblings
  // concurrently, and Promise.all keeps the data fetches overlapping the same
  // way (Next dedupes identical fetches either way).
  const results = await Promise.all(
    layout
      .filter((section) => section.enabled && RENDERERS[section.id])
      .map(async (section) => ({
        id: section.id,
        content: await RENDERERS[section.id](ctx),
      }))
  )

  return results.filter(
    (result): result is RenderedSection =>
      result.content !== null && result.content !== undefined
  )
}

/**
 * The storefront home body: sections rendered in the admin-configured order
 * (`store.metadata.home_layout`), with disabled or empty sections omitted.
 */
export const HomeSections = async ({ locale }: { locale: string }) => {
  const [layout, heroSlides] = await Promise.all([
    retrieveHomeLayout(),
    listHeroBanners(),
  ])

  const rendered = await renderSections(layout, { locale, heroSlides })
  if (!rendered.length) {
    return null
  }

  const blocks: ReactNode[] = []
  let cardRun: RenderedSection[] = []

  const flushCardRun = (key: string) => {
    if (!cardRun.length) return
    blocks.push(
      <div key={`${key}-card`} className={PLAIN_WRAPPER}>
        <div className="space-y-10 rounded-xl bg-white px-4 py-6 shadow-sm sm:px-6 lg:px-8">
          {cardRun.map((section) => (
            <div key={section.id}>{section.content}</div>
          ))}
        </div>
      </div>
    )
    cardRun = []
  }

  rendered.forEach((section) => {
    if (CARD_SECTIONS.has(section.id)) {
      cardRun.push(section)
      return
    }
    flushCardRun(`before-${section.id}`)
    const wrapper = WRAPPERS[section.id]
    blocks.push(
      <div key={section.id} className={wrapper ?? undefined}>
        {section.content}
      </div>
    )
  })
  flushCardRun("end")

  return (
    <div data-testid="home-sections">
      {blocks}
      <div aria-hidden className="pb-10" />
    </div>
  )
}
