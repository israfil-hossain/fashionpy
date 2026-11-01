import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

const PRODUCT_PAGE_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Scraped Winter Hoodie || 12144</title>
  <meta property="og:title" content="Premium Winter Hoodie">
  <meta property="og:image" content="https://cdn.example.com/hoodie.jpg">
  <meta property="product:price:amount" content="1299">
  <meta property="product:price:currency" content="BDT">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Premium Winter Hoodie",
    "image": ["https://cdn.example.com/hoodie.jpg"],
    "description": "Warm printed hoodie.",
    "sku": "HOODIE-12144",
    "offers": { "@type": "Offer", "price": "1299", "priceCurrency": "BDT" }
  }
  </script>
</head>
<body>
  <h1>Premium Winter Hoodie</h1>
  <div class="product_select_attribute_container_modal">
    <div class="product_select_attribute_modal">
      <ul>
        <li>
          <div class="select_size_name_modal"><span>M</span></div>
          <span class="select_price_modal">1499TK</span>
          <span class="select_price_modal">1299TK</span>
        </li>
        <li>
          <div class="select_size_name_modal"><span>L</span></div>
          <span class="select_price_modal">1499TK</span>
          <span class="select_price_modal">1299TK</span>
        </li>
      </ul>
    </div>
  </div>
</body>
</html>`

const NO_PRODUCT_HTML = `<!DOCTYPE html><html><head><title>Just a title</title></head><body><p>nothing</p></body></html>`

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Product scrape", () => {
      let appContainer: MedusaContainer

      const originalFetch = global.fetch

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
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
          .post("/admin/products/scrape", {
            url: "https://93.184.216.34/product/x",
          })
          .catch((e) => e)

        expect(response.status).toEqual(401)
      })

      it("rejects a body without a url", async () => {
        const response = await api
          .post("/admin/products/scrape", {}, adminHeaders)
          .catch((e) => e)

        expect(response.status).toEqual(400)
      })

      it("rejects private addresses (SSRF guard)", async () => {
        const error = await api
          .post(
            "/admin/products/scrape",
            { url: "http://127.0.0.1:9000/admin/products" },
            adminHeaders
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
          "/admin/products/scrape",
          { url: "https://93.184.216.34/product/premium-winter-hoodie" },
          adminHeaders
        )

        expect(response.status).toEqual(200)
        const draft = response.data.product
        expect(draft.title).toEqual("Premium Winter Hoodie")
        expect(draft.images).toEqual(["https://cdn.example.com/hoodie.jpg"])
        expect(draft.description).toEqual("Warm printed hoodie.")
        expect(draft.sku).toEqual("HOODIE-12144")
        expect(draft.reference_price).toEqual({
          amount: 1299,
          currency_code: "BDT",
        })
        expect(draft.option_axes).toEqual([
          { title: "Size", values: ["M", "L"] },
        ])
        expect(draft.variants).toHaveLength(2)
        expect(draft.source_url).toEqual(
          "https://93.184.216.34/product/premium-winter-hoodie"
        )
      })

      it("returns 422 when the page has no product information", async () => {
        mockFetch(NO_PRODUCT_HTML)

        const error = await api
          .post(
            "/admin/products/scrape",
            { url: "https://93.184.216.34/not-a-product" },
            adminHeaders
          )
          .catch((e) => e)

        expect(error.response?.status ?? error.status).toEqual(422)
      })

      it("maps upstream 404 to a client error", async () => {
        mockFetch("gone", 404)

        const error = await api
          .post(
            "/admin/products/scrape",
            { url: "https://93.184.216.34/removed-item" },
            adminHeaders
          )
          .catch((e) => e)

        expect(error.response?.status ?? error.status).toEqual(400)
      })
    })
  },
})
