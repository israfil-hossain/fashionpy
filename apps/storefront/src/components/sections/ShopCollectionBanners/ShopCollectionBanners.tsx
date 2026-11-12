import Image from "next/image"
import { ArrowRightIcon } from "@/icons"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { listCollections } from "@/lib/data/collections"
import {
  COLLECTION_MEDIA_FIELDS,
  pickCollectionImage,
  type CollectionWithMedia,
} from "@/lib/helpers/collection-image"

type CollectionBanner = {
  id: string
  title: string
  href: string
  image: string | null
}

/**
 * Wide collection cards on the homepage, sourced from the product collections
 * themselves (title, handle, `is_banner` artwork) so no separate banner has to
 * be created in the admin banner page.
 */
export const ShopCollectionBanners = async () => {
  const { collections } = await listCollections({
    fields: `id,title,handle,${COLLECTION_MEDIA_FIELDS}`,
  })

  const banners: CollectionBanner[] = (collections as CollectionWithMedia[]).map(
    (collection) => ({
      id: collection.id,
      title: collection.title,
      href: `/collections/${collection.handle}`,
      image: pickCollectionImage(collection, "banner"),
    })
  )

  if (!banners.length) return null

  return (
    <section data-testid="shop-collection-banners">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {banners.map((banner) => (
          <LocalizedClientLink
            key={banner.id}
            href={banner.href}
            className="group relative block aspect-[16/9] w-[85%] shrink-0 snap-start overflow-hidden rounded-xl sm:w-[60%] lg:w-[48%] xl:w-[32%]"
          >
            {banner.image ? (
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                sizes="(min-width: 1280px) 32vw, (min-width: 1024px) 48vw, (min-width: 640px) 60vw, 85vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--brand-100))] to-[#ffe4f0]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end gap-1 p-4 md:p-6">
              <h3 className="text-lg font-bold text-white md:text-2xl">
                {banner.title}
              </h3>
              <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-black transition-colors group-hover:bg-[rgb(var(--brand-500))] group-hover:text-white">
                Shop Now
                <ArrowRightIcon size={14} />
              </span>
            </div>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}
