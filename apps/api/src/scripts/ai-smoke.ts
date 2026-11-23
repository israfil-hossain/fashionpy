import { ExecArgs } from "@medusajs/framework/types"
import {
  generateBlogDraft,
  generateProductDraft,
  generateProductInsights,
  loadAiRuntime,
} from "@mercurjs/core/ai/index"

/**
 * Live smoke test for the AI product/content pipeline. Uses the provider
 * configured in Admin → Settings → AI Chatbot and writes nothing to the
 * database.
 *
 *   bun --cwd apps/api run ai:smoke
 *   AI_SMOKE_IMAGE_URL=https://cdn.example.com/shirt.jpg bun --cwd apps/api run ai:smoke
 *   AI_SMOKE_SOURCE_URL=https://example.com/product/shirt bun --cwd apps/api run ai:smoke
 */
export default async function aiSmoke({ container }: ExecArgs) {
  const runtime = await loadAiRuntime(container)
  console.log(
    `[ai-smoke] provider=${runtime.config.provider} model=${runtime.model}`
  )

  const failures: string[] = []
  const run = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn()
      console.log(`[ai-smoke] ${name}: ok`)
    } catch (error) {
      failures.push(name)
      console.error(
        `[ai-smoke] ${name}: failed — ${(error as Error).message}`
      )
    }
  }

  const image = process.env.AI_SMOKE_IMAGE_URL
  const source = process.env.AI_SMOKE_SOURCE_URL

  await run("product_draft", async () => {
    if (!image && !source) {
      console.log(
        "[ai-smoke] product_draft: skipped (set AI_SMOKE_IMAGE_URL or AI_SMOKE_SOURCE_URL)"
      )
      return
    }

    const isDataUrl = image?.startsWith("data:") ?? false
    const draft = await generateProductDraft({
      container,
      source_url: source,
      image_urls: image && !isDataUrl ? [image] : undefined,
      image_data_urls: image && isDataUrl ? [image] : undefined,
    })

    console.log(
      `[ai-smoke] product_draft: title="${draft.title}" ` +
        `variants=${draft.variants.length} tags=${draft.tags.length} ` +
        `images=${draft.images.length} sku=${draft.sku ?? "none"}`
    )
  })

  await run("product_insights", async () => {
    const insights = await generateProductInsights({
      container,
      title: "Linen summer shirt",
      description: "Lightweight breathable linen shirt for warm days.",
    })

    console.log(
      `[ai-smoke] product_insights: tags=${insights.tags.join(", ") || "none"} ` +
        `metadata_keys=${Object.keys(insights.metadata).length} ` +
        `seo_title=${insights.seo.title ?? "none"}`
    )
  })

  await run("blog_generation", async () => {
    const post = await generateBlogDraft({
      container,
      topic: "How to care for linen clothes",
      keywords: ["linen care", "summer fabric"],
      length: "short",
    })

    console.log(
      `[ai-smoke] blog_generation: title="${post.title}" ` +
        `slug=${post.slug} tags=${post.tags.length} ` +
        `content_chars=${post.content.length}`
    )
  })

  if (failures.length) {
    console.error(`[ai-smoke] failed checks: ${failures.join(", ")}`)
    process.exitCode = 1
    return
  }

  console.log("[ai-smoke] all checks passed")
}