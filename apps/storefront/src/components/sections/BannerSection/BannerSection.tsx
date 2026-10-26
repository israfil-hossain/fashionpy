import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import Image from "next/image"

export const BannerSection = () => {
  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center overflow-hidden rounded-xl border border-gray-100 bg-white">
        <div className="py-8 px-6 flex flex-col h-full items-center justify-center gap-5 text-center lg:py-16">
          <div className="flex flex-col items-center gap-4">
            <span className="text-xs inline-block px-4 py-1 border border-secondary rounded-full">
              #COLLECTION
            </span>
            <h2 className="display-sm">
              BOHO VIBES: WHERE COMFORT MEETS CREATIVITY
            </h2>
            <p className="text-base text-gray-600 max-w-lg">
              Discover boho styles that inspire adventure and embrace the beauty
              of the unconventional.
            </p>
          </div>
          <LocalizedClientLink href="/collections/boho">
            <Button
              size="large"
              className="rounded-full px-8 text-white md:rounded-sm md:px-6 bg-[rgb(var(--brand-500))] hover:bg-[rgb(var(--brand-600))]"
            >
              EXPLORE
            </Button>
          </LocalizedClientLink>
        </div>
        <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full flex justify-end">
          <Image
            loading="lazy"
            fetchPriority="high"
            src="/images/banner-section/Image.jpg"
            alt="Boho fashion collection - Model wearing a floral dress with yellow boots"
            width={700}
            height={600}
            className="object-cover object-top"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
      </div>
    </section>
  )
}
