import type { Metadata } from "next"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { getBaseUrl } from "@/lib/helpers/base-url"
import { listPolicies } from "@/lib/data/policies"
import { listRegions } from "@/lib/data/regions"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
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
    path: "/policies",
    locale,
    locales,
  })

  const title = "Policies"
  const description = `Store policies - ${
    process.env.NEXT_PUBLIC_SITE_NAME || "Storefront"
  }`

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical, languages },
    openGraph: {
      title: `${title} | ${process.env.NEXT_PUBLIC_SITE_NAME || "Storefront"}`,
      description,
      url: canonical,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Storefront",
      type: "website",
    },
  }
}

export default async function PolicyListPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const policies = await listPolicies({ countryCode: locale })

  return (
    <main className="container py-8 max-w-3xl" data-testid="policy-list-page">
      <h1 className="heading-xl mb-8">Policies</h1>
      {policies.length === 0 ? (
        <p className="text-gray-600">No policy pages have been published yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {policies.map((policy) => (
            <li key={policy.id}>
              <LocalizedClientLink
                href={`/policies/${policy.slug}`}
                className="text-lg font-medium text-gray-900 hover:text-[rgb(var(--brand-500))] transition-colors"
              >
                {policy.title}
              </LocalizedClientLink>
              {policy.excerpt && (
                <p className="text-sm text-gray-600">{policy.excerpt}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
