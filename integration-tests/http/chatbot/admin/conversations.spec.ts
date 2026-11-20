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

/**
 * Admin chat inbox (SPEC-011): list/detail transcript, admin follow-up send
 * with customer notification, AI draft (mocked provider), strict auth.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Chatbot admin inbox", () => {
      let appContainer: MedusaContainer
      let customerHeaders: any
      let customerId: string
      let conversationId: string
      const originalFetch = global.fetch

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const apiKey = await generatePublishableKey(appContainer)
        const base = generateStoreHeaders({ publishableKey: apiKey })
        const customer = await createCustomerUser(appContainer, {
          email: `chatbot-inbox-${Date.now()}@test.com`,
        })
        customerId = customer.customer.id
        customerHeaders = {
          headers: { ...base.headers, ...customer.headers.headers },
        }

        const created = await api.post(
          "/store/chatbot/conversations",
          { locale: "en" },
          customerHeaders
        )
        conversationId = created.data.conversation.id
      })

      afterEach(() => {
        global.fetch = originalFetch
      })

      it("rejects unauthenticated inbox reads", async () => {
        const list = await api
          .get("/admin/chatbot/conversations")
          .catch((e) => e.response)
        expect(list.status).toEqual(401)
      })

      it("lists conversations with the resolved customer", async () => {
        const list = await api.get(
          "/admin/chatbot/conversations?limit=50",
          adminHeaders
        )

        expect(list.status).toEqual(200)
        const row = list.data.conversations.find(
          (c: any) => c.id === conversationId
        )
        expect(row).toBeTruthy()
        expect(row.customer_id).toEqual(customerId)
        expect(row.customer).toBeTruthy()
        expect(row.customer.email).toContain("chatbot-inbox-")
        expect(list.data.count).toBeGreaterThanOrEqual(1)
      })

      it("searches conversations by customer email", async () => {
        const hit = await api.get(
          "/admin/chatbot/conversations?q=chatbot-inbox",
          adminHeaders
        )
        expect(hit.status).toEqual(200)
        expect(
          hit.data.conversations.some((c: any) => c.id === conversationId)
        ).toBe(true)

        const miss = await api.get(
          "/admin/chatbot/conversations?q=definitely-no-such-customer",
          adminHeaders
        )
        expect(miss.status).toEqual(200)
        expect(
          miss.data.conversations.some((c: any) => c.id === conversationId)
        ).toBe(false)
      })

      it("returns the transcript with customer info", async () => {
        const detail = await api.get(
          `/admin/chatbot/conversations/${conversationId}`,
          adminHeaders
        )

        expect(detail.status).toEqual(200)
        expect(detail.data.conversation.id).toEqual(conversationId)
        expect(detail.data.conversation.customer.email).toContain(
          "chatbot-inbox-"
        )
        expect(Array.isArray(detail.data.messages)).toBe(true)
      })

      it("404s the detail for an unknown conversation", async () => {
        const detail = await api
          .get("/admin/chatbot/conversations/bconv_missing", adminHeaders)
          .catch((e) => e.response)
        expect(detail.status).toEqual(404)
      })

      it("sends an admin follow-up, persists sender=admin, and notifies the customer", async () => {
        const send = await api.post(
          `/admin/chatbot/conversations/${conversationId}/messages`,
          { content: "Still looking for shoes? We can help you decide." },
          adminHeaders
        )

        expect(send.status).toEqual(201)
        expect(send.data.message.role).toEqual("assistant")
        expect(send.data.message.sender).toEqual("admin")

        // Transcript shows the follow-up with the admin sender label.
        const detail = await api.get(
          `/admin/chatbot/conversations/${conversationId}`,
          adminHeaders
        )
        const sent = detail.data.messages.find(
          (m: any) => m.id === send.data.message.id
        )
        expect(sent).toBeTruthy()
        expect(sent.sender).toEqual("admin")

        // The customer's in-app feed got the follow-up notification.
        const notifications = await api.get(
          "/store/notifications?limit=50",
          customerHeaders
        )
        expect(notifications.status).toEqual(200)
        const followup = (notifications.data.notifications ?? []).find(
          (n: any) => n.event === "chatbot.followup"
        )
        expect(followup).toBeTruthy()
        expect(followup.link).toEqual("/?chat=1")
        expect(followup.title).toBeTruthy()
        expect(followup.body).toContain("Still looking for shoes")
      })

      it("generates an AI follow-up draft from the transcript (mocked provider)", async () => {
        global.fetch = (async (input: RequestInfo | URL) => {
          const url = String(input)
          if (url.includes("/chat/completions")) {
            return new Response(
              JSON.stringify({
                choices: [
                  {
                    message: {
                      content:
                        "Hi! You asked about our shoes earlier — need help picking a size?",
                      tool_calls: [],
                    },
                  },
                ],
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          }
          return originalFetch(input as RequestInfo)
        }) as typeof fetch

        // The draft needs a configured provider.
        await api.put(
          "/admin/chatbot/settings",
          {
            enabled: true,
            provider: "openrouter",
            model: "openai/gpt-4o-mini",
            api_key: "sk-mock-key",
          },
          adminHeaders
        )

        const draft = await api.post(
          `/admin/chatbot/conversations/${conversationId}/followup`,
          {},
          adminHeaders
        )

        expect(draft.status).toEqual(200)
        expect(draft.data.suggestion).toContain("shoes")
      })
    })
  },
})
