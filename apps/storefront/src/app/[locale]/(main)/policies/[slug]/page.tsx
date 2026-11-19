import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getBaseUrl } from "@/lib/helpers/base-url"
import { getPolicyBySlug } from "@/lib/data/policies"
import { listRegions } from "@/lib/data/regions"
import { isRichText, sanitizeRichText } from "@/lib/helpers/sanitize-rich-text"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
} from "@/lib/helpers/hreflang"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const baseUrl = getBaseUrl()

  const policy = await getPolicyBySlug({ slug, countryCode: locale })
  if (!policy) {
    return {}
  }

  let locales: string[] = []
  try {
    locales = getStorefrontLocales(await listRegions())
  } catch {
    locales = [locale]
  }

  const { canonical, languages } = buildHreflangAlternates({
    baseUrl,
    path: `/policies/${slug}`,
    locale,
    locales,
  })

  const title = policy.title
  const description = policy.excerpt || policy.title

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
      type: "article",
    },
  }
}

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params

  const policy = await getPolicyBySlug({ slug, countryCode: locale })
  if (!policy) {
    notFound()
  }

  return (
    <main className="container py-8 max-w-3xl" data-testid="policy-detail-page">
      <article>
        <header className="mb-8">
          <h1 className="heading-xl mb-4">{policy.title}</h1>
          {policy.excerpt && (
            <p className="text-lg text-gray-700">{policy.excerpt}</p>
          )}
        </header>

        {policy.content && (
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{
              __html: isRichText(policy.content)
                ? sanitizeRichText(policy.content)
                : policy.content,
            }}
          />
        )}
      </article>
    </main>
  )
}
