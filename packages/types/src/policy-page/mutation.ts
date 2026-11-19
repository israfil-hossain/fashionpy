import { PolicyPageStatus } from "./common"

export interface CreatePolicyPageDTO {
  title: string
  slug?: string
  excerpt?: string | null
  content?: string | null
  status?: PolicyPageStatus
  published_at?: Date | null
  unpublished_at?: Date | null
  country_codes?: string[] | null
  metadata?: Record<string, unknown> | null
}

export interface UpdatePolicyPageDTO {
  title?: string
  slug?: string
  excerpt?: string | null
  content?: string | null
  status?: PolicyPageStatus
  published_at?: Date | null
  unpublished_at?: Date | null
  country_codes?: string[] | null
  metadata?: Record<string, unknown> | null
}
