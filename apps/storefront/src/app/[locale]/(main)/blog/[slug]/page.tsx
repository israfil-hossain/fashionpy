import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"

import { getBaseUrl } from "@/lib/helpers/base-url"
import { getBlogPostBySlug } from "@/lib/data/blog-posts"
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

  const post = await getBlogPostBySlug({ slug, countryCode: locale })
  if (!post) {
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
    path: `/blog/${slug}`,
    locale,
    locales,
  })

  const title = post.title
  const description = post.excerpt || post.title

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
      images: post.cover_image_url
        ? [{ url: post.cover_image_url, width: 1200, height: 630, alt: title }]
        : undefined,
    },
  }
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params

  const post = await getBlogPostBySlug({ slug, countryCode: locale })
  if (!post) {
    notFound()
  }

  const published = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <main className="container py-8 max-w-3xl" data-testid="blog-detail-page">
      <article>
        <header className="mb-8">
          {post.category && (
            <div className="uppercase label-md text-gray-500 mb-2">
              {post.category.name}
            </div>
          )}
          <h1 className="heading-xl mb-4">{post.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {published && (
              <time dateTime={post.published_at ?? undefined}>{published}</time>
            )}
            {post.author && <span>By {post.author}</span>}
          </div>
        </header>

        {post.cover_image_url && (
          <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded">
            <Image
              src={decodeURIComponent(post.cover_image_url)}
              alt={post.title}
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        )}

        {post.excerpt && (
          <p className="text-lg text-gray-700 mb-6">{post.excerpt}</p>
        )}

        {post.content && (
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{
              __html: isRichText(post.content)
                ? sanitizeRichText(post.content)
                : post.content,
            }}
          />
        )}

        {post.tags?.length ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="border border-secondary px-3 py-1 text-sm uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </article>
    </main>
  )
}
