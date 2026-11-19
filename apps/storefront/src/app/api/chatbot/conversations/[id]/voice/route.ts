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

/** POST voice message → STT → agent SSE */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  try {
    const backend = await fetch(
      `${BACKEND_URL}/store/chatbot/conversations/${encodeURIComponent(id)}/voice`,
      {
        method: "POST",
        headers: await backendHeaders(req),
        // Streaming is the backend default (query flag); sending `stream` in
        // the body trips the strict zod validator with "Unrecognized fields".
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      }
    )

    if (!backend.ok && !backend.body) {
      const data = await backend.json().catch(() => ({}))
      return Response.json(data, { status: backend.status })
    }

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
      { error: (err as Error).message || "Voice unavailable" },
      { status: 502 }
    )
  }
}
