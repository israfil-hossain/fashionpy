import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

const mediaImage = (i: number) => `http://example.com/collection-media-${i}.png`

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store - Collection media", () => {
      let appContainer: MedusaContainer
      let storeHeaders: { headers: Record<string, string> }

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const apiKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey: apiKey })
      })

      it("returns gallery media with banner/thumbnail flags for storefront cards", async () => {
        const created = await api.post(
          "/admin/collections",
          {
            title: "Winter Edit",
            handle: "winter-edit",
            media: [
              { url: mediaImage(1), is_banner: true },
              { url: mediaImage(2), is_thumbnail: true },
            ],
          },
          adminHeaders
        )
        expect(created.status).toEqual(200)

        const response = await api.get(
          "/store/collections?limit=100&fields=id,title,handle,media_images.id,media_images.url,media_images.type,media_images.is_thumbnail,media_images.is_banner,media_images.rank",
          storeHeaders
        )

        expect(response.status).toEqual(200)
        const collection = response.data.collections.find(
          (item: { handle: string }) => item.handle === "winter-edit"
        )
        expect(collection).toBeDefined()

        const images = collection.media_images
        expect(images).toHaveLength(2)

        const banner = images.find(
          (img: { is_banner?: boolean }) => img.is_banner
        )
        const thumbnail = images.find(
          (img: { is_thumbnail?: boolean }) => img.is_thumbnail
        )
        expect(banner?.url).toEqual(mediaImage(1))
        expect(thumbnail?.url).toEqual(mediaImage(2))
      })
    })
  },
})
