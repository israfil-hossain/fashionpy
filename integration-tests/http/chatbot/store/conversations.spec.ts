import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"

jest.setTimeout(300000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Chatbot store conversations + shipments", () => {
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
          email: `chatbot-ship-${Date.now()}@test.com`,
        })
        customerId = customer.customer.id
        customerHeaders = {
          headers: {
            ...storeHeaders.headers,
            ...customer.headers.headers,
          },
        }
      })

      it("returns empty shipments for a customer with no orders", async () => {
        const created = await api.post(
          "/store/chatbot/conversations",
          { locale: "en" },
          customerHeaders
        )
        const id = created.data.conversation.id

        const response = await api.get(
          `/store/chatbot/conversations/${id}/shipments`,
          customerHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.shipments).toEqual([])
      })

      it("rejects guest conversation creation (strict login gate)", async () => {
        const created = await api
          .post(
            "/store/chatbot/conversations",
            { locale: "en", guest_token: "guest_ship_1" },
            storeHeaders
          )
          .catch((e) => e.response)

        // SPEC-011: no guest conversations — login is required.
        expect(created.status).toEqual(401)
      })

      it("404s shipments for another customer's conversation", async () => {
        const other = await createCustomerUser(appContainer, {
          email: `chatbot-other-${Date.now()}@test.com`,
        })
        const otherHeaders = {
          headers: {
            ...storeHeaders.headers,
            ...other.headers.headers,
          },
        }

        const created = await api.post(
          "/store/chatbot/conversations",
          { locale: "en" },
          otherHeaders
        )
        const foreignId = created.data.conversation.id

        const response = await api
          .get(
            `/store/chatbot/conversations/${foreignId}/shipments`,
            customerHeaders
          )
          .catch((e) => e.response)

        expect(response.status).toEqual(404)
      })

      it("only lists the authenticated customer's own conversations", async () => {
        const other = await createCustomerUser(appContainer, {
          email: `chatbot-list-${Date.now()}@test.com`,
        })
        const otherHeaders = {
          headers: {
            ...storeHeaders.headers,
            ...other.headers.headers,
          },
        }
        await api.post(
          "/store/chatbot/conversations",
          { locale: "en" },
          otherHeaders
        )
        await api.post(
          "/store/chatbot/conversations",
          { locale: "bn" },
          customerHeaders
        )

        const list = await api.get(
          "/store/chatbot/conversations",
          customerHeaders
        )
        expect(list.status).toEqual(200)
        expect(list.data.conversations.length).toBeGreaterThanOrEqual(1)
        expect(
          list.data.conversations.every((c: any) => c.customer_id === customerId)
        ).toBe(true)
      })

      it("listMessages returns the latest N messages in chronological order", async () => {
        // Regression: `asc + limit` used to return the OLDEST N rows, so long
        // conversations replayed stale context to the agent (and dropped the
        // recent tail from the history GET).
        const created = await api.post(
          "/store/chatbot/conversations",
          { locale: "en" },
          customerHeaders
        )
        const id = created.data.conversation.id

        const service = appContainer.resolve("chatbot") as any
        for (let i = 1; i <= 8; i++) {
          await service.appendMessage({
            conversation_id: id,
            role: i % 2 === 1 ? "user" : "assistant",
            content: `msg-${i}`,
          })
          // created_at has ms precision — keep inserts on distinct timestamps.
          await new Promise((resolve) => setTimeout(resolve, 3))
        }

        const latest = await service.listMessages(id, { limit: 5 })
        expect(latest.map((m: any) => m.content)).toEqual([
          "msg-4",
          "msg-5",
          "msg-6",
          "msg-7",
          "msg-8",
        ])

        const all = await service.listMessages(id, { limit: 100 })
        expect(all.map((m: any) => m.content)).toEqual([
          "msg-1",
          "msg-2",
          "msg-3",
          "msg-4",
          "msg-5",
          "msg-6",
          "msg-7",
          "msg-8",
        ])
      })
    })
  },
})
