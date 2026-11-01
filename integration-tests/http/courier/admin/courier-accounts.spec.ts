import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(600000)

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "text/html" },
  })

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - courier accounts (platform setup)", () => {
      let appContainer: MedusaContainer

      const originalFetch = global.fetch

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      afterEach(() => {
        global.fetch = originalFetch
      })

      it("lists accounts with platform env status and rejects unauthenticated access", async () => {
        const unauth = await api.get("/admin/courier-accounts").catch((e) => e)
        expect(unauth.status ?? unauth.response?.status).toEqual(401)

        const response = await api.get("/admin/courier-accounts", adminHeaders)
        expect(response.status).toEqual(200)
        expect(response.data.courier_accounts).toEqual([])
        expect(response.data.platform_env).toEqual({
          pathao: false,
          steadfast: false,
        })
      })

      it("creates the platform account (seller_id null) after credential validation", async () => {
        global.fetch = (async (input: any) => {
          const url = String(input)
          if (url.includes("issue-token")) {
            return jsonResponse({ access_token: "tok", expires_in: 7200 })
          }
          if (url.includes("/stores")) {
            return jsonResponse({
              data: { data: [{ store_id: 4, store_name: "Platform" }] },
            })
          }
          return jsonResponse({ message: `unmocked ${url}` }, 404)
        }) as typeof fetch

        const created = await api.post(
          "/admin/courier-accounts",
          {
            provider: "pathao",
            data: {
              client_id: "cid",
              client_secret: "sec",
              username: "ops@fashionpy.com",
              password: "pw",
            },
          },
          adminHeaders
        )

        expect([200, 201]).toContain(created.status)
        const account = created.data.courier_account
        expect(account.provider).toEqual("pathao")
        expect(account.seller_id).toBeNull()
        expect(account.status).toEqual("active")
        expect(account).not.toHaveProperty("data")
        expect(JSON.stringify(account)).not.toContain("client_secret")

        // second save upserts instead of duplicating
        const again = await api.post(
          "/admin/courier-accounts",
          { provider: "pathao", data: { client_id: "cid", client_secret: "sec2", username: "ops@fashionpy.com", password: "pw2" } },
          adminHeaders
        )
        expect([200, 201]).toContain(again.status)

        const list = await api.get("/admin/courier-accounts", adminHeaders)
        const pathaoAccounts = (list.data.courier_accounts ?? []).filter(
          (a: any) => a.provider === "pathao" && !a.seller_id
        )
        expect(pathaoAccounts).toHaveLength(1)
      })

      it("rejects invalid platform credentials with 400", async () => {
        global.fetch = (async () =>
          jsonResponse({ message: "invalid client" }, 401)) as typeof fetch

        const error = await api
          .post(
            "/admin/courier-accounts",
            {
              provider: "pathao",
              data: { client_id: "bad", client_secret: "bad", username: "x", password: "x" },
            },
            adminHeaders
          )
          .catch((e) => e)

        expect(error.response?.status ?? error.status).toEqual(400)
      })

      it("seller accounts remain isolated from the admin view filters", async () => {
        global.fetch = (async () =>
          jsonResponse({ status: "success", data: { current_balance: 5 } })) as typeof fetch

        const seller = await createSellerUser(appContainer, {
          email: "seller-for-admin-view@test.com",
          name: "Admin View Seller",
        })
        const sellerAccount = await api.post(
          "/vendor/courier-accounts",
          { provider: "steadfast", data: { apiKey: "k", secretKey: "s" } },
          seller.headers
        )
        expect(sellerAccount.status).toEqual(201)

        const adminList = await api.get("/admin/courier-accounts", adminHeaders)
        const sellerRow = (adminList.data.courier_accounts ?? []).find(
          (a: any) => a.id === sellerAccount.data.courier_account.id
        )
        expect(sellerRow).toBeDefined()
        expect(sellerRow.seller_name).toBeTruthy()
        expect(sellerRow).not.toHaveProperty("data")
      })
    })
  },
})
