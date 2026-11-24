import type { MedusaContainer } from "@medusajs/framework/types"
import type { AiTask } from "@mercurjs/types"

import { normalizeImages } from "./images"
import { buildInsightsPrompt, INSIGHTS_SYSTEM } from "./prompts"
import { completeJson } from "./runtime"
import { sanitizeMetadata, sanitizeTagList } from "./sanitize"
import { AiProductInsightsSchema } from "./schemas"

export type AiProductInsights = {
  tags: string[]
  metadata: Record<string, unknown>
  seo: {
    title: string | null
    description: string | null
    keywords: string[]
  }
}

export type GenerateProductInsightsInput = {
  container: MedusaContainer
  title: string
  description?: string | null
  image_urls?: string[]
  existing_tags?: string[]
  existing_metadata?: Record<string, unknown>
  language?: string
  /** Panel task; requests with images automatically switch to the vision slot. */
  task?: AiTask
}

export async function generateProductInsights(
  input: GenerateProductInsightsInput
): Promise<AiProductInsights> {
  let imageDataUrls: string[] = []
  if (input.image_urls?.length) {
    try {
      imageDataUrls = (await normalizeImages(input.image_urls)).data_urls
    } catch {
      // Insights still work from text when an image is unreachable.
    }
  }

  const { data } = await completeJson(input.container, {
    schema: AiProductInsightsSchema,
    surface: "product_insights",
    task: imageDataUrls.length ? "vision" : (input.task ?? "admin_text"),
    fallback_task: input.task ?? "admin_text",
    max_tokens: 1200,
    messages: [
      { role: "system", content: INSIGHTS_SYSTEM },
      {
        role: "user",
        content: buildInsightsPrompt({
          title: input.title,
          description: input.description,
          existingTags: input.existing_tags,
          existingMetadata: input.existing_metadata,
          language: input.language,
        }),
        images: imageDataUrls,
      },
    ],
  })

  return {
    tags: sanitizeTagList(data.tags),
    metadata: sanitizeMetadata(data.metadata),
    seo: {
      title: data.seo?.title?.trim() || null,
      description: data.seo?.description?.trim() || null,
      keywords: sanitizeTagList(data.seo?.keywords, 20),
    },
  }
}
