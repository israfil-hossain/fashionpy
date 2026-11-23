import { MedusaContainer } from "@medusajs/framework/types"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(180_000)

const PRODUCT_DRAFT = {
  title: "Linen Summer Shirt",
  subtitle: "Breathable everyday linen",
  description: "<p>Lightweight linen shirt for warm days.</p>",
  brand: "Acme",
  sku: "acme-linen-shirt-01",
  category_names: ["Shirts"],
  option_axes: [{ title: "Size", values: ["S", "M"] }],
  variants: [
    { title: "S", options: { Size: "S" }, sku: null },
    { title: "M", options: { Size: "M" }, sku: null },
  ],
  tags: ["#summer", "Linen"],
  metadata: { material: "linen", season: "summer" },
}

const INSIGHTS = {
  tags: ["Summer", "Linen"],
  metadata: { material: "linen", season: "summer" },
  seo: {
    title: "Linen Summer Shirt",
    description: "Lightweight linen shirt for warm days.",
    keywords: ["linen", "summer shirt"],
  },
}

const BLOG_DRAFT = {
  title: "How to care for linen",
  slug: "how-to-care-for-linen",
  excerpt: "Keep linen soft and long-lasting with a few simple habits.",
  content: "<h2>Wash gently</h2><p>Use cold water and a mild detergent.</p>",
  tags: ["#Linen", "Summer Care"],
  seo: {
    title: "Linen care",
    description: "Simple linen care tips.",
    keywords: ["linen care"],
  },
  metadata: { reading_minutes: 3 },
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("AI product and content routes", () => {
      let container: MedusaContainer
      const originalFetch = global.fetch

      const mockCompletion = (content: unknown) => {
        global.fetch = (async (
          input: RequestInfo | URL,
          init?: RequestInit
        ) => {
          const url =
            typeof input === "string"
              ? input
              : input instanceof URL
                ? input.toString()
                : input.url

          if (url.includes("/chat/completions")) {
            return new Response(
              JSON.stringify({
                choices: [
                  { message: { content: JSON.stringify(content) } },
                ],
              }),
              {
                status: 200,
                headers: { "content-type": "application/json" },
              }
            )
          }

          return originalFetch(input, init)
        }) as typeof fetch
      }

      beforeAll(() => {
        container = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, container)
        await api.put(
          "/admin/chatbot/settings",
          {
            enabled: true,
            provider: "openai_compatible",
            base_url: "https://ai.test/v1",
            api_key: "test-key",
            model: "test-model",
            max_tokens: 2000,
          },
          adminHeaders
        )
      })

      afterEach(() => {
        global.fetch = originalFetch
      })

      it("drafts a product from an image for admins", async () => {
        mockCompletion(PRODUCT_DRAFT)

        const response = await api.post(
          "/admin/products/ai/draft",
          { image_data_urls: ["data:image/png;base64,AAAA"] },
          adminHeaders
        )

        expect(response.status).toEqual(200)
        const product = response.data.product
        expect(product.title).toEqual("Linen Summer Shirt")
        expect(product.sku).toEqual("ACME-LINEN-SHIRT-01")
        expect(product.option_axes).toEqual([
          { title: "Size", values: ["S", "M"] },
        ])
        expect(product.tags).toEqual(["summer", "Linen"])
        expect(product.metadata).toEqual({
          material: "linen",
          season: "summer",
        })
        expect(product.images).toEqual([])
        expect(product.description).toContain("<p>")
      })

      it("drafts a product for a seller and records quota usage", async () => {
        const { seller, headers } = await createSellerUser(container, {
          email: "ai-draft-seller@test.com",
          name: "AI Draft Seller",
        })
        mockCompletion(PRODUCT_DRAFT)

        const response = await api.post(
          "/vendor/products/ai/draft",
          { image_data_urls: ["data:image/png;base64,AAAA"] },
          headers
        )

        expect(response.status).toEqual(200)
        expect(response.data.product.title).toEqual("Linen Summer Shirt")
        expect(response.data.ai_quota).toEqual({
          used: 1,
          quota: 20,
          remaining: 19,
        })
        expect(seller.id).toBeTruthy()

        const quota = await api.get("/vendor/ai/quota", headers)
        expect(quota.status).toEqual(200)
        expect(quota.data).toEqual({ used: 1, quota: 20, remaining: 19 })
      })

      it("suggests tags, metadata and SEO for catalog insights", async () => {
        mockCompletion(INSIGHTS)

        const response = await api.post(
          "/admin/products/ai/insights",
          { title: "Linen Summer Shirt" },
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.insights.tags).toEqual(["Summer", "Linen"])
        expect(response.data.insights.metadata.material).toEqual("linen")
        expect(response.data.insights.seo.title).toEqual("Linen Summer Shirt")
      })

      it("applies AI tags and metadata to an existing product", async () => {
        const created = await api.post(
          "/admin/products",
          { title: "Enriched Product", status: "published" },
          adminHeaders
        )
        const productId = created.data.product.id
        mockCompletion(INSIGHTS)

        const response = await api.post(
          `/admin/products/${productId}/ai/enrich`,
          {},
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.suggestions.tags).toEqual(["Summer", "Linen"])

        const refreshed = await api.get(
          `/admin/products/${productId}?fields=id,metadata,tags.id,tags.value`,
          adminHeaders
        )
        const product = refreshed.data.product
        expect(product.metadata.material).toEqual("linen")
        expect(product.metadata.ai_enriched_at).toBeTruthy()
        expect(product.tags.map((tag: { value: string }) => tag.value)).toEqual(
          expect.arrayContaining(["Summer", "Linen"])
        )
      })

      it("generates a blog draft with hashtags and SEO metadata", async () => {
        mockCompletion(BLOG_DRAFT)

        const response = await api.post(
          "/admin/blog-posts/ai/generate",
          { topic: "How to care for linen" },
          adminHeaders
        )

        expect(response.status).toEqual(200)
        const post = response.data.blog_post
        expect(post.title).toEqual("How to care for linen")
        expect(post.slug).toEqual("how-to-care-for-linen")
        expect(post.tags).toEqual(["Linen", "Summer Care"])
        expect(post.metadata.seo.title).toEqual("Linen care")
        expect(post.metadata.hashtags).toEqual(["#Linen", "#SummerCare"])
        expect(post.content).toContain("<h2>")
        expect(post.status).toEqual("draft")
      })
    })
  },
})
