import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

const PRODUCT_PAGE_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Vendor Scrape Item</title>
  <meta property="og:title" content="Vendor Scrape Item">
  <meta property="og:image" content="https://cdn.example.com/item.jpg">
  <meta property="product:price:amount" content="500">
  <meta property="product:price:currency" content="BDT">
</head>
<body>
  <h1>Vendor Scrape Item</h1>
  <div class="product-gallery">
    <img src="https://cdn.example.com/item.jpg" alt="">
  </div>
  <div id="tab-description">Imported by the vendor scrape endpoint.</div>
</body>
</html>`

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - Product scrape", () => {
      let appContainer: MedusaContainer
      let sellerHeaders: any

      const originalFetch = global.fetch

      beforeEach(async () => {
        appContainer = getContainer()
        const result = await createSellerUser(appContainer, {
          email: "seller-scrape@test.com",
          name: "Scrape Seller",
        })
        sellerHeaders = result.headers
      })

      afterEach(() => {
        global.fetch = originalFetch
      })

      const mockFetch = (body: string, status = 200) => {
        global.fetch = (async () =>
          new Response(body, {
            status,
            headers: { "content-type": "text/html" },
          })) as typeof fetch
      }

      it("rejects unauthenticated requests", async () => {
        const response = await api
          .post("/vendor/products/scrape", {
            url: "https://93.184.216.34/product/x",
          })
          .catch((e) => e)

        expect(response.status).toEqual(401)
      })

      it("rejects private addresses (SSRF guard)", async () => {
        const error = await api
          .post(
            "/vendor/products/scrape",
            { url: "http://169.254.169.254/latest/meta-data" },
            sellerHeaders
          )
          .catch((e) => e)

        const status = error.response?.status ?? error.status
        const message = error.response?.data?.message ?? error.data?.message
        expect(status).toEqual(400)
        expect(message).toMatch(/local addresses/i)
      })

      it("scrapes a product page into a draft", async () => {
        mockFetch(PRODUCT_PAGE_HTML)

        const response = await api.post(
          "/vendor/products/scrape",
          { url: "https://93.184.216.34/product/vendor-scrape-item" },
          sellerHeaders
        )

        expect(response.status).toEqual(200)
        const draft = response.data.product
        expect(draft.title).toEqual("Vendor Scrape Item")
        expect(draft.images).toEqual(["https://cdn.example.com/item.jpg"])
        expect(draft.reference_price).toEqual({
          amount: 500,
          currency_code: "BDT",
        })
        expect(draft.description).toContain("Imported by the vendor")
      })
    })
  },
})
