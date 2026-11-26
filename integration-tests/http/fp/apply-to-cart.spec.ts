import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

import { MercurModules } from "@mercurjs/types"

import {
  createCustomerUser,
  customerHeaders,
} from "../../helpers/create-customer-user"

jest.setTimeout(180_000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Store - apply loyalty points to cart", () => {
      let container: ReturnType<typeof getContainer>
      let customerId: string

      beforeEach(async () => {
        container = getContainer()
        const { customer } = await createCustomerUser(container, {
          email: `loyalty-${Date.now()}@test.com`,
        })
        customerId = customer.id

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
          })
          .catch(error => error.response)

        expect(response.status).toEqual(401)
      })

      test("rejects an empty cart", async () => {
        const { regions } = await api.get("/store/regions")
        const cartResponse = await api.post(
          "/store/carts",
          { region_id: regions[0].id },
          customerHeaders
        )

        const response = await api
          .post(
            "/store/fp/rewards/apply-to-cart",
            { cart_id: cartResponse.data.cart.id, points_to_redeem: 100 },
            customerHeaders
          )
          .catch(error => error.response)

        expect(response.status).toEqual(400)
        expect(customerId).toBeTruthy()
      })
    })
  },
})
