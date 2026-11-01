import Image from "next/image"
import Link from "next/link"
import { ArrowRightIcon } from "@/icons"
import { listShopCollectionBanners } from "@/lib/data/hero-banners"

export const ShopCollectionBanners = async () => {
  const banners = await listShopCollectionBanners()
  if (!banners.length) return null

  return (
    <section data-testid="shop-collection-banners">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {banners.map((banner) => (
          <Link
            key={banner.id}
            href={banner.ctaLink ?? "/categories"}
            className="group relative block aspect-[16/9] w-[85%] shrink-0 snap-start overflow-hidden rounded-xl sm:w-[60%] lg:w-[48%] xl:w-[32%]"
          >
            <Image
              src={banner.image}
              alt={banner.title}
              fill
              sizes="(min-width: 1280px) 32vw, (min-width: 1024px) 48vw, (min-width: 640px) 60vw, 85vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end gap-1 p-4 md:p-6">
              {banner.subtitle ? (
                <p className="text-xs font-medium uppercase tracking-widest text-white/85">
                  {banner.subtitle}
                </p>
              ) : null}
              <h3 className="text-lg font-bold text-white md:text-2xl">
                {banner.title}
              </h3>
              {banner.ctaText ? (
                <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-black transition-colors group-hover:bg-[rgb(var(--brand-500))] group-hover:text-white">
                  {banner.ctaText}
                  <ArrowRightIcon size={14} />
                </span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
