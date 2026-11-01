import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(600000)

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - courier accounts", () => {
      let appContainer: MedusaContainer
      let sellerHeaders: any

      const originalFetch = global.fetch

      beforeEach(async () => {
        appContainer = getContainer()
        const result = await createSellerUser(appContainer, {
          email: "seller-courier@test.com",
          name: "Courier Seller",
        })
        sellerHeaders = result.headers
      })

      afterEach(() => {
        global.fetch = originalFetch
      })

      it("starts with no accounts and rejects unauthenticated access", async () => {
        const unauth = await api
          .get("/vendor/courier-accounts")
          .catch((e) => e)
        expect(unauth.status ?? unauth.response?.status).toEqual(401)

        const response = await api.get("/vendor/courier-accounts", sellerHeaders)
        expect(response.status).toEqual(200)
        expect(response.data.courier_accounts).toEqual([])
      })

      it("validates Pathao credentials against the courier before persisting", async () => {
        // valid: issue-token + stores
        global.fetch = (async (input: any, init?: any) => {
          const url = String(input)
          if (url.includes("issue-token")) {
            return jsonResponse({ access_token: "tok", expires_in: 7200 })
          }
          if (url.includes("/stores")) {
            return jsonResponse({
              data: { data: [{ store_id: 5, store_name: "Main" }] },
            })
          }
          return jsonResponse({ message: `unmocked ${init?.method} ${url}` }, 404)
        }) as typeof fetch

        const created = await api.post(
          "/vendor/courier-accounts",
          {
            provider: "pathao",
            data: {
              client_id: "cid",
              client_secret: "sec",
              username: "a@b.com",
              password: "pw",
            },
          },
          sellerHeaders
        )

        expect(created.status).toEqual(201)
        const account = created.data.courier_account
        expect(account.provider).toEqual("pathao")
        expect(account.status).toEqual("active")
        expect(account.seller_id).toBeTruthy()
        // credentials must NEVER be echoed back to the client
        expect(account).not.toHaveProperty("data")
        expect(JSON.stringify(account)).not.toContain("client_secret")
      })

      it("rejects invalid credentials with 400 and persists nothing", async () => {
        global.fetch = (async () =>
          jsonResponse({ message: "invalid client" }, 401)) as typeof fetch

        const error = await api
          .post(
            "/vendor/courier-accounts",
            {
              provider: "pathao",
              data: {
                client_id: "bad",
                client_secret: "bad",
                username: "x",
                password: "x",
              },
            },
            sellerHeaders
          )
          .catch((e) => e)

        const status = error.response?.status ?? error.status
        expect(status).toEqual(400)

        global.fetch = originalFetch
        const list = await api.get("/vendor/courier-accounts", sellerHeaders)
        expect(list.data.courier_accounts).toEqual([])
      })

      it("toggles cod_enabled via PATCH", async () => {
        global.fetch = (async () =>
          jsonResponse({ status: "success", data: { current_balance: 100 } })) as typeof fetch

        const created = await api.post(
          "/vendor/courier-accounts",
          {
            provider: "steadfast",
            data: { apiKey: "k", secretKey: "s" },
          },
          sellerHeaders
        )
        expect(created.status).toEqual(201)
        expect(created.data.courier_account.cod_enabled).toEqual(true)

        const patched = await api.patch(
          `/vendor/courier-accounts/${created.data.courier_account.id}`,
          { cod_enabled: false },
          sellerHeaders
        )
        expect(patched.status).toEqual(200)
        expect(patched.data.courier_account.cod_enabled).toEqual(false)

        const deleted = await api.delete(
          `/vendor/courier-accounts/${created.data.courier_account.id}`,
          sellerHeaders
        )
        expect(deleted.status).toEqual(200)

        const list = await api.get("/vendor/courier-accounts", sellerHeaders)
        expect(list.data.courier_accounts).toEqual([])
      })

      it("scopes accounts to the acting seller (other sellers see nothing)", async () => {
        global.fetch = (async () =>
          jsonResponse({ status: "success", data: { current_balance: 1 } })) as typeof fetch

        const created = await api.post(
          "/vendor/courier-accounts",
          { provider: "steadfast", data: { apiKey: "k", secretKey: "s" } },
          sellerHeaders
        )
        expect(created.status).toEqual(201)
        const accountId = created.data.courier_account.id

        const other = await createSellerUser(appContainer, {
          email: "seller-courier-2@test.com",
          name: "Other Seller",
        })

        const otherList = await api.get("/vendor/courier-accounts", other.headers)
        expect(otherList.data.courier_accounts).toEqual([])

        const otherPatch = await api
          .patch(
            `/vendor/courier-accounts/${accountId}`,
            { cod_enabled: false },
            other.headers
          )
          .catch((e) => e)
        expect(otherPatch.response?.status ?? otherPatch.status).toEqual(404)
      })
    })
  },
})
