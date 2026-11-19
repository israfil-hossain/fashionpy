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

      it("returns empty shipments for guests", async () => {
        const created = await api.post(
          "/store/chatbot/conversations",
          { locale: "en", guest_token: "guest_ship_1" },
          storeHeaders
        )
        const id = created.data.conversation.id

        const response = await api.get(
          `/store/chatbot/conversations/${id}/shipments`,
          storeHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.shipments).toEqual([])
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
    })
  },
})
