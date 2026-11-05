import { BlogPostStatus } from "./common"

export interface CreateBlogCategoryDTO {
  name: string
  slug: string
  metadata?: Record<string, unknown> | null
}

export interface UpdateBlogCategoryDTO {
  name?: string
  slug?: string
  metadata?: Record<string, unknown> | null
}

export interface CreateBlogPostDTO {
  title: string
  slug?: string
  excerpt?: string | null
  content?: string | null
  cover_image_id?: string | null
  cover_image_url?: string | null
  status?: BlogPostStatus
  published_at?: Date | null
  unpublished_at?: Date | null
  country_codes?: string[] | null
  category_id?: string | null
  tags?: string[] | null
  author?: string | null
  metadata?: Record<string, unknown> | null
}

export interface UpdateBlogPostDTO {
  title?: string
  slug?: string
  excerpt?: string | null
  content?: string | null
  cover_image_id?: string | null
  cover_image_url?: string | null
  status?: BlogPostStatus
  published_at?: Date | null
  unpublished_at?: Date | null
  country_codes?: string[] | null
  category_id?: string | null
  tags?: string[] | null
  author?: string | null
  metadata?: Record<string, unknown> | null
}
