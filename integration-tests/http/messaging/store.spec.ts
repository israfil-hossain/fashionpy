import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../helpers/create-admin-user"
import { createCustomerUser } from "../../helpers/create-customer-user"

jest.setTimeout(300000)

/**
 * Store messaging — conversation creation used to 500 because the
 * create-conversation workflow computed `thread_key` at graph-build time
 * (step proxies) and persisted `undefined`.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store messaging", () => {
      let appContainer: MedusaContainer
      let storeHeaders: any
      let customerHeaders: any
      let customerId: string

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const apiKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey: apiKey })

        const customer = await createCustomerUser(appContainer, {
          email: `messaging-${Date.now()}@test.com`,
        })
        customerId = customer.customer.id
        customerHeaders = {
          headers: {
            ...storeHeaders.headers,
            ...customer.headers.headers,
          },
        }
      })

      it("rejects unauthenticated conversation reads", async () => {
        const response = await api
          .get("/store/messages", storeHeaders)
          .catch((e) => e.response)

        expect(response.status).toEqual(401)
      })

      it("creates a support conversation with a persisted thread key and message", async () => {
        const response = await api.post(
          "/store/messages",
          { type: "support", body: "Need help with my order" },
          customerHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.conversation.id).toBeTruthy()
        expect(response.data.conversation.type).toEqual("support_customer")
        expect(response.data.conversation.thread_key).toEqual(
          `sc:${customerId}`
        )
        expect(response.data.message).toBeTruthy()
        expect(response.data.message.body).toEqual("Need help with my order")
        expect(response.data.message.sender_type).toEqual("customer")
      })

      it("lists the customer's conversations and returns the thread", async () => {
        const created = await api.post(
          "/store/messages",
          { type: "support", body: "Where is my package?" },
          customerHeaders
        )
        const conversationId = created.data.conversation.id

        const list = await api.get("/store/messages", customerHeaders)
        expect(list.status).toEqual(200)
        const row = (list.data.conversations as any[]).find(
          (c) => c.id === conversationId
        )
        expect(row).toBeTruthy()
        expect(row.thread_key).toEqual(`sc:${customerId}`)

        const thread = await api.get(
          `/store/messages/${conversationId}`,
          customerHeaders
        )
        expect(thread.status).toEqual(200)
        expect(thread.data.conversation.id).toEqual(conversationId)
        expect(
          (thread.data.messages as any[]).some(
            (m) => m.body === "Where is my package?"
          )
        ).toBe(true)
      })

      it("requires seller_id for marketplace conversations", async () => {
        const response = await api
          .post("/store/messages", { type: "marketplace" }, customerHeaders)
          .catch((e) => e.response)

        expect(response.status).toEqual(400)
      })

      it("404s another customer's thread", async () => {
        const created = await api.post(
          "/store/messages",
          { type: "support", body: "private thread" },
          customerHeaders
        )

        const other = await createCustomerUser(appContainer, {
          email: `messaging-other-${Date.now()}@test.com`,
        })
        const otherHeaders = {
          headers: {
            ...storeHeaders.headers,
            ...other.headers.headers,
          },
        }

        const response = await api
          .get(
            `/store/messages/${created.data.conversation.id}`,
            otherHeaders
          )
          .catch((e) => e.response)

        expect(response.status).toEqual(404)
      })
    })
  },
})
