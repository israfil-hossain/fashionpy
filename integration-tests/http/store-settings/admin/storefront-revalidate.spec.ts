import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

// App boot (fresh DB + migrations) varies a lot on this box under load; the
// runner's beforeAll hook inherits this ceiling.
jest.setTimeout(300000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - storefront revalidate endpoint", () => {
      let appContainer: MedusaContainer

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        // `bun run` loads the repo root `.env`, which would make the
        // store.updated subscriber call the production storefront.
        delete process.env.STOREFRONT_REVALIDATE_URL
        delete process.env.STOREFRONT_REVALIDATE_SECRET
      })

      it("rejects unauthenticated requests", async () => {
        const response = await api
          .post("/admin/storefront/revalidate", {})
          .catch((e) => e.response)

        expect(response.status).toEqual(401)
      })

      it("emits the store update for authenticated admins", async () => {
        const response = await api.post(
          "/admin/storefront/revalidate",
          {},
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data).toEqual({ revalidated: true })
      })
    })
  },
})
