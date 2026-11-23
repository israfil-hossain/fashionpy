import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"

jest.setTimeout(300000)

/**
 * POST /store/chatbot/conversations/:id/messages with a mocked OpenRouter
 * chat-completions response — proves the agent loop, persistence, and
 * non-stream JSON path without a real LLM key.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Chatbot agent message flow (mocked LLM)", () => {
      let appContainer: MedusaContainer
      let customerHeaders: any
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
          email: `chatbot-agent-${Date.now()}@test.com`,
        })
        customerHeaders = {
          headers: { ...base.headers, ...customer.headers.headers },
        }

        // Enable assistant with dummy credentials — fetch is mocked below.
        const put = await api.put(
          "/admin/chatbot/settings",
          {
            enabled: true,
            provider: "openrouter",
            model: "openai/gpt-4o-mini",
            api_key: "sk-mock-key",
            temperature: 0,
            max_tokens: 256,
          },
          adminHeaders
        )
        expect(put.status).toEqual(200)

        const created = await api.post(
          "/store/chatbot/conversations",
          { locale: "en" },
          customerHeaders
        )
        conversationId = created.data.conversation.id

        let call = 0
        global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
          const url = String(input)
          if (url.includes("/chat/completions")) {
            call += 1
            // First call: tool to search; second: final answer with cards payload
            // embedded in content (cards come from tool results in production —
            // here we only assert the final text path).
            const payload =
              call === 1
                ? {
                    choices: [
                      {
                        message: {
                          content: null,
                          tool_calls: [
                            {
                              id: "call_mock_1",
                              type: "function",
                              function: {
                                name: "search_products",
                                arguments: JSON.stringify({
                                  q: "facewash",
                                  limit: 4,
                                }),
                              },
                            },
                          ],
                        },
                      },
                    ],
                  }
                : {
                    choices: [
                      {
                        message: {
                          content:
                            "Here are facewash products for you. Tap a card to view.",
                          tool_calls: [],
                        },
                      },
                    ],
                  }
            return new Response(JSON.stringify(payload), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          }
          return originalFetch(input as RequestInfo, init)
        }) as typeof fetch
      })

      afterEach(() => {
        global.fetch = originalFetch
      })

      it("runs the agent loop, executes search_products, and persists the reply", async () => {
        const response = await api.post(
          `/store/chatbot/conversations/${conversationId}/messages`,
          { content: "show me facewash" },
          { ...customerHeaders, params: { stream: "false" } }
        )

        expect(response.status).toEqual(200)
        expect(response.data.content).toMatch(/facewash/i)
        expect(response.data.message_id).toMatch(/^bmsg_/)
        // Tool executed → product cards returned when catalog has matches;
        // empty catalog still returns the final text.
        expect(Array.isArray(response.data.cards)).toBe(true)

        const detail = await api.get(
          `/store/chatbot/conversations/${conversationId}`,
          customerHeaders
        )
        expect(detail.status).toEqual(200)
        const roles = detail.data.messages.map((m: any) => m.role)
        expect(roles).toContain("user")
        expect(roles).toContain("assistant")
        const assistant = detail.data.messages.find(
          (m: any) => m.role === "assistant"
        )
        expect(assistant.content).toMatch(/facewash/i)
      })

      it("persists product cards on the assistant message", async () => {
        const productModule = appContainer.resolve(Modules.PRODUCT)
        const title = `Facewash Deep Clean ${Date.now()}`
        await productModule.createProducts({
          title,
          status: ProductStatus.PUBLISHED,
          variants: [{ title: "Default" }],
        })

        const response = await api.post(
          `/store/chatbot/conversations/${conversationId}/messages`,
          { content: "show me facewash" },
          { ...customerHeaders, params: { stream: "false" } }
        )

        expect(response.status).toEqual(200)
        expect(response.data.cards).toHaveLength(1)
        expect(response.data.cards[0].title).toEqual(title)

        const detail = await api.get(
          `/store/chatbot/conversations/${conversationId}`,
          customerHeaders
        )
        const assistant = detail.data.messages.find(
          (m: any) => m.role === "assistant" && m.sender !== "admin"
        )
        expect(assistant.cards).toEqual(response.data.cards)
      })

      it("returns footwear for a shoes query without description-only matches", async () => {
        const productModule = appContainer.resolve(Modules.PRODUCT)
        const suffix = Date.now()
        const [category] = await productModule.createProductCategories([
          { name: `Sneakers ${suffix}`, handle: `sneakers-${suffix}`, is_active: true },
        ])
        await productModule.createProducts({
          title: `Trail Runner ${suffix}`,
          status: ProductStatus.PUBLISHED,
          variants: [{ title: "Default" }],
          categories: [{ id: category.id }],
        })
        const careKitTitle = `Leather Care Kit ${suffix}`
        await productModule.createProducts({
          title: careKitTitle,
          description: "Designed to fit most shoe sizes and styles",
          status: ProductStatus.PUBLISHED,
          variants: [{ title: "Default" }],
        })

        let call = 0
        global.fetch = (async (input: RequestInfo | URL) => {
          const url = String(input)
          if (url.includes("/chat/completions")) {
            call += 1
            const message =
              call === 1
                ? {
                    content: null,
                    tool_calls: [
                      {
                        id: "call_shoes",
                        type: "function",
                        function: {
                          name: "search_products",
                          arguments: JSON.stringify({ q: "shoes", limit: 12 }),
                        },
                      },
                    ],
                  }
                : { content: "Here are some shoes.", tool_calls: [] }
            return new Response(JSON.stringify({ choices: [{ message }] }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          }
          return originalFetch(input as RequestInfo, undefined)
        }) as typeof fetch

        const response = await api.post(
          `/store/chatbot/conversations/${conversationId}/messages`,
          { content: "I want shoes" },
          { ...customerHeaders, params: { stream: "false" } }
        )

        expect(response.status).toEqual(200)
        const titles: string[] = response.data.cards.map((card: any) => card.title)
        expect(titles.some((title) => /sneaker|runner|sandal|boot|shoe/i.test(title))).toBe(
          true
        )
        expect(titles).not.toContain(careKitTitle)
      })

      it("replays tool_calls with JSON-string arguments even when the model returned objects", async () => {
        // Ant Digital upstreams return `function.arguments` as a parsed object;
        // re-sending that verbatim made the provider 400 with "Assistant tool
        // call function.arguments must be valid JSON".
        const requests: Array<{ messages: Array<Record<string, any>> }> = []
        let call = 0
        global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
          const url = String(input)
          if (url.includes("/chat/completions")) {
            call += 1
            if (init?.body) {
              requests.push(JSON.parse(String(init.body)))
            }
            const payload =
              call === 1
                ? {
                    choices: [
                      {
                        message: {
                          content: null,
                          tool_calls: [
                            {
                              id: "call_obj",
                              type: "function",
                              function: {
                                name: "search_products",
                                arguments: { q: "facewash", limit: 4 },
                              },
                            },
                          ],
                        },
                      },
                    ],
                  }
                : {
                    choices: [
                      {
                        message: { content: "Done.", tool_calls: [] },
                      },
                    ],
                  }
            return new Response(JSON.stringify(payload), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          }
          return originalFetch(input as RequestInfo, init)
        }) as typeof fetch

        const response = await api.post(
          `/store/chatbot/conversations/${conversationId}/messages`,
          { content: "show me facewash" },
          { ...customerHeaders, params: { stream: "false" } }
        )

        expect(response.status).toEqual(200)
        expect(requests.length).toEqual(2)

        const replayed = requests[1].messages.find(
          (m) => m.role === "assistant" && m.tool_calls?.length
        )
        expect(replayed).toBeTruthy()
        const args = replayed.tool_calls[0].function.arguments
        expect(typeof args).toBe("string")
        expect(() => JSON.parse(args)).not.toThrow()
        expect(JSON.parse(args)).toEqual({ q: "facewash", limit: 4 })
      })

      it("sends behavior rules, shown-cards annotations, and shown products to the model", async () => {
        // Regression for the repeated product-list bug: the model must see
        // (a) the always-appended behavior rules, (b) an inline annotation of
        // cards the customer already sees, and (c) the shown-product titles —
        // otherwise it re-runs the same search on every follow-up question.
        const productModule = appContainer.resolve(Modules.PRODUCT)
        const title = `Harlow Test Boot ${Date.now()}`
        await productModule.createProducts({
          title,
          status: ProductStatus.PUBLISHED,
          variants: [{ title: "Default" }],
        })

        const requests: Array<{ messages: Array<Record<string, any>> }> = []
        let call = 0
        global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
          const url = String(input)
          if (url.includes("/chat/completions")) {
            call += 1
            if (init?.body) {
              requests.push(JSON.parse(String(init.body)))
            }
            const message =
              call === 1
                ? {
                    content: null,
                    tool_calls: [
                      {
                        id: "call_ctx_1",
                        type: "function",
                        function: {
                          name: "search_products",
                          arguments: JSON.stringify({ q: "boot", limit: 4 }),
                        },
                      },
                    ],
                  }
                : call === 2
                  ? {
                      content: `Here is ${title}. Tap a card to view.`,
                      tool_calls: [],
                    }
                  : { content: "BDT 249.60. Need a size?", tool_calls: [] }
            return new Response(JSON.stringify({ choices: [{ message }] }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          }
          return originalFetch(input as RequestInfo, init)
        }) as typeof fetch

        const first = await api.post(
          `/store/chatbot/conversations/${conversationId}/messages`,
          { content: "show me boots" },
          { ...customerHeaders, params: { stream: "false" } }
        )
        expect(first.status).toEqual(200)
        expect(first.data.cards.map((c: any) => c.title)).toContain(title)

        const second = await api.post(
          `/store/chatbot/conversations/${conversationId}/messages`,
          { content: "how much is it?" },
          { ...customerHeaders, params: { stream: "false" } }
        )
        expect(second.status).toEqual(200)

        // Turn 2 is the third completion call (turn 1: tool_call + final).
        const turn2 = requests[2]
        expect(turn2).toBeTruthy()

        const system = turn2.messages.find((m) => m.role === "system")
        expect(system.content).toContain("Ask at most ONE")
        expect(system.content).toContain("Do not mix scripts")
        expect(system.content).toContain("Never ask again")
        expect(system.content).toContain(
          `Products already shown earlier: ${title}`
        )

        const annotated = turn2.messages.find(
          (m) =>
            m.role === "assistant" &&
            typeof m.content === "string" &&
            m.content.includes("[Shown cards:") &&
            m.content.includes(title)
        )
        expect(annotated).toBeTruthy()

        const userTurns = turn2.messages.filter((m) => m.role === "user")
        expect(userTurns.map((m) => m.content)).toEqual([
          "show me boots",
          "how much is it?",
        ])
      })

      it("returns a structured error when the provider fails", async () => {
        global.fetch = (async (input: RequestInfo | URL) => {
          const url = String(input)
          if (url.includes("/chat/completions")) {
            return new Response(
              JSON.stringify({ error: { message: "upstream boom" } }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            )
          }
          return originalFetch(input as RequestInfo)
        }) as typeof fetch

        const response = await api
          .post(
            `/store/chatbot/conversations/${conversationId}/messages`,
            { content: "hello" },
            { ...customerHeaders, params: { stream: "false" } }
          )
          .catch((e) => e.response)

        expect(response.status).toEqual(400)
        expect(response.data.error).toMatch(/500|upstream|provider/i)
      })
    })
  },
})
