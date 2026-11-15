import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

// The test app (db create + migrations + boot) exceeds 60s on loaded dev
// machines; other agent sessions routinely hold the load average over 15.
jest.setTimeout(300000)

const DAY = 24 * 60 * 60 * 1000

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store - Active promotions", () => {
      let appContainer: MedusaContainer
      let storeHeaders: any

      const createPlatformPromotion = async (
        code: string,
        extra: Record<string, unknown> = {}
      ) => {
        const { data } = await api.post(
          `/admin/promotions`,
          {
            code,
            type: "standard",
            status: "active",
            application_method: {
              type: "percentage",
              target_type: "order",
              allocation: "across",
              value: 15,
            },
            ...extra,
          },
          adminHeaders
        )
        return data.promotion
      }

      const listCodes = async (): Promise<string[]> => {
        const { data } = await api.get(`/store/promotions`, storeHeaders)
        expect(data.promotions).toBeDefined()
        return data.promotions.map((p: any) => p.code)
      }

      beforeAll(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const apiKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey: apiKey })
      })

      it("returns an active platform promotion that has a code", async () => {
        await createPlatformPromotion("ACTIVE_HOME_15")

        const codes = await listCodes()
        expect(codes).toContain("ACTIVE_HOME_15")
      })

      it("does not return a draft promotion", async () => {
        await createPlatformPromotion("DRAFT_HOME_15", { status: "draft" })

        const codes = await listCodes()
        expect(codes).not.toContain("DRAFT_HOME_15")
      })

      it("does not return an inactive promotion", async () => {
        await createPlatformPromotion("INACTIVE_HOME_15", {
          status: "inactive",
        })

        const codes = await listCodes()
        expect(codes).not.toContain("INACTIVE_HOME_15")
      })

      it("does not return an automatic promotion", async () => {
        await createPlatformPromotion("AUTO_HOME_15", {
          is_automatic: true,
          limit: null,
        })

        const codes = await listCodes()
        expect(codes).not.toContain("AUTO_HOME_15")
      })

      it("does not return a promotion whose campaign has not started", async () => {
        const startsAt = new Date(Date.now() + 7 * DAY)
        const endsAt = new Date(Date.now() + 14 * DAY)
        await createPlatformPromotion("FUTURE_CAMPAIGN_15", {
          campaign: {
            name: "Future Campaign",
            campaign_identifier: `future-${Date.now()}`,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
          },
        })

        const codes = await listCodes()
        expect(codes).not.toContain("FUTURE_CAMPAIGN_15")
      })

      it("does not return a promotion whose campaign has ended", async () => {
        const startsAt = new Date(Date.now() - 14 * DAY)
        const endsAt = new Date(Date.now() - 7 * DAY)
        await createPlatformPromotion("PAST_CAMPAIGN_15", {
          campaign: {
            name: "Past Campaign",
            campaign_identifier: `past-${Date.now()}`,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
          },
        })

        const codes = await listCodes()
        expect(codes).not.toContain("PAST_CAMPAIGN_15")
      })

      it("returns a promotion inside an active campaign window with campaign details", async () => {
        const startsAt = new Date(Date.now() - DAY)
        const endsAt = new Date(Date.now() + 7 * DAY)
        const promotion = await createPlatformPromotion("LIVE_CAMPAIGN_15", {
          campaign: {
            name: "Live Campaign",
            campaign_identifier: `live-${Date.now()}`,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
          },
        })

        const { data } = await api.get(`/store/promotions`, storeHeaders)
        const found = data.promotions.find((p: any) => p.id === promotion.id)
        expect(found).toBeDefined()
        expect(found.code).toEqual("LIVE_CAMPAIGN_15")
        expect(found.campaign?.name).toEqual("Live Campaign")
        expect(found.campaign?.starts_at).toBeDefined()
        expect(found.campaign?.ends_at).toBeDefined()
      })

      it("returns a promotion with no campaign", async () => {
        await createPlatformPromotion("NO_CAMPAIGN_15")

        const codes = await listCodes()
        expect(codes).toContain("NO_CAMPAIGN_15")
      })

      it("does not return a seller-scoped promotion", async () => {
        const { headers } = await createSellerUser(appContainer, {
          email: `seller-promo-${Date.now()}@test.com`,
          name: "Promo Seller",
        })

        await api.post(
          `/vendor/promotions`,
          {
            code: "SELLER_ONLY_15",
            type: "standard",
            status: "active",
            application_method: {
              type: "percentage",
              target_type: "order",
              allocation: "across",
              value: 15,
            },
          },
          headers
        )

        const codes = await listCodes()
        expect(codes).not.toContain("SELLER_ONLY_15")
      })

      it("exposes only public fields — no budget or rules", async () => {
        await createPlatformPromotion("SAFE_FIELDS_15", {
          campaign: {
            name: "Safe Fields",
            campaign_identifier: `safe-${Date.now()}`,
            budget: { type: "usage", limit: 100 },
          },
        })

        const { data } = await api.get(`/store/promotions`, storeHeaders)
        const found = data.promotions.find(
          (p: any) => p.code === "SAFE_FIELDS_15"
        )
        expect(found).toBeDefined()
        expect(found.budget).toBeUndefined()
        expect(found.rules).toBeUndefined()
        expect(found.seller).toBeUndefined()
        expect(found.application_method).toBeDefined()
        expect(found.application_method.value).toEqual(15)
      })
    })
  },
})
