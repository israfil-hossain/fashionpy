import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"

import { MercurModules } from "@mercurjs/types"

import {
  createCustomerUser,
  customerHeaders,
} from "../../helpers/create-customer-user"
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../helpers/create-admin-user"

jest.setTimeout(180_000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Store - apply loyalty points to cart", () => {
      let container: ReturnType<typeof getContainer>
      let customerId: string
      let regionId: string
      let storeHeaders: { headers: Record<string, string> }
      let customerStoreHeaders: { headers: Record<string, string> }

      beforeEach(async () => {
        container = getContainer()
        const { customer } = await createCustomerUser(container, {
          email: `loyalty-${Date.now()}@test.com`,
        })
        customerId = customer.id
        const regionModule = container.resolve(Modules.REGION) as {
          createRegions: (data: unknown) => Promise<{ id: string }>
        }
        const region = await regionModule.createRegions({
          name: "Loyalty Region",
          currency_code: "bdt",
          countries: ["bd"],
        })
        regionId = region.id

        const apiKey = await generatePublishableKey(container)
        storeHeaders = generateStoreHeaders({ publishableKey: apiKey })
        customerStoreHeaders = {
          headers: { ...storeHeaders.headers, ...customerHeaders.headers },
        }

        const loyalty = container.resolve(MercurModules.FP) as {
          createFpLoyaltyAccounts: (data: unknown[]) => Promise<unknown>
        }
        await loyalty.createFpLoyaltyAccounts([
          { customer_id: customer.id, available_points: 500 },
        ])
      })

      test("rejects unauthenticated requests", async () => {
        const response = await api
          .post("/store/fp/rewards/apply-to-cart", {
            cart_id: "cart_missing",
            points_to_redeem: 100,
          },
          storeHeaders
        )
          .catch(error => error.response)

        expect(response.status).toEqual(401)
      })

      test("rejects an empty cart", async () => {
        const cartResponse = await api.post(
          "/store/carts",
          { region_id: regionId },
          customerStoreHeaders
        )

        const response = await api
          .post(
            "/store/fp/rewards/apply-to-cart",
            { cart_id: cartResponse.data.cart.id, points_to_redeem: 100 },
            customerStoreHeaders
          )
          .catch(error => error.response)

        expect(response.status).toEqual(400)
        expect(customerId).toBeTruthy()
      })
    })
  },
})
