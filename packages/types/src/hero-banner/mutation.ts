import { HeroBannerTextPosition } from "./common"

export interface CreateHeroBannerDTO {
  title: string
  subtitle?: string | null
  description?: string | null
  image_url: string
  cta_text?: string | null
  cta_link?: string | null
  text_position?: HeroBannerTextPosition
  is_active?: boolean
  rank?: number
  starts_at?: Date | null
  ends_at?: Date | null
  metadata?: Record<string, unknown> | null
}

export interface UpdateHeroBannerDTO {
  title?: string
  subtitle?: string | null
  description?: string | null
  image_url?: string
  cta_text?: string | null
  cta_link?: string | null
  text_position?: HeroBannerTextPosition
  is_active?: boolean
  rank?: number
  starts_at?: Date | null
  ends_at?: Date | null
  metadata?: Record<string, unknown> | null
}
