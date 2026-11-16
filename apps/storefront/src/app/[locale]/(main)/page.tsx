import { HomeSections } from '@/components/sections/HomeSections/HomeSections'

import type { Metadata } from "next"
import { getBaseUrl } from "@/lib/helpers/base-url"
import Script from "next/script"
import { listRegions } from "@/lib/data/regions"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
  toHreflang,
} from "@/lib/helpers/hreflang"
import { defaultOgImage } from "@/lib/helpers/og-image"

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
      images: defaultOgImage(baseUrl),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: defaultOgImage(baseUrl),
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

      <HomeSections locale={locale} />
    </main>
  )
}