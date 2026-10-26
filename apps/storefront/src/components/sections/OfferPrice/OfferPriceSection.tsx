import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { listOfferBanner } from "@/lib/data/hero-banners"

export const OfferPriceSection = async () => {
  const banner = await listOfferBanner()
  if (!banner) return null

  return (
    <section data-testid="offer-price-strip">
      <LocalizedClientLink href={banner.ctaLink ?? "/categories"} className="block">
        <div className="flex items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-[rgb(var(--brand-500))] to-[#ff3d8b] px-5 py-4 md:px-10 md:py-6">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-widest text-white/85 md:text-sm">
              {banner.title}
            </p>
            <p className="mt-0.5 truncate text-2xl font-extrabold text-white md:text-4xl">
              {banner.subtitle ?? banner.description ?? ""}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase text-[rgb(var(--brand-600))] md:px-6 md:py-2.5 md:text-sm">
            {banner.ctaText ?? "Shop Now"}
          </span>
        </div>
      </LocalizedClientLink>
    </section>
  )
}
