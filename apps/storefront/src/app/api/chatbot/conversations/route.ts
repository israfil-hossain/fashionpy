import { NextRequest } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

async function backendHeaders(req: NextRequest): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    "x-publishable-api-key": PUBLISHABLE_KEY,
    "Content-Type": "application/json",
  }
  const guest = req.headers.get("x-chatbot-guest")
  if (guest) {
    headers["x-chatbot-guest"] = guest
  }
  // Forward the customer JWT if present (httpOnly cookie readable server-side).
  const cookieHeader = req.headers.get("cookie") || ""
  const match = cookieHeader.match(/(?:^|;\s*)_medusa_jwt=([^;]+)/)
  if (match?.[1]) {
    headers.Authorization = `Bearer ${decodeURIComponent(match[1])}`
  }
  return headers
}

/** POST /api/chatbot/conversations — find-or-create a chatbot thread. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  try {
    const res = await fetch(`${BACKEND_URL}/store/chatbot/conversations`, {
      method: "POST",
      headers: await backendHeaders(req),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    })
    const data = await res.json().catch(() => ({}))
    return Response.json(data, { status: res.status })
  } catch {
    return Response.json({ error: "Chatbot unavailable" }, { status: 502 })
  }
}

/** GET /api/chatbot/conversations — list (customer only). */
export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${BACKEND_URL}/store/chatbot/conversations`, {
      method: "GET",
      headers: await backendHeaders(req),
      signal: AbortSignal.timeout(15_000),
    })
    const data = await res.json().catch(() => ({}))
    return Response.json(data, { status: res.status })
  } catch {
    return Response.json({ conversations: [] }, { status: 200 })
  }
}
