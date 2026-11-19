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
    describe("Store - Policies", () => {
      let appContainer: MedusaContainer
      let storeHeaders: { headers: Record<string, string> }

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })
      })

      const createPolicy = async (payload: Record<string, unknown>) => {
        const res = await api.post("/admin/policies", payload, adminHeaders)
        return res.data.policy_page
      }

      it("returns only published policies for the requested country", async () => {
        const globalPublished = await createPolicy({
          title: "Global Policy",
          slug: "global-policy",
          status: "published",
          country_codes: [],
        })
        const bdOnly = await createPolicy({
          title: "BD Policy",
          slug: "bd-policy",
          status: "published",
          country_codes: ["bd"],
        })
        const deOnly = await createPolicy({
          title: "DE Policy",
          slug: "de-policy",
          status: "published",
          country_codes: ["de"],
        })
        const draft = await createPolicy({
          title: "Hidden Draft",
          slug: "hidden-draft",
          status: "draft",
        })

        const bdList = await api.get(
          "/store/policies?country_code=bd&limit=50",
          storeHeaders
        )
        expect(bdList.status).toEqual(200)
        const bdIds = bdList.data.policy_pages.map((p: { id: string }) => p.id)
        expect(bdIds).toContain(globalPublished.id)
        expect(bdIds).toContain(bdOnly.id)
        expect(bdIds).not.toContain(deOnly.id)
        expect(bdIds).not.toContain(draft.id)

        const deList = await api.get(
          "/store/policies?country_code=de&limit=50",
          storeHeaders
        )
        const deIds = deList.data.policy_pages.map((p: { id: string }) => p.id)
        expect(deIds).toContain(globalPublished.id)
        expect(deIds).toContain(deOnly.id)
        expect(deIds).not.toContain(bdOnly.id)

        for (const id of [
          globalPublished.id,
          bdOnly.id,
          deOnly.id,
          draft.id,
        ]) {
          await api.delete(`/admin/policies/${id}`, adminHeaders)
        }
      })

      it("hides future-scheduled and expired policies", async () => {
        const future = await createPolicy({
          title: "Future Policy",
          slug: "future-policy",
          status: "published",
          published_at: new Date(Date.now() + 86_400_000).toISOString(),
        })
        const expired = await createPolicy({
          title: "Expired Policy",
          slug: "expired-policy",
          status: "published",
          published_at: new Date(Date.now() - 86_400_000).toISOString(),
          unpublished_at: new Date(Date.now() - 3600_000).toISOString(),
        })

        const list = await api.get(
          "/store/policies?country_code=bd&limit=50",
          storeHeaders
        )
        const ids = list.data.policy_pages.map((p: { id: string }) => p.id)
        expect(ids).not.toContain(future.id)
        expect(ids).not.toContain(expired.id)

        await api.delete(`/admin/policies/${future.id}`, adminHeaders)
        await api.delete(`/admin/policies/${expired.id}`, adminHeaders)
      })

      it("retrieves a published policy by slug and 404s drafts", async () => {
        const published = await createPolicy({
          title: "Readable Policy",
          slug: "readable-policy",
          status: "published",
          country_codes: ["bd"],
          content: "<p>Hello</p>",
        })
        const draft = await createPolicy({
          title: "Draft Policy",
          slug: "draft-policy",
          status: "draft",
        })

        const ok = await api.get(
          "/store/policies/readable-policy?country_code=bd",
          storeHeaders
        )
        expect(ok.status).toEqual(200)
        expect(ok.data.policy_page.slug).toEqual("readable-policy")
        expect(ok.data.policy_page.content).toEqual("<p>Hello</p>")

        const wrongCountry = await api
          .get(
            "/store/policies/readable-policy?country_code=de",
            storeHeaders
          )
          .catch((e) => e)
        expect(wrongCountry.status).toEqual(404)

        const draftRes = await api
          .get("/store/policies/draft-policy?country_code=bd", storeHeaders)
          .catch((e) => e)
        expect(draftRes.status).toEqual(404)

        await api.delete(`/admin/policies/${published.id}`, adminHeaders)
        await api.delete(`/admin/policies/${draft.id}`, adminHeaders)
      })
    })
  },
})
