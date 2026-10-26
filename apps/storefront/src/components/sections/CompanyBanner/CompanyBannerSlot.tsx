import Image from "next/image"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { listCompanyBanner } from "@/lib/data/hero-banners"

export const CompanyBannerSlot = async ({
  slot,
}: {
  slot: "company_1" | "company_2"
}) => {
  const banner = await listCompanyBanner(slot)
  if (!banner) return null

  return (
    <section data-testid={`company-banner-${slot}`}>
      <LocalizedClientLink
        href={banner.ctaLink ?? "/categories"}
        className="group block overflow-hidden rounded-xl"
      >
        <div className="relative aspect-[16/9] w-full md:aspect-[16/5]">
          <Image
            src={banner.image}
            alt={banner.title}
            fill
            sizes="(min-width: 1024px) 90vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 flex flex-col justify-center gap-1.5 px-6 md:gap-2 md:px-12">
            {banner.subtitle ? (
              <p className="text-xs font-medium uppercase tracking-widest text-white/85 md:text-sm">
                {banner.subtitle}
              </p>
            ) : null}
            <h2 className="max-w-2xl text-xl font-bold text-white md:text-3xl">
              {banner.title}
            </h2>
            {banner.description ? (
              <p className="hidden max-w-xl text-sm text-white/85 md:block">
                {banner.description}
              </p>
            ) : null}
            {banner.ctaText ? (
              <span className="mt-2 w-fit rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase text-black transition-colors group-hover:bg-[rgb(var(--brand-500))] group-hover:text-white md:rounded-sm md:px-5 md:py-2 md:text-sm">
                {banner.ctaText}
              </span>
            ) : null}
          </div>
        </div>
      </LocalizedClientLink>
    </section>
  )
}
