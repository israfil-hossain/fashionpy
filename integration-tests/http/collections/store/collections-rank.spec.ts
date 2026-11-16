import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store - Collection rank", () => {
      let appContainer: MedusaContainer
      let storeHeaders: { headers: Record<string, string> }

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const apiKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey: apiKey })
      })

      const createCollection = async (title: string, rank: number) => {
        const response = await api.post(
          "/admin/collections",
          { title, rank },
          adminHeaders
        )
        expect(response.status).toEqual(200)
      }

      const listTitles = async (query: string) => {
        const response = await api.get(
          `/store/collections?limit=100${query}`,
          storeHeaders
        )
        expect(response.status).toEqual(200)
        return response.data.collections.map(
          (collection: { title: string }) => collection.title
        )
      }

      it("returns collections in rank order for order=rank", async () => {
        await createCollection("Second", 2)
        await createCollection("First", 0)
        await createCollection("Third", 1)

        const titles = await listTitles("&order=rank")
        expect(titles).toEqual(["First", "Third", "Second"])
      })

      it("keeps the default newest-first order when rank is not requested", async () => {
        await createCollection("Second", 2)
        await createCollection("First", 0)
        await createCollection("Third", 1)

        const titles = await listTitles("")
        expect(titles).toEqual(["Third", "First", "Second"])
      })

      it("places unranked collections after ranked ones", async () => {
        await createCollection("Ranked", 0)
        await api.post("/admin/collections", { title: "Unranked" }, adminHeaders)

        const titles = await listTitles("&order=rank")
        expect(titles).toEqual(["Ranked", "Unranked"])
      })

      it("does not fail when rank is requested as a field", async () => {
        await createCollection("Solo", 0)

        const response = await api.get(
          "/store/collections?order=rank&fields=rank",
          storeHeaders
        )
        expect(response.status).toEqual(200)
        expect(response.data.collections).toHaveLength(1)
      })
    })
  },
})
