import type { MedusaContainer } from "@medusajs/framework/types"

import { sanitizeRichText } from "../utils/sanitize-rich-text"
import { buildBlogPrompt, BLOG_SYSTEM } from "./prompts"
import { completeJson } from "./runtime"
import { sanitizeMetadata, sanitizeTagList, slugify } from "./sanitize"
import { AiBlogDraftSchema } from "./schemas"

export type AiBlogDraft = {
  title: string
  slug: string
  excerpt: string | null
  content: string
  tags: string[]
  metadata: Record<string, unknown>
}

export type GenerateBlogDraftInput = {
  container: MedusaContainer
  topic: string
  keywords?: string[]
  tone?: "professional" | "friendly" | "playful" | "informative"
  locale?: "en" | "bn"
  length?: "short" | "medium" | "long"
  category?: string | null
  audience?: string | null
}

export async function generateBlogDraft(
  input: GenerateBlogDraftInput
): Promise<AiBlogDraft> {
  const { data } = await completeJson(input.container, {
    schema: AiBlogDraftSchema,
    surface: "blog_generation",
    max_tokens: 4000,
    temperature: 0.6,
    messages: [
      { role: "system", content: BLOG_SYSTEM },
      { role: "user", content: buildBlogPrompt(input) },
    ],
  })

  const tags = sanitizeTagList(data.tags, 15)
  const title = data.title.trim()
  const slug = slugify(data.slug ?? title) || slugify(title)
  const hashtags = tags.map((tag) => `#${tag.replace(/\s+/g, "")}`)

  return {
    title,
    slug,
    excerpt: data.excerpt?.trim() || null,
    content: sanitizeRichText(data.content),
    tags,
    metadata: {
      ...sanitizeMetadata(data.metadata),
      seo: {
        title: data.seo?.title?.trim() || title.slice(0, 60),
        description: data.seo?.description?.trim() || (data.excerpt ?? "").slice(0, 160),
        keywords: sanitizeTagList(data.seo?.keywords, 20),
      },
      hashtags,
    },
  }
}
