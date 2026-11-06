import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("GET /vendor/analytics", () => {
      let appContainer: MedusaContainer
      let headers: { headers: Record<string, string> }

      beforeAll(async () => {
        appContainer = getContainer()
        const created = await createSellerUser(appContainer, {
          email: "analytics-seller@test.com",
          name: "Analytics Store",
        })
        headers = created.headers
      })

      it("returns the analytics payload for a seller", async () => {
        const response = await api.get("/vendor/analytics?period=7d", headers)

        expect(response.status).toEqual(200)

        const { data } = response
        expect(data.period).toEqual("7d")
        expect(typeof data.kpis.revenue).toBe("number")
        expect(typeof data.kpis.orders).toBe("number")
        expect(typeof data.kpis.aov).toBe("number")
        expect(typeof data.kpis.active_offers).toBe("number")
        expect(typeof data.kpis.active_bundles).toBe("number")
        expect(typeof data.kpis.active_promotions).toBe("number")
        expect(Array.isArray(data.revenue_series)).toBe(true)
        expect(Array.isArray(data.orders_by_status)).toBe(true)
        expect(Array.isArray(data.top_products)).toBe(true)
        expect(Array.isArray(data.recent_orders)).toBe(true)
        expect(typeof data.payouts.paid).toBe("number")
        expect(typeof data.payouts.pending).toBe("number")
        expect(typeof data.payouts.pending_count).toBe("number")
      })

      it("supports every period bucket", async () => {
        for (const period of ["30d", "90d", "12m"]) {
          const response = await api.get(
            `/vendor/analytics?period=${period}`,
            headers
          )

          expect(response.status).toEqual(200)
          expect(response.data.period).toEqual(period)
        }
      })

      it("rejects unauthenticated requests", async () => {
        const error = await api.get("/vendor/analytics").catch((e) => e)

        expect(error.response.status).toEqual(401)
      })
    })
  },
})
