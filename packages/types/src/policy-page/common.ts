export type PolicyPageStatus = "draft" | "published"

export interface PolicyPageDTO {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  status: PolicyPageStatus
  published_at: Date | string | null
  unpublished_at: Date | string | null
  country_codes: string[] | null
  metadata: Record<string, unknown> | null
  created_at: Date | string
  updated_at: Date | string
  deleted_at?: Date | string | null
}
