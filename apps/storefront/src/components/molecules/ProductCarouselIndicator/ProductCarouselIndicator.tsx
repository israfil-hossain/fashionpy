"use client"
import { HttpTypes } from "@medusajs/types"
import { EmblaCarouselType } from "embla-carousel"
import { useCallback, useEffect, useState } from "react"
import { Indicator } from "@/components/atoms/Indicator/Indicator"

/**
 * Mobile progress indicator only. Desktop thumbnails live in
 * `product-thumbnail-rail` inside ProductCarousel.
 */
export const ProductCarouselIndicator = ({
  slides = [],
  embla: parentEmbla,
}: {
  slides: HttpTypes.StoreProduct["images"]
  embla?: EmblaCarouselType
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!parentEmbla) return

    onSelect(parentEmbla)
    parentEmbla.on("reInit", onSelect).on("select", onSelect)
  }, [parentEmbla, onSelect])

  if (!slides?.length) return null

  return (
    <div className="absolute bottom-3 left-3 z-10 w-[calc(100%-24px)] lg:hidden">
      <Indicator
        step={selectedIndex + 1}
        size="large"
        maxStep={slides.length}
        data-testid="product-carousel-indicator"
      />
    </div>
  )
}
