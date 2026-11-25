import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { SELLER_STOREFRONT_LAYOUT_KEY } from "@mercurjs/types"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Vendor - seller storefront layout", () => {
      let appContainer: MedusaContainer
      let seller: any
      let headers: any

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const created = await createSellerUser(appContainer, {
          email: "storefront-design@test.com",
          name: "Storefront Design Store",
        })
        seller = created.seller
        headers = created.headers

        await api.post(
          `/admin/sellers/${seller.id}/approve`,
          {},
          adminHeaders
        )
      })

      it("stores the arrangement in seller metadata and exposes it to the storefront", async () => {
        const sections = [
          { id: "reviews", enabled: true },
          { id: "featured_products", enabled: false },
        ]

        const update = await api.post(
          `/vendor/sellers/${seller.id}`,
          {
            metadata: {
              existing_key: "kept",
              [SELLER_STOREFRONT_LAYOUT_KEY]: { sections },
            },
          },
          headers
        )

        expect(update.status).toEqual(200)
        expect(update.data.seller.metadata).toEqual(
          expect.objectContaining({
            existing_key: "kept",
            [SELLER_STOREFRONT_LAYOUT_KEY]: { sections },
          })
        )

        const response = await api.get(
          `/store/sellers?handle=${seller.handle}`
        )

        expect(response.status).toEqual(200)
        const stored = response.data.sellers.find(
          (entry: any) => entry.id === seller.id
        )
        expect(stored.metadata[SELLER_STOREFRONT_LAYOUT_KEY]).toEqual({
          sections,
        })
      })
    })
  },
})
