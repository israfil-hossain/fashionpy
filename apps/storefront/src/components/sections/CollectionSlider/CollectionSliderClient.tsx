"use client"

import Image from "next/image"
import { useRef } from "react"

import { ArrowLeftIcon, ArrowRightIcon } from "@/icons"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ScrollReveal } from "@/components/molecules/ScrollReveal/ScrollReveal"

export type CollectionSlide = {
  id: string
  title: string
  handle: string
  image: string | null
}

export const CollectionSliderClient = ({ slides }: { slides: CollectionSlide[] }) => {
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollByDir = (dir: number) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: dir * track.clientWidth * 0.65, behavior: "smooth" })
  }

  return (
    <section data-testid="collection-slider">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-primary md:text-xl">
          Shop by Collection
        </h2>
        <div className="hidden gap-2 md:flex">
          <button
            type="button"
            aria-label="Previous collections"
            onClick={() => scrollByDir(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-[rgb(var(--brand-500))] hover:text-[rgb(var(--brand-500))]"
          >
            <ArrowLeftIcon size={18} />
          </button>
          <button
            type="button"
            aria-label="Next collections"
            onClick={() => scrollByDir(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-[rgb(var(--brand-500))] hover:text-[rgb(var(--brand-500))]"
          >
            <ArrowRightIcon size={18} />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar flex gap-5 overflow-x-auto scroll-smooth pb-1"
      >
        {slides.map((slide, index) => (
          <ScrollReveal
            key={slide.id}
            delay={Math.min(index, 4) * 0.08}
            className="w-[78%] shrink-0 sm:w-[52%] lg:w-[34%] xl:w-[26%]"
          >
            <LocalizedClientLink
              href={`/collections/${slide.handle}`}
              className="group block"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 sm:aspect-[16/9]">
                {slide.image ? (
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    sizes="(min-width: 1024px) 34vw, (min-width: 640px) 52vw, 78vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--brand-100))] to-[#ffe4f0]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                  <h3 className="text-base font-bold text-white md:text-xl">
                    {slide.title}
                  </h3>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/90">
                    Shop Now
                    <ArrowRightIcon size={14} />
                  </span>
                </div>
              </div>
            </LocalizedClientLink>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
