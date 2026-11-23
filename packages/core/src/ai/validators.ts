import { z } from "zod"

const ImageUrls = z.array(z.string().min(1).max(4096)).max(5)
const ImageDataUrls = z.array(z.string().min(1).max(12_000_000)).max(5)

export const AiProductHints = z
  .object({
    category: z.string().max(120).optional(),
    brand: z.string().max(120).optional(),
    language: z.string().max(40).optional(),
    target_audience: z.string().max(200).optional(),
    keywords: z.array(z.string().max(60)).max(10).optional(),
  })
  .strict()

export type AiProductDraftBodyType = z.infer<typeof AiProductDraftBody>
export const AiProductDraftBody = z
  .object({
    image_urls: ImageUrls.optional(),
    image_data_urls: ImageDataUrls.optional(),
    source_url: z.string().url().max(4096).optional(),
    hints: AiProductHints.optional(),
  })
  .strict()

export type AiProductInsightsBodyType = z.infer<typeof AiProductInsightsBody>
export const AiProductInsightsBody = z
  .object({
    product_id: z.string().optional(),
    title: z.string().max(300).optional(),
    description: z.string().max(20_000).nullable().optional(),
    image_urls: ImageUrls.optional(),
    language: z.string().max(40).optional(),
  })
  .strict()

export type AiProductEnrichBodyType = z.infer<typeof AiProductEnrichBody>
export const AiProductEnrichBody = z
  .object({
    apply_tags: z.boolean().optional().default(true),
    apply_metadata: z.boolean().optional().default(true),
    image_urls: ImageUrls.optional(),
    language: z.string().max(40).optional(),
  })
  .strict()

export type AiBlogGenerateBodyType = z.infer<typeof AiBlogGenerateBody>
export const AiBlogGenerateBody = z
  .object({
    topic: z.string().min(3).max(300),
    keywords: z.array(z.string().max(60)).max(15).optional(),
    tone: z.enum(["professional", "friendly", "playful", "informative"]).optional(),
    locale: z.enum(["en", "bn"]).optional(),
    length: z.enum(["short", "medium", "long"]).optional(),
    category_id: z.string().optional(),
    category: z.string().max(120).nullable().optional(),
    audience: z.string().max(200).nullable().optional(),
    author: z.string().max(120).nullable().optional(),
  })
  .strict()
