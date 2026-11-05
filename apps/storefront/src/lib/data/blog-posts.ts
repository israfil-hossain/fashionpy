"use server"

import { sdk } from "../client"

export type StoreBlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content?: string | null
  cover_image_url: string | null
  published_at: string | null
  tags: string[] | null
  author: string | null
  category_id: string | null
  category?: { id: string; name: string; slug: string } | null
}

export type StoreBlogCategory = {
  id: string
  name: string
  slug: string
}

const mapPost = (post: StoreBlogPost) => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt,
  image: post.cover_image_url,
  category: post.category ?? null,
  tags: post.tags ?? [],
  author: post.author,
  published_at: post.published_at,
  href: `/blog/${post.slug}`,
})

export const listBlogPosts = async ({
  countryCode,
  page = 1,
  limit = 12,
  category,
}: {
  countryCode?: string
  page?: number
  limit?: number
  category?: string
}) => {
  try {
    const offset = Math.max(page - 1, 0) * limit
    const res = (await (sdk.store.blog_posts.query({
      limit,
      offset,
      ...(countryCode ? { country_code: countryCode } : {}),
      ...(category ? { category_id: category } : {}),
      fetchOptions: {
        cache: "no-store",
      },
    } as never))) as {
      blog_posts?: StoreBlogPost[]
      count?: number
      limit?: number
      offset?: number
    }

    return {
      blog_posts: (res?.blog_posts ?? []).map(mapPost),
      count: res?.count ?? 0,
      limit: res?.limit ?? limit,
      offset: res?.offset ?? 0,
    }
  } catch {
    return { blog_posts: [], count: 0, limit, offset: 0 }
  }
}

export const getBlogPostBySlug = async ({
  slug,
  countryCode,
}: {
  slug: string
  countryCode?: string
}) => {
  try {
    const res = (await (sdk.store.blog_posts.$slug.query({
      $slug: slug,
      ...(countryCode ? { country_code: countryCode } : {}),
      fetchOptions: { cache: "no-store" },
    } as never))) as { blog_post?: StoreBlogPost }

    return res?.blog_post ?? null
  } catch {
    return null
  }
}

export const listBlogCategories = async () => {
  try {
    const res = (await (sdk.store.blog_categories.query({
      limit: 50,
      fetchOptions: { cache: "no-store" },
    } as never))) as { blog_categories?: StoreBlogCategory[] }

    return res?.blog_categories ?? []
  } catch {
    return []
  }
}
