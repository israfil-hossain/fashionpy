import { MedusaContainer } from "@medusajs/framework/types"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MercurModules } from "@mercurjs/types"

import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(120_000)

type AiQuota = { used: number; quota: number; remaining: number }

type SellerService = {
  updateSellers(data: Record<string, unknown>): Promise<unknown>
  consumeAiProductCredit(sellerId: string): Promise<AiQuota>
  refundAiProductCredit(sellerId: string): Promise<void>
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("seller AI product quota", () => {
      let container: MedusaContainer
      const service = () =>
        container.resolve<SellerService>(MercurModules.SELLER)

      beforeAll(() => {
        container = getContainer()
      })

      it("consumes and refunds a credit", async () => {
        const { seller } = await createSellerUser(container, {
          email: "ai-quota@test.com",
          name: "AI Quota Seller",
        })

        const first = await service().consumeAiProductCredit(seller.id)
        expect(first).toEqual({ used: 1, quota: 20, remaining: 19 })

        await service().refundAiProductCredit(seller.id)

        const second = await service().consumeAiProductCredit(seller.id)
        expect(second).toEqual({ used: 1, quota: 20, remaining: 19 })
      })

      it("refuses past the quota and respects a raised limit", async () => {
        const { seller } = await createSellerUser(container, {
          email: "ai-quota-limited@test.com",
          name: "AI Quota Limited",
        })

        await service().updateSellers({
          id: seller.id,
          metadata: { ai_product_quota: 1 },
        })

        await service().consumeAiProductCredit(seller.id)
        await expect(
          service().consumeAiProductCredit(seller.id)
        ).rejects.toThrow(/AI product limit/)

        await service().updateSellers({
          id: seller.id,
          metadata: { ai_product_quota: 2 },
        })

        const raised = await service().consumeAiProductCredit(seller.id)
        expect(raised).toEqual({ used: 2, quota: 2, remaining: 0 })
      })
    })
  },
})
