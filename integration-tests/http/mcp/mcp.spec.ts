import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(120_000)

medusaIntegrationTestRunner({
  testSuite: ({ api }) => {
    describe("Store - FashionPy MCP endpoint", () => {
      test("publishes protected resource metadata", async () => {
        const response = await api.get("/mcp")

        expect(response.status).toEqual(200)
        expect(response.data).toMatchObject({
          authorization_servers: ["https://accounts.google.com"],
          scopes_supported: ["products:read", "products:write", "admin:review"],
        })
      })

      test("challenges unauthenticated tool calls", async () => {
        const response = await api
          .post(
            "/mcp",
            { jsonrpc: "2.0", id: 1, method: "tools/list" },
            { headers: { "Content-Type": "application/json" } }
          )
          .catch((error) => error.response)

        expect(response.status).toEqual(401)
      })
    })
  },
})
