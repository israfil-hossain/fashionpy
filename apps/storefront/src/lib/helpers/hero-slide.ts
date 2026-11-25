export type HeroSlideText = {
  title?: string | null
  subtitle?: string | null
  description?: string | null
}

export const hasHeroText = (slide: HeroSlideText): boolean =>
  Boolean(slide.title || slide.subtitle || slide.description)
