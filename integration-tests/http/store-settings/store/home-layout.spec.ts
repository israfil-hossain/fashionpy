import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"

// App boot (fresh DB + migrations) varies a lot on this box under load; the
// runner's beforeAll hook inherits this ceiling.
jest.setTimeout(240000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store - Store settings (homepage layout)", () => {
      let appContainer: MedusaContainer
      let storeHeaders: { headers: Record<string, string> }
      let storeId: string

      beforeAll(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const apiKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey: apiKey })

        const stores = await api.get("/admin/stores", adminHeaders)
        storeId = stores.data.stores[0].id
      })

      it("returns null home_layout before an admin saves one", async () => {
        const response = await api.get("/store/store-settings", storeHeaders)

        expect(response.status).toEqual(200)
        expect(response.data).toHaveProperty("announcement")
        expect(response.data.home_layout).toBeNull()
      })

      it("round-trips a saved home layout through store metadata", async () => {
        const layout = {
          sections: [
            { id: "blog", enabled: false },
            { id: "hero", enabled: true },
            { id: "promo_codes", enabled: true },
          ],
        }

        const update = await api.post(
          `/admin/stores/${storeId}`,
          { metadata: { home_layout: layout } },
          adminHeaders
        )
        expect(update.status).toEqual(200)

        const response = await api.get("/store/store-settings", storeHeaders)
        expect(response.status).toEqual(200)
        expect(response.data.home_layout).toEqual(layout)
      })

      it("keeps unrelated metadata keys when the layout is replaced", async () => {
        await api.post(
          `/admin/stores/${storeId}`,
          {
            metadata: {
              announcement: { enabled: false, message: "keep me" },
              home_layout: { sections: [{ id: "hero", enabled: false }] },
            },
          },
          adminHeaders
        )

        const response = await api.get("/store/store-settings", storeHeaders)
        expect(response.data.home_layout).toEqual({
          sections: [{ id: "hero", enabled: false }],
        })
        expect(response.data.announcement).toMatchObject({
          message: "keep me",
        })
      })
    })
  },
})
