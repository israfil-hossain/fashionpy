import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"

jest.setTimeout(180000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store - Blog posts", () => {
      let appContainer: MedusaContainer
      let storeHeaders: { headers: Record<string, string> }

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })
      })

      const createPost = async (payload: Record<string, unknown>) => {
        const res = await api.post("/admin/blog-posts", payload, adminHeaders)
        return res.data.blog_post
      }

      it("returns only published posts for the requested country", async () => {
        const globalPublished = await createPost({
          title: "Global Published",
          status: "published",
          country_codes: [],
        })
        const bdOnly = await createPost({
          title: "BD Only",
          status: "published",
          country_codes: ["bd"],
        })
        const deOnly = await createPost({
          title: "DE Only",
          status: "published",
          country_codes: ["de"],
        })
        const draft = await createPost({
          title: "Hidden Draft",
          status: "draft",
        })

        const bdList = await api.get(
          "/store/blog-posts?country_code=bd&limit=50",
          storeHeaders
        )
        expect(bdList.status).toEqual(200)
        const bdIds = bdList.data.blog_posts.map((p: { id: string }) => p.id)
        expect(bdIds).toContain(globalPublished.id)
        expect(bdIds).toContain(bdOnly.id)
        expect(bdIds).not.toContain(deOnly.id)
        expect(bdIds).not.toContain(draft.id)

        const deList = await api.get(
          "/store/blog-posts?country_code=de&limit=50",
          storeHeaders
        )
        const deIds = deList.data.blog_posts.map((p: { id: string }) => p.id)
        expect(deIds).toContain(globalPublished.id)
        expect(deIds).toContain(deOnly.id)
        expect(deIds).not.toContain(bdOnly.id)

        for (const id of [
          globalPublished.id,
          bdOnly.id,
          deOnly.id,
          draft.id,
        ]) {
          await api.delete(`/admin/blog-posts/${id}`, adminHeaders)
        }
      })

      it("hides future-scheduled and expired posts", async () => {
        const future = await createPost({
          title: "Future Post",
          status: "published",
          published_at: new Date(Date.now() + 86_400_000).toISOString(),
        })
        const expired = await createPost({
          title: "Expired Post",
          status: "published",
          published_at: new Date(Date.now() - 86_400_000).toISOString(),
          unpublished_at: new Date(Date.now() - 3600_000).toISOString(),
        })

        const list = await api.get(
          "/store/blog-posts?country_code=bd&limit=50",
          storeHeaders
        )
        const ids = list.data.blog_posts.map((p: { id: string }) => p.id)
        expect(ids).not.toContain(future.id)
        expect(ids).not.toContain(expired.id)

        await api.delete(`/admin/blog-posts/${future.id}`, adminHeaders)
        await api.delete(`/admin/blog-posts/${expired.id}`, adminHeaders)
      })

      it("retrieves a published post by slug and 404s drafts", async () => {
        const published = await createPost({
          title: "Readable Post",
          slug: "readable-post",
          status: "published",
          country_codes: ["bd"],
          content: "<p>Hello</p>",
        })
        const draft = await createPost({
          title: "Draft Post",
          slug: "draft-post",
          status: "draft",
        })

        const ok = await api.get(
          "/store/blog-posts/readable-post?country_code=bd",
          storeHeaders
        )
        expect(ok.status).toEqual(200)
        expect(ok.data.blog_post.slug).toEqual("readable-post")

        const wrongCountry = await api
          .get(
            "/store/blog-posts/readable-post?country_code=de",
            storeHeaders
          )
          .catch((e) => e)
        expect(wrongCountry.status).toEqual(404)

        const draftRes = await api
          .get(
            "/store/blog-posts/draft-post?country_code=bd",
            storeHeaders
          )
          .catch((e) => e)
        expect(draftRes.status).toEqual(404)

        await api.delete(`/admin/blog-posts/${published.id}`, adminHeaders)
        await api.delete(`/admin/blog-posts/${draft.id}`, adminHeaders)
      })
    })
  },
})
