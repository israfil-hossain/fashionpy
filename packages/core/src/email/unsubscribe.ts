import { createHmac, timingSafeEqual } from "node:crypto"

export type UnsubscribePayload = {
  customerId: string
  kind: "all" | "cart_reminder" | "wishlist_reminder"
}

const secret = () => process.env.JWT_SECRET || "supersecret"

export const createUnsubscribeToken = (payload: UnsubscribePayload): string => {
  const body = `${payload.customerId}:${payload.kind}`
  const signature = createHmac("sha256", secret()).update(body).digest("hex")
  return Buffer.from(`${body}:${signature}`).toString("base64url")
}

export const verifyUnsubscribeToken = (
  token: string
): UnsubscribePayload | null => {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8")
    const [customerId, kind, signature] = decoded.split(":")
    if (!customerId || !kind || !signature) return null

    const expected = createHmac("sha256", secret())
      .update(`${customerId}:${kind}`)
      .digest("hex")
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null

    if (
      kind !== "all" &&
      kind !== "cart_reminder" &&
      kind !== "wishlist_reminder"
    ) {
      return null
    }
    return { customerId, kind }
  } catch {
    return null
  }
}

export const isOptedOut = (
  metadata: Record<string, unknown> | null | undefined,
  kind: "cart_reminder" | "wishlist_reminder"
): boolean => {
  const value = metadata?.email_opt_out
  if (Array.isArray(value)) {
    return value.includes("all") || value.includes(kind)
  }
  return value === "all" || value === true
}

export const unsubscribeUrl = (payload: UnsubscribePayload): string => {
  const base = (
    process.env.STOREFRONT_URL ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    "http://localhost:8000"
  ).replace(/\/+$/, "")
  return `${base}/unsubscribe?token=${createUnsubscribeToken(payload)}`
}
