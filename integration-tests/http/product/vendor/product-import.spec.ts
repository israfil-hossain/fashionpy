import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(120000)

/**
 * Vendor bulk product upload: `POST /vendor/products/import` accepts a CSV
 * (Medusa v1 export format), parses it with `parseProductCsvStep` and creates
 * every product through Mercur's `createProductsWorkflow` so the products are
 * linked to the importing seller (`product_seller`) and recorded in the
 * product-edit audit trail. `POST /vendor/products/export` returns a CSV
 * download URL for the seller's products.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Vendor - product import/export", () => {
      let appContainer: MedusaContainer
      let seller: any
      let sellerHeaders: any

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const res = await createSellerUser(appContainer, {
          email: "vendor-import@test.com",
          name: "Vendor Import Store",
        })
        seller = res.seller
        sellerHeaders = res.headers
      })

      const CSV_HEADER = "Product Handle,Product Title,Variant Title"

      const uploadCsv = (rows: string[]) => {
        const csv = [CSV_HEADER, ...rows].join("\n")
        const formData = new FormData()
        formData.append(
          "file",
          new Blob([csv], { type: "text/csv" }),
          "products.csv"
        )
        return api.post("/vendor/products/import", formData, {
          headers: { ...sellerHeaders.headers },
          validateStatus: () => true,
        })
      }

      const listSellerProductIds = async (): Promise<string[]> => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_seller",
          fields: ["product_id"],
          filters: { seller_id: seller.id },
        })
        return (data as { product_id: string | null }[])
          .map((r) => r.product_id)
          .filter((id): id is string => !!id)
      }

      it("imports products from a CSV and links them to the seller", async () => {
        const res = await uploadCsv(["bulk-shirt,Bulk Shirt,Default"])

        expect(res.status).toEqual(200)
        expect(res.data.summary.created).toEqual(1)

        const productIds = await listSellerProductIds()
        expect(productIds).toHaveLength(1)

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product",
          fields: ["id", "title", "handle", "status", "variants.id"],
          filters: { id: productIds[0] },
        })

        const product = data[0] as {
          title: string
          handle: string
          status: string
          variants: { id: string }[]
        }
        expect(product.title).toEqual("Bulk Shirt")
        expect(product.handle).toEqual("bulk-shirt")
        expect(product.status).toEqual("draft")
        expect(product.variants.length).toBeGreaterThanOrEqual(1)
      })

      it("is visible in the seller product list after import", async () => {
        await uploadCsv(["bulk-listed,Bulk Listed,Default"])

        const list = await api.get("/vendor/products", sellerHeaders)
        expect(list.status).toEqual(200)

        const titles = (list.data.products as { title: string }[]).map(
          (p) => p.title
        )
        expect(titles).toContain("Bulk Listed")
      })

      it("rejects a CSV without a product handle", async () => {
        const res = await uploadCsv([",No Handle Product,Default"])

        expect(res.status).toEqual(400)
        expect(JSON.stringify(res.data)).toContain("handle")
      })

      it("rejects a request without a file", async () => {
        const res = await api.post(
          "/vendor/products/import",
          {},
          { ...sellerHeaders, validateStatus: () => true }
        )

        expect(res.status).toEqual(400)
        expect(JSON.stringify(res.data)).toContain("No file uploaded")
      })

      it("exports the seller products as a CSV url", async () => {
        await uploadCsv(["export-me,Export Me,Default"])

        const res = await api.post(
          "/vendor/products/export",
          {},
          sellerHeaders
        )

        expect(res.status).toEqual(200)
        expect(typeof res.data.url).toEqual("string")
        expect(res.data.url.length).toBeGreaterThan(0)
      })
    })
  },
})
