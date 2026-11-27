import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import type { McpIdentity } from "./auth"
import {
  registerAdminTools,
  registerCommonTools,
  registerSellerTools,
} from "./tools"

export const createMcpServer = (identity: McpIdentity) => {
  const server = new McpServer(
    { name: "fashionpy", version: "1.0.0" },
    { capabilities: { tools: { listChanged: false } } }
  )

  registerCommonTools(server, identity)

  if (identity.actorType === "member") {
    registerSellerTools(server, identity)
  }

  if (identity.scopes.includes("admin:review")) {
    registerAdminTools(server, identity)
  }

  return server
}
