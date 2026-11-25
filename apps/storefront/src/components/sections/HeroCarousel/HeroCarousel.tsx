"use client"

import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination, EffectFade } from "swiper/modules"
import Image from "next/image"
import Link from "next/link"
import { ArrowRightIcon } from "@/icons"

import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/effect-fade"

import type { HeroBannerSlide } from "@/lib/data/hero-banners"
import { hasHeroText } from "@/lib/helpers/hero-slide"

type Slide = HeroBannerSlide

export const HeroCarousel = ({ slides }: { slides: Slide[] }) => {
  const visibleSlides = slides.slice(0, 5)
  if (!visibleSlides.length) return null
  return (
    <section className="w-full relative" data-testid="hero-carousel">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        spaceBetween={0}
        slidesPerView={1}
        pagination={{
          clickable: true,
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        loop={visibleSlides.length > 1}
        className="hero-swiper overflow-hidden rounded-2xl"
      >
        {visibleSlides.map((slide, i) => {
          const showText = hasHeroText(slide)
          const showButton =
            slide.ctaActive && Boolean(slide.ctaText || slide.ctaLink)
          const showOverlay = showText || showButton

          const content = (
            <>
              <Image
                src={slide.image}
                alt={slide.title ?? ""}
                fill
                className="object-cover"
                priority={i === 0}
                quality={90}
                sizes="100vw"
              />
              {showOverlay && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
              )}
              {showOverlay && (
                <div className="absolute inset-0 flex items-center">
                  <div
                    className={`container mx-auto px-4 lg:px-8 ${
                      slide.textPosition === "center"
                        ? "text-center"
                        : slide.textPosition === "right"
                          ? "text-right ml-auto"
                          : ""
                    }`}
                  >
                    <div
                      className={`max-w-2xl ${
                        slide.textPosition === "center"
                          ? "mx-auto"
                          : slide.textPosition === "right"
                            ? "ml-auto"
                            : ""
                      }`}
                    >
                      <div className="animate-fade-in-up">
                        {slide.subtitle ? (
                          <p className="text-white/90 text-xs md:text-sm font-medium mb-2 uppercase tracking-wider">
                            {slide.subtitle}
                          </p>
                        ) : null}
                        {slide.title ? (
                          <h1 className="text-white text-2xl md:text-5xl lg:text-6xl font-bold mb-3 leading-tight">
                            {slide.title}
                          </h1>
                        ) : null}
                        {slide.description ? (
                          <p className="hidden md:block text-white/90 text-base mb-5 max-w-xl">
                            {slide.description}
                          </p>
                        ) : null}
                        {showButton && (
                          <span
                            className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 text-xs rounded-full md:gap-3 md:px-6 md:py-3 md:rounded-sm md:text-sm font-bold uppercase group"
                            data-testid="hero-cta"
                          >
                            {slide.ctaText ?? "Shop Now"}
                            <ArrowRightIcon
                              size={20}
                              className="group-hover:translate-x-1 transition-transform"
                            />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )

          return (
            <SwiperSlide key={slide.id}>
              {slide.ctaLink ? (
                <Link
                  href={slide.ctaLink}
                  className="relative block h-[240px] w-full md:h-[360px] lg:h-[420px]"
                  data-testid="hero-image-link"
                >
                  {content}
                </Link>
              ) : (
                <div className="relative h-[240px] w-full md:h-[360px] lg:h-[420px]">
                  {content}
                </div>
              )}
            </SwiperSlide>
          )
        })}
      </Swiper>

      <style jsx global>{`
        .hero-swiper .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
          background: white;
          opacity: 0.7;
        }

        .hero-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          background: white;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
      `}</style>
    </section>
  )
}
