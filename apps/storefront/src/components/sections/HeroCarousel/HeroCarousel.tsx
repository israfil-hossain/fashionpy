"use client"

import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules"
import Image from "next/image"
import Link from "next/link"
import { ArrowRightIcon } from "@/icons"
import { SearchBar } from "@/components/molecules/SearchBar/SearchBar"

import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/navigation"
import "swiper/css/effect-fade"

import type { HeroBannerSlide } from "@/lib/data/hero-banners"

type Slide = HeroBannerSlide

export const HeroCarousel = ({ slides }: { slides: Slide[] }) => {
  if (!slides || slides.length === 0) return null
  return (
    <section className="w-full relative" data-testid="hero-carousel">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        loop={true}
        className="hero-swiper"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-[240px] md:h-[360px] lg:h-[420px]">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                priority={i === 0}
                quality={90}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

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
                      <p className="text-white/90 text-xs md:text-sm font-medium mb-2 uppercase tracking-wider">
                        {slide.subtitle ?? ""}
                      </p>
                      <h1 className="text-white text-2xl md:text-5xl lg:text-6xl font-bold mb-3 leading-tight">
                        {slide.title}
                      </h1>
                      <p className="hidden md:block text-white/90 text-base mb-5 max-w-xl">
                        {slide.description ?? ""}
                      </p>
                      <Link
                        href={slide.ctaLink ?? "/categories"}
                        className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 text-xs rounded-full md:gap-3 md:px-6 md:py-3 md:rounded-sm md:text-sm font-bold uppercase hover:bg-black hover:text-white transition-all duration-300 group"
                      >
                        {slide.ctaText ?? "Shop Now"}
                        <ArrowRightIcon
                          size={20}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div
        className="absolute inset-x-0 bottom-4 z-10 flex justify-center px-4 md:bottom-8"
        data-testid="hero-search"
      >
        <div className="w-full max-w-[560px] md:max-w-[720px]">
          <SearchBar size="large" />
        </div>
      </div>

      <style jsx global>{`
        .hero-swiper .swiper-button-next,
        .hero-swiper .swiper-button-prev {
          color: white;
          background: rgba(0, 0, 0, 0.5);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          transition: all 0.3s;
        }

        .hero-swiper .swiper-button-next:hover,
        .hero-swiper .swiper-button-prev:hover {
          background: rgba(0, 0, 0, 0.8);
          transform: scale(1.1);
        }

        .hero-swiper .swiper-button-next::after,
        .hero-swiper .swiper-button-prev::after {
          font-size: 20px;
        }

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

        @media (max-width: 767px) {
          .hero-swiper .swiper-pagination {
            bottom: 64px;
          }

          .hero-swiper .swiper-button-next,
          .hero-swiper .swiper-button-prev {
            display: none;
          }
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
