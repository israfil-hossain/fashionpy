import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(180000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Hero banners", () => {
      let appContainer: MedusaContainer

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      it("creates a banner with the shop_collection slot", async () => {
        const response = await api.post(
          "/admin/hero-banners",
          {
            title: "Shop collection slide",
            image_url: "http://example.com/shop-collection.png",
            slot: "shop_collection",
            rank: 1,
          },
          adminHeaders
        )

        expect(response.status).toEqual(201)
        const banner = response.data.hero_banner
        expect(banner).toBeDefined()
        expect(banner.slot).toEqual("shop_collection")

        await api.delete(`/admin/hero-banners/${banner.id}`, adminHeaders)
      })

      it("lists banners filtered by shop_collection slot", async () => {
        const created = await api.post(
          "/admin/hero-banners",
          {
            title: "Filtered shop collection slide",
            image_url: "http://example.com/shop-collection-filter.png",
            slot: "shop_collection",
          },
          adminHeaders
        )
        const bannerId = created.data.hero_banner.id

        const response = await api.get(
          "/admin/hero-banners?slot=shop_collection",
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.hero_banners).toHaveLength(1)
        expect(response.data.hero_banners[0].id).toEqual(bannerId)
        expect(response.data.hero_banners[0].slot).toEqual("shop_collection")

        await api.delete(`/admin/hero-banners/${bannerId}`, adminHeaders)
      })

      it("rejects an unknown slot value", async () => {
        const response = await api
          .post(
            "/admin/hero-banners",
            {
              title: "Bad slot",
              image_url: "http://example.com/bad-slot.png",
              slot: "not_a_slot",
            },
            adminHeaders
          )
          .catch((e) => e)

        expect(response.status).toEqual(400)
      })
    })
  },
})
