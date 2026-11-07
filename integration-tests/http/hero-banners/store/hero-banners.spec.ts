import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { IEventBusModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"

jest.setTimeout(180000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store - Hero banners", () => {
      let appContainer: MedusaContainer
      let storeHeaders: { headers: Record<string, string> }

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const apiKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey: apiKey })
      })

      const createBanner = async (overrides: Record<string, unknown> = {}) => {
        const response = await api.post(
          "/admin/hero-banners",
          {
            title: "Store visible slide",
            image_url: "http://example.com/hero.png",
            slot: "hero",
            ...overrides,
          },
          adminHeaders
        )
        expect(response.status).toEqual(201)
        return response.data.hero_banner
      }

      it("returns an active banner created by the admin", async () => {
        const banner = await createBanner()

        const response = await api.get(
          "/store/hero-banners?slot=hero",
          storeHeaders
        )

        expect(response.status).toEqual(200)
        const visible = response.data.hero_banners.find(
          (b: { id: string }) => b.id === banner.id
        )
        expect(visible).toBeDefined()
        expect(visible.title).toEqual("Store visible slide")
        expect(visible.is_active).toEqual(true)
        expect(visible).toHaveProperty("starts_at")
        expect(visible).toHaveProperty("ends_at")

        await api.delete(`/admin/hero-banners/${banner.id}`, adminHeaders)
      })

      it("hides inactive banners", async () => {
        const banner = await createBanner({ is_active: false })

        const response = await api.get(
          "/store/hero-banners?slot=hero",
          storeHeaders
        )

        expect(response.status).toEqual(200)
        const visible = response.data.hero_banners.find(
          (b: { id: string }) => b.id === banner.id
        )
        expect(visible).toBeUndefined()

        await api.delete(`/admin/hero-banners/${banner.id}`, adminHeaders)
      })

      it("hides banners outside their date window", async () => {
        const startsLater = await createBanner({
          title: "Starts later",
          starts_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        const endedEarlier = await createBanner({
          title: "Ended earlier",
          ends_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        })

        const response = await api.get(
          "/store/hero-banners?slot=hero",
          storeHeaders
        )

        expect(response.status).toEqual(200)
        const ids = response.data.hero_banners.map((b: { id: string }) => b.id)
        expect(ids).not.toContain(startsLater.id)
        expect(ids).not.toContain(endedEarlier.id)

        await api.delete(`/admin/hero-banners/${startsLater.id}`, adminHeaders)
        await api.delete(`/admin/hero-banners/${endedEarlier.id}`, adminHeaders)
      })

      it("filters banners by slot", async () => {
        const hero = await createBanner({ title: "Hero slide" })
        const company = await createBanner({
          title: "Company slide",
          slot: "company_1",
        })

        const response = await api.get(
          "/store/hero-banners?slot=hero",
          storeHeaders
        )

        expect(response.status).toEqual(200)
        const ids = response.data.hero_banners.map((b: { id: string }) => b.id)
        expect(ids).toContain(hero.id)
        expect(ids).not.toContain(company.id)

        await api.delete(`/admin/hero-banners/${hero.id}`, adminHeaders)
        await api.delete(`/admin/hero-banners/${company.id}`, adminHeaders)
      })

      it("emits hero_banner events so the storefront cache can invalidate", async () => {
        const eventBus = appContainer.resolve<IEventBusModuleService>(
          Modules.EVENT_BUS
        )
        const emitted: string[] = []
        eventBus.subscribe("*", async (event) => {
          if (event.name.startsWith("hero_banner.")) {
            emitted.push(event.name)
          }
        })

        const banner = await createBanner()
        await api.post(
          `/admin/hero-banners/${banner.id}`,
          { title: "Renamed slide" },
          adminHeaders
        )
        await api.delete(`/admin/hero-banners/${banner.id}`, adminHeaders)

        expect(emitted).toContain("hero_banner.created")
        expect(emitted).toContain("hero_banner.updated")
        expect(emitted).toContain("hero_banner.deleted")
      })
    })
  },
})
