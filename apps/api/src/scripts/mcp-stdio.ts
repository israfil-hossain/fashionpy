import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

import { resolveLocalIdentity } from "../mcp/auth"
import { createMcpServer } from "../mcp/server"

const main = async () => {
  const identity = resolveLocalIdentity()
  const server = createMcpServer(identity)
  const transport = new StdioServerTransport()

  await server.connect(transport)
  console.error(
    `FashionPy MCP stdio server started (${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"})`
  )
}

void main()
