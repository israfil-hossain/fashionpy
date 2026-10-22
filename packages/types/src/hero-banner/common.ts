export type HeroBannerTextPosition = "left" | "center" | "right"

export interface HeroBannerDTO {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  image_url: string
  cta_text: string | null
  cta_link: string | null
  text_position: HeroBannerTextPosition
  is_active: boolean
  rank: number
  starts_at: Date | string | null
  ends_at: Date | string | null
  metadata: Record<string, unknown> | null
  created_at: Date | string
  updated_at: Date | string
  deleted_at?: Date | string | null
}
