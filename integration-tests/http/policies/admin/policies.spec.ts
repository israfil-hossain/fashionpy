import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(180000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Policies", () => {
      let appContainer: MedusaContainer

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      it("creates a draft policy with auto slug", async () => {
        const response = await api.post(
          "/admin/policies",
          {
            title: "Return & Refund",
            excerpt: "How returns work",
            content: "<p>Body</p>",
            country_codes: ["bd"],
          },
          adminHeaders
        )

        expect(response.status).toEqual(201)
        const policy = response.data.policy_page
        expect(policy.title).toEqual("Return & Refund")
        expect(policy.slug).toEqual("return-refund")
        expect(policy.status).toEqual("draft")
        expect(policy.country_codes).toEqual(["bd"])

        await api.delete(`/admin/policies/${policy.id}`, adminHeaders)
      })

      it("publishes a policy and defaults published_at", async () => {
        const created = await api.post(
          "/admin/policies",
          { title: "Privacy Policy" },
          adminHeaders
        )
        const id = created.data.policy_page.id

        const updated = await api.post(
          `/admin/policies/${id}`,
          { status: "published" },
          adminHeaders
        )

        expect(updated.status).toEqual(200)
        expect(updated.data.policy_page.status).toEqual("published")
        expect(updated.data.policy_page.published_at).toBeTruthy()

        await api.delete(`/admin/policies/${id}`, adminHeaders)
      })

      it("lists policies filtered by status", async () => {
        const created = await api.post(
          "/admin/policies",
          { title: "Listed Draft", status: "draft" },
          adminHeaders
        )
        const id = created.data.policy_page.id

        const response = await api.get(
          "/admin/policies?status=draft&q=Listed",
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(
          response.data.policy_pages.some((p: { id: string }) => p.id === id)
        ).toBe(true)

        await api.delete(`/admin/policies/${id}`, adminHeaders)
      })

      it("rejects an invalid slug", async () => {
        const response = await api
          .post(
            "/admin/policies",
            { title: "Bad slug", slug: "Not Valid!" },
            adminHeaders
          )
          .catch((e) => e)

        expect(response.status).toEqual(400)
      })

      it("deletes a policy", async () => {
        const created = await api.post(
          "/admin/policies",
          { title: "Doomed Policy" },
          adminHeaders
        )
        const id = created.data.policy_page.id

        const deleted = await api.delete(`/admin/policies/${id}`, adminHeaders)
        expect(deleted.status).toEqual(200)
        expect(deleted.data.deleted).toEqual(true)

        const fetched = await api
          .get(`/admin/policies/${id}`, adminHeaders)
          .catch((e) => e)
        expect(fetched.status).toEqual(404)
      })
    })
  },
})
