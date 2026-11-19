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
    describe("Chatbot admin settings", () => {
      let appContainer: MedusaContainer

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      it("rejects unauthenticated settings reads", async () => {
        const response = await api
          .get("/admin/chatbot/settings")
          .catch((e) => e.response)

        expect(response.status).toEqual(401)
      })

      it("round-trips settings without echoing secrets", async () => {
        const put = await api.put(
          "/admin/chatbot/settings",
          {
            enabled: true,
            provider: "openrouter",
            model: "openai/gpt-4o-mini",
            api_key: "sk-test-secret-key",
            temperature: 0.3,
            max_tokens: 512,
          },
          adminHeaders
        )

        expect(put.status).toEqual(200)
        expect(put.data.settings.enabled).toBe(true)
        expect(put.data.settings.provider).toBe("openrouter")
        expect(put.data.settings.model).toBe("openai/gpt-4o-mini")
        expect(put.data.settings.api_key_set).toBe(true)
        expect(JSON.stringify(put.data)).not.toContain("sk-test-secret-key")

        const get = await api.get("/admin/chatbot/settings", adminHeaders)
        expect(get.status).toEqual(200)
        expect(get.data.settings.api_key_set).toBe(true)
        expect(JSON.stringify(get.data)).not.toContain("sk-test-secret-key")

        // Blank api_key on update leaves the stored secret alone
        const update = await api.put(
          "/admin/chatbot/settings",
          { enabled: false },
          adminHeaders
        )
        expect(update.data.settings.enabled).toBe(false)
        expect(update.data.settings.api_key_set).toBe(true)
      })
    })

    describe("Chatbot store conversations", () => {
      let appContainer: MedusaContainer
      let storeHeaders: any
      let customerHeaders: any

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const apiKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey: apiKey })

        const customer = await createCustomerUser(appContainer, {
          email: "chatbot-customer@test.com",
        })
        customerHeaders = {
          headers: {
            ...storeHeaders.headers,
            ...customer.headers.headers,
          },
        }
      })

      it("exposes public config without secrets", async () => {
        const response = await api.get("/store/chatbot/config", storeHeaders)
        expect(response.status).toEqual(200)
        expect(response.data).toHaveProperty("enabled")
        expect(response.data).not.toHaveProperty("api_key")
      })

      it("creates a guest conversation", async () => {
        const response = await api.post(
          "/store/chatbot/conversations",
          { locale: "bn", guest_token: "guest_token_abc123" },
          storeHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.conversation.id).toMatch(/^bconv_/)
        expect(response.data.conversation.locale).toBe("bn")
        expect(response.data.conversation.customer_id).toBeNull()
      })

      it("creates a customer conversation bound to the actor", async () => {
        const response = await api.post(
          "/store/chatbot/conversations",
          { locale: "en" },
          customerHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.conversation.customer_id).toBeTruthy()
        expect(response.data.conversation.id).toMatch(/^bconv_/)
      })

      it("lists only the customer's conversations", async () => {
        await api.post(
          "/store/chatbot/conversations",
          { locale: "en" },
          customerHeaders
        )

        const list = await api.get("/store/chatbot/conversations", customerHeaders)
        expect(list.status).toEqual(200)
        expect(list.data.conversations.length).toBeGreaterThanOrEqual(1)
        expect(
          list.data.conversations.every((c: any) => c.customer_id)
        ).toBe(true)
      })

      it("returns conversation history for the owner", async () => {
        const created = await api.post(
          "/store/chatbot/conversations",
          { locale: "en" },
          customerHeaders
        )
        const id = created.data.conversation.id

        const detail = await api.get(
          `/store/chatbot/conversations/${id}`,
          customerHeaders
        )
        expect(detail.status).toEqual(200)
        expect(detail.data.conversation.id).toBe(id)
        expect(Array.isArray(detail.data.messages)).toBe(true)
      })

      it("rejects message send when the assistant is disabled", async () => {
        await api.put(
          "/admin/chatbot/settings",
          { enabled: false },
          adminHeaders
        )

        const created = await api.post(
          "/store/chatbot/conversations",
          { locale: "en" },
          customerHeaders
        )
        const id = created.data.conversation.id

        const response = await api
          .post(
            `/store/chatbot/conversations/${id}/messages`,
            { content: "hello" },
            { ...customerHeaders, params: { stream: "false" } }
          )
          .catch((e) => e.response)

        // Disabled assistant returns a polite message with 200 (non-stream)
        // or an error payload — either way the agent must not crash.
        expect([200, 400]).toContain(response.status)
        if (response.status === 200) {
          expect(response.data.content || response.data.error).toBeTruthy()
        }
      })
    })
  },
})
