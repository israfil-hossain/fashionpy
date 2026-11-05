import type { Metadata } from "next"

import { getBaseUrl } from "@/lib/helpers/base-url"
import { listBlogPosts } from "@/lib/data/blog-posts"
import { listRegions } from "@/lib/data/regions"
import { BlogCard } from "@/components/organisms/BlogCard/BlogCard"
import { ProductsPagination } from "@/components/organisms/ProductsPagination/ProductsPagination"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
} from "@/lib/helpers/hreflang"

const BLOG_LIMIT = 12

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
    path: "/blog",
    locale,
    locales,
  })

  const title = "Blog"
  const description = `Latest stories and updates - ${
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

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export default async function BlogListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  const sp = await searchParams
  const page = Math.max(Number(firstValue(sp.page)) || 1, 1)

  const { blog_posts, count } = await listBlogPosts({
    countryCode: locale,
    page,
    limit: BLOG_LIMIT,
  })

  const pages = Math.ceil(count / BLOG_LIMIT) || 1

  return (
    <main className="container py-8" data-testid="blog-list-page">
      <h1 className="heading-xl uppercase mb-8">Blog</h1>
      {blog_posts.length === 0 ? (
        <p className="text-md text-gray-600">No posts yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blog_posts.map((post, index) => (
              <BlogCard key={post.id} index={index} post={post} alwaysShow />
            ))}
          </div>
          {pages > 1 && <ProductsPagination pages={pages} />}
        </>
      )}
    </main>
  )
}
