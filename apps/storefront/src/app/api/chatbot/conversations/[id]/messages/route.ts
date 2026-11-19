import { NextRequest } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

async function backendHeaders(req: NextRequest): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "x-publishable-api-key": PUBLISHABLE_KEY,
    "Content-Type": "application/json",
  }
  const guest = req.headers.get("x-chatbot-guest")
  if (guest) headers["x-chatbot-guest"] = guest
  const cookieHeader = req.headers.get("cookie") || ""
  const match = cookieHeader.match(/(?:^|;\s*)_medusa_jwt=([^;]+)/)
  if (match?.[1]) {
    headers.Authorization = `Bearer ${decodeURIComponent(match[1])}`
  }
  return headers
}

/**
 * POST /api/chatbot/conversations/:id/messages — streams the agent reply
 * as SSE (passthrough from the Medusa API).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  try {
    const backend = await fetch(
      `${BACKEND_URL}/store/chatbot/conversations/${encodeURIComponent(id)}/messages`,
      {
        method: "POST",
        headers: await backendHeaders(req),
        // The backend streams by default (query flag `stream !== "false"`).
        // `stream` in the body is rejected by the strict zod validator.
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      }
    )

    if (!backend.ok && !backend.body) {
      const data = await backend.json().catch(() => ({}))
      return Response.json(data, { status: backend.status })
    }

    // Pass SSE stream through
    return new Response(backend.body, {
      status: backend.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || "Chatbot unavailable" },
      { status: 502 }
    )
  }
}

/** GET history */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const res = await fetch(
      `${BACKEND_URL}/store/chatbot/conversations/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: await backendHeaders(req),
        signal: AbortSignal.timeout(15_000),
      }
    )
    const data = await res.json().catch(() => ({}))
    return Response.json(data, { status: res.status })
  } catch {
    return Response.json({ error: "Unavailable" }, { status: 502 })
  }
}
