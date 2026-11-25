import { notFound } from "next/navigation"
import { Suspense } from "react"

import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { SellerPageHeader } from '@/components/sections/SellerPageHeader/SellerPageHeader';
import { SellerSections } from '@/components/sections/SellerSections/SellerSections';
import {
  decodeSellerStorefrontLayout,
  normalizeSellerStorefrontLayout,
  SELLER_STOREFRONT_LAYOUT_KEY,
} from '@mercurjs/types';
import { retrieveCustomer } from "@/lib/data/customer"
import { listRegions } from "@/lib/data/regions"
import { getSellerByHandle } from "@/lib/data/seller"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
} from "@/lib/helpers/hreflang"
import { defaultOgImage } from "@/lib/helpers/og-image"
import type { Metadata } from "next"
import { getBaseUrl } from "@/lib/helpers/base-url"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}): Promise<Metadata> {
  const { handle, locale } = await params

  const seller = await getSellerByHandle(handle)
  if (!seller) {
    return {}
  }

  const baseUrl = getBaseUrl()

  let locales: string[] = []
  try {
    locales = getStorefrontLocales(await listRegions())
  } catch {
    locales = [locale]
  }

  const { canonical, languages } = buildHreflangAlternates({
    baseUrl,
    path: `/sellers/${handle}`,
    locale,
    locales,
  })

  const title = seller.name
  const description = `${seller.name} - ${
    process.env.NEXT_PUBLIC_SITE_NAME || "Storefront"
  }`

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: `${title} | ${process.env.NEXT_PUBLIC_SITE_NAME || "Storefront"}`,
      description,
      url: canonical,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Storefront",
      type: "website",
      images: defaultOgImage(baseUrl),
    },
  }
}

export default function SellerPage(props: PageProps<"/[locale]/sellers/[handle]">) {
  return (
    <main className="container">
      <Suspense fallback={<RouteFallback />}>
        <SellerContent {...props} />
      </Suspense>
    </main>
  )
}

async function SellerContent({ params, searchParams }: PageProps<"/[locale]/sellers/[handle]">) {
  const { handle, locale } = await params
  const { page, layout } = (await searchParams) as {
    page?: string
    layout?: string
  }

  const [seller, user] = await Promise.all([
    getSellerByHandle(handle),
    retrieveCustomer(),
  ])

  if (!seller) {
    notFound()
  }

  const pageNumber = typeof page === "string" ? parseInt(page, 10) || 1 : 1

  const sections =
    decodeSellerStorefrontLayout(layout) ??
    normalizeSellerStorefrontLayout(
      (seller.metadata as Record<string, unknown> | null)?.[
        SELLER_STOREFRONT_LAYOUT_KEY
      ] ?? null
    )

  return (
    <>
      <SellerPageHeader header seller={seller} user={user} />
      <SellerSections
        seller={seller}
        locale={locale}
        page={pageNumber}
        sections={sections}
      />
    </>
  )
}
