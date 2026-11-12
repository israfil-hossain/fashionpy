import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

const mediaImage = (i: number) => `http://example.com/category-media-${i}.png`
const iconImage = (i: number) => `http://example.com/category-icon-${i}.svg`

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store - Product category media", () => {
      let appContainer: MedusaContainer
      let storeHeaders: { headers: Record<string, string> }

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const apiKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey: apiKey })
      })

      // The product model defaults `is_active` to false; the storefront only
      // lists active categories, so tests opt in explicitly.
      const createCategory = async (body: Record<string, unknown>) => {
        const response = await api.post(
          "/admin/product-categories",
          { is_active: true, ...body },
          adminHeaders
        )
        expect(response.status).toEqual(200)
        return response.data.product_category
      }

      it("returns gallery and icon media on the store list by default", async () => {
        await createCategory({
          name: "Menswear",
          handle: "menswear",
          media: [
            { url: mediaImage(1), is_thumbnail: true, is_banner: true },
            { url: mediaImage(2) },
          ],
          icon: iconImage(1),
        })

        const response = await api.get(
          "/store/product-categories?handle=menswear",
          storeHeaders
        )

        expect(response.status).toEqual(200)
        const category = response.data.product_categories[0]
        const images = category.media_images

        expect(images).toBeDefined()
        expect(images).toHaveLength(3)
        const thumbnail = images.find(
          (img: { url: string }) => img.url === mediaImage(1)
        )
        expect(thumbnail?.is_thumbnail).toEqual(true)
        expect(thumbnail?.is_banner).toEqual(true)
        expect(
          images.find((img: { type: string | null }) => img.type === "icon")?.url
        ).toEqual(iconImage(1))
      })

      it("returns media on nested children so a category tree can render", async () => {
        const parent = await createCategory({
          name: "Sneakers",
          handle: "sneakers",
          media: [{ url: mediaImage(1), is_thumbnail: true }],
        })
        await createCategory({
          name: "High Top",
          handle: "high-top",
          parent_category_id: parent.id,
          media: [{ url: mediaImage(2), is_banner: true }],
        })

        const response = await api.get(
          "/store/product-categories?limit=100",
          storeHeaders
        )

        expect(response.status).toEqual(200)

        const parentCategory = response.data.product_categories.find(
          (category: { handle: string }) => category.handle === "sneakers"
        )
        expect(parentCategory).toBeDefined()
        expect(parentCategory.media_images).toHaveLength(1)

        const child = parentCategory.category_children.find(
          (category: { handle: string }) => category.handle === "high-top"
        )
        expect(child).toBeDefined()
        expect(child.media_images).toHaveLength(1)
        expect(child.media_images[0].url).toEqual(mediaImage(2))
        expect(child.media_images[0].is_banner).toEqual(true)
      })

      it("returns media on the store retrieve by handle", async () => {
        await createCategory({
          name: "Boots",
          handle: "boots",
          media: [{ url: mediaImage(3), is_thumbnail: true }],
        })

        const response = await api.get(
          "/store/product-categories?handle=boots",
          storeHeaders
        )

        expect(response.status).toEqual(200)
        const images = response.data.product_categories[0].media_images
        expect(images).toHaveLength(1)
        expect(images[0].url).toEqual(mediaImage(3))
      })
    })
  },
})
