"use client"

import useEmblaCarousel from "embla-carousel-react"
import { EmblaCarouselType } from "embla-carousel"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { ProductImageMagnifier } from "@/components/molecules/ProductImageMagnifier/ProductImageMagnifier"
import { ProductCarouselIndicator } from "@/components/molecules/ProductCarouselIndicator/ProductCarouselIndicator"
import { WishlistButton } from "@/components/cells/WishlistButton/WishlistButton"
import { useScreenSize } from "@/hooks/useScreenSize"
import { cn } from "@/lib/utils"
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons"
import { Wishlist } from "@/types/wishlist"

export const ProductCarousel = ({
  slides = [],
  productId,
  user,
  wishlist,
}: {
  slides: HttpTypes.StoreProduct["images"]
  productId?: string
  user?: Parameters<typeof WishlistButton>[0]["user"]
  wishlist?: Wishlist[]
}) => {
  const screenSize = useScreenSize()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis:
      screenSize === "xs" || screenSize === "sm" || screenSize === "md"
        ? "x"
        : "y",
    loop: true,
    align: "start",
  })

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on("reInit", onSelect).on("select", onSelect)
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <div className="flex w-full gap-3" data-testid="product-carousel">
      {/* Desktop thumbnail rail — sibling column, not overlaid */}
      <div
        className="hidden w-16 shrink-0 flex-col gap-2 lg:flex"
        data-testid="product-thumbnail-rail"
      >
        {(slides || []).map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Show image ${index + 1}`}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "h-16 w-16 shrink-0 overflow-hidden rounded-sm border-2 transition-colors duration-300",
              selectedIndex === index ? "border-primary" : "border-tertiary"
            )}
            data-testid={`product-thumbnail-${index}`}
          >
            <Image
              src={decodeURIComponent(slide.url)}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      <div className="relative min-w-0 flex-1" data-testid="product-carousel-main">
        <div className="embla relative" data-testid="product-carousel-viewport">
          <div
            className="embla__viewport overflow-hidden rounded-xs"
            ref={emblaRef}
          >
            <div
              className="embla__container h-[350px] lg:h-fit max-h-[698px] flex lg:block"
              data-testid="product-carousel-container"
            >
              {(slides || []).map((slide, idx) => (
                <div
                  key={slide.id}
                  className="embla__slide min-w-0 h-[350px] lg:h-fit"
                  data-testid={`product-carousel-slide-${idx}`}
                >
                  <ProductImageMagnifier src={slide.url} alt="Product image">
                    <Image
                      priority={idx === 0}
                      fetchPriority={idx === 0 ? "high" : "auto"}
                      src={decodeURIComponent(slide.url)}
                      alt="Product image"
                      width={700}
                      height={700}
                      quality={idx === 0 ? 85 : 70}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="max-h-[700px] w-full h-auto aspect-square object-contain object-center"
                      data-testid={`product-carousel-image-${idx}`}
                    />
                  </ProductImageMagnifier>
                </div>
              ))}
            </div>
          </div>
        </div>

        {slides && slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={scrollPrev}
              className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary/80 text-primary shadow-sm transition hover:bg-primary"
              data-testid="product-carousel-prev"
            >
              <ArrowLeftIcon size={18} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={scrollNext}
              className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary/80 text-primary shadow-sm transition hover:bg-primary"
              data-testid="product-carousel-next"
            >
              <ArrowRightIcon size={18} />
            </button>
          </>
        )}

        {productId && (
          <div className="absolute right-3 top-3 z-10">
            <WishlistButton productId={productId} wishlist={wishlist} user={user} />
          </div>
        )}

        {slides?.length ? (
          <ProductCarouselIndicator slides={slides} embla={emblaApi} />
        ) : null}
      </div>
    </div>
  )
}
