import jwt from "jsonwebtoken"

import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

export type McpIdentity = {
  actorId: string
  actorType: "user" | "member"
  email: string
  sellerId?: string
  token: string
  scopes: string[]
}

type GoogleTokenInfo = {
  email?: string
  email_verified?: string | boolean
  hd?: string
  aud?: string
}

const googleClientId = process.env.GOOGLE_CLIENT_ID
const allowedDomain = process.env.MCP_GOOGLE_WORKSPACE_DOMAIN

const verifyGoogleToken = async (token: string): Promise<GoogleTokenInfo> => {
  if (!googleClientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured")
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
  )

  if (!response.ok) {
    throw new Error("Invalid Google ID token")
  }

  const info = (await response.json()) as GoogleTokenInfo

  if (info.aud !== googleClientId) {
    throw new Error("Google token audience does not match FashionPy")
  }

  if (info.email_verified !== true && info.email_verified !== "true") {
    throw new Error("Google email is not verified")
  }

  if (allowedDomain && info.hd !== allowedDomain) {
    throw new Error("Google account is outside the allowed workspace")
  }

  const email = info.email
  if (!email) {
    throw new Error("Google token has no email")
  }

  return { ...info, email }
}

const mintToken = (identity: {
  actorId: string
  actorType: "user" | "member"
}) => {
  const now = Math.floor(Date.now() / 1000)

  return jwt.sign(
    {
      actor_id: identity.actorId,
      actor_type: identity.actorType,
      auth_identity_id: `mcp_${identity.actorId}`,
      auth_provider: "google",
      app_metadata: {},
      iat: now,
      exp: now + 3600,
    },
    process.env.JWT_SECRET || "supersecret"
  )
}

export const resolveLocalIdentity = (): McpIdentity => {
  const actorId = process.env.MCP_ACTOR_ID
  const actorType = process.env.MCP_ACTOR_TYPE

  if (!actorId || (actorType !== "user" && actorType !== "member")) {
    throw new Error(
      "MCP_ACTOR_ID and MCP_ACTOR_TYPE (user|member) are required for local stdio mode"
    )
  }

  const admin = actorType === "user"

  return {
    actorId,
    actorType,
    email: process.env.MCP_ACTOR_EMAIL || "local",
    sellerId: process.env.MCP_SELLER_ID,
    token: mintToken({ actorId, actorType }),
    scopes: admin
      ? ["products:read", "products:write", "admin:review"]
      : ["products:read", "products:write"],
  }
}

export const resolveMcpIdentity = async (
  container: MedusaContainer,
  authorization: string | undefined
): Promise<McpIdentity> => {
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing bearer token")
  }

  const presented = authorization.slice(7)
  const devEmail = process.env.MCP_DEV_EMAIL
  const info =
    devEmail && presented === process.env.MCP_DEV_TOKEN
      ? { email: devEmail }
      : await verifyGoogleToken(presented)

  const email = info.email
  if (!email) {
    throw new Error("No email associated with this Google account")
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: users } = await query.graph({
    entity: "user",
    fields: ["id", "email"],
    filters: { email },
  })

  const adminUser = users[0] as { id: string; email: string } | undefined

  if (adminUser) {
    return {
      actorId: adminUser.id,
      actorType: "user",
      email,
      token: mintToken({ actorId: adminUser.id, actorType: "user" }),
      scopes: ["products:read", "products:write", "admin:review"],
    }
  }

  const { data: members } = await query.graph({
    entity: "member",
    fields: ["id", "email"],
    filters: { email },
  })

  const member = members[0] as { id: string; email: string } | undefined

  if (!member) {
    throw new Error("No FashionPy account is linked to this Google email")
  }

  const { data: sellerMemberships } = await query.graph({
    entity: "seller_member",
    fields: ["seller_id"],
    filters: { member_id: member.id },
  })

  const sellerId = (
    sellerMemberships[0] as { seller_id?: string } | undefined
  )?.seller_id

  if (!sellerId) {
    throw new Error("This member is not linked to a seller")
  }

  return {
    actorId: member.id,
    actorType: "member",
    email,
    sellerId,
    token: mintToken({ actorId: member.id, actorType: "member" }),
    scopes: ["products:read", "products:write"],
  }
}
