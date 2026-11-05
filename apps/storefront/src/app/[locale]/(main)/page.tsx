import { BannerSection } from '@/components/sections/BannerSection/BannerSection'
import { BlogSection } from '@/components/sections/BlogSection/BlogSection'
import { HeroCarousel } from '@/components/sections/HeroCarousel/HeroCarousel'
import { TrustBarSection } from '@/components/sections/TrustBar/TrustBarSection'
import { CategoryStrip } from '@/components/sections/CategoryStrip/CategoryStrip'
import { TabbedProductGrid } from '@/components/sections/TabbedProductGrid/TabbedProductGrid'
import { NewArrivalsSection } from '@/components/sections/NewArrivalsSection/NewArrivalsSection'
import { BestDealsSection } from '@/components/sections/BestDealsSection/BestDealsSection'
import { CollectionSliderSection } from '@/components/sections/CollectionSlider/CollectionSliderSection'
import { CompanyBannerSlot } from '@/components/sections/CompanyBanner/CompanyBannerSlot'
import { OfferPriceSection } from '@/components/sections/OfferPrice/OfferPriceSection'
import { ShopCollectionBanners } from '@/components/sections/ShopCollectionBanners/ShopCollectionBanners'

import type { Metadata } from "next"
import { getBaseUrl } from "@/lib/helpers/base-url"
import Script from "next/script"
import { listRegions } from "@/lib/data/regions"
import { listHeroBanners } from "@/lib/data/hero-banners"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
  toHreflang,
} from "@/lib/helpers/hreflang"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  const baseUrl = getBaseUrl()

  let locales: string[] = []
  try {
    locales = getStorefrontLocales(await listRegions())
  } catch {
    locales = [locale]
  }

  const { canonical, languages } = buildHreflangAlternates({
    baseUrl,
    path: "",
    locale,
    locales,
  })

  const title = "Home"
  const description =
    "Welcome to FashionPy! Create a modern marketplace that you own and customize in every aspect with high-performance, fully customizable storefront."
  const ogImage = "/B2C_Storefront_Open_Graph.png"

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-video-preview": -1,
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: `${title} | ${
        process.env.NEXT_PUBLIC_SITE_NAME ||
        "FashionPy - Marketplace Storefront"
      }`,
      description,
      url: canonical,
      siteName:
        process.env.NEXT_PUBLIC_SITE_NAME ||
        "FashionPy - Marketplace Storefront",
      type: "website",
      images: [
        {
          url: ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`,
          width: 1200,
          height: 630,
          alt:
            process.env.NEXT_PUBLIC_SITE_NAME ||
            "FashionPy - Marketplace Storefront",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`],
    },
  }
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const baseUrl = getBaseUrl()

  const siteName =
    process.env.NEXT_PUBLIC_SITE_NAME ||
    "FashionPy - Marketplace Storefront"

  const heroSlides = await listHeroBanners()

  return (
    <main className="min-h-screen bg-[#FFF5F8] text-primary">
      <Script
        id="ld-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: siteName,
            url: `${baseUrl}/${locale}`,
            logo: `${baseUrl}/favicon.ico`,
          }),
        }}
      />
      <Script
        id="ld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: siteName,
            url: `${baseUrl}/${locale}`,
            inLanguage: toHreflang(locale),
          }),
        }}
      />

      <HeroCarousel slides={heroSlides} />
      <div className="pt-3">
        <CategoryStrip />
      </div>
      <div className="px-4 pt-3 lg:px-16">
        <TrustBarSection />
      </div>
      <div className="px-4 pt-5 lg:px-16">
        <CollectionSliderSection />
      </div>
      <div className="px-4 pt-5 lg:px-16">
        <ShopCollectionBanners />
      </div>
      <div className="space-y-5 px-4 pt-5 lg:px-16">
        <CompanyBannerSlot slot="company_1" />
        <OfferPriceSection />
        <CompanyBannerSlot slot="company_2" />
      </div>
      <div className="w-full px-4 pb-10 pt-5 lg:px-16">
        <div className="space-y-10 rounded-xl bg-white px-4 py-6 shadow-sm sm:px-6 lg:px-8">
          <NewArrivalsSection locale={locale} />
          <BestDealsSection locale={locale} />
          <TabbedProductGrid locale={locale} />
          <BannerSection />
          <BlogSection locale={locale} />
        </div>
      </div>
    </main>
  )
}