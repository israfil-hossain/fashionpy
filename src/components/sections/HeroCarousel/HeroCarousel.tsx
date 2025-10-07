"use client"

import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules"
import Image from "next/image"
import Link from "next/link"
import { ArrowRightIcon } from "@/icons"

import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/navigation"
import "swiper/css/effect-fade"

type Slide = {
  id: number
  image: string
  title: string
  subtitle: string
  description: string
  ctaText: string
  ctaLink: string
  textPosition: "left" | "center" | "right"
}

const slides: Slide[] = [
  {
    id: 1,
    image: "/images/hero/banner-1.jpg",
    title: "New Collection 2025",
    subtitle: "Fashion Trends",
    description: "Discover the latest trends in fashion",
    ctaText: "Shop Now",
    ctaLink: "/categories",
    textPosition: "left",
  },
  {
    id: 2,
    image: "/images/hero/banner-2.jpg",
    title: "Summer Sale",
    subtitle: "Up to 50% Off",
    description: "Don't miss out on incredible deals",
    ctaText: "Explore Deals",
    ctaLink: "/categories",
    textPosition: "center",
  },
  {
    id: 3,
    image: "/images/hero/banner-3.jpg",
    title: "Trending Now",
    subtitle: "Street Style",
    description: "Express yourself with unique pieces",
    ctaText: "Browse Collection",
    ctaLink: "/categories",
    textPosition: "right",
  },
]

export const HeroCarousel = () => {
  return (
    <section className="w-full relative">
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
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px]">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                priority={slide.id === 1}
                quality={90}
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
                      <p className="text-white/90 text-sm md:text-base font-medium mb-2 uppercase tracking-wider">
                        {slide.subtitle}
                      </p>
                      <h1 className="text-white text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
                        {slide.title}
                      </h1>
                      <p className="text-white/90 text-base md:text-lg mb-8 max-w-xl">
                        {slide.description}
                      </p>
                      <Link
                        href={slide.ctaLink}
                        className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-sm font-bold uppercase text-sm md:text-base hover:bg-black hover:text-white transition-all duration-300 group"
                      >
                        {slide.ctaText}
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
