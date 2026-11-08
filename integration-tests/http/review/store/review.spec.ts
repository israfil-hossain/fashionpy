import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"

jest.setTimeout(180000)

const seedProductReview = async (
  container: MedusaContainer,
  productId: string,
  customerId: string,
  overrides: Record<string, unknown> = {}
) => {
  const service = container.resolve(MercurModules.REVIEW)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const review = await service.createReviews({
    reference: "product",
    rating: 5,
    customer_note: "Love it",
    status: "published",
    ...overrides,
  })

  await link.create([
    {
      [Modules.PRODUCT]: { product_id: productId },
      [MercurModules.REVIEW]: { review_id: review.id },
    },
    {
      [Modules.CUSTOMER]: { customer_id: customerId },
      [MercurModules.REVIEW]: { review_id: review.id },
    },
  ])

  return review
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Store - Reviews", () => {
      let appContainer: MedusaContainer
      let storeHeaders: ReturnType<typeof generateStoreHeaders>
      let productId: string
      let customerId: string
      let customerHeaders: { headers: Record<string, string> }

      const authedStoreHeaders = () => ({
        headers: { ...storeHeaders.headers, ...customerHeaders.headers },
      })

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })

        const productModule = appContainer.resolve(Modules.PRODUCT)
        const product = await productModule.createProducts({
          title: "Reviewable Product",
          status: ProductStatus.PUBLISHED,
          variants: [{ title: "Default" }],
        })
        productId = product.id

        const customerResult = await createCustomerUser(appContainer, {
          email: `buyer-${Date.now()}@test.com`,
        })
        customerId = customerResult.customer.id
        customerHeaders = customerResult.headers
      })

      describe("GET /store/reviews", () => {
        it("lists published product reviews without authentication", async () => {
          await seedProductReview(appContainer, productId, customerId, {
            status: "published",
            customer_note: "Public note",
          })

          const response = await api.get(
            `/store/reviews?product_id=${productId}`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(1)
          expect(response.data.reviews[0].customer_note).toEqual("Public note")
          expect(response.data.reviews[0].status).toEqual("published")
        })

        it("hides pending and rejected reviews from the public product listing", async () => {
          await seedProductReview(appContainer, productId, customerId, {
            status: "published",
            customer_note: "Visible",
          })
          await seedProductReview(appContainer, productId, customerId, {
            status: "pending",
            customer_note: "Hidden pending",
          })
          await seedProductReview(appContainer, productId, customerId, {
            status: "rejected",
            customer_note: "Hidden rejected",
          })

          const response = await api.get(
            `/store/reviews?product_id=${productId}`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(1)
          expect(
            response.data.reviews.every((r: any) => r.status === "published")
          ).toBe(true)
          expect(response.data.reviews[0].customer_note).toEqual("Visible")
        })

        it("forces status=published even when the client asks for pending", async () => {
          await seedProductReview(appContainer, productId, customerId, {
            status: "pending",
            customer_note: "Should not appear",
          })

          const response = await api.get(
            `/store/reviews?product_id=${productId}&status=pending`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(0)
        })

        it("does not return reviews for a different product", async () => {
          const productModule = appContainer.resolve(Modules.PRODUCT)
          const other = await productModule.createProducts({
            title: "Other Product",
            status: ProductStatus.PUBLISHED,
            variants: [{ title: "Default" }],
          })

          await seedProductReview(appContainer, other.id, customerId, {
            status: "published",
            customer_note: "Other product review",
          })

          const response = await api.get(
            `/store/reviews?product_id=${productId}`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(0)
        })

        it("requires authentication for the personal reviews list", async () => {
          const response = await api
            .get(`/store/reviews`, storeHeaders)
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("returns only the signed-in customer's reviews for the personal list", async () => {
          const other = await createCustomerUser(appContainer, {
            email: `other-${Date.now()}@test.com`,
          })

          await seedProductReview(appContainer, productId, customerId, {
            status: "pending",
            customer_note: "Mine",
          })
          await seedProductReview(appContainer, productId, other.customer.id, {
            status: "published",
            customer_note: "Theirs",
          })

          const response = await api.get(
            `/store/reviews`,
            authedStoreHeaders()
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(1)
          expect(response.data.reviews[0].customer_note).toEqual("Mine")
          expect(response.data.reviews[0].status).toEqual("pending")
        })

        it("returns pending personal reviews alongside published ones", async () => {
          await seedProductReview(appContainer, productId, customerId, {
            status: "pending",
            customer_note: "Awaiting moderation",
          })
          await seedProductReview(appContainer, productId, customerId, {
            status: "published",
            customer_note: "Already live",
          })

          const response = await api.get(
            `/store/reviews`,
            authedStoreHeaders()
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(2)
        })
      })
    })
  },
})
