export type BlogPostStatus = "draft" | "published"

export interface BlogCategoryDTO {
  id: string
  name: string
  slug: string
  metadata: Record<string, unknown> | null
  created_at: Date | string
  updated_at: Date | string
  deleted_at?: Date | string | null
}

export interface BlogPostDTO {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  cover_image_id: string | null
  cover_image_url: string | null
  status: BlogPostStatus
  published_at: Date | string | null
  unpublished_at: Date | string | null
  country_codes: string[] | null
  category_id: string | null
  category?: BlogCategoryDTO | null
  tags: string[] | null
  author: string | null
  metadata: Record<string, unknown> | null
  created_at: Date | string
  updated_at: Date | string
  deleted_at?: Date | string | null
}
