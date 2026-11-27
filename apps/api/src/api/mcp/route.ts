import type { IncomingMessage, ServerResponse } from "node:http"

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"

import { resolveMcpIdentity } from "../../mcp/auth"
import { createMcpServer } from "../../mcp/server"

const baseUrl =
  process.env.MCP_PUBLIC_URL || process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const resourceUrl = `${baseUrl.replace(/\/$/, "")}/mcp`
const authorizationServer = "https://accounts.google.com"

const checkOrigin = (req: MedusaRequest, res: MedusaResponse) => {
  const configured = process.env.MCP_ALLOWED_ORIGINS
  if (!configured) return true

  const origin = req.headers.origin
  const allowed = configured.split(",").map((value) => value.trim())
  if (!origin || allowed.includes(origin)) return true

  res.status(403).json({ error: "Origin not allowed" })
  return false
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!checkOrigin(req, res)) return

  res.json({
    resource: resourceUrl,
    authorization_servers: [authorizationServer],
    scopes_supported: ["products:read", "products:write", "admin:review"],
    bearer_methods_supported: ["header"],
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!checkOrigin(req, res)) return

  let identity
  try {
    identity = await resolveMcpIdentity(req.scope, req.headers.authorization)
  } catch (error) {
    res.setHeader(
      "WWW-Authenticate",
      `Bearer resource_metadata="${resourceUrl}", error="invalid_token", error_description="${(error as Error).message.replace(/"/g, "")}"`
    )
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })
  const server = createMcpServer(identity)

  try {
    await server.connect(transport)
    await transport.handleRequest(
      req as unknown as IncomingMessage,
      res as unknown as ServerResponse,
      req.body
    )
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: (error as Error).message })
    }
  }
}
