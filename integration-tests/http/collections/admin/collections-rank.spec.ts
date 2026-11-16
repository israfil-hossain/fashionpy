import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Collection rank", () => {
      let appContainer: MedusaContainer

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      const createCollection = async (title: string, rank?: number) => {
        const response = await api.post(
          "/admin/collections",
          rank === undefined ? { title } : { title, rank },
          adminHeaders
        )
        expect(response.status).toEqual(200)
        return response.data.collection
      }

      const listTitles = async (query = "") => {
        const response = await api.get(
          `/admin/collections?limit=20${query}`,
          adminHeaders
        )
        expect(response.status).toEqual(200)
        return {
          titles: response.data.collections.map(
            (collection: { title: string }) => collection.title
          ),
          count: response.data.count,
        }
      }

      it("persists rank as metadata.rank on create and leaves it unset when omitted", async () => {
        const ranked = await createCollection("Ranked", 0)
        expect(ranked.metadata).toEqual({ rank: 0 })

        const unranked = await createCollection("Unranked")
        expect(unranked.metadata?.rank).toBeUndefined()
      })

      it("updates and clears the rank", async () => {
        const collection = await createCollection("Mutable", 3)

        const updated = await api.post(
          `/admin/collections/${collection.id}`,
          { rank: 1 },
          adminHeaders
        )
        expect(updated.status).toEqual(200)
        expect(updated.data.collection.metadata).toEqual({ rank: 1 })

        const cleared = await api.post(
          `/admin/collections/${collection.id}`,
          { rank: null },
          adminHeaders
        )
        expect(cleared.status).toEqual(200)
        expect(cleared.data.collection.metadata?.rank).toBeNull()
      })

      it("lists ranked collections first in rank order by default", async () => {
        await createCollection("Second", 2)
        await createCollection("First", 0)
        await createCollection("Third", 1)
        await createCollection("NoRank")

        const { titles, count } = await listTitles()
        expect(titles).toEqual(["First", "Third", "Second", "NoRank"])
        expect(count).toEqual(4)
      })

      it("sorts descending with order=-rank", async () => {
        await createCollection("Second", 2)
        await createCollection("First", 0)
        await createCollection("Third", 1)
        await createCollection("NoRank")

        const { titles } = await listTitles("&order=-rank")
        expect(titles).toEqual(["Second", "Third", "First", "NoRank"])
      })

      it("pages after ranking", async () => {
        await createCollection("Second", 2)
        await createCollection("First", 0)
        await createCollection("Third", 1)
        await createCollection("NoRank")

        const response = await api.get(
          "/admin/collections?limit=2&offset=1",
          adminHeaders
        )
        expect(response.status).toEqual(200)
        expect(
          response.data.collections.map(
            (collection: { title: string }) => collection.title
          )
        ).toEqual(["Third", "Second"])
        expect(response.data.count).toEqual(4)
        expect(response.data.offset).toEqual(1)
        expect(response.data.limit).toEqual(2)
      })

      it("keeps non-rank ordering working", async () => {
        await createCollection("Zeta", 0)
        await createCollection("Alpha", 1)

        const { titles } = await listTitles("&order=title")
        expect(titles).toEqual(["Alpha", "Zeta"])
      })
    })
  },
})
