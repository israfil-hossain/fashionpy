import { z } from "zod"

const VariantSchema = z.object({
  title: z.string().min(1).max(200),
  options: z.record(z.string(), z.string()).optional().default({}),
  sku: z.string().max(64).nullable().optional(),
})

const OptionAxisSchema = z.object({
  title: z.string().min(1).max(80),
  values: z.array(z.string().min(1).max(80)).min(1).max(50),
})

export const AiProductDraftSchema = z.object({
  title: z.string().min(1).max(300),
  subtitle: z.string().max(500).nullable().optional(),
  description: z.string().max(20_000).nullable().optional(),
  brand: z.string().max(200).nullable().optional(),
  sku: z.string().max(64).nullable().optional(),
  category_names: z.array(z.string().min(1).max(120)).max(10).optional().default([]),
  option_axes: z.array(OptionAxisSchema).max(5).optional().default([]),
  variants: z.array(VariantSchema).max(200).optional().default([]),
  tags: z.array(z.string().max(80)).max(25).optional().default([]),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
})

export type AiProductDraftPayload = z.infer<typeof AiProductDraftSchema>

export const AiSeoSchema = z.object({
  title: z.string().max(120).nullable().optional(),
  description: z.string().max(320).nullable().optional(),
  keywords: z.array(z.string().max(60)).max(20).optional().default([]),
})

export const AiProductInsightsSchema = z.object({
  tags: z.array(z.string().max(80)).max(20).optional().default([]),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  seo: AiSeoSchema.optional(),
})

export type AiProductInsightsPayload = z.infer<typeof AiProductInsightsSchema>

export const AiBlogDraftSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(96).nullable().optional(),
  excerpt: z.string().max(600).nullable().optional(),
  content: z.string().min(1).max(50_000),
  tags: z.array(z.string().max(80)).max(15).optional().default([]),
  seo: AiSeoSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
})

export type AiBlogDraftPayload = z.infer<typeof AiBlogDraftSchema>
