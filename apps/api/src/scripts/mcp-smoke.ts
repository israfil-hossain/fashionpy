import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"

const main = async () => {
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["apps/api/src/scripts/mcp-stdio.ts"],
  env: {
    ...process.env,
    MEDUSA_BACKEND_URL: process.env.MEDUSA_BACKEND_URL || "http://127.0.0.1:9000",
    JWT_SECRET: process.env.JWT_SECRET || "supersecret",
    MCP_ACTOR_ID: process.env.MCP_SMOKE_ACTOR_ID || "usr_test",
    MCP_ACTOR_TYPE: process.env.MCP_SMOKE_ACTOR_TYPE || "user",
    MCP_SELLER_ID: process.env.MCP_SMOKE_SELLER_ID || "sel_test",
  },
  stderr: "inherit",
})

const client = new Client({ name: "fashionpy-mcp-smoke", version: "1.0.0" })

await client.connect(transport)
const { tools } = await client.listTools()

if (process.env.MCP_SMOKE_TOOL) {
  const result = await client.callTool({
    name: process.env.MCP_SMOKE_TOOL,
    arguments: JSON.parse(process.env.MCP_SMOKE_ARGS || "{}"),
  })
  console.log(JSON.stringify(result, null, 2))
} else {
  console.log(
    JSON.stringify(
      tools.map((tool) => ({ name: tool.name, description: tool.description })),
      null,
      2
    )
  )
}

await client.close()
}

void main()
