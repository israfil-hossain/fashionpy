import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(180000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Blog posts", () => {
      let appContainer: MedusaContainer

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      it("creates a draft post with auto slug", async () => {
        const response = await api.post(
          "/admin/blog-posts",
          {
            title: "Hello Fashion World",
            excerpt: "A short excerpt",
            content: "<p>Body</p>",
            country_codes: ["bd"],
            tags: ["fashion"],
          },
          adminHeaders
        )

        expect(response.status).toEqual(201)
        const post = response.data.blog_post
        expect(post.title).toEqual("Hello Fashion World")
        expect(post.slug).toEqual("hello-fashion-world")
        expect(post.status).toEqual("draft")
        expect(post.country_codes).toEqual(["bd"])

        await api.delete(`/admin/blog-posts/${post.id}`, adminHeaders)
      })

      it("publishes a post and defaults published_at", async () => {
        const created = await api.post(
          "/admin/blog-posts",
          { title: "Scheduled Post" },
          adminHeaders
        )
        const id = created.data.blog_post.id

        const updated = await api.post(
          `/admin/blog-posts/${id}`,
          { status: "published" },
          adminHeaders
        )

        expect(updated.status).toEqual(200)
        expect(updated.data.blog_post.status).toEqual("published")
        expect(updated.data.blog_post.published_at).toBeTruthy()

        await api.delete(`/admin/blog-posts/${id}`, adminHeaders)
      })

      it("lists posts filtered by status", async () => {
        const created = await api.post(
          "/admin/blog-posts",
          { title: "Listed Draft", status: "draft" },
          adminHeaders
        )
        const id = created.data.blog_post.id

        const response = await api.get(
          "/admin/blog-posts?status=draft&q=Listed",
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(
          response.data.blog_posts.some((p: { id: string }) => p.id === id)
        ).toBe(true)

        await api.delete(`/admin/blog-posts/${id}`, adminHeaders)
      })

      it("rejects an invalid slug", async () => {
        const response = await api
          .post(
            "/admin/blog-posts",
            { title: "Bad slug", slug: "Not Valid!" },
            adminHeaders
          )
          .catch((e) => e)

        expect(response.status).toEqual(400)
      })

      it("creates and lists blog categories", async () => {
        const created = await api.post(
          "/admin/blog-categories",
          { name: "Style Guide" },
          adminHeaders
        )

        expect(created.status).toEqual(201)
        expect(created.data.blog_category.slug).toEqual("style-guide")

        const list = await api.get("/admin/blog-categories", adminHeaders)
        expect(list.status).toEqual(200)
        expect(
          list.data.blog_categories.some(
            (c: { id: string }) => c.id === created.data.blog_category.id
          )
        ).toBe(true)

        await api.delete(
          `/admin/blog-categories/${created.data.blog_category.id}`,
          adminHeaders
        )
      })
    })
  },
})
